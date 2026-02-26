# Use an official Python runtime as a parent image
FROM python:3.10-slim-bullseye

# Install system dependencies required for dlib and face-recognition
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable to limit memory usage during dlib compilation
# This prevents the "Out of Memory" error by using only one CPU core for building
ENV DLIB_MAKE_THREADS=1

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install dependencies
# We install cmake first to ensure dlib can find it
RUN pip install --no-cache-dir cmake
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create directory for persistent data if it doesn't exist
RUN mkdir -p /opt/render/project/data

# Command to run the application
# Using shell form to allow environment variable expansion
CMD gunicorn app:app --bind 0.0.0.0:$PORT
