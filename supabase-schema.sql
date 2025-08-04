-- ==========================================
-- Magic TEE Auth - Supabase Schema
-- ==========================================
-- Execute this SQL in your Supabase SQL Editor

-- Create users table for storing wallet data
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  sub VARCHAR(255) NOT NULL UNIQUE, -- Auth0 user ID
  wallet_group UUID NOT NULL,
  wallet_id UUID NOT NULL UNIQUE,
  access_key TEXT NOT NULL,
  recovery_key TEXT NOT NULL,
  wallet_address VARCHAR(42) NOT NULL, -- Ethereum address
  nonce INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_sub ON users (sub);
CREATE INDEX IF NOT EXISTS idx_users_wallet_id ON users (wallet_id);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users (wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Create updated_at trigger to automatically update the timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores user wallet data from Magic TEE API';
COMMENT ON COLUMN users.sub IS 'Auth0 user identifier (unique)';
COMMENT ON COLUMN users.wallet_group IS 'Magic TEE wallet group UUID';
COMMENT ON COLUMN users.wallet_id IS 'Magic TEE wallet UUID';
COMMENT ON COLUMN users.access_key IS 'Magic TEE wallet access key';
COMMENT ON COLUMN users.recovery_key IS 'Magic TEE wallet recovery key';
COMMENT ON COLUMN users.wallet_address IS 'Ethereum wallet address';
COMMENT ON COLUMN users.nonce IS 'Transaction nonce counter';

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to access all data
CREATE POLICY "Service role can access all users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO authenticated;