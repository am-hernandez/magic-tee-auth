export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Magic TEE Auth
          </h1>
          <p className="text-gray-600 mb-8">
            Secure wallet creation with Auth0 and Magic TEE
          </p>

          <div className="space-y-4">
            <a
              href="/api/auth/login?returnTo=/dashboard"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Sign In with Auth0
            </a>

            <div className="text-sm text-gray-500">
              <p>Features:</p>
              <ul className="mt-2 text-left list-disc list-inside space-y-1">
                <li>Auth0 authentication</li>
                <li>Magic TEE wallet creation</li>
                <li>Supabase data storage</li>
                <li>Base Sepolia transactions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
