FROM python:3.9-slim

WORKDIR /app

COPY . .

RUN pip install Flask==2.3.0

RUN useradd -m ctfuser && chown -R ctfuser:ctfuser /app
USER ctfuser

EXPOSE 5000

CMD ["python", "app.py"]
