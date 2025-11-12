# PYTHON COMPILER
**Difficulty:** MEDIUM

**Description:**

Can you bypass the Python sandbox to read the flag?

The system blocks dangerous functions like `open`, `import`, `eval`, and `exec`. Find a way to read `flag.txt` without using these forbidden keywords!

## Docker commands

**build**
```bash
docker build -t python-ctf .
```

**run**
```bash
docker run -p 5000:5000 python-ctf
```

**stop**
```bash
docker stop python-ctf && docker rm python-ctf
```

## Access

Open http://localhost:5000 in your browser

## Flag Format

`Cytutor{...}`
