#!/bin/bash

set -e

echo "⚙️  Loading configuration..."

# Load environment variables from the deploy.env file if it exists.
# Sourcing it keeps values containing spaces intact; word splitting the file
# through xargs did not.
if [ -f "deploy.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ./deploy.env
  set +a
fi

# Check for required variables, using the defined suffix for error messages.
ERROR_SUFFIX="Please define it in deploy.env or as an environment variable."
: "${LOCAL_SOURCE_PATH:?LOCAL_SOURCE_PATH is not set. $ERROR_SUFFIX}"
: "${SFTP_USER:?SFTP_USER is not set. $ERROR_SUFFIX}"
: "${SFTP_HOST:?SFTP_HOST is not set. $ERROR_SUFFIX}"
: "${SFTP_PORT:?SFTP_PORT is not set. $ERROR_SUFFIX}"
: "${SFTP_REMOTE_PATH:?SFTP_REMOTE_PATH is not set. $ERROR_SUFFIX}"

# --- Prerequisite Checks ---
# Check if the local source directory exists.
if [ ! -d "$LOCAL_SOURCE_PATH" ]; then
  echo "❌ Error: Local source directory '$LOCAL_SOURCE_PATH' not found."
  exit 1
fi

# --- Start Deployment ---
echo "🚀 Starting deployment to $SFTP_HOST..."
echo "----------------------------------------"
echo "Source (Local):    ./$LOCAL_SOURCE_PATH/"
echo "Target (Remote):   $SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/"
echo "----------------------------------------"

rsync -avz --delete --progress \
  -e "ssh -p $SFTP_PORT" \
  "$LOCAL_SOURCE_PATH/" \
  "$SFTP_USER@$SFTP_HOST:$SFTP_REMOTE_PATH/"

echo "----------------------------------------"
echo "✅ Deployment completed successfully!"
echo "----------------------------------------"
