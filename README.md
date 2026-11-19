# Dera

Free homestay booking website for India. Guests send a booking request, the host approves it, and the guest pays the host at the property.

Built with **Next.js** (website) and **Supabase** (database, login, photo storage). Hosted on **Vercel**.

## What it does

- **Explore:** search stays by city or state, number of guests and type of stay; sort by price
- **Login:** passwordless, with a login link sent by email
- **Hosts:** list a place with up to 6 photos, a price in ₹ and amenities; hide or show listings
- **Guests:** request dates, see the price, send a message to the host
- **Host dashboard:** approve or decline requests, with a reply (address, directions, phone)
- **My trips:** guests see request status and the host's reply, and can cancel
- **Safety:** the database blocks double bookings, and each user can only see or change their own data

## Setup (one time)

### 1. Create the database
1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the full contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.

### 2. Put the site live on Vercel
1. In Vercel, click **Add New → Project**, pick the `dera` repository, and click **Import**.
2. Before deploying, open **Environment Variables** and add both of these. Find them in Supabase → **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the `anon` `public` key (never the `service_role` key)
3. Click **Deploy**. You'll get an address like `https://dera-xyz.vercel.app`.

### 3. Let login links point to your site
In Supabase → **Authentication → URL Configuration**:
- **Site URL:** your Vercel address
- **Redirect URLs:** add your Vercel address too

## Run it on your own computer (optional)

```bash
cp .env.example .env.local   # then fill in the two values
npm install
npm run dev
```

## Ideas for later
- Online payments with Razorpay
- Reviews and ratings
- Map view
- Phone OTP login
- Email notifications for new requests
