# Digital Banking System

This is my TS Academy backend assignment — a banking system backend that integrates with the **NibssByPhoenix** simulated NIBSS API. It handles customer onboarding, KYC, account creation, and core banking operations (name enquiry, transfers, balance checks, transaction history).

**Deadline:** 5th September 2026

---

## Stack

- Node.js + Express
- MongoDB with Mongoose
- Joi for validation
- JWT for auth (access + refresh tokens)
- bcrypt for password hashing
- Axios for calling NIBSS
- Helmet, express-rate-limit, cookie-parser

---

## Project Structure

```
backend/
├── config/DataBase.js
├── controller/
│   ├── UserController.js
│   ├── AccountController.js
│   └── TransactionController.js
├── middleware/
│   ├── AuthMiddleware.js
│   ├── Validate.js
│   ├── RateLimitMiddleware.js
│   └── errorHandler.js
├── model/
│   ├── User.js
│   ├── Account.js
│   └── Transaction.js
├── routes/
│   ├── UserRoutes.js
│   ├── AccountRoutes.js
│   └── TransactionRoutes.js
├── service/
│   └── nibssClient.js
├── utils/
│   ├── AppError.js
│   └── Tokens.js
├── validator/
│   ├── userValidator.js
│   ├── kycValidator.js
│   └── transferValidator.js
└── app.js
```

---

## Environment Variables

```
PORT=7000
MONGODB_URI=mongodb://localhost:27017/digital-banking

NIBSS_BASE_URL=https://nibssbyphoenix.onrender.com
NIBSS_API_KEY=
NIBSS_API_SECRET=
NIBSS_BANK_CODE=
NIBSS_BANK_NAME=

ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
```

One thing that tripped me up: `import "dotenv/config"` has to be the very first line in `app.js`. Since ES module imports load before anything else in the file runs, if dotenv loads after another import that reads `process.env` at the top level, that value gets locked in as `undefined` for the whole process — even if the `.env` file is correct.

---

## Two Separate Auth Systems — don't mix these up

- **`ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`** — for logging *my customers* into this app.
- **`NIBSS_API_KEY` / `NIBSS_API_SECRET`** — for authenticating *my fintech* to NIBSS. Server-side only, customers never see it.

---

## What's Working So Far

### User (`/api/user`)
- `POST /register` — create a customer
- `POST /login` — returns access token, sets refresh token cookie
- `POST /refresh` — get a new access token
- `POST /logout`
- `POST /kyc` — submits BVN/NIN to NIBSS, validates it, flips `isKycVerified` to true

### Account (`/api/account`)
- `POST /createAccount` — requires KYC verified, one account per user, creates the NUBAN on NIBSS and saves it locally
- `GET /getBalance` — always fetched live from NIBSS, never stored locally so it can't go stale
- `GET /nameEnquiry/:accountNumber` — resolves an account number to a name before transferring

### Transaction (`/api/transaction`)
- `POST /transfer` — sends money between two accounts, logs the transfer locally
- `GET /` — my transaction history, scoped to the logged-in user only
- `GET /:transactionId` — checks a transaction's status (only works for transactions that user actually made)

---

## Design Decisions

- **No local balance caching.** Balance always comes from NIBSS live. A stored balance would drift the second a transfer happens, so I didn't bother.
- **Access tokens expire in 15 min, refresh tokens in 7 days.** No database session table — kept it stateless for this assignment's scope.
- **Data isolation** is enforced by always filtering by `req.user._id`, never by an ID the client sends. This applies to transaction history and status checks.

---

## Biggest Lesson: NIBSS's Live API Doesn't Always Match Its Own Docs

I got stuck a few times trusting the documented sample responses instead of testing the real thing. Every time, I fixed it by hitting the endpoint directly in Postman first (bypassing my own app) to see the actual shape before writing any parsing code. A few examples:

| Endpoint | Docs say | Actually returns |
|---|---|---|
| `validateBvn` | `{ "valid": true, ... }` | `{ "success": true, "data": { ... } }` |
| `account/create` | Flat, no `accountName` | Nested under `"account"`, and `accountName` IS included; `bankName` is not |
| `transfer` | `{ "transactionId": ..., "from": ..., "to": ... }` | `{ "reference": ..., "senderAccount": ..., "receiverAccount": ... }` |

Lesson: never trust a docs sample blindly — always confirm with a real request first.

---

## Other Notes

- The NIBSS sandbox seems to be shared across the whole cohort, so obvious test BVNs (`12345678901`, sequences, repeated digits) are usually already taken. I generate random 11-digit numbers instead.
- It's hosted on Render's free tier, so it occasionally cold-starts slowly or throws a transient 500. Hitting `/api/docs` first usually wakes it up.
- Early on, a bug in my account-creation code caused a few NIBSS accounts to get created without saving locally (it checked for a `success` field that didn't exist in the real response). I found and reconciled those manually once I caught it — the underlying bug is fixed now.

---

## Still Left To Do

- [ ] Intra vs inter-bank transfer distinction, if the assignment needs it called out explicitly (currently `/transfer` handles both the same way, matching how NIBSS itself treats it)
- [ ] Final review of data isolation across every endpoint
- [ ] Clean up any leftover duplicate routes from when I moved `transferFunds` between controllers
- [ ] Final end-to-end test pass before submission