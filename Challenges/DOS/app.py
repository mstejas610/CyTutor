from flask import Flask
import psutil, time

app = Flask(__name__)

FLAG = "CTF{DoS_me_if_you_can}"
THRESHOLD = 200    # number of concurrent TCP connections that signals attack
DURATION  = 30     # seconds the condition must persist
attack_start = None

@app.route("/")
def index():
    global attack_start
    # Count current TCP connections to this container on port 8080
    conns = [c for c in psutil.net_connections(kind='tcp')
             if c.laddr.port == 8080 and c.status == 'ESTABLISHED']

    if len(conns) > THRESHOLD:
        if attack_start is None:
            attack_start = time.time()
        elif time.time() - attack_start >= DURATION:
            return FLAG
    else:
        attack_start = None

    return "Service OK"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
