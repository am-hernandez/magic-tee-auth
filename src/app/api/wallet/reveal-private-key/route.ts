import { NextRequest, NextResponse } from "next/server";
import { SupabaseUserService } from "@/utils/supabase";

interface RevealPrivateKeyRequest {
  rsa_public_key: string;
  encryption_context: string;
  user_sub: string;
}

interface MagicRevealResponse {
  data: {
    private_key: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: RevealPrivateKeyRequest = await req.json();
    const { rsa_public_key, encryption_context, user_sub } = body;

    if (!rsa_public_key || !encryption_context || !user_sub) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: rsa_public_key, encryption_context, user_sub",
        },
        { status: 400 }
      );
    }

    const userService = new SupabaseUserService();

    const existingUsers = await userService.findUserBySub(user_sub);
    if (existingUsers.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = existingUsers[0];

    let revealResponse;
    try {
      revealResponse = await fetch(
        "https://tee.magiclabs.com/v1/api/wallet/reveal_pk",
        {
          method: "POST",
          headers: {
            "x-magic-secret-key": process.env.MAGIC_SECRET_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            encryption_context: encryption_context,
            access_key: user.access_key,
            wallet_id: user.wallet_id,
            rsa_public_key: rsa_public_key,
          }),
        }
      );
    } catch (error) {
      console.error("Failed to call Magic reveal_pk API:", error);
      return NextResponse.json(
        {
          error: "Failed to connect to Magic API",
          details:
            error instanceof Error ? error.message : "Unknown network error",
        },
        { status: 500 }
      );
    }

    if (!revealResponse.ok) {
      const errorText = await revealResponse.text();
      console.error("Magic API error:", revealResponse.status, errorText);
      return NextResponse.json(
        {
          error: `Magic API error: ${revealResponse.status}`,
          details: errorText,
        },
        { status: revealResponse.status }
      );
    }

    const revealData: MagicRevealResponse = await revealResponse.json();

    return NextResponse.json({
      encrypted_private_key: revealData.data.private_key,
    });
  } catch (error) {
    console.error("Reveal private key error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
