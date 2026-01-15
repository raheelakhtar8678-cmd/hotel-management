# YieldVibe - Setup Required

## ⚠️ **DATABASE NOT CONNECTED**

Your `.env.local` file contains **placeholder values**. You need to set up a real Supabase database.

---

## 🚀 **Quick Setup (5 minutes):**

### **Step 1: Create Supabase Account**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (free)

### **Step 2: Create New Project**
1. Click "New Project"
2. Name: `yieldvibe`
3. Database Password: *Choose a strong password*
4. Region: *Choose closest to you*
5. Click "Create new project"
6. **Wait 2-3 minutes** for setup to complete

### **Step 3: Get Your Credentials**
1. In Supabase dashboard, click **Settings** (gear icon)
2. Click **API** in sidebar
3. Copy these values:

**You'll see:**
- **Project URL** (starts with `https://xxx.supabase.co`)
- **anon public key** (starts with `eyJ...`)
- **service_role key** (starts with `eyJ...`, labeled "secret")

### **Step 4: Update `.env.local`**

Open `E:\hotel management\.env.local` and replace with your **real values**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_KEY
CRON_SECRET=yieldvibe_cron_secret
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
```

**Replace:**
- `YOUR_PROJECT_ID` → from Project URL
- `YOUR_ANON_KEY` → anon public key
- `YOUR_SERVICE_KEY` → service_role secret key  
- `YOUR_DB_PASSWORD` → password you chose in Step 2

### **Step 5: Create Database Tables**

1. In Supabase dashboard, click **SQL Editor**
2. Click "New query"
3. Copy the ENTIRE contents of `E:\hotel management\schema-premium.sql`
4. Paste into SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Should say "Success" with green checkmark ✅

### **Step 6: Run Migration for Calendar Sync**

1. Still in SQL Editor, click "New query"
2. Copy contents of `E:\hotel management\migrations\add_calendar_sync.sql`
3. Paste and click "Run"
4. Should succeed ✅

### **Step 7: Restart Dev Server**

```powershell
# Stop the current server (Ctrl+C in terminal)
# Then restart:
npm run dev
```

### **Step 8: Test Property Creation**

1. Go to `http://localhost:3000/properties/new`
2. Fill out form
3. Click "Create Property"
4. Should now work! ✅

---

## 🔍 **Verify It Worked:**

**Check database has tables:**
1. Supabase → **Table Editor**
2. Should see tables: `properties`, `rooms`, `bookings`, `pricing_rules`, `calendar_connections`

**Check property was created:**
1. Supabase → **Table Editor** → `properties` table
2. Should see your test property

---

## ❓ **Why This Happened:**

The default `.env.local` file has dummy placeholder values:
- `https://yieldvibe-demo.supabase.co` ← Not a real database
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy` ← Fake API key

These don't connect to an actual database, so all API calls fail.

---

## 📋 **Checklist:**

- [ ] Created Supabase account
- [ ] Created new project  
- [ ] Copied Project URL, anon key, service key
- [ ] Updated `.env.local` with real values
- [ ] Ran `schema-premium.sql` in Supabase SQL Editor
- [ ] Ran `add_calendar_sync.sql` migration
- [ ] Restarted dev server (`npm run dev`)
- [ ] Tested property creation - works!

---

## 🆘 **Need Help?**

**If you get stuck:**
- Make sure you're copying the **entire** API keys (they're very long!)
- Database password must match what you set in Step 2
- Project URL must match your actual project (no `.dummy` or placeholder text)
- Check Supabase project status is "Active" (green)

**To verify connection works:**
```javascript
// Run in browser console on http://localhost:3000
fetch('/api/properties')
  .then(r => r.json())
  .then(console.log)

// Should return: {success: true, properties: []}
// NOT an error!
```

---

## ⚡ **After Setup:**

Once connected, ALL features will work:
- ✅ Create properties
- ✅ Add rooms
- ✅ Create bookings
- ✅ Pricing rules
- ✅ Calendar sync
- ✅ Dashboard with real data

**Total setup time:** ~5 minutes

Let me know once you've completed the setup! 🚀
