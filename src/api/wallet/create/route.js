import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/mongodb';

const getWalletHandler = withApiAuthRequired(async (req, res) => {
    try {
        const { user } = await getSession(req, res);
        const { db } = await connectToDatabase();

        // Check if user is authenticated
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        // Check if user already exists, if so return user data
        const existingUser = await db.find({ sub: user.sub }).toArray();
        if (existingUser.length > 0) return NextResponse.json({ user: existingUser }, { status: 200 });
        
        // If user doesn't exist, create wallet for user
        const wallet_group = "5e6053b4-64b7-47e6-9c03-361421caa45b";
        
        // Call Magic TEE API wallet creation endpoint
        const newWallet = await fetch('https://global-tee-prod.magickms.com/v1/api/wallet', {
            method: 'POST',
            headers: {
                'x-magic-secret-key': process.env.MAGIC_SECRET_KEY,
            },
            body: JSON.stringify({
                // Do not use Auth0 sub claim in ID token as encryption context in your prod app!
                encryption_context: user.sub,
                network: "EVM",
                wallet_group_id: wallet_group,
                resource_id: "nextjs-auth0"
            }),
        });
        
        const newWalletInfo = await newWallet.json();
        
        // Construct DB entry for new user
        const newUser = {
            email: user.email,
            sub: user.sub,
            wallet_group,
            wallet_id: newWalletInfo.data.uuid,
            access_key: newWalletInfo.data.access_key,
            recovery_key: newWalletInfo.data.recovery_key,
            wallet_address: newWalletInfo.data.public_address,
            nonce: 0,
        };
        
        // Insert new user into DB
        const result = await db.insertOne(newUser);
        
        // Return user data if successful
        if (result.acknowledged == true && result.insertedId) {
            return NextResponse.json({ user: [newUser] }, { status: 200 });
        };
        
        return NextResponse.json({ error: 'Failed to create wallet, try again' }, { status: 500 });

         } catch (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
         };
    });
    
    export const GET = getWalletHandler;