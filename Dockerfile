# Use the official n8n Docker image as a base
FROM n8nio/n8n

# Switch to the root user to create a new data directory
USER root

# Create a new directory /data and give ownership to the 'node' user.
# This avoids the permission issues associated with the default /home/node/.n8n directory.
RUN mkdir /data && chown node:node /data

# Switch back to the non-root 'node' user for security
USER node

# Use an environment variable to tell n8n to use the new /data directory
# for all of its configuration, database, and workflow files.
ENV N8N_USER_FOLDER=/data

# The container will now start n8n, which will automatically read the
# N8N_USER_FOLDER variable and use our safe, new directory.
