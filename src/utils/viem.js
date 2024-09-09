import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
 
export const viemClient = createPublicClient({ 
  chain: baseSepolia, 
  transport: http(process.env.ALCHEMY_API_KEY), 
});
