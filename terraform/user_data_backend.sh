#!/bin/bash
set -euo pipefail

# Log all output to user-data log
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "=== Starting SmartPantry Backend Provisioning ==="
date

# 1. Update and install base packages
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ca-certificates gnupg

# 2. Install Node.js 22 LTS
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=22
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update -y
apt-get install -y nodejs

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 3. Setup application directory
mkdir -p /opt/smartpantry
cd /opt/smartpantry

echo "Cloning repository ${git_repo_url} (branch: ${git_branch})..."
if [ ! -d "/opt/smartpantry/.git" ]; then
  git clone -b "${git_branch}" "${git_repo_url}" . || {
    echo "Warning: Git clone failed, retrying default branch..."
    git clone "${git_repo_url}" . || true
  }
fi

cd /opt/smartpantry/backend

# 4. Write environment configuration
cat << 'ENVFILE' > /opt/smartpantry/backend/.env
PORT=5000
AWS_REGION=${aws_region}
DYNAMODB_TABLE_NAME=${dynamodb_table_name}
SNS_TOPIC_ARN=${sns_topic_arn}
DB_TYPE=dynamodb
NODE_ENV=production
ENVFILE

# 5. Install dependencies
echo "Installing backend dependencies..."
npm install --production

# 6. Create systemd service for reliable operation and auto-restart
cat << 'SERVICE' > /etc/systemd/system/smartpantry-backend.service
[Unit]
Description=SmartPantry Backend Node.js Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/smartpantry/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=smartpantry-backend
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE

# 7. Reload systemd, enable and start service
systemctl daemon-reload
systemctl enable smartpantry-backend.service
systemctl restart smartpantry-backend.service

echo "=== SmartPantry Backend Provisioning Complete ==="
systemctl status smartpantry-backend.service --no-pager
