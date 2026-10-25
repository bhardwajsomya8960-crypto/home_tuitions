#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 EC2 instance: Docker, a swap file (Next.js builds need
# memory on small instances) and the app checkout. Run as the default "ubuntu" user:
#   curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/deploy/aws/ec2-setup.sh | bash
# or copy it to the server and run: bash ec2-setup.sh <git-repo-url>
set -euo pipefail

REPO_URL="${1:-}"

echo "Installing Docker..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
sudo systemctl enable --now docker

if [ ! -f /swapfile ]; then
  echo "Adding a 2 GB swap file..."
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

if [ -n "$REPO_URL" ] && [ ! -d "$HOME/app" ]; then
  git clone "$REPO_URL" "$HOME/app"
fi

echo
echo "Done. Log out and back in (so docker works without sudo), then:"
echo "  cd ~/app/deploy/aws && cp .env.production.example .env.production && nano .env.production"
echo "  docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build"
