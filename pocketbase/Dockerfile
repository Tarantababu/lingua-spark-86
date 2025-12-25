# PocketBase Dockerfile for Fly.io deployment
# Build: Multi-stage for smaller image size

FROM alpine:latest as downloader

ARG POCKETBASE_VERSION=0.22.0
ARG TARGETOS
ARG TARGETARCH

# Install dependencies
RUN apk add --no-cache \
    ca-certificates \
    unzip \
    wget \
    zip

# Download PocketBase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_${TARGETOS}_${TARGETARCH}.zip \
    && unzip pocketbase_${POCKETBASE_VERSION}_${TARGETOS}_${TARGETARCH}.zip \
    && chmod +x pocketbase

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    ca-certificates \
    tzdata

# Copy PocketBase binary from downloader stage
COPY --from=downloader /pocketbase /usr/local/bin/pocketbase

# Copy hooks directory
COPY pb_hooks /pb_hooks

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy frontend build (if exists)
# This directory is created by the deploy-unified.sh script
COPY pb_public /pb_public

# Expose port 8080
EXPOSE 8080

# Create data directory
RUN mkdir -p /pb_data

# Set working directory
WORKDIR /

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run entrypoint script
CMD ["/entrypoint.sh"]
