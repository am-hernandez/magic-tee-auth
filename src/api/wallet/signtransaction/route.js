import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/mongodb';
import { viemClient } from '@/utils/viem';
import { formatEther, parseUnits, toHex } from 'viem';

const signTransactonHandler = withApiAuthRequired(async (req, res) => {
    try {
        const { user } = await getSession(req, res);
        const { db } = await connectToDatabase();

        // Check if user is authenticated
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        // Check if user already exists, if so return user data
        const existingUser = await db.find({ sub: user.sub }).toArray();

        if (existingUser.length > 0) {
            if (req.method === 'POST') {
                // Read and parse the request body
                const requestBody = await req.json();

                // get wallet info
                const walletId = existingUser[0].wallet_id;
                const accessKey = existingUser[0].access_key;
                const walletAddress = existingUser[0].wallet_address;
                const transactionNonce = await viemClient.getTransactionCount({ address: walletAddress });
                const toAddress = requestBody.payload.to;
                const sendValue = parseUnits(requestBody.payload.value, 18);
                const {maxFeePerGas, maxPriorityFeePerGas} = await viemClient.estimateFeesPerGas();

                let viemTransaction;
                
                try {
                    viemTransaction = await viemClient.prepareTransactionRequest({
                        type: 2,
                        chainId: 84532,
                        to: toAddress,
                        nonce: transactionNonce,
                        maxFeePerGas: Number(maxFeePerGas),
                        maxPriorityFeePerGas: Number(maxPriorityFeePerGas),
                        value: toHex(sendValue),
                        data: "0x416e67656c20676f657320746f20746865206d6f6f6e",
                    });

                    viemTransaction.gas = Number(viemTransaction.gas);
                    console.log("📢 Viem Transaction:", viemTransaction);

                    /*************************
                    ** CHECK WALLET BALANCE **
                    *************************/

                    // Calculate the total cost of the transaction
                    const totalGasCost = BigInt(viemTransaction.gas) * maxFeePerGas;
                    const totalCost = totalGasCost + sendValue;

                    const balance = await viemClient.getBalance({ address: walletAddress });

                    // before signing, check if balance is too low to send this transaction
                    if (balance < totalCost) {
                        return NextResponse.json({
                            error: `Insufficient funds for transaction. Need: ${formatEther(totalCost)} ETH, Have: ${formatEther(balance)} ETH`,
                            status: 400 
                        });
                    }
                } catch (error) {
                    console.log("🚨 Viem Error: Error while preparing transaction");
                    console.error(error);
                }

                /*********************
                ** SIGN TRANSACTION **
                *********************/

                // Call Magic TEE sign transaction endpoint
                const signTransactionResponse = await fetch('https://global-tee-prod.magickms.com/v1/api/wallet/sign_transaction', {
                    method: 'POST',
                    headers: {
                        'x-magic-secret-key': process.env.MAGIC_SECRET_KEY,
                    },
                    body: JSON.stringify({
                        // Do not use Auth0 sub claim in ID token as encryption context in your prod app!
                        payload: viemTransaction,
                        encryption_context: user.sub,
                        access_key: accessKey,
                        wallet_id: walletId,
                    }),
                });
                
                const signedTransactionResJSON = await signTransactionResponse.json();
                console.log("📢 signed trx response JSON:", signedTransactionResJSON.data);

                /*********************
                ** SEND TRANSACTION **
                *********************/

                if(signedTransactionResJSON.error_code){
                    console.log("🚨 Error while signing transaction: ", signedTransactionResJSON.error_code);
                    return NextResponse.json({ ...signedTransactionResJSON }, { status: 500 })
                } else {
                    const signedTrx = signedTransactionResJSON.data.signed_transaction;

                    // send the raw transaction
                    const transactionHash = await viemClient.sendRawTransaction({serializedTransaction: signedTrx});

                    return transactionHash && NextResponse.json({ "transaction_hash": transactionHash }, { status: 200 });
                }
            }
        } else {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
    } catch (error) {
        console.log("Error:", error);
        return NextResponse.json({ error: error }, { status: 500 });
    };
    });
    
    export const POST = signTransactonHandler;
