#!/bin/bash

# Start Java Spring Boot backend in background
echo "Starting Java backend on port 8080..."
cd backend
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=8080" &
JAVA_PID=$!
cd ..

# Wait for Java backend to start
echo "Waiting for Java backend to be ready..."
sleep 30

# Start Node.js frontend proxy
echo "Starting Node.js frontend on port 8081..."
npm run dev
