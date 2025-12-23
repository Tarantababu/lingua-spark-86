# PocketBase Deployment Guide - Fly.io

Complete guide to deploying PocketBase backend for LinguaSpark on Fly.io.

---

## Prerequisites

1. **Fly.io Account**
   - Sign up at https://fly.io
   - Install flyctl CLI: https://fly.io/docs/hands-on/install-flyctl/
   - Login: `flyctl auth login`

2. **OpenAI API Key**
   - Required for translation and audio generation features
   - Get from: https://platform.openai.com/api-keys

---

## Step 1: Initial Deployment

### Automatic Deployment (Recommended)

Run the deployment script:

```bash
cd pocketbase
./deploy.sh
```

The script will:
- Check for flyctl installation
- Create the Fly.io app
- Create persistent volume (1GB)
- Deploy PocketBase
- Provide next steps

### Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
cd pocketbase

# Create the app
flyctl apps create linguaspark-pb

# Create persistent volume
flyctl volumes create pb_data --region fra --size 1 -a linguaspark-pb

# Deploy
flyctl deploy --local-only
```

---

## Step 2: Configure Secrets

After deployment, set required secrets:

```bash
# OpenAI API key (required for AI features)
flyctl secrets set OPENAI_API_KEY=sk-your-openai-key -a linguaspark-pb

# PocketBase encryption key (generate random 32-char string)
flyctl secrets set PB_ENCRYPTION_KEY=$(openssl rand -hex 16) -a linguaspark-pb
```

Secrets are encrypted and never exposed in logs.

---

## Step 3: Access PocketBase Admin

Open the admin dashboard:

```bash
flyctl open -a linguaspark-pb
```

Or visit: `https://linguaspark-pb.fly.dev/_/`

### First-Time Setup

1. **Create Admin Account**
   - You'll be prompted to create an admin account on first visit
   - Use a strong password
   - Save credentials securely

2. **Import Schema**
   - Go to Settings → Import collections
   - Upload `pb_schema.json` file
   - Review and confirm the import
   - This creates all collections with proper access rules

---

## Step 4: Configure Collections

### Enable Realtime (Important!)

For these collections, enable realtime subscriptions:

1. Go to Collections
2. For **vocabulary**, **reading_sessions**, and **profiles**:
   - Click collection name
   - Go to "Options" tab
   - Enable "Realtime"
   - Save

### Verify Access Rules

Ensure these access rules are set (should be automatic from schema import):

**profiles:**
- List/View/Create/Update/Delete: `@request.auth.id != "" && user = @request.auth.id`

**lessons:**
- List/View: `@request.auth.id != ""`
- Create: `@request.auth.id != ""`
- Update/Delete: `@request.auth.id != "" && (created_by = @request.auth.id || created_by = "")`

**vocabulary:**
- List/View/Create/Update/Delete: `@request.auth.id != "" && user = @request.auth.id`

**reading_sessions:**
- List/View/Create/Update/Delete: `@request.auth.id != "" && user = @request.auth.id`

**daily_stats:**
- List/View/Create/Update/Delete: `@request.auth.id != "" && user = @request.auth.id`

---

## Step 5: Update Frontend Configuration

Update your frontend environment variables:

```env
# .env (frontend)
VITE_POCKETBASE_URL=https://linguaspark-pb.fly.dev
VITE_OPENAI_API_KEY=sk-your-openai-key
```

**Note:** If you're calling OpenAI API directly from frontend (Option A), you'll need the API key in frontend .env. For production, consider implementing backend routes instead.

---

## Monitoring and Maintenance

### View Logs

```bash
# Live logs
flyctl logs -a linguaspark-pb

# Last 100 lines
flyctl logs -a linguaspark-pb -n 100
```

### Check Status

```bash
flyctl status -a linguaspark-pb
```

### Check Volume Usage

```bash
flyctl volumes list -a linguaspark-pb
```

### SSH into Container

```bash
flyctl ssh console -a linguaspark-pb
```

---

## Scaling

### Increase Volume Size

```bash
flyctl volumes extend <volume-id> -s 5 -a linguaspark-pb
```

### Increase Memory

Edit `fly.toml`:

```toml
[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512  # Increase from 256
```

Then redeploy:

```bash
flyctl deploy --local-only
```

---

## Backup and Recovery

### Manual Backup

```bash
# SSH into container
flyctl ssh console -a linguaspark-pb

# Create backup
cd /pb_data
tar -czf backup-$(date +%Y%m%d).tar.gz data.db pb_data

# Download backup (from local machine)
flyctl ssh sftp get /pb_data/backup-*.tar.gz
```

### Automated Backups

Fly.io doesn't provide automatic SQLite backups, consider:

1. **Fly.io Snapshots**: Manual volume snapshots via flyctl
2. **Custom Script**: Cron job to backup to S3/B2
3. **PocketBase Hooks**: Auto-backup on critical operations

---

## Troubleshooting

### App Won't Start

1. Check logs: `flyctl logs -a linguaspark-pb`
2. Verify volume is mounted: `flyctl ssh console` → `ls -la /pb_data`
3. Check secrets: `flyctl secrets list -a linguaspark-pb`

### Connection Issues

1. Verify HTTPS is enabled: `https://linguaspark-pb.fly.dev/api/health`
2. Check CORS settings in PocketBase admin
3. Verify frontend URL matches deployment

### Volume Full

```bash
# Check usage
flyctl ssh console -a linguaspark-pb
df -h

# Extend volume
flyctl volumes extend <volume-id> -s 3
```

---

## Cost Optimization

### Current Configuration Costs (Estimates)

- **Compute**: ~$2-3/month (shared CPU, 256MB RAM)
- **Volume**: ~$0.15/month (1GB)
- **Bandwidth**: Free tier (160GB outbound)
- **Total**: ~$2-5/month

### To Reduce Costs

1. **Enable auto-stop** (not recommended for production):
   ```toml
   auto_stop_machines = true
   ```

2. **Reduce memory** to 256MB (already configured)

3. **Monitor bandwidth** usage (audio files can add up)

---

## Security Best Practices

### 1. Secure Admin Access

- Use strong admin password
- Enable 2FA in PocketBase admin (if available)
- Limit admin dashboard access by IP (via Fly.io)

### 2. API Key Management

- Never commit API keys to git
- Rotate keys regularly
- Use environment-specific keys

### 3. Access Rules

- Keep access rules strict (user-scoped)
- Test all rules before production
- Monitor failed auth attempts in logs

### 4. HTTPS Only

- force_https = true (already configured)
- Redirect all HTTP to HTTPS

---

## Maintenance Schedule

### Weekly
- Check logs for errors
- Monitor disk usage
- Verify backup integrity

### Monthly
- Review access logs
- Update PocketBase version if needed
- Audit user accounts

### Quarterly
- Review and optimize access rules
- Test disaster recovery
- Audit API usage and costs

---

## Updating PocketBase

To update to a new version:

1. Edit `Dockerfile` → Change `POCKETBASE_VERSION`
2. Redeploy:
   ```bash
   cd pocketbase
   flyctl deploy --local-only
   ```

3. Test thoroughly in admin dashboard

---

## Rolling Back

If deployment fails:

```bash
# View release history
flyctl releases -a linguaspark-pb

# Rollback to previous version
flyctl releases rollback <release-id> -a linguaspark-pb
```

---

## Support and Resources

- **PocketBase Docs**: https://pocketbase.io/docs/
- **Fly.io Docs**: https://fly.io/docs/
- **GitHub Issues**: Report bugs or ask questions
- **Discord**: PocketBase community for support

---

## Quick Reference Commands

```bash
# Deploy/Update
cd pocketbase && ./deploy.sh

# View logs
flyctl logs -a linguaspark-pb

# Open admin
flyctl open -a linguaspark-pb

# SSH access
flyctl ssh console -a linguaspark-pb

# Check status
flyctl status -a linguaspark-pb

# Set secrets
flyctl secrets set KEY=value -a linguaspark-pb

# Scale resources
flyctl scale memory 512 -a linguaspark-pb
```

---

## Next Steps

After deployment:

1. ✅ Test authentication (signup/login)
2. ✅ Create test lesson
3. ✅ Add test vocabulary
4. ✅ Verify realtime updates
5. ✅ Test file uploads (audio)
6. ✅ Configure frontend to use PocketBase
7. ✅ Monitor for 24-48 hours
8. ✅ Decommission Supabase

---

**Deployment Complete!** 🎉

Your PocketBase backend is now running at: `https://linguaspark-pb.fly.dev`
