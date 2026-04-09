let token = "";
let archivoActual = "";
const nombreArchivo = document.querySelector("#NombreArchivo");
const API = "https://my-github-dashboard.onrender.com"

async function cargarRepos() {
  // token = document.getElementById("token").value;
  const res = await fetch("http://localhost:5000/repos");

  // const res = await fetch("http://localhost:5000/repos", {
  //   headers: {
  //     // Authorization: "token " + token,
  //     Authorization: "Bearer " + token,
  //   },
  // });

  const repos = await res.json();

  const lista = document.getElementById("repos");
  lista.innerHTML = "";

  repos.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r.name;
    //li.onclick = () => clonarRepo(r);
    li.onclick = async () => {
      cargarRepos();
      await clonarRepo(r);
      cargarArbol(r.name);
    };
    lista.appendChild(li);
  });
}

async function clonarRepo(repo) {
  await fetch("http://localhost:5000/clone", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: repo.clone_url,
      name: repo.name,
    }),
  });

  cargarArchivos(repo.name);
}

async function cargarArchivos(repo) {
  const res = await fetch(`http://localhost:5000/files?repo=${repo}`);
  const files = await res.json();

  archivoActual = files[0];
  const elNombre = archivoActual.split("\\")[1];

  const contenido = await fetch(
    `http://localhost:5000/file?path=${archivoActual}`,
  );
  document.getElementById("editor").value = await contenido.text();
  nombreArchivo.textContent = elNombre;
}

async function guardar() {
  const contenido = document.getElementById("editor").value;

  await fetch("http://localhost:5000/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: archivoActual,
      content: contenido,
    }),
  });

  alert("Guardado");
}

async function cargarArbol(repo) {
  const res = await fetch(`http://localhost:5000/tree?repo=${repo}`);
  const data = await res.json();

  const tree = document.getElementById("tree");
  tree.innerHTML = "";

  renderTree(data, tree);
}

function renderTree(nodes, container) {
  nodes.forEach((node) => {
    const div = document.createElement("div");
    div.classList.add("tree-item");
    //console.log(node.name);

    if (node.type === "folder") {
      div.textContent = "📁 " + node.name;
      div.classList.add("folder");

      const childrenContainer = document.createElement("div");
      childrenContainer.style.display = "none";
      childrenContainer.style.marginLeft = "15px";

      div.onclick = () => {
        childrenContainer.style.display =
          childrenContainer.style.display === "none" ? "block" : "none";
      };

      container.appendChild(div);
      container.appendChild(childrenContainer);

      renderTree(node.children, childrenContainer);
    }

    if (node.type === "file") {
      div.textContent = "📄 " + node.name;
      div.classList.add("file");

      div.onclick = async () => {
        const res = await fetch(`http://localhost:5000/file?path=${node.path}`);

        const contenido = await res.text();

        archivoActual = node.path;
        document.getElementById("editor").value = contenido;
        nombreArchivo.textContent = node.name;
      };

      container.appendChild(div);
    }
  });
}
