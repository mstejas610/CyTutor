from flask import Flask, request, jsonify
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
    
    # Check blacklist
    for word in BLACKLIST:
        if word in code.lower():
            return jsonify({'error': f'Forbidden: {word}'})
    
    # Execute code
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
