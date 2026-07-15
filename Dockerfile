# ==========================================
# STAGE 1: Dependency builder
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# ==========================================
# STAGE 2: Secure runtime environment
# ==========================================
FROM node:18-alpine

# Enforce secure environment variables
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /usr/src/app

# Copy production assets and dependencies from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY public ./public

# Setup folder permissions for non-root user execution
RUN chown -R node:node /usr/src/app

# Switch executing user context to standard 'node' (Least Privilege)
USER node

# Expose server entry point
EXPOSE 3000

# Execute server boot
CMD ["npm", "start"]
