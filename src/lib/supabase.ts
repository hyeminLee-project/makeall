import { createClient } from "@supabase/supabase-js";

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`환경변수 ${name}이(가) 설정되지 않았습니다.`);
  return value;
}

export const supabaseAdmin = createClient(
  getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
  getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY")
);
