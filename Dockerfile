# ==============================================================================
# Multi-Stage Production Dockerfile for Cyber Sentry AI Screening Platform
# ==============================================================================

# Stage 1: Build React Production Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend & Integrated Static Host
FROM python:3.11-slim
WORKDIR /app

# Set system dependencies for OpenCV and image forensics
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy Backend Source Code
COPY backend/ ./backend/

# Copy Built Frontend Distribution
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose Web Port (Defaults to 8000 / $PORT on Cloud)
EXPOSE 8000
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

WORKDIR /app/backend

# Start Production ASGI Server binding dynamically to Render's $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
