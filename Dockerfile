# Start from the official n8n image
FROM n8nio/n8n:latest

# Switch to the root user to install dependencies
USER root

# Create a directory for our custom nodes and set permissions
RUN mkdir -p /home/node/.n8n/custom && chown -R node:node /home/node/.n8n

# Switch back to the node user
USER node

# Copy our custom nodes package into the image
COPY packages/n8n-nodes-nabla /home/node/.n8n/custom/n8n-nodes-nabla

# Go into the custom nodes directory and install dependencies
WORKDIR /home/node/.n8n/custom/n8n-nodes-nabla
RUN npm install

# Go back to the main n8n directory
WORKDIR /home/node/

# Set the environment variable to tell n8n to load our custom nodes
# Note: This path is inside the container
ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom/n8n-nodes-nabla