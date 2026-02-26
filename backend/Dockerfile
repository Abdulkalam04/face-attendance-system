# Use a modern, pre-built image that HAS face_recognition and dlib already
FROM sterliakov/python-face-recognition:latest

# Set working directory
WORKDIR /app

# The base image already has dlib/face_recognition
# We only install your other requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your code
COPY . .

# Create folders
RUN mkdir -p /app/instance /app/uploads

# Start the app
CMD gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120
