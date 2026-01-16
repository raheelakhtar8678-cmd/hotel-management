# YieldVibe Setup Guide 🚀

Complete setup instructions for deploying YieldVibe with database and AI features.

## Quick Start

### 1. Database Setup (Neon)
1. Create an account at [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Get your **pooled connection string** (not direct!)

### 2. Deploy to Vercel
1. Deploy this repo to Vercel
2. Add environment variables in Settings:
   - `POSTGRES_URL` = your Neon pooled connection
   - `CRON_SECRET` = any random string
   - `GEMINI_API_KEY` = (optional) from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Initialize Database
1. Visit your deployed app
2. Go to Settings
3. Click "Initialize / Repair Database Tables"

### 4. Start Using
- Add properties
- Configure pricing rules
- Connect calendars
- Get AI insights

## Local Development

Create `.env.local`:
```bash
POSTGRES_URL=postgres://...your-neon-pooled-connection...
CRON_SECRET=yieldvibe_secret
GEMINI_API_KEY=AIza...  # optional for AI features
```

Run:
```bash
npm install
npm run dev
```

Visit [localhost:3000/settings](http://localhost:3000/settings) to initialize database.

## AI Features

To enable AI-powered insights:
1. Get free API key: [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add `GEMINI_API_KEY` to environment variables
3. Redeploy (or restart dev server)

AI features automatically work - no "save settings" needed!

## Troubleshooting

**"invalid_connection_string" error?**
- Use `POSTGRES_URL` (not `DATABASE_URL`)
- Must be **pooled** connection from Neon

**AI not working?**
- Add `GEMINI_API_KEY` to environment variables
- Redeploy after adding

For detailed instructions, see the full setup guide.
