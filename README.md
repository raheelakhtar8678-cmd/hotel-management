# 🏨 YieldVibe - Hotel Revenue Management System

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![License](https://img.shields.io/badge/license-MIT-blue)

**YieldVibe** is a comprehensive hotel revenue management platform with AI-powered pricing optimization, multi-channel calendar sync, and real-time analytics.

🔗 **[Live Demo](https://yieldvibe.vercel.app)** | 📚 **[Documentation](./DEPLOY_VERCEL.md)** | 🚀 **[Deploy on Vercel](https://vercel.com/new)**

---

## ✨ Features

### **Core Revenue Management**
- 📊 **Dynamic Pricing Engine** - Automated price optimization based on demand, seasonality, and occupancy
- 📅 **Multi-Property Management** - Manage unlimited properties and rooms from one dashboard
- 💰 **Pricing Rules** - Create custom rules with time-based, occupancy-based, and seasonal strategies
- 🎯 **Price Limits** - Set floor/ceiling constraints to protect margins

### **Channel Management**
- 🔄 **iCal Calendar Sync** - Import bookings from Airbnb, Vrbo, Booking.com automatically
- 🚫 **Conflict Detection** - Prevent double-bookings across channels
- 🏷️ **Multi-Channel Tracking** - Track performance by booking source
- 📱 **Real-time Sync** - Manual or automated calendar synchronization

### **Analytics & Insights**
- 📈 **Revenue Dashboard** - Real-time KPIs and performance metrics
- 🔥 **Demand Heatmap** - 30-day visual demand forecast
- 🤖 **AI Insights** - Powered by Google Gemini for pricing recommendations
- 📊 **Performance Reports** - Revenue, occupancy, and benchmark reports

### **Automation**
- ⏰ **Cron Jobs** - Automated hourly price updates
- 🎨 **Active Rules Widget** - Manage and monitor active pricing strategies
- 🔍 **Smart Recommendations** - AI-suggested optimizations

---

## 🚀 Quick Start

### **1. Deploy to Vercel**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/yieldvibe)

### **2. Set Up Database**

1. Create free [Supabase](https://supabase.com) account
2. Create new project
3. Copy credentials to Vercel environment variables
4. Run `schema-premium.sql` and `migrations/add_calendar_sync.sql` in SQL Editor

### **3. Configure Environment**

Add in Vercel → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
CRON_SECRET=your-random-secret
```

**Done!** Visit your deployed URL 🎉

---

## 💻 Local Development

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/yieldvibe.git
cd yieldvibe

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📁 Project Structure

```
yieldvibe/
├── app/
│   ├── api/              # API routes
│   │   ├── properties/   # Property CRUD
│   │   ├── bookings/     # Booking management
│   │   ├── pricing-rules/ # Rule engine
│   │   ├── calendar-connections/ # iCal sync
│   │   └── cron/         # Automated tasks
│   ├── properties/       # Property pages
│   ├── calendar/         # Booking calendar
│   ├── pricing-rules/    # Rule management
│   ├── settings/         # Configuration
│   └── reports/          # Analytics
├── components/           # React components
│   ├── ui/               # shadcn/ui components
│   ├── charts/           # Data visualizations
│   └── *.tsx             # Custom widgets
├── lib/
│   ├── engine/           # Pricing engine logic
│   ├── ical/             # Calendar parser
│   └── supabase/         # Database client
├── migrations/           # Database migrations
└── public/               # Static assets
```

---

## 🎯 Key Technologies

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **UI**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS 4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **AI**: [Google Gemini](https://ai.google.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 📚 Documentation

- 📖 **[Deployment Guide](./DEPLOY_VERCEL.md)** - Deploy to Vercel
- 🔧 **[Database Setup](./SETUP_DATABASE.md)** - Configure Supabase
- 🧪 **[Calendar Sync Guide](./calendar_sync_guide.md)** - iCal integration
- 🐛 **[Debugging Guide](./DEBUGGING.md)** - Troubleshooting

---

## 🎨 Features Showcase

### Dashboard
![Dashboard](https://via.placeholder.com/800x400?text=YieldVibe+Dashboard)

### Pricing Rules
![Pricing Rules](https://via.placeholder.com/800x400?text=Pricing+Rules+Engine)

### Calendar Sync
![Calendar Sync](https://via.placeholder.com/800x400?text=Calendar+Sync)

---

## 🔐 Security

- ✅ Row Level Security (RLS) enabled in Supabase
- ✅ Environment variables for sensitive data
- ✅ API authentication via service role keys
- ✅ CRON_SECRET for automated endpoints
- ✅ HTTPS enforced via Vercel

---

## 💡 Use Cases

- 🏨 **Hotels** - Manage room inventory and optimize pricing
- 🏠 **Vacation Rentals** - Sync Airbnb/Vrbo calendars automatically
- 🏢 **Property Managers** - Multi-property portfolio management
- 💼 **Revenue Managers** - Data-driven pricing strategies

---

## 📊 System Status

| Component | Status |
|-----------|--------|
| Dashboard | ✅ Working |
| Properties | ✅ Working |
| Bookings | ✅ Working |
| Pricing Engine | ✅ Working |
| Calendar Sync | ✅ Working |
| Reports | ✅ Working |
| Settings | ✅ Working |
| API Endpoints | ✅ Working |

**Completion:** ~95% (Production Ready)

---

## 🛠️ Development

### **Build**
```bash
npm run build
```

### **Lint**
```bash
npm run lint
```

### **Database Migrations**
```sql
-- Run in Supabase SQL Editor
\i schema-premium.sql
\i migrations/add_calendar_sync.sql
```

---

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `CRON_SECRET` | Secret for cron endpoints | Yes |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 💬 Support

- 📧 **Email**: support@yieldvibe.com
- 💬 **Discord**: [Join our community](https://discord.gg/yieldvibe)
- 📖 **Docs**: [Full documentation](./DEPLOY_VERCEL.md)

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)

---

**Made with ❤️ for hotel revenue managers worldwide**

🚀 **[Deploy Now](https://vercel.com/new)** | 📚 **[Read the Docs](./DEPLOY_VERCEL.md)** | ⭐ **[Star on GitHub](https://github.com/YOUR_USERNAME/yieldvibe)**
