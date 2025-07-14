FROM n8nio/n8n:latest

# Railway provides the PORT environment variable.
# n8n will listen on this port if it's set.
# No EXPOSE instruction is needed as Railway handles this automatically.

# The rest of the configuration will be handled by Railway environment variables.