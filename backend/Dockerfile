# Use a specialized image that comes with dlib and face_recognition pre-installed
# This avoids the slow and memory-intensive compilation process
FROM animenosekai/face_recognition:latest

# Set the working directory
WORKDIR /app

# The base image already has dlib and face_recognition, 
# so we only need to install your other dependencies.
COPY requirements.txt .

# Remove dlib and face-recognition from requirements.txt temporarily to avoid re-installing 
# (though keeping them is usually fine as they'll show as 'already satisfied')
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Ensure the instance and uploads directories exist
RUN mkdir -p /app/instance /app/uploads

# Render uses the $PORT environment variable
CMD gunicorn app:app --bind 0.0.0.0:$PORT
