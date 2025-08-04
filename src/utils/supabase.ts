import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export interface UserRecord {
  id?: number;
  email: string;
  sub: string;
  wallet_group: string;
  wallet_id: string;
  access_key: string;
  recovery_key: string;
  wallet_address: string;
  nonce: number;
  created_at?: string;
  updated_at?: string;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

export class SupabaseUserService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  async findUserBySub(sub: string): Promise<UserRecord[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select("*")
      .eq("sub", sub);

    if (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data || [];
  }

  async insertUser(
    user: Omit<UserRecord, "id" | "created_at" | "updated_at">
  ): Promise<UserRecord> {
    const { data, error } = await this.supabase
      .from("users")
      .insert([user])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert user: ${error.message}`);
    }

    return data;
  }

  async updateUser(
    sub: string,
    updates: Partial<UserRecord>
  ): Promise<UserRecord> {
    const { data, error } = await this.supabase
      .from("users")
      .update(updates)
      .eq("sub", sub)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }
}
