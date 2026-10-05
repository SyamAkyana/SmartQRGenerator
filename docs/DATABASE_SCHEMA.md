# SmartQR — Database Schema Documentation

## Current Phase (Phase 1)

### `User` (`users`)
Stores user accounts for authentication and ownership relations.

| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, cuid | Unique user identifier |
| `name` | String | NOT NULL | User's full display name |
| `email` | String | UNIQUE, NOT NULL | Lowercased email address |
| `passwordHash` | String | NOT NULL | Bcrypt hash (cost factor 12) |
| `avatarUrl` | String | NULLABLE | Profile avatar URL |
| `createdAt` | DateTime | DEFAULT now() | Creation timestamp |
| `updatedAt` | DateTime | AUTO updated | Modification timestamp |

### `PasswordResetToken` (`password_reset_tokens`)
Stores hashed password reset tokens with 1-hour expiration and single-use tracking.

| Column | Type | Attributes | Description |
|---|---|---|---|
| `id` | String | PK, cuid | Unique token record ID |
| `userId` | String | FK -> User.id (Cascade) | Target user |
| `tokenHash` | String | UNIQUE, NOT NULL | SHA-256 hash of raw reset token |
| `expiresAt` | DateTime | NOT NULL | Expiry timestamp |
| `usedAt` | DateTime | NULLABLE | Timestamp when consumed |
| `createdAt` | DateTime | DEFAULT now() | Creation timestamp |

## Future Phases

- Phase 2: `QRCode` & `QRDesign`
- Phase 4: `Scan` (Analytics)
- Phase 5: `File`
- Phase 6: `MultiLinkPage` & `MultiLinkItem`
