############################################################
# 1) Build React UI (Vite requires glibc → use Debian)
############################################################
FROM node:20-bullseye AS ui-build

ENV ROLLUP_USE_WASM=true

WORKDIR /app/frontend
COPY frontend/package*.json ./
# ❗ DELETE the lockfile inside container (forces WASM-compatible install)
RUN rm -f package-lock.json

# Install dependencies cleanly (safe for ARM)
RUN npm install --legacy-peer-deps

# Copy project files
COPY frontend/ .

# Build UI with WASM Rollup
RUN npm run build


############################################################
# 2) Build Spring Boot backend (Java 17)
############################################################
FROM maven:3.9.6-eclipse-temurin-17 AS backend-build

WORKDIR /app/backend

COPY backend/pom.xml .
COPY backend/src ./src

RUN mvn -q -e -DskipTests clean package


############################################################
# 3) Final Runtime Container
# Combines: Backend JAR + UI static assets + MOJO models
############################################################
FROM eclipse-temurin:17-jre AS runtime

WORKDIR /app

##############################
# COPY SPRING BOOT JAR
##############################
COPY --from=backend-build /app/backend/target/*.jar app.jar

##############################
# COPY ML MODELS (3 Mojos)
##############################
# Expected filenames:
#  - approval_model.zip
#  - borrow_model.zip
#  - risk_model.zip
COPY models /app/models

##############################
# COPY UI BUILD → STATIC PATH
##############################
# Spring Boot automatically serves:
#  /static/** → http://server/**
#
# So expose the UI here:
COPY --from=ui-build /app/frontend/dist /app/static

##############################
# ENV VARS FOR BACKEND CONFIG
##############################
ENV MODEL_APPROVAL_PATH=/app/models/approval_model.zip \
    MODEL_BORROW_PATH=/app/models/borrow_model.zip \
    MODEL_RISK_PATH=/app/models/risk_model.zip \
    SPRING_WEB_RESOURCES_STATIC_LOCATIONS=file:/app/static/

##############################
# PORT EXPOSURE
##############################
EXPOSE 8080

##############################
# ENTRYPOINT
##############################
ENTRYPOINT ["java", "-jar", "app.jar"]
