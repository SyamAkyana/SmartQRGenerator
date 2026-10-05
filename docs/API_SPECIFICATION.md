# SmartQR — API Specification (Phase 1)

## Authentication Endpoints

### Route Handler: `POST /api/auth/[...nextauth]`
Handles Auth.js session operations (sign in, sign out, session retrieval).

### Server Action: `registerAction(prevState, formData)`
- **Input:** `name`, `email`, `password`, `confirmPassword`
- **Output:** `{ success: true }` or `{ success: false, error: string, fieldErrors?: Record<string, string[]> }`
- **Side effects:** Creates user in DB, logs user in via `signIn("credentials")`, redirects to `/dashboard`.

### Server Action: `loginAction(prevState, formData)`
- **Input:** `email`, `password`
- **Output:** Redirects to `/dashboard` on success; `{ success: false, error: string }` on failure.

### Server Action: `logoutAction()`
- **Side effects:** Clears session cookie, redirects to `/login`.

### Server Action: `forgotPasswordAction(prevState, formData)`
- **Input:** `email`
- **Output:** Generic success message + optional `debugToken` in development mode.

### Server Action: `resetPasswordAction(prevState, formData)`
- **Input:** `token`, `password`, `confirmPassword`
- **Output:** Updates password, consumes token.
