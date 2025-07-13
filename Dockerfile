# STAGE 1: Build the custom nodes
FROM node:18-alpine AS builder

WORKDIR /build
COPY packages/n8n-nodes-nabla .
RUN npm install && npm run build

# STAGE 2: Create the final n8n image
FROM n8nio/n8n:latest

# Copy the built nodes from the 'builder' stage
# into the location where n8n looks for custom nodes
COPY --from=builder /build /home/node/.n8n/custom/