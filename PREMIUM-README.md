# YieldVibe Premium - Setup Guide

## 🎉 What's New

YieldVibe has been transformed into a premium SaaS with:

- **Dark Mode Theme**: Deep Slate (#0f172a) + Electric Indigo (#6366f1) accents
- **Interactive Charts**: Revenue Pace (This Year vs Last Year), Demand Heatmap, Channel Health
- **AI Revenue Insights**: Gemini-powered actionable recommendations
- **Smart Price Limits**: Floor & Ceiling price protection
- **Premium Glassmorphism UI**: Hover effects, smooth animations

---

## 🚀 Quick Start

### 1. Database Setup

Run the new database schema to enable premium features:

```bash
# First, run the original schema if you haven't
psql your_database < schema.sql

# Then, run the premium schema
psql your_database < schema-premium.sql
```

**OR** manually run the SQL via Supabase Dashboard:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `schema-premium.sql`
3. Execute

### 2. Configure Gemini AI API Key

1. Navigate to `http://localhost:3000/settings`
2. Get your FREE Gemini API key from: https://aistudio.google.com/apikey
3. Paste it in the "Gemini API Key" field
4. Click "Save All Settings"

### 3. Set Price Limits

In Settings → Price Hard Limits:
- **Floor Price**: Minimum price (e.g., $99) - never go below
- **Ceiling Price**: Maximum price (e.g., $400) - never exceed

The AI and automated pricing will respect these limits.

---

## 💡 Using AI Revenue Insights

### Generating Insights

The AI Insights panel (right sidebar on Dashboard) automatically loads insights on page load.

To manually generate new insights:
1. Click the 🔄 refresh button in the AI Insights panel
2. Wait for Gemini AI to analyze your hotel data
3. Review the 3 generated actionable cards

### Approving Insights

Each insight card has:
- **Type**: Event Alert, Demand Surge, or Competitor Update
- **Description**: What's happening
- **Suggested Action**: Specific recommendation
- **Estimated Impact**: Revenue impact ($)
- **One-Click Approve Button**: Click to apply the suggestion

When you click "One-Click Approve":
1. Room prices update automatically
2. Floor/Ceiling limits are enforced
3. Price history is logged
4. The insight is marked as "approved"

---

## 📊 Dashboard Features

### Revenue Pace Chart
- Compares This Year vs Last Year performance
- Shows monthly revenue trends
- Interactive tooltips on hover

### Demand Heatmap
- Next 30 days calendar view
- Color-coded: Light Blue (low) → Purple → Red (surge)
- Hover to see booking count per day

### Channel Health
- Donut chart showing revenue distribution
- Booking.com, Expedia, Direct bookings
- "Commission Saver" metric shows OTA savings

---

## 🛠️ For Developers

### Adding New Features

All premium features follow this pattern:

1. **Database**: Add tables to `schema-premium.sql`
2. **API Routes**: Add to `app/api/...`
3. **Components**: Add to `components/...`
4. **Styling**: Use glassmorphism classes (`glass-card`, `hover-glow`)

### Key Files

- `app/globals.css` - Dark mode theme & utilities
- `components/ai-insights-panel.tsx` - AI insights UI
- `app/api/ai/generate-insights/route.ts` - AI generation endpoint
- `app/api/ai/approve-insight/route.ts` - Approval logic
- `app/api/cron/update-prices/route.ts` - Automated pricing (respects limits)

---

## 🎨 Customization

### Changing Theme Colors

Edit `app/globals.css`:

```css
:root {
  --background: #0f172a;  /* Deep Slate */
  --primary: #6366f1;     /* Electric Indigo */
  /* ... */
}
```

### Adding More Insight Types

Edit `app/api/ai/generate-insights/route.ts` and add new types to the schema.

---

## 📦 Deployment

### Vercel

```bash
git add .
git commit -m "Premium YieldVibe with AI insights"
git push origin main
```

Vercel will auto-deploy. Make sure to add environment variables in Vercel dashboard.

### Required Environment Variables

```
DATABASE_URL=your_supabase_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CRON_SECRET=your_cron_secret
```

**Note**: Users provide their own Gemini API keys via Settings page, so no global Gemini key needed!

---

##  📝 License

This is a portable SaaS product meant for sale as a one-time purchase with no monthly fees.

---

## 🆘 Support

For issues or questions:
1. Check the Supabase logs for database errors
2. Check browser console for frontend errors
3. Verify Gemini API key is configured in Settings
4. Ensure database schema is up to date

---

**Enjoy your premium revenue management system! 🚀**
