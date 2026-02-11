#!/bin/bash

# Start Java Spring Boot backend
cd backend
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=8080"
