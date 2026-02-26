# 1. Use the FULL Python image (this has build tools pre-installed)
FROM python:3.10-bullseye

# 2. Install only the absolutely necessary extra system libraries
RUN apt-get update && apt-get install -y \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Set the single-core build limit (to prevent the 8GB memory crash)
ENV DLIB_MAKE_THREADS=1

# 4. Set working directory
WORKDIR /app

# 5. Install dlib first (it's the hardest part, doing it alone is safer)
# We use --verbose so we can see if it's actually working
RUN pip install --no-cache-dir dlib==19.24.1

# 6. Install the rest of your requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 7. Copy your code
COPY . .

# 8. Create necessary folders
RUN mkdir -p /app/instance /app/uploads

# 9. Start the app
CMD gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120
