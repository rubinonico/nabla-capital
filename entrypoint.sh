#!/bin/sh
#
# This script is run when the container starts.
# It ensures that the n8n data directory has the correct permissions
# before launching the main n8n application.

# Change the ownership of the .n8n directory to the node user.
# This runs every time the container starts, ensuring permissions are correct
# even if the volume is mounted after the initial build.
chown -R node:node /home/node/.n8n

# Execute the original n8n start command.
# The 'exec' command replaces the current process with the n8n process,
# which is a best practice for entrypoint scripts.
exec n8n
