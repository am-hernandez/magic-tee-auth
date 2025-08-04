"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
      } else {
        alert("Error with wallet: " + data.error);
      }
    } catch (error) {
      alert(
        "Error: " + (error instanceof Error ? error.message : "Unknown error")
      );
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

            <a
              href="/api/auth/logout"
              className="block w-full sm:w-auto text-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </a>
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
      </div>
    </div>
  );
}
