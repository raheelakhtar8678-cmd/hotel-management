# 🚀 YieldVibe - Vercel Deployment Guide

## Quick Deploy (5 Minutes)

### **Prerequisites:**
- ✅ Supabase account with project created
- ✅ GitHub account
- ✅ Vercel account (free)

---

## 📋 **Step-by-Step Deployment:**

### **1. Push to GitHub**

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - YieldVibe revenue management system"

# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/yieldvibe.git
git branch -M main
git push -u origin main
```

### **2. Connect to Vercel**

1. **Go to** [vercel.com](https://vercel.com)
2. **Sign up** with GitHub
3. **Click** "Add New Project"
4. **Import** your GitHub repository
5. **Click** "Import"

### **3. Configure Environment Variables**

**In Vercel dashboard:**

1. Go to **Settings** → **Environment Variables**
2. Add the following variables (get from Supabase):

| Variable Name | Value | Where to Find |
|---------------|-------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase → Settings → API → service_role secret |
| `DATABASE_URL` | `postgresql://postgres:password@...` | See format below |
| `CRON_SECRET` | `your-secret-here` | Any random string |

**DATABASE_URL Format:**
```
postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
```

Replace:
- `YOUR_DB_PASSWORD` → Database password from Supabase project creation
- `YOUR_PROJECT_ID` → From your Supabase Project URL

### **4. Deploy!**

1. **Click** "Deploy"
2. **Wait** 2-3 minutes for build
3. **Success!** Your app is live at `https://your-project.vercel.app`

---

## 🗄️ **Database Setup (Required Before First Use)**

After deployment, set up your database tables:

### **Option A: Supabase Dashboard (Recommended)**

1. Open **Supabase** → Your Project
2. Go to **SQL Editor**
3. Click **New query**
4. Copy and paste **ENTIRE** contents of:
   - `schema-premium.sql`
5. Click **Run** (Ctrl+Enter)
6. Should see ✅ "Success"
7. Repeat for:
   - `migrations/add_calendar_sync.sql`

### **Option B: Command Line**

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push
```

---

## ⚙️ **Configure Cron Jobs (Optional)**

For automated pricing updates every hour:

### **Using Vercel Cron:**

1. Create `vercel.json` (already done ✅)
2. In Vercel dashboard:
   - Go to **Settings** → **Cron Jobs**
   - Click **Add Cron Job**
   - **Path:** `/api/cron/update-prices`
   - **Schedule:** `0 * * * *` (every hour)
   - **Headers:** Add `Authorization: Bearer YOUR_CRON_SECRET`

### **Using External Service (Cron-job.org):**

1. Go to [cron-job.org](https://console.cron-job.org)
2. Create account
3. **Create new job:**
   - **URL:** `https://your-project.vercel.app/api/cron/update-prices`
   - **Schedule:** Every 1 hour
   - **Headers:** `Authorization: Bearer YOUR_CRON_SECRET`

---

## ✅ **Verify Deployment Works:**

### **Test 1: Homepage**
Visit: `https://your-project.vercel.app`
- Should see YieldVibe dashboard

### **Test 2: Database Connection**
1. Go to `/settings`
2. Should show **"Connected ✅"** badge
3. If disconnected, check environment variables

### **Test 3: API Endpoints**
```javascript
// Open browser console on your deployed site
fetch('/api/properties')
  .then(r => r.json())
  .then(console.log)

// Should return: {success: true, properties: []}
```

### **Test 4: Create Property**
1. Go to `/properties/new`
2. Fill form and submit
3. Should redirect to `/properties`
4. Property should appear in list

---

## 🔧 **Troubleshooting:**

### **Build Failed**

**Error:** `Module not found`
**Fix:** 
```bash
# Locally, ensure all dependencies installed
npm install
npm run build

# If build succeeds locally, push changes
git add .
git commit -m "Fix dependencies"
git push
```

### **Environment Variables Not Working**

1. **Check spelling** - must match exactly
2. **Redeploy** after adding variables:
   - Vercel → Deployments → ... → Redeploy

### **Database Connection Failed**

1. **Verify DATABASE_URL** format
2. **Check password** - must match what you set
3. **Test connection** in Supabase:
   - SQL Editor → `SELECT 1;` → Should work

### **404 on API Routes**

- **Ensure** `vercel.json` exists
- **Check** API files in `app/api/*` folder
- **Redeploy** if needed

---

## 📊 **Custom Domain (Optional)**

1. **In Vercel:**
   - Settings → Domains
   - Add your domain
2. **Update DNS:**
   - Add CNAME record pointing to `cname.vercel-dns.com`
3. **Wait** for SSL certificate (automatic, ~10 min)

---

## 🔄 **Continuous Deployment:**

**Already enabled!** Every push to `main` branch automatically deploys.

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Vercel automatically deploys in ~2 min
```

---

## 📈 **Analytics & Monitoring:**

Vercel provides free:
- **Performance metrics**
- **Error tracking**
- **Usage statistics**

Access at: Vercel Dashboard → Analytics

---

## 💰 **Cost:**

**Vercel Free Tier:**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Enough for production use!

**Supabase Free Tier:**
- ✅ 500MB database
- ✅ 1GB file storage
- ✅ 2GB bandwidth
- ✅ Plenty for most hotels!

**Total Cost:** $0/month 🎉

---

## 🎯 **Production Checklist:**

Before going live:

- [ ] Database tables created (`schema-premium.sql`)
- [ ] Environment variables set in Vercel
- [ ] Deployment successful
- [ ] Test property creation works
- [ ] Test booking creation works
- [ ] Pricing rules execute correctly
- [ ] Calendar sync functional
- [ ] Settings page shows "Connected"
- [ ] Custom domain configured (optional)
- [ ] Cron job set up (optional)

---

## 🔐 **Security Best Practices:**

1. **Never commit `.env.local`** to Git
2. **Rotate CRON_SECRET** periodically
3. **Use Row Level Security** in Supabase
4. **Enable 2FA** on Vercel & Supabase accounts
5. **Monitor** Vercel Analytics for unusual activity

---

## 📚 **Additional Resources:**

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Integration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## 🆘 **Need Help?**

**Common Issues:**

1. **"Failed to connect to database"**
   - Check environment variables
   - Verify Supabase project is active
   - Test connection in Supabase SQL Editor

2. **"Build takes too long"**
   - Normal first build: 2-3 minutes
   - Subsequent builds: ~1 minute
   - Check Vercel build logs for errors

3. **"Environment variable not found"**
   - Add in Vercel dashboard
   - Click "Redeploy" after adding
   - Wait for new deployment to finish

---

## ✨ **You're Live!**

Your YieldVibe instance is now:
- 🌍 Accessible worldwide
- 🔒 Secured with HTTPS
- 🚀 Fast with CDN
- 💾 Connected to Supabase
- 📊 Ready for production!

**Share your deployment URL and start managing revenue!** 🎉
