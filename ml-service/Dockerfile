# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for OpenCV and YOLO
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies directly to save time
RUN pip install --no-cache-dir fastapi uvicorn ultralytics python-multipart pydantic pillow requests

# Copy the application code
COPY . .

# Pre-download the YOLOv8 model weights
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Expose the port
EXPOSE 8001

# Command to run the service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
