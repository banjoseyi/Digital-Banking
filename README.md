# Digital Banking System — TS Academy Backend Assignment

A backend banking system integrating with the **NibssByPhoenix** simulated NIBSS API. Supports customer onboarding, KYC verification, account creation, and (in progress) core banking operations.

---

## Tech Stack

- **Runtime:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Validation:** Joi
- **Auth:** JWT (access + refresh tokens, stateless — no DB session tracking)
- **Password hashing:** bcrypt
- **HTTP client:** Axios (with a custom auto-refreshing wrapper for NIBSS auth)
- **Security middleware:** Helmet, express-rate-limit, cookie-parser

---

## Project Structure

```
backend/
├── config/
│   └── DataBase.js
├── controller/
│   ├── UserController.js
│   └── AccountController.js
├── middleware/
│   ├── AuthMiddleware.js       # protect() — Bearer token verification
│   ├── Validate.js             # Joi schema validation middleware
│   ├── RateLimitMiddleware.js  # register/login rate limits
│   └── errorHandler.js         # centralized error handler (must be last in app.js)
├── model/
│   ├── User.js
│   └── Account.js
├── routes/
│   ├── UserRoutes.js
│   └── AccountRoutes.js
├── service/
│   └── nibssClient.js          # Axios instance with auto-refreshing NIBSS JWT
├── utils/
│   ├── AppError.js
│   └── Tokens.js                # createAccessToken / createRefreshToken
├── validator/
│   ├── userValidator.js
│   └── kycValidator.js
└── app.js
```

---

## Environment Variables

```
PORT=7000
MONGODB_URI=mongodb://localhost:27017/digital-banking

NIBSS_BASE_URL=*****
NIBSS_API_KEY=<from fintech onboarding>
NIBSS_API_SECRET=<from fintech onboarding>
NIBSS_BANK_CODE=<assigned by NIBSS>
NIBSS_BANK_NAME=<assigned by NIBSS>

ACCESS_TOKEN_SECRET=<random string>
REFRESH_TOKEN_SECRET=<random string>
```

**Important:** `import "dotenv/config"` must be the **first line** in `app.js`, before any other imports. ES module imports are hoisted and execute before code in the importing file — if `dotenv.config()` runs after other imports, any module that reads `process.env` at import time (rather than inside a function) will lock in `undefined` values permanently for that process.

---

## Two Separate Auth Systems (don't confuse these)

| | Purpose | Used by |
|---|---|---|
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | Authenticates **our own customers** into this app | `/api/user/login`, `protect` middleware |
| `NIBSS_API_KEY` / `NIBSS_API_SECRET` | Authenticates **our fintech** to NIBSS itself | `nibssClient.js` (server-to-server only, never touches a customer's session) |

---

## Implemented So Far

### User Auth (`/api/user`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create a customer account (rate-limited) |
| POST | `/login` | — | Login, returns access token + sets refresh token cookie (rate-limited) |
| POST | `/refresh` | Refresh cookie | Issue a new access token |
| POST | `/logout` | Bearer | Clear refresh token cookie |
| POST | `/kyc` | Bearer | Submit BVN/NIN → insert + validate against NIBSS, flips `isKycVerified` |

### Accounts (`/api/account`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/createAccount` | Bearer | Create NIBSS bank account (requires KYC verified, max 1/user) |
| GET | `/balance` | Bearer | Live balance, always fetched fresh from NIBSS — never cached locally |

### Design decisions
- **Access tokens:** 15 min expiry, sent in `Authorization: Bearer` header. **Refresh tokens:** 7 days, httpOnly cookie. Stateless — no DB-backed session table, by choice for this assignment's scope.
- **No local balance caching.** Balance-check always hits NIBSS live (`GET /api/account/balance/{accountNo}`), so it can never drift out of sync with the real ledger.
- **`accountName`** on account creation is taken directly from NIBSS's response (confirmed present despite the docs' sample suggesting otherwise).
- **`bankName`** is NOT returned by `account/create` — pulled from `NIBSS_BANK_NAME` env var instead, since every account created by this fintech belongs to the same single assigned bank.

---

## Important Gotcha: NIBSS's Live API Doesn't Always Match Its Own Docs

Several endpoints returned a different response shape in production than their documented sample. Confirmed by testing directly against NIBSS in Postman (bypassing our app) before trusting any shape:

| Endpoint | Docs sample shape | **Actual live shape** |
|---|---|---|
| `validateBvn` | `{ "valid": true, "bvn": ..., ... }` | `{ "success": true, "message": ..., "data": { "bvn": ..., ... } }` — no `valid` field |
| `account/create` | Flat: `{ "accountNumber": ..., "bankCode": ..., "balance": ... }`, no `accountName` | Nested: `{ "message": ..., "account": { "accountNumber": ..., "accountName": ..., "bankCode": ... } }` — no `bankName`, no `balance` field, `accountName` IS present |

**Lesson applied throughout:** never trust a documented sample response blindly — confirm the real shape with a direct test before parsing it in code.

---

## Known Data Quirk (documented, not a bug)

Early testing surfaced a bug (now fixed) where the app checked for a `success`/`data` field that didn't exist in NIBSS's real `account/create` response, causing the app to treat successful NIBSS account creations as failures and skip the local database save. This left a few accounts existing on NIBSS with no matching local record for a small number of early test users. These were manually reconciled once identified via `GET /api/accounts`. The underlying bug is fixed, so this shouldn't recur for accounts created going forward.

---

## Still To Do (per assignment requirements)

- [ ] Name enquiry (`GET /api/account/name-enquiry/{accountNo}`)
- [ ] Funds transfer — intra-bank and inter-bank (`POST /api/transfer`)
- [ ] Transaction status check (TSQ) (`GET /api/transaction/{transactionId}`)
- [ ] Transaction history endpoint, scoped so each customer sees only their own transactions
- [ ] `Transaction` model to log transfers locally (from/to, amount, status, owning userId)
- [ ] Data isolation review — confirm no endpoint can be made to return another customer's data

---

## Testing Notes

- The NIBSS sandbox appears to be **shared across the whole cohort** — avoid "obvious" test BVNs (`12345678901`, sequences, all-same-digit patterns); they're likely already taken by classmates. Use random 11-digit numbers instead.
- NIBSS is hosted on Render's free tier — expect occasional cold-start delays or transient 500s after periods of inactivity. Hit `/api/docs` first to "wake" it before a testing session.