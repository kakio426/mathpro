import "server-only";
import { z } from "zod";
import { publicEnvSchema } from "@/lib/env";

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

function formatEnvIssues(issues: z.ZodIssue[]) {
  return issues
    .map((issue) => {
      const key = issue.path.join(".") || "unknown";
      return `- ${key}: ${issue.message}`;
    })
    .join("\n");
}

function loadServerEnv() {
  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      `Missing or invalid server environment variables.\n${formatEnvIssues(parsed.error.issues)}`,
    );
  }

  return parsed.data;
}

export const serverEnv = loadServerEnv();
