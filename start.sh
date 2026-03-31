#!/bin/bash

# Quick Start Script for Student Team Management System
# This script starts both backend and frontend servers

echo "🚀 Starting Student Team Management System..."
echo ""

# Check if database is running
echo "📊 Checking database connection..."
if ! mysql -u root -p"Abhin@24" -e "USE student_project_tracker;" 2>/dev/null; then
    echo "❌ Database connection failed. Please start MySQL and try again."
    exit 1
fi
echo "✅ Database connected"
echo ""

# Start backend in background
echo "🔧 Starting backend server..."
cd "$(dirname "$0")"
npm start > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"
echo ""

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3

# Check if backend is running
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "❌ Backend failed to start. Check logs/backend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
echo "✅ Backend is ready"
echo ""

# Start frontend in background
echo "🎨 Starting frontend server..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
sleep 5
echo ""

echo "✅ All servers are running!"
echo ""
echo "📍 Access your application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   Health:   http://localhost:3000/health"
echo ""
echo "📝 Process IDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "🛑 To stop servers:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📋 Logs are available in:"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "🎉 Happy coding!"
