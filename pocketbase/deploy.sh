#!/bin/bash
# PocketBase Deployment Script for Fly.io
# This script automates the deployment process

set -e  # Exit on error

echo "🚀 PocketBase Deployment to Fly.io"
echo "===================================="
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ Error: flyctl is not installed"
    echo "Install it from: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Check if logged in to Fly.io
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Error: Not logged in to Fly.io"
    echo "Run: flyctl auth login"
    exit 1
fi

echo "✅ Fly.io CLI detected and authenticated"
echo ""

# Change to pocketbase directory
cd "$(dirname "$0")"

# Check if app exists
APP_NAME="linguaspark-pb"
if flyctl status -a $APP_NAME &> /dev/null; then
    echo "📦 App '$APP_NAME' already exists"
    echo ""
    read -p "Do you want to deploy an update? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
else
    echo "🆕 Creating new app '$APP_NAME'"
    echo ""
    
    # Create the app
    flyctl apps create $APP_NAME
    
    # Create volume for persistent storage
    echo "📁 Creating persistent volume..."
    flyctl volumes create pb_data --region fra --size 1 -a $APP_NAME
    
    # Set secrets
    echo ""
    echo "🔐 Setting up secrets..."
    echo "⚠️  You'll need to set the following secrets manually after deployment:"
    echo "   - OPENAI_API_KEY (for AI features)"
    echo "   - PB_ENCRYPTION_KEY (32-character random string)"
    echo ""
    echo "Run these commands after deployment:"
    echo "  flyctl secrets set OPENAI_API_KEY=your-key -a $APP_NAME"
    echo "  flyctl secrets set PB_ENCRYPTION_KEY=\$(openssl rand -hex 16) -a $APP_NAME"
    echo ""
    read -p "Press Enter to continue with deployment..."
fi

# Deploy the application
echo ""
echo "🚢 Deploying to Fly.io..."
flyctl deploy --remote-only

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Open PocketBase admin: flyctl open -a $APP_NAME"
echo "2. Create admin account (first time only)"
echo "3. Import schema from pb_schema.json via admin UI"
echo "4. Set secrets if not done already:"
echo "   flyctl secrets set OPENAI_API_KEY=your-key -a $APP_NAME"
echo "   flyctl secrets set PB_ENCRYPTION_KEY=\$(openssl rand -hex 16) -a $APP_NAME"
echo "5. Update frontend .env with PocketBase URL"
echo ""
echo "🔗 Your PocketBase URL: https://$APP_NAME.fly.dev"
echo ""

# Offer to open the app
read -p "Open PocketBase admin in browser? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    flyctl open -a $APP_NAME
fi

echo ""
echo "✨ Done!"
