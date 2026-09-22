#!/usr/bin/env bash
# =============================================================================
# COSC349 Assignment 2: Turnkey Cloud Deployment Script
# SmartPantry: Cloud Pantry Inventory Management System
# =============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}=================================================================${NC}"
echo -e "${BOLD}${BLUE}   🥫 SmartPantry Cloud Infrastructure Deployment (Terraform)   ${NC}"
echo -e "${BOLD}${BLUE}=================================================================${NC}"

# Check prerequisites
if ! command -v terraform &> /dev/null; then
  echo -e "${RED}Error: terraform is not installed or not in PATH.${NC}"
  echo "Please install Terraform >= 1.5.0 or ensure it is in your PATH."
  exit 1
fi

echo -e "${GREEN}✓ Found Terraform: $(terraform version | head -n1)${NC}"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT_DIR}/terraform"

# Package application code bundle for deterministic S3 deployment
echo -e "\n${BOLD}Step 0: Packaging application code bundle (S3 deployment)...${NC}"
(cd "${ROOT_DIR}" && zip -q -r terraform/app_bundle.zip backend frontend \
  -x "*/node_modules/*" -x "*/dist/*" -x "*/.env" -x "*/.DS_Store")
echo -e "${GREEN}✓ Application bundle packaged (${ROOT_DIR}/terraform/app_bundle.zip)${NC}"

# Check if AWS credentials exist
if [ -z "$AWS_ACCESS_KEY_ID" ] && [ ! -f "$HOME/.aws/credentials" ]; then
  echo -e "${YELLOW}Warning: No AWS environment credentials or ~/.aws/credentials found.${NC}"
  echo "For AWS Academy Learner Lab, paste your temporary credentials from the 'AWS Details' modal:"
  echo "  export AWS_ACCESS_KEY_ID=..."
  echo "  export AWS_SECRET_ACCESS_KEY=..."
  echo "  export AWS_SESSION_TOKEN=..."
  echo ""
  read -p "Do you wish to continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Initialize Terraform
echo -e "\n${BOLD}Step 1: Initializing Terraform...${NC}"
terraform init

# Validate configuration
echo -e "\n${BOLD}Step 2: Validating Terraform configuration...${NC}"
terraform validate

# Plan deployment
echo -e "\n${BOLD}Step 3: Generating execution plan...${NC}"
terraform plan -out=tfplan

# Apply confirmation
echo -e "\n${BOLD}Step 4: Ready to deploy.${NC}"
read -p "Do you want to apply this plan to AWS? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "\n${BOLD}Applying infrastructure deployment... (Expected time: ~2-3 minutes)${NC}"
  terraform apply "tfplan"
  rm -f tfplan

  echo -e "\n${GREEN}${BOLD}=================================================================${NC}"
  echo -e "${GREEN}${BOLD}🎉 Deployment Completed Successfully!${NC}"
  echo -e "${GREEN}${BOLD}=================================================================${NC}\n"

  terraform output
  echo ""
  echo "To verify the deployment, run:"
  echo "  ./scripts/test-cloud-workflow.sh \$(terraform output -raw backend_api_url)"
else
  echo -e "${YELLOW}Deployment cancelled by user.${NC}"
  rm -f tfplan
fi
