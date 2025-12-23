# 🚀 Supabase to PocketBase Migration - Complete Guide

**Project:** LinguaSpark Language Learning App  
**Migration Type:** Complete Backend Replacement  
**Data Loss:** Acceptable (fresh start)  
**Target Cost:** $2-6/month (from $0-25/month)

---

## 📚 Documentation Index

This migration includes 6 comprehensive documents:

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[backend_requirements.md](./backend_requirements.md)** | Complete feature inventory and requirements | Understanding what needs to be built |
| **[pocketbase/pb_schema.json](./pocketbase/pb_schema.json)** | Database schema definition | Importing into PocketBase admin |
| **[pocketbase/DEPLOYMENT.md](./pocketbase/DEPLOYMENT.md)** | Deploy PocketBase to Fly.io | Backend deployment and configuration |
| **[FRONTEND_MIGRATION.md](./FRONTEND_MIGRATION.md)** | Frontend code migration guide | Updating React app to use PocketBase |
| **[PRODUCTION_CUTOVER.md](./PRODUCTION_CUTOVER.md)** | Step-by-step cutover plan | Switching from Supabase to PocketBase in prod |
| **This Document** | Overview and quick start | Getting started with migration |

---

## 🎯 Migration Overview

### Why PocketBase?

**Cost Savings:**
- Supabase: $0-25/month (Pro: $25/mo required for production features)
- PocketBase on Fly.io: $2-6/month (80-95% cost reduction)

**Simplicity:**
- Self-hosted, single binary
- Built-in admin dashboard
- No separate storage service needed
- SQLite database (fast, portable)

**Features:**
- All features you need (auth, database, files, realtime)
- Similar API to Supabase
- Easier to debug and maintain
- No vendor lock-in

### What's Changing?

| Component | Before (Supabase) | After (PocketBase) |
|-----------|-------------------|-------------------|
| **Database** | PostgreSQL (cloud) | SQLite (Fly.io) |
| **Auth** | Supabase Auth | PocketBase Auth |
| **Storage** | Supabase Storage buckets | PocketBase file fields |
| **Edge Functions** | Supabase Edge Functions | Direct OpenAI API calls |
| **Realtime** | Postgres subscriptions | PocketBase realtime |
| **SDK** | @supabase/supabase-js | pocketbase |
| **Cost** | $0-25/month | $2-6/month |

---

## 🚦 Quick Start Guide

### Phase 1: Deploy Backend (1-2 hours)

1. **Deploy PocketBase to Fly.io**
   ```bash
   cd lingua-spark-86/pocketbase
   ./deploy.sh
   ```
   
   Follow prompts to:
   - Create Fly.io app
   - Create persistent volume
   - Deploy PocketBase
   - Set secrets (OpenAI API key)

2. **Configure PocketBase**
   - Open admin: `https://linguaspark-pb.fly.dev/_/`
   - Create admin account
   - Import `pb_schema.json`
   - Enable realtime on vocabulary, reading_sessions, profiles
   - Test with sample data

**📖 Detailed Guide:** [pocketbase/DEPLOYMENT.md](./pocketbase/DEPLOYMENT.md)

---

### Phase 2: Migrate Frontend (2-4 hours)

1. **Install PocketBase SDK**
   ```bash
   cd lingua-spark-86
   npm install pocketbase
   ```

2. **Update Environment Variables**
   ```env
   VITE_POCKETBASE_URL=https://linguaspark-pb.fly.dev
   VITE_OPENAI_API_KEY=sk-your-key
   ```

3. **Migrate Code** (see detailed guide)
   - Create `src/lib/pocketbase.ts`
   - Update `AuthContext.tsx`
   - Update all hooks (useLessons, useVocabulary, etc.)
   - Update pages (Stats, Profile, Reader)
   - Create API wrappers for translation/TTS

4. **Test Locally**
   ```bash
   npm run dev
   ```
   Test all features thoroughly

**📖 Detailed Guide:** [FRONTEND_MIGRATION.md](./FRONTEND_MIGRATION.md)

---

### Phase 3: Production Cutover (2-4 hours)

1. **Pre-Cutover Checks**
   - Verify PocketBase is healthy
   - Frontend builds successfully
   - All tests passing
   - Team briefed

2. **Deploy Frontend**
   - Update production environment variables
   - Deploy to production
   - Run smoke tests

3. **Monitor**
   - Watch logs for 1 hour
   - Test all critical paths
   - Verify realtime updates
   - Check for errors

4. **Sign Off**
   - All systems green
   - No critical issues
   - Users can access app
   - Migration complete! 🎉

**📖 Detailed Guide:** [PRODUCTION_CUTOVER.md](./PRODUCTION_CUTOVER.md)

---

## 📋 Complete Checklist

### Backend Setup
- [ ] Fly.io account created
- [ ] flyctl installed and authenticated
- [ ] PocketBase deployed to Fly.io
- [ ] Persistent volume created (1GB)
- [ ] Admin account created
- [ ] Schema imported from pb_schema.json
- [ ] Realtime enabled on required collections
- [ ] OpenAI API key configured
- [ ] Health check passing
- [ ] Test data created

### Frontend Migration
- [ ] PocketBase SDK installed
- [ ] Environment variables updated
- [ ] `src/lib/pocketbase.ts` created
- [ ] `src/api/` wrappers created
- [ ] AuthContext migrated
- [ ] useLessons.ts updated
- [ ] useVocabulary.ts updated
- [ ] useSRS.ts updated
- [ ] useTextToSpeech.ts updated
- [ ] Stats.tsx realtime updated
- [ ] Profile.tsx updated
- [ ] Reader.tsx updated
- [ ] Local testing completed
- [ ] Build successful

### Production Deployment
- [ ] Environment variables set in hosting platform
- [ ] Frontend deployed to production
- [ ] Smoke tests passed (auth, lessons, vocab, stats)
- [ ] Realtime verified working
- [ ] No critical errors in logs
- [ ] Monitored for 48 hours
- [ ] User feedback positive

### Cleanup (After 7 days)
- [ ] Supabase data exported (if needed)
- [ ] Supabase project paused
- [ ] No issues with PocketBase for 7 days
- [ ] Supabase project deleted
- [ ] Supabase code removed from repo
- [ ] Documentation updated

---

## 📊 Migration Timeline

### Typical Timeline (Total: 8-12 hours)

| Phase | Duration | Can Do In Advance? |
|-------|----------|-------------------|
| **Planning & Review** | 1-2 hours | ✅ Yes |
| **Backend Deployment** | 1-2 hours | ✅ Yes |
| **Frontend Migration** | 2-4 hours | ✅ Yes |
| **Local Testing** | 1-2 hours | ✅ Yes |
| **Production Cutover** | 2-4 hours | ❌ No (cutover day) |
| **Monitoring** | 48 hours | ❌ No (post-cutover) |

**Recommended Approach:**
- Week 1: Deploy PocketBase, test backend
- Week 2: Migrate frontend code, test locally
- Week 3: Production cutover on low-traffic day

---

## 💡 Key Concepts

### PocketBase Collections = Supabase Tables

Collections in PocketBase are like tables in Supabase, but with:
- Built-in access rules (like RLS)
- Automatic timestamps (created, updated)
- File fields (no separate storage service)
- Realtime subscriptions built-in

### PocketBase Client Usage

```typescript
// Initialize once
import PocketBase from 'pocketbase';
export const pb = new PocketBase('https://linguaspark-pb.fly.dev');

// Auth
await pb.collection('users').authWithPassword(email, password);

// Query
const lessons = await pb.collection('lessons').getFullList({
  filter: 'language = "es"',
  sort: '-created'
});

// Create
const word = await pb.collection('vocabulary').create(data);

// Update
await pb.collection('vocabulary').update(id, data);

// Delete
await pb.collection('vocabulary').delete(id);

// Realtime
pb.collection('vocabulary').subscribe('*', (e) => {
  console.log(e.action, e.record);
});
```

---

## 🎓 Learning Resources

### PocketBase
- **Official Docs:** https://pocketbase.io/docs/
- **JS SDK:** https://github.com/pocketbase/js-sdk
- **Discord:** https://discord.gg/pocketbase
- **Examples:** Check SDK repo for examples

### Fly.io
- **Docs:** https://fly.io/docs/
- **CLI:** https://fly.io/docs/flyctl/
- **Pricing:** https://fly.io/docs/about/pricing/
- **Support:** https://community.fly.io/

---

## 🔧 Troubleshooting

### Common Issues

**Backend won't start:**
- Check logs: `flyctl logs -a linguaspark-pb`
- Verify volume mounted: `flyctl ssh console`
- Check secrets: `flyctl secrets list`

**Auth not working:**
- Verify PocketBase URL in .env
- Check PocketBase admin for user
- Inspect browser localStorage

**Realtime not updating:**
- Verify realtime enabled in PocketBase admin
- Check browser WebSocket connection
- Review subscription code

**Files not uploading:**
- Check file size < 50MB
- Verify FormData format
- Check PocketBase file field settings

### Getting Help

1. **Check Documentation**
   - Review relevant .md file for your phase
   - Search PocketBase docs
   - Check Fly.io docs

2. **Check Logs**
   ```bash
   flyctl logs -a linguaspark-pb
   ```

3. **Community Support**
   - PocketBase Discord
   - Fly.io Community Forum
   - GitHub Issues (for code-specific questions)

---

## ⚠️ Important Notes

### Data Loss is Acceptable

This is a **clean replacement migration**:
- ✅ No need to migrate users
- ✅ No need to migrate data
- ✅ Fresh start for everyone
- ✅ Simpler migration process
- ❌ Existing user data will not carry over

### API Key Security

**Development:**
- API key in frontend .env is fine for development
- Not exposed in git (in .gitignore)

**Production:**
- Consider moving OpenAI calls to backend (PocketBase hooks)
- Or use separate serverless functions (Vercel/Cloudflare)
- Or accept frontend exposure with rate limiting

### Monitoring is Critical

After cutover:
- ✅ Monitor logs for 48 hours
- ✅ Watch for authentication failures
- ✅ Verify realtime updates working
- ✅ Check file uploads
- ✅ Monitor costs on Fly.io

---

## 💰 Cost Breakdown

### PocketBase on Fly.io (Monthly)

**Compute (Shared CPU):**
- 1 shared CPU: ~$1.94
- 256MB RAM: included

**Storage:**
- 1GB volume: ~$0.15/GB
- Growing to 3GB: ~$0.45

**Bandwidth:**
- First 160GB: FREE
- Additional: $0.02/GB

**Estimated Total: $2-6/month**

### vs Supabase

| Feature | Supabase Free | Supabase Pro | PocketBase |
|---------|---------------|--------------|------------|
| Database | 500MB | Unlimited | 1-10GB |
| Storage | 1GB | 100GB | 1-10GB |
| Auth | Unlimited | Unlimited | Unlimited |
| Realtime | 200 concurrent | 500 concurrent | ~100-200 |
| Edge Functions | Limited | Included | DIY |
| **Cost** | **$0** | **$25/mo** | **$2-6/mo** |

**Break-even:** Even if you need Supabase Free, PocketBase is often better for:
- More control
- Easier debugging
- No cold starts
- True ownership

---

## 🎉 Success Criteria

Migration is successful when:

### Technical
- [ ] All authentication flows working
- [ ] All CRUD operations working
- [ ] Realtime updates functioning
- [ ] File uploads successful
- [ ] No critical errors in logs
- [ ] Response times < 500ms
- [ ] Uptime > 99.5%

### User Experience
- [ ] Users can signup/login
- [ ] Users can create and view lessons
- [ ] Users can add and manage vocabulary
- [ ] Stats page shows real-time updates
- [ ] Audio generation works
- [ ] No increase in complaints

### Business
- [ ] Cost reduced by 80-95%
- [ ] Maintenance easier
- [ ] Team confident with new stack
- [ ] Documentation complete

---

## 📞 Support

### During Migration
- Review documentation thoroughly
- Test each step before proceeding
- Keep Supabase running as backup
- Document any issues encountered

### Post-Migration
- Monitor for 48 hours minimum
- Keep Supabase for 7 days (rollback option)
- Update team on new architecture
- Share learnings in team retro

### Getting Stuck?
1. Check the relevant .md file for detailed steps
2. Review PocketBase/Fly.io documentation
3. Search community forums
4. Ask in Discord/community
5. Create GitHub issue with details

---

## 📁 Files Created

This migration created the following files:

```
lingua-spark-86/
├── backend_requirements.md          # Feature inventory
├── FRONTEND_MIGRATION.md            # Frontend migration guide
├── PRODUCTION_CUTOVER.md            # Cutover plan
├── MIGRATION_README.md              # This file
└── pocketbase/
    ├── pb_schema.json               # Database schema
    ├── Dockerfile                   # PocketBase Docker image
    ├── fly.toml                     # Fly.io configuration
    ├── deploy.sh                    # Deployment script
    └── DEPLOYMENT.md                # Deployment guide
```

---

## 🚀 Ready to Start?

### Recommended Order:

1. **Read** `backend_requirements.md` to understand the application
2. **Deploy** PocketBase using `pocketbase/DEPLOYMENT.md`
3. **Migrate** frontend code using `FRONTEND_MIGRATION.md`
4. **Plan** cutover using `PRODUCTION_CUTOVER.md`
5. **Execute** cutover on a low-traffic day
6. **Monitor** for 48 hours
7. **Celebrate** success! 🎉

### Questions Before Starting?

Review the appropriate document:
- **What data do I need?** → `backend_requirements.md`
- **How do I deploy backend?** → `pocketbase/DEPLOYMENT.md`
- **How do I update my code?** → `FRONTEND_MIGRATION.md`
- **How do I switch in production?** → `PRODUCTION_CUTOVER.md`

---

**Good luck with your migration!** 

This is a well-planned, thoroughly documented migration. Take it step by step, test thoroughly, and you'll have a more cost-effective, maintainable backend in no time.

For questions or issues, refer to the detailed guides or reach out to the PocketBase/Fly.io communities.

**Let's build something great! 🚀**
