# Use Miniconda - it has pre-built binaries for dlib
FROM continuumio/miniconda3

# Install dlib and face_recognition using Conda (PRE-COMPILED BINARIES)
# This takes seconds and won't crash your memory!
RUN conda install -c conda-forge dlib face_recognition -y

# Set working directory
WORKDIR /app

# Install your other Python requirements
COPY requirements.txt .
# Create necessary folders and set permissions
RUN mkdir -p /app/instance /app/uploads && chmod -R 777 /app/instance /app/uploads
# Filter out dlib and face_recognition from requirements.txt as they are already installed
RUN pip install --no-cache-dir -r requirements.txt

# Copy your code
COPY . .

# Start the app
# (Miniconda uses a slightly different path for gunicorn, usually provided by pip)
RUN pip install gunicorn
CMD gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120
