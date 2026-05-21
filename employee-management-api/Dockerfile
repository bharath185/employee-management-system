FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN mkdir -p /tmp/uploads/photos /tmp/uploads/documents
COPY --from=build /app/target/employee-management-api-*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
