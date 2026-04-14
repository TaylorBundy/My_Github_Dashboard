let token = "";
let archivoActual = "";
const nombreArchivo = document.querySelector("#NombreArchivo");
const API = "https://my-github-dashboard.onrender.com";
let elNombre = "";

async function cargarRepos() {
  // token = document.getElementById("token").value;
  const res = await fetch(`${API}/repos`);

  const repos = await res.json();

  const lista = document.getElementById("repos");
  lista.innerHTML = "";

  repos.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r.name + "➡️";
    li.title = `Presione para mostrar contenido de: ${r.name}`;
    //li.onclick = () => clonarRepo(r);
    li.onclick = async () => {
      //cargarRepos();
      await clonarRepo(r);
      cargarArbol(r.name);
    };
    lista.appendChild(li);
  });
}

async function clonarRepo(repo) {
  await fetch(`${API}/clone`, {
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
  const res = await fetch(`${API}/files?repo=${repo}`);
  const files = await res.json();

  archivoActual = files[0];
  //elNombre = archivoActual.split("\\")[1];
  elNombre = archivoActual.split("/")[2];

  const contenido = await fetch(`${API}/file?path=${archivoActual}`);
  document.getElementById("editor").value = await contenido.text();
  nombreArchivo.textContent = elNombre;
}

async function guardar() {
  const contenido = document.getElementById("editor").value;
  const res = await fetch(`${API}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: archivoActual,
      content: contenido,
    }),
  });
  const data = await res.json();

  data.logs.forEach((l) => console.log(l));

  alert("Guardado");
}

async function cargarArbol2(repo) {
  const res = await fetch(`${API}/tree?repo=${repo}`);
  const data = await res.json();

  const tree = document.getElementById("tree");
  tree.innerHTML = "";

  renderTree(data, tree);
}

async function cargarArbol(repo) {
  const tree = document.getElementById("tree");
  const iframe = document.getElementById("repoPage");

  tree.innerHTML = "Cargando...";
  iframe.src = ""; // limpiar

  try {
    // 👇 ejecuta ambas cosas al mismo tiempo
    const [treeRes, pagesRes] = await Promise.all([
      fetch(`${API}/tree?repo=${repo}`),
      fetch(`${API}/pages?repo=${repo}`),
    ]);

    const treeData = await treeRes.json();
    console.log(treeData);
    const pagesData = await pagesRes.json();

    // 🌳 renderizar archivos
    tree.innerHTML = "";
    renderTree(treeData, tree);

    // 🌐 mostrar github pages
    // if (pagesData.url) {
    //   iframe.src = pagesData.url;
    // } else {
    //   iframe.src = "";
    //   iframe.outerHTML = "<p>Este repositorio no tiene GitHub Pages</p>";
    // }
    if (pagesData.url) {
      iframe.src = pagesData.url;
      document.getElementById("pagesLink").href = pagesData.url;
    } else {
      iframe.src = "";
    }
  } catch (err) {
    console.error(err);
    tree.innerHTML = "Error cargando repositorio";
  }
}

function renderTree(nodes, container) {
  nodes.forEach((node) => {
    const div = document.createElement("div");
    div.classList.add("tree-item");

    if (node.type === "folder") {
      div.textContent = "📁 " + node.name;
      div.title = `Presione para mostrar el contenido de: ${node.name}`;
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
      div.title = `Presione para editar el archivo: ${node.name}`;
      div.classList.add("file");

      div.onclick = async () => {
        const res = await fetch(`${API}/file?path=${node.path}`);

        const contenido = await res.text();

        archivoActual = node.path;
        document.getElementById("editor").value = contenido;
        nombreArchivo.textContent = node.name;
      };

      container.appendChild(div);
    }
  });
}

setInterval(async () => {
  const res = await fetch(`${API}/logs`);
  const logs = await res.json();

  //console.clear();
  logs.forEach((l) => console.log(l));
}, 5000);

function login2() {
  window.location.href = "https://my-github-dashboard.onrender.com/login";
}

function login() {
  const cuenta = document.getElementById("cuenta").value;
  console.log(cuenta);

  window.location.href = `https://my-github-dashboard.onrender.com/login?cuenta=${cuenta}`;
}
