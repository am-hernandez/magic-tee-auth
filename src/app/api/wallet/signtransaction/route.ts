import { getSession } from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";
import { SupabaseUserService } from "@/utils/supabase";
import { viemClient } from "@/utils/viem";
import { formatEther, parseUnits, TransactionRequest, Address } from "viem";

interface TransactionPayload {
  to: Address;
  value: string;
}

interface RequestBody {
  payload: TransactionPayload;
}

interface MagicSignResponse {
  data?: {
    signed_transaction: `0x${string}`;
  };
  error_code?: string;
}

export async function POST(req: NextRequest) {
  try {
    const res = new NextResponse();
    const session = await getSession(req, res);
    const user = session?.user;
    const userService = new SupabaseUserService();

    // Check if user is authenticated
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if user already exists, if so return user data
    const existingUser = await userService.findUserBySub(user.sub!);

    if (existingUser.length > 0) {
      if (req.method === "POST") {
        // Read and parse the request body
        const requestBody: RequestBody = await req.json();

        // get wallet info
        const walletId = existingUser[0].wallet_id;
        const accessKey = existingUser[0].access_key;
        const walletAddress = existingUser[0].wallet_address as Address;
        const transactionNonce = await viemClient.getTransactionCount({
          address: walletAddress,
        });
        const toAddress = requestBody.payload.to;
        const sendValue = parseUnits(requestBody.payload.value, 18);
        const { maxFeePerGas, maxPriorityFeePerGas } =
          await viemClient.estimateFeesPerGas();

        let viemTransaction: TransactionRequest;

        try {
          viemTransaction = await viemClient.prepareTransactionRequest({
            type: "eip1559",
            chainId: 84532,
            to: toAddress,
            nonce: transactionNonce,
            maxFeePerGas,
            maxPriorityFeePerGas,
            value: sendValue,
            data: "0x416e67656c20676f657320746f20746865206d6f6f6e",
          });
          console.log("📢 Viem Transaction:", viemTransaction);

          /*************************
           ** CHECK WALLET BALANCE **
           *************************/

          // Calculate the total cost of the transaction
          const totalGasCost = viemTransaction.gas! * maxFeePerGas!;
          const totalCost = totalGasCost + sendValue;

          const balance = await viemClient.getBalance({
            address: walletAddress,
          });

          // before signing, check if balance is too low to send this transaction
          if (balance < totalCost) {
            return NextResponse.json(
              {
                error: `Insufficient funds for transaction. Need: ${formatEther(
                  totalCost
                )} ETH, Have: ${formatEther(balance)} ETH`,
              },
              { status: 400 }
            );
          }
        } catch (error) {
          console.log("🚨 Viem Error: Error while preparing transaction");
          console.error(error);
          return NextResponse.json(
            { error: "Failed to prepare transaction" },
            { status: 500 }
          );
        }

        /*********************
         ** SIGN TRANSACTION **
         *********************/

        // Call Magic TEE sign transaction endpoint
        const signTransactionResponse = await fetch(
          "https://tee.magiclabs.com/v1/api/wallet/sign_transaction",
          {
            method: "POST",
            headers: {
              "x-magic-secret-key": process.env.MAGIC_SECRET_KEY!,
            },
            body: JSON.stringify({
              // Do not use Auth0 sub claim in ID token as encryption context in your prod app!
              payload: viemTransaction,
              encryption_context: user.sub,
              access_key: accessKey,
              wallet_id: walletId,
            }),
          }
        );

        const signedTransactionResJSON: MagicSignResponse =
          await signTransactionResponse.json();
        console.log(
          "📢 signed trx response JSON:",
          signedTransactionResJSON.data
        );

        /*********************
         ** SEND TRANSACTION **
         *********************/

        if (signedTransactionResJSON.error_code) {
          console.log(
            "🚨 Error while signing transaction: ",
            signedTransactionResJSON.error_code
          );
          return NextResponse.json(
            { ...signedTransactionResJSON },
            { status: 500 }
          );
        } else {
          const signedTrx = signedTransactionResJSON.data!.signed_transaction;

          // send the raw transaction
          const transactionHash = await viemClient.sendRawTransaction({
            serializedTransaction: signedTrx,
          });

          return (
            transactionHash &&
            NextResponse.json(
              { transaction_hash: transactionHash },
              { status: 200 }
            )
          );
        }
      }
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  } catch (error) {
    console.log("Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
