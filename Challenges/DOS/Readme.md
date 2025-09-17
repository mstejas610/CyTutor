# DoS Challenge

**Difficulty:** Medium  

## Overview
This is a containerized CTF challenge that hosts a vulnerable Flask web service.  
Players must overwhelm the service with many concurrent TCP connections to trigger a denial-of-service (DoS) condition and reveal the hidden flag.

---

### 1️⃣ Start the environment

docker compose up -d


### 2️⃣ Check running services

docker compose ps


You should see a container named victim exposing port 8080.

### 3️⃣ Verify the service

curl http://localhost:8080

Output: Service OK
