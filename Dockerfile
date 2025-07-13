# Start from the official n8n image
FROM n8nio/n8n:latest

# Switch to the root user to perform installations
USER root

# Create a directory for our custom nodes
RUN mkdir -p /home/node/.n8n/custom

# Copy our custom nodes package into the image
COPY packages/n8n-nodes-nabla /home/node/.n8n/custom/n8n-nodes-nabla

# Give the node user ownership of the copied files
RUN chown -R node:node /home/node/.n8n/custom

# Switch back to the node user
USER node

# Go into the custom nodes directory
WORKDIR /home/node/.n8n/custom/n8n-nodes-nabla

# Install dependencies AND build the typescript
RUN npm install && npm run build

# Go back to the main n8n directory
WORKDIR /home/node/

# Set the environment variable to tell n8n to load our custom nodes
# n8n looks for the package.json of the custom package
ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom/n8n-nodes-nabla