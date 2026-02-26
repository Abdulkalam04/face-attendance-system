FROM continuumio/miniconda3

# 1. Install face_recognition and dlib via Conda (Fast & Pre-compiled)
RUN conda install -c conda-forge dlib face_recognition -y

# 2. Set working directory
WORKDIR /app

# 3. Create folders and set permissions FIRST
RUN mkdir -p /app/instance /app/uploads && chmod -R 777 /app/instance /app/uploads

# 4. Install other dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy your code
COPY . .

# 6. Ensure the database path environment variable is set for the app
ENV PERSISTENT_DIR=/app/instance
ENV PORT=10000

# 7. Start the app
CMD gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120
