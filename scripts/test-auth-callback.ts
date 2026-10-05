/**
 * Diagnostic: test the Auth.js credentials callback directly via HTTP.
 * This simulates what signIn does internally — posts to /api/auth/callback/credentials
 */

const BASE = "http://localhost:3000";

async function main() {
  // 1. Get CSRF token from /api/auth/csrf
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json();
  console.log("CSRF token:", csrfToken ? "(found)" : "(MISSING)");

  // 2. POST to /api/auth/callback/credentials with demo credentials
  const callbackRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      email: "demo@smartqr.example",
      password: "DemoPassword123!",
      callbackUrl: `${BASE}/dashboard`,
      redirect: "false",
      json: "true",
    }),
    redirect: "manual",
  });

  console.log("Callback status:", callbackRes.status);
  console.log("Callback headers:", Object.fromEntries(callbackRes.headers.entries()));
  const location = callbackRes.headers.get("location");
  if (location) console.log("Redirect to:", location);

  // 3. Check the session
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { cookie: callbackRes.headers.getSetCookie().join("; ") },
  });
  const session = await sessionRes.json();
  console.log("Session:", JSON.stringify(session, null, 2));
}

main().catch(console.error);
