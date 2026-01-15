# Property Creation Debugging Guide

## ✅ Enhanced Logging Added!

I've added detailed console logging to both the form and API to help debug the issue.

---

## 🔍 **How to Debug:**

### **Step 1: Open Browser Console**
1. **In your browser**, press `F12` or `Ctrl+Shift+I`
2. **Click "Console" tab**
3. **Clear the console** (trash icon)

### **Step 2: Try Creating Property**
1. **Go to:** `http://localhost:3000/properties/new`
2. **Fill the form:**
   - Property Name: `Test Hotel`
   - City: `Miami`
   - Base Price: `150`
3. **Click "Create Property"**

### **Step 3: Check Console Output**

**You should see this sequence:**
```
🔵 Starting property creation...
Form data: {name: "Test Hotel", property_type: "hotel", ...}
📤 Sending to API: {...}
🔵 [API] POST /api/properties - Starting...
📥 [API] Received body: {...}
👤 [API] Using user ID: 00000000-0000-0000-0000-000000000001
💾 [API] Inserting property: {...}
✅ [API] Property created: {id: "...", name: "Test Hotel", ...}
🛏️ [API] Creating default room...
✅ [API] Default room created
📥 Response status: 200
📥 Response data: {success: true, property: {...}}
✅ Property created successfully!
```

### **Step 4: Look for Errors**

**If you see ❌ errors, copy them and share with me!**

Common issues:
- `❌ [API] Database error:` → Database connection issue
- `❌ [API] Missing required fields` → Form data issue
- `❌ Network error:` → API not responding

---

## 🐛 **Common Fixes:**

### **Issue: "relation 'properties' does not exist"**
**Fix:** Database tables not created

**Run this in Supabase dashboard → SQL Editor:**
```sql
-- Check if properties table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'properties';
```

If no results, you need to run the schema file!

### **Issue: "Failed to connect to database"**
**Fix:** Check your `.env.local` file

**Verify these variables exist:**
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### **Issue: Form submits but no redirect**
**Check console for:**
- `success: false` in response
- Any alert popup message
- Network tab shows 500 error

---

## 📋 **Quick Test via API Directly:**

**Open browser console and run:**
```javascript
fetch('/api/properties', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'API Test Property',
    city: 'Miami',
    base_price: 150,
    property_type: 'hotel'
  })
})
.then(r => r.json())
.then(data => console.log('API Response:', data))
.catch(err => console.error('API Error:', err));
```

**Expected output:**
```javascript
API Response: {success: true, property: {...}}
```

---

## 🎯 **Next Steps:**

1. **Try creating property again** with console open
2. **Copy any error messages** you see
3. **Check the terminal** where `npm run dev` is running
4. **Share the console output** and I'll help fix it!

---

## 🔥 **Emergency Fallback:**

If nothing works, we can create a simple test:

**Visit:** `http://localhost:3000/api/properties`

Should show JSON with existing properties or empty array `{"success":true,"properties":[]}`

If you get:
- `404` → API route not found
- `500` → Database/server error
- Timeout → Server not running
