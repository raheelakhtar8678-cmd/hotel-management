# YieldVibe - Hotel & Airbnb Property Management System

## Buyer's Guide

Congratulations on your purchase! This guide will help you set up and deploy YieldVibe on your own Vercel account with a Neon PostgreSQL database.

---

## What You're Getting

### Core Features
- ✅ **Multi-Property Dashboard** - Manage multiple properties from one interface
- ✅ **Smart Booking Calculator** - Create bookings with dynamic pricing
- ✅ **Revenue Analytics** - KPIs, channel health, demand forecasting
- ✅ **Pricing Rules Engine** - Automate price adjustments
- ✅ **Calendar Integration** - iCal sync with Airbnb, Booking.com, VRBO
- ✅ **Tax Management** - Configure taxes per property
- ✅ **Staff Management** - Track housekeeping and maintenance
- ✅ **Webhook API** - Integrate with n8n, Zapier, Make.com
- ✅ **Email Notifications** - Automated booking confirmations
- ✅ **Data Export** - CSV & Excel export
- ✅ **Modern UI** - Fresh blue/white SaaS design

### Cost Savings
Compare to competitors:
- Guesty: $99/month = **$1,188/year**
- Hostaway: $79/month = **$948/year**
- Lodgify: $64/month = **$768/year**

**YieldVibe: One-time $200** + Free hosting on Vercel/Neon

---

## Quick Start (15 minutes)

### Step 1: Accept Transfer

You'll receive a GitHub repository transfer and Vercel project invitation. Accept both.

### Step 2: Create Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project (any name, e.g., "yieldvibe-db")
3. Copy the connection string (looks like `postgres://user:password@host/database`)

### Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `POSTGRES_URL` | Your Neon connection string | Database connection |
| `RESEND_API_KEY` | (Optional) API key from resend.com | Email notifications |
| `GEMINI_API_KEY` | (Optional) API key from Google AI | AI revenue insights |

### Step 4: Run Database Migration

1. Go to [Neon Console](https://console.neon.tech)
2. Open SQL Editor
3. Copy and run the SQL from `/app/settings` page → SQL Guide tab
4. Run each section in order (1-4)

### Step 5: Deploy

Click "Redeploy" in Vercel, and your app is live!

---

## Environment Variables Reference

### Required

```env
POSTGRES_URL=postgres://username:password@host.neon.tech/dbname?sslmode=require
```

### Optional (Recommended)

```env
# Email notifications via Resend (3,000 free/month)
RESEND_API_KEY=re_xxxxxxxxxxxx

# AI revenue insights via Google Gemini
GEMINI_API_KEY=AIzaxxxxxxxxxx
```

---

## First-Time Setup

After deployment:

1. **Add Your First Property**
   - Navigate to Properties → Add Property
   - Fill in property details, pricing limits

2. **Add Rooms**
   - Go to Inventory → Add Room
   - Configure room types, base prices

3. **Set Up Taxes** (Optional)
   - Settings → Manage Taxes
   - Add applicable taxes (VAT, GST, etc.)

4. **Configure Pricing Rules** (Optional)
   - Pricing Rules → New Rule
   - Set up weekend, seasonal, or last-minute adjustments

5. **Connect Calendars** (Optional)
   - Calendar → Connect
   - Paste iCal URLs from Airbnb, Booking.com

---

## Webhook API Setup

### Enable API Keys

1. Go to Settings → API Keys tab
2. If prompted, run the migration SQL in Neon
3. Generate a new API key with desired permissions

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/webhooks/booking` | List recent bookings |
| `POST` | `/api/webhooks/booking` | Create new booking |
| `GET` | `/api/webhooks/availability` | Check room availability |
| `GET` | `/api/webhooks/rooms` | List rooms with status |
| `GET` | `/api/webhooks/revenue` | Revenue summary |

### Authentication

Include your API key in requests:

```
Authorization: Bearer yvb_xxxxxxxxxxxxx
```

or

```
X-API-Key: yvb_xxxxxxxxxxxxx
```

### Example: Create Booking (n8n/Zapier)

```json
POST /api/webhooks/booking
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "room_id": "uuid-of-room",
  "guest_name": "John Smith",
  "guest_email": "john@example.com",
  "check_in": "2024-02-15",
  "check_out": "2024-02-18",
  "total_paid": 450.00,
  "guests": 2,
  "channel": "zapier"
}
```

---

## Email Notifications

### Setup Resend

1. Create account at [resend.com](https://resend.com) (free: 3,000 emails/month)
2. Get your API key from dashboard
3. Add `RESEND_API_KEY` to Vercel environment variables
4. Redeploy

### What Gets Sent

- **Booking Confirmation** → Guest receives confirmation with all details
- Beautiful, responsive email templates included

---

## Troubleshooting

### "Database connection error"
- Verify `POSTGRES_URL` is correct in Vercel env vars
- Ensure the Neon database is not paused (free tier pauses after 5 days of inactivity)

### "API key not working"
- Make sure you ran the API keys migration SQL
- Check that the key has correct permissions (read/write)

### "Email not sending"
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Note: Emails won't send if guest_email is empty

### "AI Insights not working"
- Add `GEMINI_API_KEY` to environment variables
- Get free API key from [Google AI Studio](https://aistudio.google.com)

---

## Support

This is a one-time purchase with no ongoing support obligation. However, the codebase is well-documented and follows standard Next.js patterns.

For customizations or issues:
- Review the code in the GitHub repository
- Check Next.js and Vercel documentation
- Common issues are covered in this guide

---

## File Structure Overview

```
/app                    # Next.js app router pages
  /api                  # API routes
    /webhooks           # External integration endpoints
  /bookings             # Bookings management page
  /calculator           # Booking calculator
  /settings             # System configuration
/components             # Reusable UI components
/lib                    # Utility libraries
  /email.ts             # Email notification system
  /export.ts            # CSV/Excel export
  /api-auth.ts          # Webhook authentication
/migrations             # SQL migration scripts
```

---

## License

This software is sold for personal/commercial use. You may:
- Deploy on your own infrastructure
- Modify the code for your needs
- Use for commercial property management

You may not:
- Resell the source code
- Redistribute as a competing product

---

**Thank you for choosing YieldVibe! 🎉**
