#!/usr/bin/env bash
# =============================================================================
# COSC349 Assignment 2: Automated Cloud-Hosted Workflow Check
# SmartPantry: Cloud Pantry Inventory Management System
#
# Usage:
#   ./scripts/test-cloud-workflow.sh [TARGET_API_URL]
# Example:
#   ./scripts/test-cloud-workflow.sh http://54.167.34.12:5000
#   ./scripts/test-cloud-workflow.sh http://localhost:5000
# =============================================================================

set -e

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

TARGET_URL="${1:-http://localhost:5000}"
# Remove trailing slash if provided
TARGET_URL="${TARGET_URL%/}"

echo -e "${BOLD}${BLUE}=================================================================${NC}"
echo -e "${BOLD}${BLUE}   🥫 SmartPantry Cloud Automated Workflow Verification Check   ${NC}"
echo -e "${BOLD}${BLUE}=================================================================${NC}"
echo -e "Target URL: ${YELLOW}${TARGET_URL}${NC}"
echo -e "Execution Time: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

pass_test() {
  echo -e "  ${GREEN}✓ PASSED:${NC} $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail_test() {
  echo -e "  ${RED}✗ FAILED:${NC} $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

# -----------------------------------------------------------------------------
# STEP 1: Verify Health Endpoint & Cloud Connectivity
# -----------------------------------------------------------------------------
echo -e "${BOLD}Step 1: Checking Backend Health & Cloud Services Status (/health)${NC}"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${TARGET_URL}/health" || echo -e "{}\n000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  pass_test "Backend is healthy (HTTP 200)"
  REGION=$(echo "$BODY" | grep -o '"region":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
  DB_MODE=$(echo "$BODY" | grep -o '"mode":"[^"]*"' | head -n1 | cut -d'"' -f4 || echo "unknown")
  echo -e "    → Region: ${YELLOW}${REGION}${NC} | Storage Mode: ${YELLOW}${DB_MODE}${NC}"
else
  fail_test "Backend health check returned HTTP ${HTTP_CODE}"
  echo "$BODY"
  exit 1
fi

echo ""

# -----------------------------------------------------------------------------
# STEP 2: Write New Item to Managed Storage (DynamoDB) with Near Expiry
# -----------------------------------------------------------------------------
echo -e "${BOLD}Step 2: Meaningful Write to Managed Storage (POST /products)${NC}"
TOMORROW=$(date -u -v+1d "+%Y-%m-%d" 2>/dev/null || date -u -d "+1 day" "+%Y-%m-%d" 2>/dev/null || echo "2026-09-23")
PAYLOAD=$(cat << JSON
{
  "name": "Cloud Workflow Test Milk",
  "quantity": 2,
  "expiry_date": "${TOMORROW}",
  "category": "AutomatedTest"
}
JSON
)

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${TARGET_URL}/products" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
CREATE_HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$CREATE_HTTP_CODE" -eq 201 ]; then
  pass_test "Product successfully created in DynamoDB (HTTP 201)"
  PRODUCT_ID=$(echo "$CREATE_BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "")
  PRODUCT_STATUS=$(echo "$CREATE_BODY" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "")
  echo -e "    → Created Product ID: ${YELLOW}${PRODUCT_ID}${NC}"
  echo -e "    → Status Assigned: ${YELLOW}${PRODUCT_STATUS}${NC} (Expected: soon)"
else
  fail_test "Failed to write product to managed storage (HTTP ${CREATE_HTTP_CODE})"
  echo "$CREATE_BODY"
  exit 1
fi

echo ""

# -----------------------------------------------------------------------------
# STEP 3: Meaningful Read from Managed Storage (DynamoDB)
# -----------------------------------------------------------------------------
echo -e "${BOLD}Step 3: Meaningful Read from Managed Storage (GET /products)${NC}"
GET_RESPONSE=$(curl -s -w "\n%{http_code}" "${TARGET_URL}/products")
GET_HTTP_CODE=$(echo "$GET_RESPONSE" | tail -n1)
GET_BODY=$(echo "$GET_RESPONSE" | sed '$d')

if [ "$GET_HTTP_CODE" -eq 200 ]; then
  pass_test "Products list retrieved successfully (HTTP 200)"
  if echo "$GET_BODY" | grep -q "$PRODUCT_ID"; then
    pass_test "Verified newly inserted item is present in DynamoDB items list"
  else
    fail_test "Item ${PRODUCT_ID} not found in retrieved products list"
  fi
else
  fail_test "Failed to read products from managed storage (HTTP ${GET_HTTP_CODE})"
fi

echo ""

# -----------------------------------------------------------------------------
# STEP 4: Trigger Further Managed Service: Amazon SNS Expiry & Stock Audit Sweep
# -----------------------------------------------------------------------------
echo -e "${BOLD}Step 4: Trigger Non-EC2 Managed Service - Amazon SNS Audit Sweep (POST /products/audit)${NC}"
AUDIT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${TARGET_URL}/products/audit")
AUDIT_HTTP_CODE=$(echo "$AUDIT_RESPONSE" | tail -n1)
AUDIT_BODY=$(echo "$AUDIT_RESPONSE" | sed '$d')

if [ "$AUDIT_HTTP_CODE" -eq 200 ]; then
  pass_test "Audit sweep completed and SNS alert event dispatched (HTTP 200)"
  SNS_STATUS=$(echo "$AUDIT_BODY" | grep -o '"status":"[^"]*"' | head -n1 | cut -d'"' -f4 || echo "")
  echo -e "    → SNS Dispatch Result: ${YELLOW}${SNS_STATUS}${NC}"
else
  fail_test "Failed to execute audit sweep via Amazon SNS (HTTP ${AUDIT_HTTP_CODE})"
fi

echo ""

# -----------------------------------------------------------------------------
# STEP 5: Trigger S3 Inventory Export
# -----------------------------------------------------------------------------
echo -e "${BOLD}Step 5: Trigger Managed Object Storage Export - Amazon S3 (POST /products/export)${NC}"
EXPORT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${TARGET_URL}/products/export")
EXPORT_HTTP_CODE=$(echo "$EXPORT_RESPONSE" | tail -n1)
EXPORT_BODY=$(echo "$EXPORT_RESPONSE" | sed '$d')

if [ "$EXPORT_HTTP_CODE" -eq 200 ]; then
  pass_test "Inventory snapshot exported to Amazon S3 (HTTP 200)"
  S3_FILE=$(echo "$EXPORT_BODY" | grep -o '"filename":"[^"]*"' | cut -d'"' -f4 || echo "report.json")
  echo -e "    → Generated S3 Report Object: ${YELLOW}${S3_FILE}${NC}"
else
  fail_test "Failed to export report to Amazon S3 (HTTP ${EXPORT_HTTP_CODE})"
fi

echo ""

# -----------------------------------------------------------------------------
# STEP 6: Clean Up Test Item (DELETE /products/:id)
# -----------------------------------------------------------------------------
echo -e "${BOLD}Step 6: Cleaning Up Test Item (DELETE /products/${PRODUCT_ID})${NC}"
if [ -n "$PRODUCT_ID" ]; then
  DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${TARGET_URL}/products/${PRODUCT_ID}")
  DELETE_HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
  if [ "$DELETE_HTTP_CODE" -eq 200 ]; then
    pass_test "Cleaned up test item from DynamoDB (HTTP 200)"
  else
    fail_test "Failed to delete test item (HTTP ${DELETE_HTTP_CODE})"
  fi
fi

echo ""
echo -e "${BOLD}${BLUE}=================================================================${NC}"
echo -e "Verification Summary: ${GREEN}${TESTS_PASSED} passed${NC}, ${RED}${TESTS_FAILED} failed${NC}"
echo -e "${BOLD}${BLUE}=================================================================${NC}"

if [ "$TESTS_FAILED" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}🎉 CLOUD WORKFLOW VERIFICATION SUCCEEDED!${NC}\n"
  exit 0
else
  echo -e "${RED}${BOLD}❌ CLOUD WORKFLOW VERIFICATION FAILED!${NC}\n"
  exit 1
fi
