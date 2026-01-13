#!/bin/bash

# Start Java Spring Boot backend in background
echo "Starting Java backend on port 5001..."
cd backend
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=5001" &
JAVA_PID=$!
cd ..

# Wait for Java backend to start
echo "Waiting for Java backend to be ready..."
sleep 30

# Start Node.js frontend proxy
echo "Starting Node.js frontend on port 5000..."
npm run dev
