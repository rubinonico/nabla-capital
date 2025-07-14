# Use the official n8n Docker image as a base
FROM n8nio/n8n

# Switch to the root user to copy files and set permissions
USER root

# Copy the custom entrypoint script into the container
COPY entrypoint.sh /usr/local/bin/

# Make the entrypoint script executable
RUN chmod +x /usr/local/bin/entrypoint.sh

# Switch back to the non-root 'node' user for security
USER node

# Set the custom script as the entrypoint for the container.
# This will run our permission-fixing script before starting n8n.
ENTRYPOINT ["entrypoint.sh"]
