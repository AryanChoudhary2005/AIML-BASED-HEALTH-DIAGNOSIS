FROM python:3.10-slim

# 1. Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg libsndfile1 && rm -rf /var/lib/apt/lists/*

# 2. Create a non-root user (Hugging Face requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH
WORKDIR $HOME/app

# 3. Copy and install requirements
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the rest of the files
COPY --chown=user . .

# 5. Hugging Face uses port 7860 by default
EXPOSE 7860

# 6. Start the app on port 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]