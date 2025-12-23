# PocketBase Quick Start - Post Deployment

## ✅ Your PocketBase is Running!

The 404 error at `https://linguaspark-pb.fly.dev/` is **normal**. PocketBase doesn't serve a homepage.

---

## 📍 Important URLs

| Purpose | URL | Status |
|---------|-----|--------|
| **Admin Dashboard** | https://linguaspark-pb.fly.dev/_/ | ✅ Working |
| **API Health** | https://linguaspark-pb.fly.dev/api/health | ✅ Working |
| **API Endpoint** | https://linguaspark-pb.fly.dev/api/ | ✅ Working |
| Root (/) | https://linguaspark-pb.fly.dev/ | ❌ 404 (expected) |

---

## 🚀 Step 1: Access Admin Dashboard

**Open this URL in your browser:**
```
https://linguaspark-pb.fly.dev/_/
```

**On first visit, you'll be prompted to create an admin account:**
1. Enter admin email
2. Enter secure password (min 8 characters)
3. Confirm password
4. Click "Create"

⚠️ **Important**: Save these credentials securely!

---

## 📥 Step 2: Import Schema

Once logged into admin:

1. **Navigate to Settings**
   - Click "Settings" in left sidebar
   - Or go to: https://linguaspark-pb.fly.dev/_/#/settings

2. **Import Collections**
   - Click "Import collections" button
   - Select `pb_schema.json` file from your computer
   - Review the preview
   - Click "Import" to confirm

3. **Verify Collections Created**
   - Click "Collections" in left sidebar
   - You should see:
     - ✅ profiles
     - ✅ lessons
     - ✅ vocabulary
     - ✅ reading_sessions
     - ✅ daily_stats

---

## ⚡ Step 3: Enable Realtime

Enable realtime subscriptions for these collections:

### For `vocabulary`:
1. Click on "vocabulary" collection
2. Go to "Options" tab
3. Toggle "Realtime" ON
4. Click "Save changes"

### For `reading_sessions`:
1. Click on "reading_sessions" collection
2. Go to "Options" tab
3. Toggle "Realtime" ON
4. Click "Save changes"

### For `profiles`:
1. Click on "profiles" collection
2. Go to "Options" tab
3. Toggle "Realtime" ON
4. Click "Save changes"

---

## 🧪 Step 4: Create Test Data

### Create Test User

1. **Go to Users Collection** (`_pb_users_auth_`)
   - Click "Collections" → "users"
   
2. **Create New User**
   - Click "+ New record"
   - Email: `test@example.com`
   - Password: `testpass123`
   - Verify: true
   - Click "Create"
   - Note the user ID (you'll need it)

### Create Test Profile

1. **Go to Profiles Collection**
   - Click "Collections" → "profiles"
   
2. **Create New Profile**
   - Click "+ New record"
   - user: Select the test user you just created
   - display_name: "Test User"
   - native_language: "en"
   - target_language: "es"
   - daily_lingq_goal: 20
   - Click "Create"

### Create Test Lesson

1. **Go to Lessons Collection**
   - Click "Collections" → "lessons"
   
2. **Create New Lesson**
   - Click "+ New record"
   - title: "Test Lesson"
   - content: "Hola mundo. Esto es una prueba."
   - language: "es"
   - difficulty_level: "beginner"
   - content_type: "article"
   - word_count: 6
   - is_archived: false
   - Click "Create"

---

## ✅ Step 5: Verify Everything Works

### Test API Endpoint

Try fetching lessons (should work without auth since access rule allows any authenticated user):

```bash
curl https://linguaspark-pb.fly.dev/api/collections/lessons/records
```

You should get a 401 (Unauthorized) - this is correct! The API requires authentication.

### Test with Authentication

```bash
# Login
curl -X POST https://linguaspark-pb.fly.dev/api/collections/users/auth-with-password \
  -H "Content-Type: application/json" \
  -d '{
    "identity": "test@example.com",
    "password": "testpass123"
  }'
```

You should get a response with `token` - this means auth is working!

---

## 🔐 Step 6: Set Environment Variables

Now that PocketBase is ready, update your frontend environment:

**Edit `.env` file:**
```env
VITE_POCKETBASE_URL=https://linguaspark-pb.fly.dev
VITE_OPENAI_API_KEY=your-openai-key-here
```

---

## 🧹 Common Issues

### Issue: Can't access admin dashboard
**Solution:** Make sure you're going to `/_/` not just `/`

### Issue: Schema import fails
**Solution:** 
- Check the JSON file is valid
- Try importing collections one at a time
- Check browser console for errors

### Issue: Realtime not working
**Solution:**
- Verify realtime is enabled in collection options
- Check browser console for WebSocket errors
- Ensure HTTPS is working (wss:// for WebSocket)

---

## 📊 Verify Deployment Status

Run these commands to check everything:

```bash
# Health check
curl https://linguaspark-pb.fly.dev/api/health

# Check Fly.io status
flyctl status -a linguaspark-pb

# View logs
flyctl logs -a linguaspark-pb

# Check volume
flyctl volumes list -a linguaspark-pb
```

---

## 🎉 You're Ready!

Once you've completed these steps:
- ✅ Admin account created
- ✅ Schema imported
- ✅ Realtime enabled
- ✅ Test data created
- ✅ Environment variables set

**Next:** Start migrating your frontend code following `FRONTEND_MIGRATION.md`

---

## 📞 Need Help?

- **PocketBase Docs**: https://pocketbase.io/docs/
- **Fly.io Docs**: https://fly.io/docs/
- **Check Logs**: `flyctl logs -a linguaspark-pb`
- **SSH Access**: `flyctl ssh console -a linguaspark-pb`

---

## Quick Reference URLs

- **Admin**: https://linguaspark-pb.fly.dev/_/
- **API**: https://linguaspark-pb.fly.dev/api/
- **Health**: https://linguaspark-pb.fly.dev/api/health
- **Collections**: https://linguaspark-pb.fly.dev/api/collections

**Remember**: The root URL (/) showing 404 is completely normal! ✅
