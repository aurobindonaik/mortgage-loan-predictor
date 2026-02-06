FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . /workspace
RUN mvn clean -q -DskipTests package

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
ENV MODEL_APPROVAL_PATH=/opt/models/mo_approval_model.zip \
    MODEL_BORROW_PATH=/opt/models/mo_borrow_model.zip \
    MODEL_CREDIT_APPROVAL_PATH=/opt/models/credit_approval_model.zip \
    MODEL_CREDIT_BORROW_PATH=/opt/models/credit_borrow_model.zip \
    MODEL_LOAN_APPROVAL_PATH=/opt/models/loan_approval_model.zip \
    MODEL_LOAN_BORROW_PATH=/opt/models/loan_borrow_model.zip \
    MODEL_CURRENT_APPROVAL_PATH=/opt/models/current_approval_model.zip
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
