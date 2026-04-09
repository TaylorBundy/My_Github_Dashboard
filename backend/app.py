from flask import Flask, request, jsonify
import requests
import os
from git import Repo
# from flask import Flask, request, jsonify
from flask_cors import CORS  # 👈 IMPORTANTE

app = Flask(__name__)
CORS(app)  # 👈 ESTO SOLUCIONA TODO

# app = Flask(__name__)

GITHUB_API = "https://api.github.com"
GITHUB_TOKEN = "token"

@app.route("/repos")
def get_repos():
    token = request.headers.get("Authorization")
    
    #headers = {
        #"Authorization": token
    #}
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}"
    }

    r = requests.get(f"{GITHUB_API}/user/repos", headers=headers)
    # print("STATUS:", r.status_code)
    # print("RESPONSE:", r.text)
    return jsonify(r.json())


@app.route("/clone", methods=["POST"])
def clone_repo():
    data = request.json
    url = data["url"]
    name = data["name"]

    path = f"repos/{name}"

    if not os.path.exists(path):
        Repo.clone_from(url, path)

    return jsonify({"status": "clonado"})

def construir_arbol(directorio):
    arbol = []

    for item in os.listdir(directorio):
        ruta = os.path.join(directorio, item)

        if os.path.isdir(ruta):
            arbol.append({
                "name": item,
                "type": "folder",
                "children": construir_arbol(ruta)
            })
        else:
            arbol.append({
                "name": item,
                "type": "file",
                "path": ruta.replace("\\", "/")
            })

    return arbol


@app.route("/tree")
def get_tree():
    repo = request.args.get("repo")
    path = f"repos/{repo}"

    arbol = construir_arbol(path)
    return jsonify(arbol)


@app.route("/files")
def list_files():
    repo = request.args.get("repo")
    path = f"repos/{repo}"

    files = []
    for root, dirs, filenames in os.walk(path):
        for f in filenames:
            files.append(os.path.join(root, f))

    return jsonify(files)


@app.route("/file")
def read_file():
    path = request.args.get("path")

    with open(path, "r", encoding="utf-8") as f:
        return f.read()


@app.route("/save", methods=["POST"])
def save_file():
    data = request.json
    path = data["path"]
    content = data["content"]

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    repo = Repo(os.path.dirname(path))
    repo.git.add(A=True)
    repo.index.commit("Update desde web")

    return jsonify({"status": "guardado"})


#app.run(debug=True)

app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))