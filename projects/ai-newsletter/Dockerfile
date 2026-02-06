# AI Newsletter - Execution Environment
# Lightweight Python container for running execution scripts

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy execution scripts
COPY execution/ ./execution/
COPY workflows/ ./workflows/

# Create output directory for adapted workflows
RUN mkdir -p workflows/adapted

# Set Python path
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Default command: run health check
CMD ["python", "execution/verify_all.py", "--verbose"]

# Example usage:
#   Build:  docker build -t ai-newsletter .
#   Health: docker run --env-file .env ai-newsletter
#   Adapt:  docker run --env-file .env ai-newsletter python execution/workflow_adapter.py
#   Import: docker run --env-file .env ai-newsletter python execution/import_workflows.py
