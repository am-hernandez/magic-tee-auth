import { handleAuth } from "@auth0/nextjs-auth0";

// Handle all Auth0 routes (login, logout, callback, me)
export const GET = handleAuth();
export const POST = handleAuth();
