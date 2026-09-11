# RideIt — Bike Rental & Booking Platform

A full-stack bike rental platform for travelers: search bikes by city, verify
your documents, book online or pay cash at pickup, and manage everything from
a user dashboard — with a full admin panel to manage users, bikes, bookings,
payments, cities, coupons and support tickets.

## Features

- **Auth**: register/login/logout, email verification, phone OTP verification,
  forgot/reset password, JWT (access + refresh, httpOnly cookies)
- **Document verification**: government ID, driving license, selfie —
  upload → pending → approved/rejected, with admin review. A user cannot
  book a bike until all three are approved.
- **Bike search**: filter by city, category, price, brand, transmission,
  fuel type, rating; sort by price/rating/popularity
- **Booking**: server-validated availability (no double-booking, race-safe
  via a MongoDB transaction), server-calculated pricing (rental + helmet +
  taxes − discount + deposit), coupons
- **Payments**: Razorpay integration with a built-in **mock mode** so the
  entire flow works before you have real Razorpay keys; server-side signature
  verification; webhook handler; refunds
- **Cash payments**: "Pay at Pickup", admin marks cash received/not received
- **Admin panel**: dashboard stats & charts, user management, document
  review, bike/city/location CRUD, booking management, payments, coupons,
  support tickets
- **Security**: bcrypt hashing, JWT, role-based authorization, rate limiting,
  Mongo-injection sanitization, XSS sanitization, Helmet, owner-or-admin-only
  document file access (never publicly served)

## Tech stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, React Router, Axios, Vite
- **Backend**: Node.js, Express, TypeScript, Mongoose (MongoDB)
- **Auth**: JWT + bcrypt, OTP (mock mode until an SMS provider is wired in)
- **Payments**: Razorpay (mock mode until real test/live keys are set)
- **File storage**: local disk by default; swappable to S3/Cloudinary via
  `STORAGE_DRIVER` (see `backend/src/config/storage.ts`)

---

## 1. Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas
  connection string
- npm

## 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
```

Edit `.env` as needed. **You do not need real Razorpay keys to run the app**
— `PAYMENTS_MOCK_MODE=true` (the default) makes the whole booking → pay →
confirm flow work with a simulated checkout. Same for OTP (`OTP_MOCK_MODE=true`
prints/returns the OTP instead of sending a real SMS) and for
`STORAGE_DRIVER=local` (documents/photos are saved to `backend/uploads/`).

Start MongoDB, then seed sample data (10 cities, 30+ bikes, an admin account,
a demo traveler account, and two coupons):

```bash
npm run seed
```

This prints the seeded admin and demo user credentials to the console —by
default:
- Admin: `admin@bikerental.com` / `ChangeMe123!` (from `.env` `ADMIN_EMAIL`/`ADMIN_PASSWORD`)
- Demo user: `traveler@example.com` / `Password123!`

Run the API in dev mode:

```bash
npm run dev
```

The API starts on `http://localhost:5000`. Health check: `GET /api/health`.

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The app starts on `http://localhost:5173` and proxies `/api` and `/uploads`
requests to the backend (see `vite.config.ts`), so you don't need to change
`VITE_API_BASE_URL` for local dev unless you're pointing at a deployed API.

Open `http://localhost:5173` for the user app, and
`http://localhost:5173/admin/login` for the admin panel.

## 4. Going from mock to real integrations

| Integration | What to do |
|---|---|
| **Razorpay** | Get Test (then Live) keys from the [Razorpay dashboard](https://dashboard.razorpay.com/) → Settings → API Keys. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `PAYMENTS_MOCK_MODE=false` in `backend/.env`. Set `VITE_RAZORPAY_KEY_ID` in `frontend/.env`. Swap `MockRazorpayCheckout.tsx` for the real Razorpay Checkout.js script (the swap point is documented in that file and in `razorpayService.ts`). |
| **SMS/OTP (Twilio)** | Sign up at twilio.com, buy/verify a number, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` and `OTP_MOCK_MODE=false` in `backend/.env`. The real Twilio call is already wired in `otpService.ts` — no code changes needed. |
| **Cloud storage (S3/Cloudinary)** | Real SDK integrations are already wired in `backend/src/config/storage.ts` — just set `STORAGE_DRIVER=s3` (or `cloudinary`) and the matching credentials in `.env`. **For S3**: create the bucket with default "Block Public Access" ON, then add a bucket policy granting public `s3:GetObject` on `arn:aws:s3:::YOUR_BUCKET/bikes/*` and `.../profiles/*` only — never on `documents/*`, which must stay private. **For Cloudinary**: no extra setup needed; documents automatically upload as `type: authenticated` (private) and are served through short-lived signed URLs. |
| **Maps** | Set `VITE_MAP_PROVIDER` and the relevant token in `frontend/.env`, then add a Mapbox GL / Google Maps component where you want a live map. Not wired up yet — this scaffold uses location dropdowns instead to avoid requiring a paid key out of the box. |
| **Email** | Set `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` in `backend/.env` — works with any SMTP provider (SendGrid, AWS SES, Mailgun, Postmark, etc.), no code changes needed. Without it, emails are logged to the server console instead of sent. |

## 5. Production deployment checklist

Before deploying for real users (not just a demo), do all of the following:

1. **Replace default secrets.** Generate strong random values for `JWT_SECRET` and `JWT_REFRESH_SECRET` (e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`) — never ship the `.env.example` defaults.
2. **Switch file storage off local disk.** Most hosting platforms (Render, Railway, Heroku, etc.) have an ephemeral filesystem — anything saved to `backend/uploads/` is lost on every redeploy/restart. Set `STORAGE_DRIVER=s3` or `cloudinary` (see table above) before going live.
3. **Turn on real payments.** Set real Razorpay keys and `PAYMENTS_MOCK_MODE=false`.
4. **Turn on real email.** Configure a real SMTP provider so verification/reset/booking emails actually send.
5. **Turn on real SMS.** Configure Twilio (or another provider) and set `OTP_MOCK_MODE=false` so phone verification is real.
6. **Serve everything over HTTPS.** Cookies are marked `secure` automatically when `NODE_ENV=production` (see `authController.ts`), which means browsers will silently drop them over plain HTTP — both the frontend and backend must be on HTTPS domains (any of Render/Vercel/Netlify/Railway provide this automatically). Also update `CLIENT_URL` (backend) and `VITE_API_BASE_URL` (frontend) to the real production URLs, and restrict MongoDB Atlas network access to your server's IP instead of `0.0.0.0/0`.



## 5. Project structure

```
backend/
  src/
    config/       # env, db, storage (local/S3/Cloudinary) drivers
    models/       # Mongoose schemas
    middleware/   # auth, error handling, upload, rate limiting
    controllers/  # route handlers (admin/ subfolder for admin-only ones)
    routes/       # Express routers
    services/     # business logic: pricing, availability, razorpay, email, otp, notifications, invoices
    utils/        # ApiError, ApiResponse, token helpers, booking ID generator
    seed/         # seed script + sample data JSON
frontend/
  src/
    components/   # shared UI: BikeCard, StatusBadge, ProtectedRoute, MockRazorpayCheckout
    layouts/      # UserLayout, AdminLayout
    pages/        # user-facing pages + pages/admin for the admin panel
    context/      # AuthContext
    services/     # Axios-based API clients
    types/        # shared TypeScript types
```

## 6. Key business rules implemented server-side (never trust the client for these)

- **Price**: calculated in `services/pricingService.ts` from the bike's
  stored rates, never from a number the frontend sends.
- **Availability / no double-booking**: `services/availabilityService.ts`
  checks for overlapping active bookings on the same bike, wrapped in a
  MongoDB transaction in `bookingController.createBooking` so two concurrent
  requests can't both succeed for the same overlapping slot.
- **Payment status**: only ever flips to "successful" after
  `razorpayService.verifyPaymentSignature` (an HMAC check using the account
  secret) passes — the frontend's "it worked" callback is not trusted.
- **Document gate**: `User.areDocumentsApproved()` is checked server-side in
  `bookingController.createBooking` before any booking is created.
- **Role**: `req.user.role` always comes from a fresh DB lookup in the
  `protect` middleware, never from a client-supplied field.

## 7. Known gaps / good next steps

This is a complete, working scaffold with real logic for the core flows —
a few lower-priority items are intentionally left as clearly marked
extension points rather than filled with speculative code:

- PDF invoice generation (`invoiceService.ts` builds the structured data;
  wire in `pdfkit` or `puppeteer` to render it to a downloadable PDF)
- Wishlist persistence (add a `wishlist: ObjectId[]` field to `User`)
- Interactive map component (Mapbox GL/Google Maps) instead of the current
  location dropdowns
- Admin review moderation page and city-level location sub-table UI
- SMS/WhatsApp notifications (structure is in place via `notificationService.ts`)
