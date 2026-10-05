# SmartQR — Security Specification

## Authentication Security

1. **Password Hashing:**
   - Algorithm: `bcrypt`
   - Cost factor: 12
   - Passwords truncated at 72 characters (bcrypt limitation enforced via Zod schema).

2. **Password Policy:**
   - Minimum 8 characters
   - Maximum 72 characters
   - At least 1 lowercase letter (`[a-z]`)
   - At least 1 uppercase letter (`[A-Z]`)
   - At least 1 numeric character (`[0-9]`)

3. **Session Management:**
   - Auth.js v5 with JWT session strategy
   - Signed and encrypted using `AUTH_SECRET` (256-bit entropy)
   - `user.id` persisted in JWT payload for downstream ownership checks

4. **Password Reset Tokens:**
   - Generated using `crypto.randomBytes(32)` (256-bit cryptographic entropy)
   - Raw tokens are never stored in the database — only SHA-256 hashes
   - Tokens expire after 1 hour
   - Single-use enforced via atomic transaction updating `usedAt`
   - Password reset request endpoint always returns generic success to prevent user enumeration

5. **Server-Side Validation:**
   - All inputs validated using Zod before any database or authentication operation
   - Client-side validation provided for UX only
