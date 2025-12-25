#!/bin/sh
set -e

# Copy hooks from image to volume (always overwrite to ensure latest hooks are used)
if [ -d "/pb_hooks" ] && [ "$(ls -A /pb_hooks 2>/dev/null)" ]; then
    echo "Copying hooks from /pb_hooks to /pb_data/pb_hooks..."
    mkdir -p /pb_data/pb_hooks
    cp -f /pb_hooks/*.js /pb_data/pb_hooks/ 2>/dev/null || true
    echo "Hooks copied successfully"
fi

# Start PocketBase
exec /usr/local/bin/pocketbase serve --http=0.0.0.0:8080 --dir=/pb_data

