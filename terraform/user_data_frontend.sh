#!/bin/bash
set -euo pipefail

# Log all output to user-data log
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "=== Starting SmartPantry Frontend Provisioning ==="
date

# 1. Update and install base packages & Nginx
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ca-certificates gnupg nginx

# 2. Install Node.js 22 LTS (for building frontend)
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=22
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update -y
apt-get install -y nodejs

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

cd /opt/smartpantry/frontend

# 4. Set frontend environment variables (points directly to Backend EC2)
cat << ENVFILE > /opt/smartpantry/frontend/.env
VITE_API_URL=/api
VITE_AWS_REGION=${aws_region}
ENVFILE

# 5. Build React production bundle
echo "Building React production distribution..."
npm install
npm run build

# 6. Configure Nginx to serve React frontend & reverse-proxy /api calls to Backend
cat << 'NGINX_CONF' > /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;
    root /opt/smartpantry/frontend/dist;
    index index.html;

    # Serve static frontend assets with SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse-proxy /api/ to backend EC2 instance
    location /api/ {
        proxy_pass http://${backend_private_ip}:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Custom error pages
    error_page 404 /index.html;
}
NGINX_CONF

# 7. Test and reload Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "=== SmartPantry Frontend Provisioning Complete ==="
systemctl status nginx --no-pager
