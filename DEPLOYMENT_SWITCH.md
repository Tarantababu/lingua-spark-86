# Frontend Deployment Switch Guide

This guide explains how to switch the frontend deployment from the old `lingua-spark-86` app to the unified `linguaspark-pb` domain on Fly.io.

## Current Architecture

- **Backend (PocketBase)**: Already deployed at `https://linguaspark-pb.fly.dev` ✅
- **Frontend (React/Vite)**: Currently at `https://lingua-spark-86.fly.dev` → Needs to be moved to `https://linguaspark-pb.fly.dev`

## Changes Made

### 1. Updated Configuration Files

#### `.env`
- ✅ Added `VITE_POCKETBASE_URL=https://linguaspark-pb.fly.dev`
- ✅ Added placeholder for `VITE_OPENAI_API_KEY` (needs to be set with actual key)
- Marked legacy Supabase config as deprecated

#### `fly.toml`
- ✅ Changed app name from `lingua-spark-86` to `linguaspark-ui`

**Note**: The app name `linguaspark-ui` is used to distinguish it from the backend, but both will be accessed through the unified domain after DNS/routing configuration.

---

## Deployment Options

### Option 1: Deploy Frontend to the Same PocketBase App (Recommended)

Deploy the frontend as a static site served by the PocketBase backend. This is simpler and uses one domain.

**Steps:**

1. **Build the Frontend**
   ```bash
   cd lingua-spark-86
   npm install
   npm run build
   ```

2. **Copy Build to PocketBase Public Directory**
   ```bash
   # Create public directory structure in pocketbase
   mkdir -p pocketbase/pb_public
   
   # Copy built files to PocketBase public directory
   cp -r dist/* pocketbase/pb_public/
   ```

3. **Update PocketBase Dockerfile**
   Add this to `pocketbase/Dockerfile` before the CMD line:
   ```dockerfile
   # Copy frontend build
   COPY pb_public /pb_public
   ```

4. **Redeploy PocketBase**
   ```bash
   cd pocketbase
   flyctl deploy --local-only -a linguaspark-pb
   ```

5. **Access Your App**
   - Frontend: `https://linguaspark-pb.fly.dev/`
   - PocketBase Admin: `https://linguaspark-pb.fly.dev/_/`
   - API: `https://linguaspark-pb.fly.dev/api/`

### Option 2: Deploy Frontend as Separate App with Custom Domain

Keep frontend and backend as separate Fly.io apps but use subdomain routing.

**Steps:**

1. **Create New Frontend App**
   ```bash
   cd lingua-spark-86
   
   # Delete old app (optional - if you want to clean up)
   flyctl apps destroy lingua-spark-86
   
   # Create new app with better name
   flyctl apps create linguaspark-ui
   
   # Deploy
   npm run build  # Build with correct env vars
   flyctl deploy --local-only
   ```

2. **Configure Custom Domain (Optional)**
   ```bash
   # Add custom domain if you have one
   flyctl certs add yourdomain.com -a linguaspark-ui
   flyctl certs add api.yourdomain.com -a linguaspark-pb
   ```

3. **Update DNS Records**
   - Point `yourdomain.com` → `linguaspark-ui.fly.dev`
   - Point `api.yourdomain.com` → `linguaspark-pb.fly.dev`

### Option 3: Use Fly.io Proxy/Routing

Use a single domain with path-based routing.

**Not recommended** for this architecture as it adds unnecessary complexity.

---

## Recommended: Option 1 (Single Domain)

**Why?**
- Simpler deployment and maintenance
- No CORS issues
- Single domain to manage
- Lower cost (one app instead of two)
- PocketBase can serve static files efficiently

**Implementation:**

1. **Update PocketBase Dockerfile**
   ```dockerfile
   # pocketbase/Dockerfile
   FROM alpine:latest
   
   # Install PocketBase
   ARG POCKETBASE_VERSION=0.23.14
   ADD https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip /tmp/pocketbase.zip
   RUN apk add --no-cache unzip ca-certificates && \
       unzip /tmp/pocketbase.zip -d /pb && \
       chmod +x /pb/pocketbase && \
       rm /tmp/pocketbase.zip
   
   # Copy frontend build to public directory
   COPY pb_public /pb/pb_public
   
   # Create data directory
   RUN mkdir -p /pb_data
   
   EXPOSE 8080
   
   # Start PocketBase
   CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
   ```

2. **Create Deployment Script**
   ```bash
   # deploy-unified.sh
   #!/bin/bash
   
   echo "Building frontend..."
   cd lingua-spark-86
   npm install
   npm run build
   
   echo "Preparing PocketBase deployment..."
   mkdir -p pocketbase/pb_public
   cp -r dist/* pocketbase/pb_public/
   
   echo "Deploying to Fly.io..."
   cd pocketbase
   flyctl deploy --local-only -a linguaspark-pb
   
   echo "Deployment complete!"
   echo "Frontend: https://linguaspark-pb.fly.dev/"
   echo "Admin: https://linguaspark-pb.fly.dev/_/"
   echo "API: https://linguaspark-pb.fly.dev/api/"
   ```

3. **Make it executable and run**
   ```bash
   chmod +x deploy-unified.sh
   ./deploy-unified.sh
   ```

---

## Environment Variables

### Production .env for Building

Before building, ensure your `.env` file has:

```env
VITE_POCKETBASE_URL=https://linguaspark-pb.fly.dev
VITE_OPENAI_API_KEY=sk-your-actual-openai-key-here
```

### Setting Fly.io Secrets (Backend)

```bash
# OpenAI API key (for backend AI features)
flyctl secrets set OPENAI_API_KEY=sk-your-actual-key -a linguaspark-pb

# PocketBase encryption key
flyctl secrets set PB_ENCRYPTION_KEY=$(openssl rand -hex 16) -a linguaspark-pb
```

---

## Testing Checklist

After deployment:

- [ ] Frontend loads at `https://linguaspark-pb.fly.dev/`
- [ ] Admin dashboard accessible at `https://linguaspark-pb.fly.dev/_/`
- [ ] API health check: `https://linguaspark-pb.fly.dev/api/health`
- [ ] User authentication works (signup/login)
- [ ] Lessons load correctly
- [ ] Vocabulary features work
- [ ] Audio playback functions
- [ ] No CORS errors in browser console
- [ ] All API calls succeed

---

## Cleanup Old Deployment

Once the new deployment is verified:

```bash
# List your apps
flyctl apps list

# Destroy old frontend app
flyctl apps destroy lingua-spark-86

# Verify
flyctl apps list
```

---

## Troubleshooting

### Frontend Shows 404
- Check that `pb_public` directory was copied correctly
- Verify PocketBase is serving static files: `flyctl logs -a linguaspark-pb`

### API Calls Fail
- Verify `VITE_POCKETBASE_URL` is correct in `.env` before building
- Check browser console for actual URL being called
- Verify CORS settings in PocketBase admin

### Build Fails
- Ensure Node.js dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run build`
- Verify `.env` file exists and has required variables

### Deployment Fails
- Check Fly.io status: `flyctl status -a linguaspark-pb`
- View logs: `flyctl logs -a linguaspark-pb`
- Verify volume is mounted: `flyctl volumes list -a linguaspark-pb`

---

## Quick Commands

```bash
# Build frontend
cd lingua-spark-86 && npm run build

# Deploy (Option 1 - Unified)
./deploy-unified.sh

# View logs
flyctl logs -a linguaspark-pb

# Check status
flyctl status -a linguaspark-pb

# Open in browser
flyctl open -a linguaspark-pb

# SSH into container
flyctl ssh console -a linguaspark-pb
```

---

## Next Steps

1. ✅ Configuration files updated
2. ⏳ Choose deployment option (Option 1 recommended)
3. ⏳ Set actual OpenAI API key in `.env`
4. ⏳ Build and deploy
5. ⏳ Test all features
6. ⏳ Clean up old `lingua-spark-86` app
7. ⏳ Update any external references to old domain

---

**Ready to deploy!** 🚀
