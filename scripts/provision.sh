#!/bin/bash

echo "Updating Ubuntu..."

sudo apt-get update

echo "Installing required packages..."

sudo apt-get install -y \
    curl \
    git \
    wget \
    unzip \
    apt-transport-https \
    ca-certificates \
    software-properties-common

echo "Installing Docker..."

curl -fsSL https://get.docker.com | sh

sudo usermod -aG docker vagrant

sudo systemctl enable docker
sudo systemctl start docker

echo "Installing Docker Compose..."

sudo apt-get install -y docker-compose-plugin

echo "Provisioning Complete!"