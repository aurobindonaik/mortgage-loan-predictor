FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . /workspace
RUN mvn clean -q -DskipTests package

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
ENV MODEL_APPROVAL_PATH=/opt/models/approval_model.zip MODEL_BORROW_PATH=/opt/models/borrow_model.zip MODEL_RISK_PATH=/opt/models/risk_model.zip
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
