import { defineConfig, devices } from "@playwright/test";

const port = 3001;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key MATHPRO_E2E_FIXTURES=1 npm run dev -- --hostname 127.0.0.1 --port 3001",
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
