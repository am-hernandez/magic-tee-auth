"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface WalletData {
  wallet_address: string;
  wallet_id: string;
  wallet_group: string;
  email: string;
  nonce: number;
  created_at: string;
}

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [revealingKey, setRevealingKey] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [blurPrivateKey, setBlurPrivateKey] = useState(true);

  const checkWallet = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/wallet/create", {
        headers: {
          "x-user-info": JSON.stringify({
            sub: user.sub,
            email: user.email,
          }),
        },
      });
      const data = await response.json();

      if (response.ok && data.user && data.user[0]) {
        setWalletData(data.user[0]);
      }
    } catch (error) {
      console.error("Error checking wallet:", error);
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  };

  const revealPrivateKey = async () => {
    if (!user || !walletData) return;

    setRevealingKey(true);
    try {
      // Step 1: Create RSA encryption keypair using the Web Crypto API
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-1",
        },
        false, // non-exportable from the browser (important)
        ["encrypt", "decrypt"]
      );

      // Step 2: Export the raw public key
      const exported = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );

      // Step 3: Convert the ArrayBuffer to a Base64 string
      const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
      const exportedAsBase64 = window.btoa(exportedAsString);

      // Step 4: Split the Base64 string into manageable chunks (optional, but typical for PEM)
      const maxLineLength = 64;
      let formattedBase64 = "";
      for (let i = 0; i < exportedAsBase64.length; i += maxLineLength) {
        formattedBase64 += exportedAsBase64.slice(i, i + maxLineLength) + "\n";
      }

      // Step 5: Create the PEM header and footer
      const rsa_public_key = `-----BEGIN PUBLIC KEY-----\n${formattedBase64}-----END PUBLIC KEY-----\n`;

      // Step 6: Send rsa_public_key to backend to call /v1/api/wallet/reveal_pk
      // Use user.sub as encryption_context (same as wallet creation)
      const response = await fetch("/api/wallet/reveal-private-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rsa_public_key: rsa_public_key,
          encryption_context: user.sub, // Use Auth0 user ID as encryption context
          user_sub: user.sub,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reveal private key");
      }

      // Debug: Log the response data to see what we're getting
      console.log("Magic API response:", data);
      console.log("Encrypted private key:", data.encrypted_private_key);

      // Check if encrypted_private_key exists
      if (!data.encrypted_private_key) {
        throw new Error(
          "No encrypted private key received from Magic API. Response: " +
            JSON.stringify(data)
        );
      }

      // Step 7: Use the RSA private key to decrypt the encrypted_private_key
      const base64ToUint8 = (base64: string) => {
        // Clean the base64 string (remove whitespace, newlines, etc.)
        const cleanBase64 = base64.replace(/\s/g, "");
        console.log("Cleaned base64 string length:", cleanBase64.length);
        console.log(
          "First 100 chars of base64:",
          cleanBase64.substring(0, 100)
        );

        try {
          const binaryString = window.atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes;
        } catch (error) {
          console.error("Error decoding base64:", error);
          console.error("Base64 string that failed:", cleanBase64);
          throw new Error("Failed to decode base64 encrypted private key");
        }
      };

      const encryptedBuffer = base64ToUint8(data.encrypted_private_key);
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        keyPair.privateKey,
        encryptedBuffer
      );
      const eoa_pk = new TextDecoder().decode(decryptedBuffer);

      setPrivateKey(eoa_pk);
      setShowPrivateKey(true);
      setBlurPrivateKey(true);
    } catch (error) {
      console.error("Error revealing private key:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to reveal private key: ${errorMessage}`, {
        duration: 6000,
      });
    } finally {
      setRevealingKey(false);
    }
  };

  // Auto-check for existing wallet on component mount
  useEffect(() => {
    if (user && !initialCheckDone) {
      checkWallet();
    }
  }, [user, initialCheckDone]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  const createOrRefreshWallet = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/wallet/create", {
        headers: {
          "x-user-info": JSON.stringify({
            sub: user.sub,
            email: user.email,
          }),
        },
      });
      const data = await response.json();

      if (response.ok) {
        setWalletData(data.user[0]);
        toast.success("Wallet ready!");
      } else {
        toast.error(`Wallet error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome, {user.name || user.email}!
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">User Info:</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Sub:</strong> {user.sub}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {!loading && initialCheckDone && (
              <button
                className={`w-full sm:w-auto px-6 py-3 rounded-lg transition-colors ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : walletData
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
                onClick={createOrRefreshWallet}
                disabled={loading}
              >
                {walletData ? "Refresh Wallet Info" : "Create Magic TEE Wallet"}
              </button>
            )}

            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>
                  {walletData
                    ? "Refreshing..."
                    : "Checking for existing wallet..."}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              {walletData && (
                <button
                  onClick={revealPrivateKey}
                  disabled={revealingKey}
                  className={`px-6 py-3 rounded-lg transition-colors ${
                    revealingKey
                      ? "bg-yellow-400 cursor-not-allowed"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  } text-white`}
                >
                  {revealingKey ? "Revealing..." : "🔑 Reveal Private Key"}
                </button>
              )}

              <a
                href="/api/auth/logout"
                className="block w-full sm:w-auto text-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </a>
            </div>
          </div>
        </div>

        {walletData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-3 text-green-700">
              Magic TEE Wallet 🔐
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-1">
                  Wallet Address
                </p>
                <p className="font-mono text-sm break-all">
                  {walletData.wallet_address}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-1">
                  Wallet ID
                </p>
                <p className="font-mono text-sm break-all">
                  {walletData.wallet_id}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <p className="text-sm text-purple-600 font-medium mb-1">
                  Wallet Group
                </p>
                <p className="font-mono text-sm break-all">
                  {walletData.wallet_group}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-sm text-gray-600 font-medium mb-1">
                  Transaction Nonce
                </p>
                <p className="font-mono text-sm">{walletData.nonce}</p>
              </div>
            </div>
            <div className="mt-4 bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-1">Created</p>
              <p className="text-sm">
                {new Date(walletData.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Private Key Modal */}
        {showPrivateKey && privateKey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-red-700">
                  🔑 Private Key (Keep Secret!)
                </h2>
                <button
                  onClick={() => {
                    setShowPrivateKey(false);
                    setPrivateKey(null);
                    setBlurPrivateKey(true); // Reset blur state when closing
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 text-sm">
                  ⚠️ <strong>WARNING:</strong> This is your wallet's private
                  key. Never share it with anyone! Anyone with this key can
                  control your wallet and steal your funds.
                </p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Private Key:
                  </label>
                  <button
                    onClick={() => setBlurPrivateKey(!blurPrivateKey)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      blurPrivateKey
                        ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {blurPrivateKey ? "👁️ Show" : "🙈 Hide"}
                  </button>
                </div>
                <textarea
                  value={privateKey}
                  readOnly
                  className={`w-full h-32 p-3 border border-gray-300 rounded font-mono text-sm bg-gray-50 transition-all duration-200 ${
                    blurPrivateKey ? "blur-sm" : ""
                  }`}
                  style={{ wordBreak: "break-all" }}
                />
                {blurPrivateKey && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Private key is blurred for security. Click "👁️ Show" to
                    reveal.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(privateKey);
                    toast.success("Private key copied to clipboard!");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  📋 Copy to Clipboard
                </button>
                <button
                  onClick={() => {
                    setShowPrivateKey(false);
                    setPrivateKey(null);
                    setBlurPrivateKey(true); // Reset blur state when closing
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
