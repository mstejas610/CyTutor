from flask import Flask, request, render_template, abort
import os

app = Flask(__name__, template_folder="templates")

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PAGES_DIR = os.path.join(BASE_DIR, "pages")

def safe_join(base, user_path):
    if not user_path:
        return None
    if user_path.startswith("/") or user_path.startswith("\\"):
        return None
    normalized = os.path.normpath(os.path.join(base, user_path))
    if not normalized.startswith(os.path.abspath(base)):
        return None
    return normalized

@app.route("/")
def index():
    # single bookmarklet UX: prompts for filename and navigates to /page
    bookmarklet = ("javascript:(function(){var n=prompt('Page name? e.g. about.txt');"
                   "if(n)location.href='/page?name='+encodeURIComponent(n);})();")
    return render_template("index.html", bookmarklet=bookmarklet)

@app.route("/page")
def page():
    name = request.args.get("name", "about.txt")
    file_path = safe_join(PAGES_DIR, name)
    if not file_path or not os.path.exists(file_path):
        return abort(404)
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    return render_template("page.html", name=name, content=content)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
