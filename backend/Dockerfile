# ─── Stage 1: Build ─────────────────────────────────────────────────────────
FROM eclipse-temurin:20-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper & pom first (cache layer)
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw .

RUN chmod +x mvnw

# Download dependencies (cached layer)
RUN ./mvnw dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN ./mvnw package -DskipTests -B

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM eclipse-temurin:20-jre-alpine AS runtime

WORKDIR /app

# Create non-root user for security
RUN addgroup -S lms && adduser -S lms -G lms

# Create upload directory
RUN mkdir -p /app/uploads && chown -R lms:lms /app

USER lms

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=prod", \
  "-jar", "app.jar"]
