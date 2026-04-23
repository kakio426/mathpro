import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    protocol: /^https?$/,
    hostname: z.regexes.domain,
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

function formatEnvIssues(issues: z.ZodIssue[]) {
  return issues
    .map((issue) => {
      const key = issue.path.join(".") || "unknown";
      return `- ${key}: ${issue.message}`;
    })
    .join("\n");
}

function loadPublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      `Missing or invalid public environment variables.\n${formatEnvIssues(parsed.error.issues)}`,
    );
  }

  return parsed.data;
}

export const publicEnv = loadPublicEnv();
