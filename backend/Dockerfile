# syntax=docker/dockerfile:1

############################
# 1) Build stage
############################
FROM maven:3.9.12-eclipse-temurin-25 AS build
WORKDIR /app

# Cache dependencies first
COPY pom.xml .
RUN mvn -q -e -DskipTests dependency:go-offline

# Copy sources and build
COPY src ./src
RUN mvn -q -DskipTests clean package

############################
# 2) Runtime stage
############################
FROM eclipse-temurin:25-jre
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -r -u 10001 appuser

# Copy jar (adjust pattern if you use a custom finalName)
COPY --from=build /app/target/*.jar /app/app.jar

# Default Spring Boot port
EXPOSE 8080

# Optional: set JVM defaults (tweak as needed)
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Dfile.encoding=UTF-8"

USER appuser

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
