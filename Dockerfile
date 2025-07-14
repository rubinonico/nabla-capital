# Use the official n8n Docker image as a base
FROM n8nio/n8n

# Temporarily switch to the root user to fix directory permissions.
# This is a necessary step to allow the n8n process to write to its data volume.
USER root

# Create the .n8n directory (if it doesn't exist) and, most importantly,
# change its ownership to the 'node' user and group (which both have an ID of 1000).
# The -R flag makes this recursive, ensuring all subfolders also have correct permissions.
# This command is the key to fixing the "EACCES: permission denied" error.
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n

# Switch back to the non-root 'node' user for security before the application starts.
# This is a best practice for running containerized applications.
USER node

# The container will now proceed with its default startup command.
# The n8n process, running as 'node', will now have the required permissions
# to write its config, database, and workflows to the persistent volume.
