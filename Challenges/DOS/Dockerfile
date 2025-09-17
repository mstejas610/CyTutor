FROM python:3.11-slim
RUN pip install flask
RUN useradd -m ctfplayer          # create a normal user
WORKDIR /home/ctfplayer
USER ctfplayer
COPY app.py /app/app.py           # keep the vulnerable app
CMD ["python", "/app/app.py"]
