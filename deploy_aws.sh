#!/bin/bash
# AWS EC2 Deployment Script

echo "Deploying SmartRoute to AWS EC2..."

sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose git

sudo systemctl start docker
sudo systemctl enable docker

git clone YOUR_REPO_URL smartroute-web
cd smartroute-web
sudo docker-compose up -d --build

echo "Deployment complete!"
echo "Frontend: http://YOUR_EC2_IP:3000"
echo "Backend:  http://YOUR_EC2_IP:8000"
