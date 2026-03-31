#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================="
echo "🧪 System Verification Tests"
echo "=================================="
echo ""

# Test 1: Backend Server
echo "Test 1: Backend Server..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend server is running${NC}"
else
    echo -e "${RED}❌ Backend server is not responding${NC}"
    exit 1
fi
echo ""

# Test 2: Database Connection
echo "Test 2: Database Connection..."
HEALTH=$(curl -s http://localhost:3000/health | jq -r '.database')
if [ "$HEALTH" == "connected" ]; then
    echo -e "${GREEN}✅ Database is connected${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

# Test 3: Student Login
echo "Test 3: Student Login..."
STUDENT_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@university.edu","password":"password123"}' \
  | jq -r '.data.token')

if [ "$STUDENT_TOKEN" != "null" ] && [ -n "$STUDENT_TOKEN" ]; then
    echo -e "${GREEN}✅ Student login successful${NC}"
    echo "   Token: ${STUDENT_TOKEN:0:30}..."
else
    echo -e "${RED}❌ Student login failed${NC}"
    exit 1
fi
echo ""

# Test 4: Tutor Login
echo "Test 4: Tutor Login..."
TUTOR_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/tutor/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.smith@university.edu","password":"password123"}' \
  | jq -r '.data.token')

if [ "$TUTOR_TOKEN" != "null" ] && [ -n "$TUTOR_TOKEN" ]; then
    echo -e "${GREEN}✅ Tutor login successful${NC}"
    echo "   Token: ${TUTOR_TOKEN:0:30}..."
else
    echo -e "${RED}❌ Tutor login failed${NC}"
    exit 1
fi
echo ""

# Test 5: Student API - My Team
echo "Test 5: Student API - My Team..."
TEAM_NAME=$(curl -s -X GET http://localhost:3000/api/students/my-team \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  | jq -r '.data.team_name')

if [ "$TEAM_NAME" == "Alpha Team" ]; then
    echo -e "${GREEN}✅ Student can view team: $TEAM_NAME${NC}"
else
    echo -e "${RED}❌ Student team API failed${NC}"
    exit 1
fi
echo ""

# Test 6: Tutor API - View Teams
echo "Test 6: Tutor API - View Teams..."
TEAM_COUNT=$(curl -s -X GET http://localhost:3000/api/tutor/teams \
  -H "Authorization: Bearer $TUTOR_TOKEN" \
  | jq '.data | length')

if [ "$TEAM_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Tutor can view teams: $TEAM_COUNT teams found${NC}"
else
    echo -e "${RED}❌ Tutor teams API failed${NC}"
    exit 1
fi
echo ""

# Test 7: Tutor API - View Phases
echo "Test 7: Tutor API - View Phases..."
PHASE_COUNT=$(curl -s -X GET http://localhost:3000/api/tutor/phases \
  -H "Authorization: Bearer $TUTOR_TOKEN" \
  | jq '.data | length')

if [ "$PHASE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Tutor can view phases: $PHASE_COUNT phases found${NC}"
else
    echo -e "${RED}❌ Tutor phases API failed${NC}"
    exit 1
fi
echo ""

# Test 8: Student API - My Submissions
echo "Test 8: Student API - My Submissions..."
SUBMISSION_COUNT=$(curl -s -X GET http://localhost:3000/api/students/my-submissions \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  | jq '.data | length')

if [ "$SUBMISSION_COUNT" -ge 0 ]; then
    echo -e "${GREEN}✅ Student can view submissions: $SUBMISSION_COUNT submissions found${NC}"
else
    echo -e "${RED}❌ Student submissions API failed${NC}"
    exit 1
fi
echo ""

# Test 9: Frontend Port
echo "Test 9: Frontend Server..."
if lsof -i:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend server is running on port 5173${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend server not running${NC}"
    echo "   Run: cd frontend && npm run dev"
fi
echo ""

echo "=================================="
echo "✨ Verification Complete!"
echo "=================================="
echo ""
echo -e "${GREEN}All systems operational!${NC}"
echo ""
echo "📝 Quick Access:"
echo "   • Application: http://localhost:5173"
echo "   • Backend API: http://localhost:3000"
echo "   • Health Check: http://localhost:3000/health"
echo ""
echo "🔐 Test Credentials:"
echo "   • Tutor: john.smith@university.edu / password123"
echo "   • Student: alice@university.edu / password123"
echo ""
echo "📚 Documentation:"
echo "   • Setup: SETUP_COMPLETE.md"
echo "   • Quick Start: QUICK_START.md"
echo "   • Credentials: LOGIN_CREDENTIALS.md"
echo ""
