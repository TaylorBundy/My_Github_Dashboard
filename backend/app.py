from flask import Flask, request, jsonify, session, redirect
import requests
import os
from git import Repo
# from flask import Flask, request, jsonify
from flask_cors import CORS  # 👈 IMPORTANTE
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)  # 👈 ESTO SOLUCIONA TODO

# app = Flask(__name__)

GITHUB_API = "https://api.github.com"
#GITHUB_TOKEN = "token"

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")
CLIENT_ID = os.getenv("GITHUB_CLIENT_ID2")
CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET2")

def buscar_index(owner, repo):
    url = f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"
    res = requests.get(url).json()

    for item in res.get("tree", []):
        if item["path"].endswith("index.html"):
            return item["path"]

    return None

@app.route("/login")
def login():
    cuenta = request.args.get("cuenta")
    cuentas = {
        "CLIENT_ID1": {
            "client_id": os.getenv("GITHUB_CLIENT_ID1"),
        },
        "CLIENT_ID2": {
            "client_id": os.getenv("GITHUB_CLIENT_ID2"),
        }
    }
    config = cuentas.get(cuenta)
    client_id = config["client_id"]
    return redirect(
        f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=repo"
    )

@app.route("/callback")
def callback():
    code = request.args.get("code")

    # Intercambiar code por token
    res = requests.post(
        "https://github.com/login/oauth/access_token",
        headers={"Accept": "application/json"},
        data={
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code
        }
    )

    access_token = res.json().get("access_token")

    # Guardar en sesión
    session["token"] = access_token

    return redirect("http://localhost:8000")  # tu frontend

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
    url_auth = url.replace(
        "https://",
        f"https://{GITHUB_TOKEN}@"
    )

    if not os.path.exists(path):
        Repo.clone_from(url_auth, path)
        # Repo.clone_from(url, path)

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

@app.route("/pages")
def get_pages():
    repo = request.args.get("repo")  # ej: "usuario/repo"
    owner, repo_name = repo.split("/")

    # url = f"https://api.github.com/repos/{owner}/{repo_name}/pages"
    url = f"{GITHUB_API}/user/repos/{repo}/pages"

    headers = {}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    # r = requests.get(url, headers=headers)
    r = requests.get(f"{GITHUB_API}/user/repos", headers=headers)

    if r.status_code == 200:
        return {"url": r.json()["html_url"]}
    else:
        return {"url": None}

@app.route("/check_url")
def check_url():
    url = request.args.get("url")

    try:
        r = requests.head(url, allow_redirects=True, timeout=5)
        return {"ok": r.status_code < 400}
    except:
        return {"ok": False}
    
# @app.route("/check_pages")
# def check_pages():
#     url = request.args.get("url")

#     posibles = [
#         url,
#         url + "index.html",
#         url + "frontend/index.html"
#     ]

#     for u in posibles:
#         try:
#             r = requests.get(u, timeout=5)
#             if r.status_code == 200:
#                 return {"ok": True, "url": u}
#         except:
#             continue

#     return {"ok": False, "url": None}

@app.route("/check_pages")
def check_pages():
    base_url = request.args.get("url")

    # 1. probar raíz
    r = requests.get(base_url)
    if r.status_code == 200:
        return {"ok": True, "url": base_url}

    # 2. extraer owner/repo desde la URL
    # ejemplo: https://taylorbundy.github.io/My_Github_Dashboard/
    parts = base_url.replace("https://", "").split("/")
    owner = parts[0].split(".")[0]
    repo = parts[1] if len(parts) > 1 else ""

    # 3. buscar index.html en el repo
    path = buscar_index(owner, repo)

    if path:
        nueva_url = base_url.rstrip("/") + "/" + path
        return {"ok": True, "url": nueva_url}

    return {"ok": False}

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

@app.route("/buscar", methods=["GET"])
def buscar_archivo():
    owner = request.args.get("owner")
    repo = request.args.get("repo")
    archivo = request.args.get("archivo")

    if not owner or not repo or not archivo:
        return jsonify({"error": "Faltan parámetros"}), 400

    url = f"https://api.github.com/search/code?q={archivo}+repo:{owner}/{repo}"

    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json"
    }

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        return jsonify({
            "error": "Error en GitHub API",
            "detalle": response.json()
        }), response.status_code

    data = response.json()

    # devolver solo lo útil
    resultados = [
        {
            "nombre": item["name"],
            "path": item["path"],
            "url": item["html_url"]
        }
        for item in data.get("items", [])
    ]

    return jsonify(resultados)

# @app.route("/save2", methods=["POST"])
# def save_file():
#     data = request.json
#     path = data["path"]
#     content = data["content"]
#     print(content)

#     with open(path, "w", encoding="utf-8") as f:
#         f.write(content)

#     repo = Repo(os.path.dirname(path))
#     repo.git.add(A=True)
#     repo.index.commit("Update desde web")

#     return jsonify({"status": "guardado"})

#ANDA
# @app.route("/save", methods=["POST"])
# def save_file():
#     data = request.json
#     path = data["path"]
#     content = data["content"]

#     with open(path, "w", encoding="utf-8") as f:
#         f.write(content)

#     repo_path = os.path.dirname(path)
#     #repo = Repo(path, search_parent_directories=True)
#     repo = Repo(repo_path)
#     log(f"repo: {repo}")

#     repo.git.add(A=True)
#     repo.index.commit("Update desde web")

#     # 🔥 AGREGAR ESTO:
#     origin = repo.remote(name="origin")
#     origin.push()

#     return jsonify({"status": "guardado y subido"})

# @app.route("/save", methods=["POST"])
# def save_file():
#     logs = []
#     try:
#         data = request.json
#         path = data["path"]
#         #print(path)
#         content = data["content"]
#         log(f"Path recibido: {path}")

#         with open(path, "w", encoding="utf-8") as f:
#             f.write(content)
#         #logs.append("Archivo guardado")
#         #logs.append(GITHUB_USERNAME)

#         #repo = Repo(path, search_parent_directories=True)
#         repo = Repo(os.path.dirname(path))
#         log(f"repos: {repo}")

#         if repo.is_dirty(untracked_files=True):
#             repo.git.add(A=True)
#             repo.index.commit("Update desde web")
#             #logs.append("Commit realizado")

#             #import os
#             token = os.getenv("GITHUB_TOKEN")

#             origin = repo.remote(name="origin")

#             url = origin.url
#             url = url.replace(".git/", ".git")
#             # url_auth = url.replace("https://", f"https://{GITHUB_TOKEN}@")
#             url_auth = url.replace(
#                 "https://",
#                 f"https://{GITHUB_USERNAME}:{GITHUB_TOKEN}@"
#             )

#             origin.set_url(url_auth)
#             log(f"url: {url_auth}")
#             origin.push()
#             #logs.append("Push realizado")

#         return jsonify({"status": "ok",
#                         "logs": log})

#     except Exception as e:
#         print("ERROR SAVE:", e)
#         return jsonify({"error": str(e), "logs": logs}), 500

@app.route("/save", methods=["POST"])
def save_file():
    try:
        #import os
        #from git import Repo

        data = request.json
        path = data["path"]
        content = data["content"]

        # 🔧 Normalizar path (clave para Render/Linux)
        path = os.path.normpath(path).replace("\\", "/")

        log(f"path recibido: {path}")

        # 💾 Guardar archivo
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

        # 🔥 Detectar repo correctamente (raíz o subcarpeta)
        repo = Repo(path, search_parent_directories=True)
        log(f"repo root: {repo.working_tree_dir}")

        # 📌 Agregar SOLO el archivo modificado
        #repo.git.add(path)
        repo.git.add(A=True)

        # 🧠 Evitar commit vacío
        if repo.is_dirty(untracked_files=True):
            repo.index.commit(f"Update {os.path.basename(path)}")
            log("commit realizado")

            # 🔐 Autenticación para push
            token = os.getenv("GITHUB_TOKEN")
            username = os.getenv("GITHUB_USERNAME")

            origin = repo.remote(name="origin")
            url = origin.url

            # limpiar posibles errores de URL
            url = url.replace(".git/", ".git")

            url_auth = url.replace(
                "https://",
                f"https://{username}:{token}@"
            )

            #origin.set_url(url_auth)

            # 🚀 Push
            origin.push()
            log("push realizado")

        else:
            log("no hay cambios para commitear")

        return jsonify({
            "status": "guardado y subido"
        })

    except Exception as e:
        log(f"ERROR: {str(e)}")
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500
    
logs_global = []

def log(msg):
    print(msg)
    logs_global.append(msg)

@app.route("/logs")
def get_logs():
    return jsonify(logs_global)

#app.run(debug=True)

#app.run(host="0.0.0.0", #port=int(os.environ.get("PORT", 5000)))

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=int(os.environ.get("PORT", 5000)))