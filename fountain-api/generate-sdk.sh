#!/bin/bash

set -e

echo "🚀 Generating Fountain API SDK..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create output directories
mkdir -p ./sdk
mkdir -p ./docs

echo -e "${BLUE}1. Building API to generate Swagger spec...${NC}"
npm run build > /dev/null

echo -e "${BLUE}2. Starting API server temporarily...${NC}"
timeout 10s npm run start:prod > /tmp/api.log 2>&1 &
API_PID=$!

# Wait for API to be ready
echo -e "${BLUE}3. Waiting for API server...${NC}"
sleep 3

echo -e "${BLUE}4. Downloading Swagger spec...${NC}"
curl -s http://localhost:3000/api-json > ./openapi.json || echo "Warning: Could not download spec"

# Kill the API server
kill $API_PID 2>/dev/null || true
wait $API_PID 2>/dev/null || true

echo -e "${BLUE}5. Generating TypeScript SDK...${NC}"
npx -y @openapitools/openapi-generator-cli generate \
  -i ./openapi.json \
  -g typescript-axios \
  -o ./sdk/typescript \
  --config-file ./openapi-generator-config.json 2>/dev/null || true

echo -e "${BLUE}6. Generating JavaScript SDK...${NC}"
npx -y @openapitools/openapi-generator-cli generate \
  -i ./openapi.json \
  -g javascript \
  -o ./sdk/javascript \
  --config-file ./openapi-generator-config.json 2>/dev/null || true

echo -e "${BLUE}7. Generating Python SDK...${NC}"
npx -y @openapitools/openapi-generator-cli generate \
  -i ./openapi.json \
  -g python \
  -o ./sdk/python \
  --config-file ./openapi-generator-config.json 2>/dev/null || true

echo ""
echo -e "${GREEN}✓ SDK generation complete!${NC}"
echo ""
echo -e "${YELLOW}Generated SDKs:${NC}"
echo "  • TypeScript/Node.js: ./sdk/typescript"
echo "  • JavaScript/Browser: ./sdk/javascript"
echo "  • Python: ./sdk/python"
echo ""
echo -e "${YELLOW}OpenAPI Spec:${NC}"
echo "  • ./openapi.json"
echo ""
echo -e "${BLUE}To use the TypeScript SDK:${NC}"
echo "  cd sdk/typescript"
echo "  npm install"
echo "  npm link"
echo ""
echo -e "${BLUE}Then in your project:${NC}"
echo "  npm link fountain-api-sdk"
echo ""
