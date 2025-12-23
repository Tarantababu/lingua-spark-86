# Production Cutover Plan - Supabase to PocketBase

Step-by-step guide for switching from Supabase to PocketBase in production.

---

## Overview

This is a **complete replacement** migration with acceptable data loss. No data migration is required.

**Timeline:** 2-4 hours (including testing)

**Downtime:** Minimal (frontend redeploy only)

---

## Pre-Cutover Checklist (Do in Advance)

### Backend (PocketBase)
- [ ] PocketBase deployed to Fly.io
- [ ] Schema imported and verified
- [ ] Realtime enabled on vocabulary, reading_sessions, profiles
- [ ] Admin account created
- [ ] OpenAI API key configured
- [ ] Health check passing (`https://linguaspark-pb.fly.dev/api/health`)
- [ ] Test user account created
- [ ] Sample lesson created
- [ ] Test vocabulary added
- [ ] Realtime subscriptions tested

### Frontend
- [ ] PocketBase SDK installed (`npm install pocketbase`)
- [ ] All code migrated (Auth, hooks, pages)
- [ ] Environment variables updated
- [ ] Local testing completed
- [ ] Build succeeds (`npm run build`)
- [ ] Preview deployment tested (staging if available)

### Communication
- [ ] Notify users of upcoming maintenance (if applicable)
- [ ] Schedule cutover during low-traffic period
- [ ] Backup team contact available
- [ ] Rollback plan documented

---

## Cutover Day - Timeline

### Phase 1: Final Verification (30 min)

**Time: T-30 to T-0**

1. **Verify PocketBase Health**
   ```bash
   curl https://linguaspark-pb.fly.dev/api/health
   # Should return 200 OK
   ```

2. **Check Fly.io Status**
   ```bash
   flyctl status -a linguaspark-pb
   # Should show "running"
   ```

3. **Test Critical Paths**
   - Admin login to PocketBase
   - Collections visible
   - Realtime enabled
   - Files uploadable

4. **Frontend Final Build**
   ```bash
   cd lingua-spark-86
   npm run build
   # Verify no errors
   ```

---

### Phase 2: Supabase Freeze (5 min)

**Time: T-0 to T+5**

⚠️ **From this point, Supabase data will not be used**

1. **Optional: Export Supabase Data** (if needed for reference)
   ```bash
   # Export via Supabase dashboard
   # Settings → Database → Export
   ```

2. **Mark Supabase as Read-Only** (optional, if possible)
   - Set RLS policies to prevent writes
   - Or simply proceed knowing new data goes to PocketBase

---

### Phase 3: Deploy Frontend (15 min)

**Time: T+5 to T+20**

1. **Update Environment Variables**
   
   Update `.env` (or hosting platform environment):
   ```env
   VITE_POCKETBASE_URL=https://linguaspark-pb.fly.dev
   VITE_OPENAI_API_KEY=sk-your-key
   ```

2. **Deploy to Production**
   
   **For Vercel:**
   ```bash
   vercel --prod
   ```
   
   **For Netlify:**
   ```bash
   netlify deploy --prod
   ```
   
   **For Static Hosting:**
   ```bash
   npm run build
   # Upload dist/ folder to hosting
   ```

3. **Verify Deployment**
   - Visit production URL
   - Check browser console for errors
   - Verify network requests go to PocketBase

---

### Phase 4: Smoke Testing (20 min)

**Time: T+20 to T+40**

Test all critical user flows:

#### 1. Authentication (5 min)
- [ ] **Signup**
  - Create new account
  - Verify email/password works
  - Check profile created in PocketBase admin
  
- [ ] **Login**
  - Login with test account
  - Verify session persists
  - Check auth token in localStorage
  
- [ ] **Logout**
  - Logout
  - Verify redirect to auth page
  - Check session cleared

#### 2. Lessons (5 min)
- [ ] **View Lessons**
  - Navigate to Library
  - Verify lessons load
  - Check filtering works
  
- [ ] **Create Lesson**
  - Import or create new lesson
  - Verify it appears in library
  - Check it's saved in PocketBase

#### 3. Vocabulary (5 min)
- [ ] **Add Word**
  - Open a lesson
  - Click on a word
  - Add translation
  - Verify it saves
  
- [ ] **View Vocabulary**
  - Navigate to Vocabulary page
  - Verify words appear
  - Check status colors

#### 4. Stats & Realtime (5 min)
- [ ] **View Stats**
  - Navigate to Stats page
  - Check counters load
  - Verify streak displayed
  
- [ ] **Realtime Updates**
  - Keep Stats page open
  - In another tab, add vocabulary
  - Verify Stats page updates in real-time

#### 5. Audio (if applicable)
- [ ] **Generate Audio**
  - Create/edit lesson
  - Generate audio
  - Verify audio plays

---

### Phase 5: Monitoring (60 min)

**Time: T+40 to T+100**

Monitor production for issues:

1. **Browser Console**
   - Open DevTools
   - Monitor for errors
   - Check network tab for failed requests

2. **PocketBase Logs**
   ```bash
   flyctl logs -a linguaspark-pb
   ```
   Watch for:
   - 401/403 errors (auth issues)
   - 500 errors (server issues)
   - High response times

3. **User Behavior**
   - Monitor user signups (if any)
   - Check for support requests
   - Watch for error reports

4. **Performance**
   - Page load times
   - API response times
   - Realtime update latency

---

### Phase 6: Sign-Off (10 min)

**Time: T+100 to T+110**

1. **Verify All Systems Green**
   - [ ] No critical errors in logs
   - [ ] All smoke tests passing
   - [ ] Realtime working
   - [ ] Auth working
   - [ ] No user complaints

2. **Document Issues**
   - Note any non-critical issues
   - Create tickets for fixes
   - Schedule follow-up

3. **Declare Success**
   - Migration complete
   - PocketBase is primary backend
   - Supabase can be decommissioned

---

## Post-Cutover Monitoring (24-48 hours)

### Day 1

**Immediately After (First 4 hours)**
- [ ] Check logs every 30 minutes
- [ ] Monitor error rates
- [ ] Watch for user reports
- [ ] Verify realtime updates
- [ ] Check database growth

**Evening Check (End of Day 1)**
- [ ] Review full day logs
- [ ] Check authentication success rate
- [ ] Verify no data loss
- [ ] Review user feedback
- [ ] Note performance metrics

### Day 2

**Morning Check**
- [ ] Review overnight logs
- [ ] Check for any issues during low-traffic hours
- [ ] Verify backups running
- [ ] Review disk usage

**Afternoon Check**
- [ ] Monitor peak traffic performance
- [ ] Check API usage
- [ ] Review any issues from Day 1
- [ ] Test edge cases

**Final Review (End of Day 2)**
- [ ] Comprehensive health check
- [ ] Performance report
- [ ] User satisfaction check
- [ ] Decision on Supabase decommission

---

## Rollback Procedure

If critical issues occur, rollback to Supabase:

### Quick Rollback (< 15 min)

1. **Revert Environment Variables**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Redeploy Previous Frontend**
   ```bash
   # Git rollback
   git revert HEAD
   git push
   
   # Redeploy
   vercel --prod  # or your deployment command
   ```

3. **Verify Rollback**
   - Check app loads
   - Test auth
   - Verify data access

### Full Rollback (if code was merged)

1. **Checkout Previous Commit**
   ```bash
   git log  # Find last good commit
   git checkout <commit-hash>
   git push -f origin main  # Dangerous - use carefully
   ```

2. **Redeploy**
   ```bash
   npm run build
   # Deploy via your platform
   ```

3. **Communication**
   - Notify users of temporary issue
   - Post incident report
   - Schedule retry

---

## Decommissioning Supabase

**Do NOT do this until 48 hours after successful cutover**

### Pre-Decommission

1. **Final Data Export** (if needed)
   - Export all tables as CSV/JSON
   - Download any files from storage
   - Save edge function code for reference

2. **Audit**
   - Verify no services still use Supabase
   - Check for any hardcoded Supabase URLs
   - Review CI/CD for Supabase references

### Decommission Steps

1. **Pause Project** (free for 7 days)
   - Supabase Dashboard → Settings → Pause project
   - Keeps data but stops billing

2. **Monitor** (7 days)
   - Ensure no issues with PocketBase
   - Confirm no dependency on Supabase
   - Verify backups working

3. **Delete Project** (after 7 days)
   - Supabase Dashboard → Settings → Delete project
   - Confirm deletion
   - Cancel subscription

4. **Clean Up Code**
   ```bash
   cd lingua-spark-86
   
   # Remove Supabase package (optional)
   npm uninstall @supabase/supabase-js
   
   # Archive supabase directory
   mv supabase supabase-archived
   
   # Remove supabase integration code
   rm -rf src/integrations/supabase
   
   # Commit changes
   git add .
   git commit -m "chore: remove Supabase after migration to PocketBase"
   git push
   ```

---

## Success Metrics

### Technical Metrics
- **Uptime**: > 99.5% after cutover
- **Response Time**: < 500ms for 95th percentile
- **Error Rate**: < 1% of all requests
- **Realtime Latency**: < 2 seconds

### User Metrics
- **Authentication Success**: > 95%
- **Session Duration**: Maintained or improved
- **Feature Usage**: No drop in key features
- **User Complaints**: < 5% increase

### Cost Metrics
- **Monthly Cost**: $2-6/month (vs $0-25 Supabase)
- **ROI**: 80-95% cost reduction
- **Bandwidth**: Within Fly.io free tier

---

## Issue Resolution

### Common Issues & Solutions

#### Issue: Auth Not Persisting
**Symptoms:** Users logged out on page refresh

**Solution:**
```typescript
// Ensure PocketBase auth state is restored
useEffect(() => {
  if (pb.authStore.isValid) {
    setUser(pb.authStore.model);
  }
}, []);
```

#### Issue: Realtime Not Working
**Symptoms:** Stats not updating live

**Solution:**
1. Check realtime enabled in PocketBase admin
2. Verify subscription code:
   ```typescript
   pb.collection('vocabulary').subscribe('*', callback);
   ```
3. Check browser console for WebSocket errors

#### Issue: File Upload Fails
**Symptoms:** Audio generation fails

**Solution:**
1. Check file size < 50MB
2. Verify FormData format:
   ```typescript
   const formData = new FormData();
   formData.append('audio_file', blob, 'audio.mp3');
   ```
3. Check PocketBase admin file field settings

#### Issue: Query Returns Empty
**Symptoms:** Lessons/vocabulary not loading

**Solution:**
1. Check filter syntax (use `&&` not `AND`)
2. Verify user relation field: `user = "${userId}"`
3. Check access rules in PocketBase admin

---

## Emergency Contacts

**During Cutover:**
- PocketBase Discord: https://discord.gg/pocketbase
- Fly.io Support: https://fly.io/docs/about/support/
- Team Lead: [Your contact]

**After Hours:**
- On-call engineer: [Contact]
- Backup: [Contact]

---

## Post-Mortem Template

After successful cutover, document:

### What Went Well
- [List successes]
- [Smooth processes]
- [Team collaboration]

### What Could Be Improved
- [Pain points]
- [Unexpected issues]
- [Documentation gaps]

### Metrics
- **Cutover Duration:** [Actual vs planned]
- **Downtime:** [Amount]
- **Issues Encountered:** [Count and severity]
- **User Impact:** [Scale 1-10]

### Action Items
- [ ] Update documentation based on learnings
- [ ] Fix any minor issues found
- [ ] Schedule team retro
- [ ] Share knowledge with team

---

## Checklist Summary

### Before Cutover
- [ ] Backend deployed and tested
- [ ] Frontend code migrated and tested
- [ ] Environment variables ready
- [ ] Team briefed
- [ ] Rollback plan ready

### During Cutover (2-4 hours)
- [ ] Verify PocketBase health
- [ ] Freeze Supabase (optional)
- [ ] Deploy frontend
- [ ] Run smoke tests
- [ ] Monitor for 1 hour
- [ ] Sign off on success

### After Cutover (48 hours)
- [ ] Monitor logs continuously
- [ ] Check user reports
- [ ] Verify metrics healthy
- [ ] Fix any minor issues
- [ ] Plan Supabase decommission

### Cleanup (After 7 days)
- [ ] Export Supabase data (final)
- [ ] Delete Supabase project
- [ ] Remove Supabase code
- [ ] Update documentation
- [ ] Celebrate success! 🎉

---

## Final Notes

**Remember:**
- Data loss is acceptable - no migration needed
- Keep Supabase as backup for 7 days
- Test thoroughly before declaring success
- Monitor closely for 48 hours
- Document everything

**Good luck with the cutover!** This is a clean replacement, so the process should be straightforward. If issues arise, rollback quickly and reassess.

---

**Questions?** Review:
- `backend_requirements.md` - Schema details
- `FRONTEND_MIGRATION.md` - Code changes
- `pocketbase/DEPLOYMENT.md` - Backend setup
