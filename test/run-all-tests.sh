#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Running all tests..."
echo "======================="
echo ""

FAILED=0
PASSED=0

# ============================================
# TEST 1: Environment
# ============================================

echo "Test 1: Environment configuration..."

if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ .env file missing${NC}"
    ((FAILED++))
fi

# Check required variables
source .env 2>/dev/null || true

if [ ! -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${GREEN}✅ OPENROUTER_API_KEY set${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  OPENROUTER_API_KEY not set${NC}"
fi

echo ""

# ============================================
# TEST 2: Dependencies
# ============================================

echo "Test 2: Dependencies..."

if [ -d node_modules ]; then
    echo -e "${GREEN}✅ node_modules exists${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ node_modules missing - run: npm install${NC}"
    ((FAILED++))
fi

echo ""

# ============================================
# TEST 3: OpenRouter Connection
# ============================================

echo "Test 3: OpenRouter connection..."

node test/test-openrouter.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ OpenRouter test passed${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ OpenRouter test failed${NC}"
    ((FAILED++))
fi

echo ""

# ============================================
# TEST 4: Bidding Engine
# ============================================

echo "Test 4: Bidding Engine..."

node test/test-bidding-engine.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Bidding Engine test passed${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Bidding Engine test failed${NC}"
    ((FAILED++))
fi

echo ""

# ============================================
# TEST 5: Quality Control
# ============================================

echo "Test 5: Quality Control..."

node test/test-quality-control.js
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Quality Control test passed${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Quality Control test failed${NC}"
    ((FAILED++))
fi

echo ""

# ============================================
# TEST 6: Configuration Files
# ============================================

echo "Test 6: Configuration files..."

for file in config/agents.json config/bidding-strategies.json config/llm.json; do
    if [ -f $file ]; then
        # Check if valid JSON
        if jq empty $file 2>/dev/null; then
            echo -e "${GREEN}✅ $file valid${NC}"
            ((PASSED++))
        else
            echo -e "${RED}❌ $file invalid JSON${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}⚠️  $file missing${NC}"
    fi
done

echo ""

# ============================================
# SUMMARY
# ============================================

echo "======================="
echo "Test Summary:"
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo "======================="
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "System is ready to start."
    echo "Run: npm start"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Please fix issues before starting."
    echo ""
    exit 1
fi
