import { NextRequest, NextResponse } from "next/server";
import { SupabaseUserService, UserRecord } from "@/utils/supabase";

interface MagicWalletResponse {
  data: {
    uuid: string;
    access_key: string;
    recovery_key: string;
    public_address: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    // Get user from client-side (passed via headers)
    const userHeader = req.headers.get("x-user-info");
    let user = null;

    if (userHeader) {
      try {
        user = JSON.parse(userHeader);
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid user data" },
          { status: 400 }
        );
      }
    }

    const userService = new SupabaseUserService();

    // Check if user is authenticated
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if user already exists, if so return user data
    const existingUser = await userService.findUserBySub(user.sub);
    if (existingUser.length > 0)
      return NextResponse.json({ user: existingUser }, { status: 200 });

    // If user doesn't exist, create wallet for user via Magic TEE API

    // First, get or create a wallet group
    let wallet_group_id: string;

    // Check if we have existing wallet groups
    console.log("Testing Magic API connection...");
    console.log(
      "Using secret key:",
      process.env.MAGIC_SECRET_KEY ? "***SET***" : "MISSING"
    );

    let groupsResponse;
    try {
      groupsResponse = await fetch(
        "https://tee.magiclabs.com/v1/api/wallet_groups",
        {
          headers: {
            "x-magic-secret-key": process.env.MAGIC_SECRET_KEY!,
          },
        }
      );
    } catch (error) {
      console.error("Failed to fetch wallet groups:", error);
      return NextResponse.json(
        {
          error: "Failed to connect to Magic API",
          details:
            error instanceof Error ? error.message : "Unknown network error",
        },
        { status: 500 }
      );
    }

    if (!groupsResponse.ok) {
      const errorText = await groupsResponse.text();
      console.error("Magic API error:", groupsResponse.status, errorText);
      return NextResponse.json(
        {
          error: `Magic API error: ${groupsResponse.status}`,
          details: errorText,
        },
        { status: 500 }
      );
    }

    const groupsData = await groupsResponse.json();

    if (groupsData.data && groupsData.data.length > 0) {
      // Use existing wallet group
      wallet_group_id = groupsData.data[0].uuid;
    } else {
      // Create new wallet group
      let createGroupResponse;
      try {
        createGroupResponse = await fetch(
          "https://tee.magiclabs.com/v1/api/wallet_group",
          {
            method: "POST",
            headers: {
              "x-magic-secret-key": process.env.MAGIC_SECRET_KEY!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              metadata: {
                resource_id: "nextjs-auth0-app",
              },
            }),
          }
        );
      } catch (error) {
        console.error("Failed to create wallet group:", error);
        return NextResponse.json(
          {
            error: "Failed to create wallet group",
            details:
              error instanceof Error ? error.message : "Unknown network error",
          },
          { status: 500 }
        );
      }

      if (!createGroupResponse.ok) {
        const errorText = await createGroupResponse.text();
        console.error(
          "Create group error:",
          createGroupResponse.status,
          errorText
        );
        return NextResponse.json(
          {
            error: `Create group error: ${createGroupResponse.status}`,
            details: errorText,
          },
          { status: 500 }
        );
      }

      const newGroupData = await createGroupResponse.json();
      wallet_group_id = newGroupData.data.uuid;
    }

    // Call Magic TEE API wallet creation endpoint
    let newWallet;
    try {
      newWallet = await fetch("https://tee.magiclabs.com/v1/api/wallet", {
        method: "POST",
        headers: {
          "x-magic-secret-key": process.env.MAGIC_SECRET_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Do not use Auth0 sub claim in ID token as encryption context in your prod app!
          encryption_context: user.sub,
          network: "EVM",
          wallet_group_id: wallet_group_id,
          resource_id: "nextjs-auth0",
        }),
      });
    } catch (error) {
      console.error("Failed to create wallet:", error);
      return NextResponse.json(
        {
          error: "Failed to create wallet",
          details:
            error instanceof Error ? error.message : "Unknown network error",
        },
        { status: 500 }
      );
    }

    if (!newWallet.ok) {
      const errorText = await newWallet.text();
      console.error("Create wallet error:", newWallet.status, errorText);
      return NextResponse.json(
        {
          error: `Create wallet error: ${newWallet.status}`,
          details: errorText,
        },
        { status: 500 }
      );
    }

    const newWalletInfo: MagicWalletResponse = await newWallet.json();

    // Construct DB entry for new user with REAL wallet data from Magic
    const newUser: Omit<UserRecord, "id" | "created_at" | "updated_at"> = {
      email: user.email,
      sub: user.sub,
      wallet_group: wallet_group_id,
      wallet_id: newWalletInfo.data.uuid,
      access_key: newWalletInfo.data.access_key,
      recovery_key: newWalletInfo.data.recovery_key,
      wallet_address: newWalletInfo.data.public_address, // REAL address from Magic!
      nonce: 0,
    };

    // Insert new user into Supabase
    const insertedUser = await userService.insertUser(newUser);

    // Return user data if successful
    return NextResponse.json({ user: [insertedUser] }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
