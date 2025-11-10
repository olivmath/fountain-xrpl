#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== FOUNTAIN API TEST SCRIPT ===${NC}\n"

# Test 1: Login
echo -e "${BLUE}1. Testing Authentication (Login)${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "company-1"
  }')

echo "$LOGIN_RESPONSE" | jq .
JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.jwt')

echo -e "\n${GREEN}✓ JWT Token obtained: ${JWT_TOKEN:0:20}...${NC}\n"

# Test 2: Create Stablecoin (RLUSD)
echo -e "${BLUE}2. Testing Create Stablecoin (RLUSD Deposit)${NC}"
STABLECOIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/stablecoin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "companyId": "company-1",
    "clientId": "client-123",
    "companyWallet": "rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr",
    "clientName": "Park America Building",
    "currencyCode": "PABRL",
    "amount": 13000,
    "depositType": "RLUSD",
    "webhookUrl": "http://localhost:3001/webhook"
  }')

echo "$STABLECOIN_RESPONSE" | jq .
STABLECOIN_ID=$(echo "$STABLECOIN_RESPONSE" | jq -r '.stablecoinId // "N/A"')
OPERATION_ID=$(echo "$STABLECOIN_RESPONSE" | jq -r '.operationId // "N/A"')

echo -e "\n${GREEN}✓ Stablecoin created${NC}\n"

# Test 3: Burn Stablecoin
echo -e "${BLUE}3. Testing Burn Stablecoin (RLUSD Return)${NC}"
BURN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/stablecoin/burn \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "stablecoinId": "'"$STABLECOIN_ID"'",
    "currencyCode": "PABRL",
    "amountBrl": 5000,
    "returnAsset": "RLUSD",
    "webhookUrl": "http://localhost:3001/webhook"
  }')

echo "$BURN_RESPONSE" | jq .

echo -e "\n${GREEN}=== Tests Complete ===${NC}"
