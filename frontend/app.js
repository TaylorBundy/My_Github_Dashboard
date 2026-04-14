let token = "";
let archivoActual = "";
const nombreArchivo = document.querySelector("#NombreArchivo");
//const urlPagina = document.getElementById("pagesLink");
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

async function cargarArbol3(repo) {
  const tree = document.getElementById("tree");
  const iframe = document.getElementById("repoPage");

  tree.innerHTML = "Cargando...";
  iframe.src = ""; // limpiar

  try {
    // 👇 ejecuta ambas cosas al mismo tiempo
    // const [treeRes, pagesRes] = await Promise.all([
    //   fetch(`${API}/tree?repo=${repo}`),
    //   fetch(`${API}/pages?repo=${repo}`),
    // ]);
    const treeRes = await fetch(`${API}/tree?repo=${repo}`);

    const treeData = await treeRes.json();
    console.log(treeData);
    const pagesRes = await fetch(`${API}/pages?repo=${repo}`);
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
    //tree.innerHTML = "Error cargando repositorio";
  }
}

async function cargarArbol(repo) {
  const tree = document.getElementById("tree");
  //const iframe = document.getElementById("repoPage");
  //console.log(repo);

  tree.innerHTML = "Cargando...";
  //iframe.src = "";

  const [treeRes, pagesRes, info] = await Promise.allSettled([
    fetch(`${API}/tree?repo=${repo}`),
    //fetch(`https://api.github.com/repos/TaylorBundy`),
    //fetch(`${API}/pages?repo=${repo}`),
  ]);
  //console.log(pagesRes.status);
  //const infor = await treeRes.value.json();
  //console.log(infor);
  // obtenerRepo("taylorbundy", "My_Github_Dashboard").then((data) =>
  //   console.log(data),
  // );

  // obtenerTodo("taylorbundy", repo).then((data) => {
  //   const contenido = data.contenido;
  //   contenido.forEach((conte) => {
  //     console.log(conte);
  //   });
  //   //console.log(data);
  // });

  // buscarIndexRapido("taylorbundy", repo).then((res) => {
  //   console.log("Encontrados:", res);
  // });

  // detectarGitHubPages("taylorbundy", repo).then((res) => {
  //   console.log("Encontrados:", res);
  // });

  //buscarArchivo("taylorbundy", repo, "index.html").then(console.log);
  // buscarArchivo("taylorbundy", repo, "index.html").then((data) => {
  //   console.log(data);
  // });

  // async function test() {
  //   const resultado = await buscarArchivo("TaylorBundy", repo, "index.html");

  //   console.log(resultado);
  // }

  // test();

  // 🌳 TREE (siempre intentar mostrarlo)
  if (treeRes.status === "fulfilled") {
    try {
      const treeData = await treeRes.value.json();
      tree.innerHTML = "";
      renderTree(treeData, tree);
    } catch (e) {
      tree.innerHTML = "Error procesando archivos";
    }
  } else {
    tree.innerHTML = "Error cargando repositorio";
  }

  // 🌐 PAGES (opcional)
  if (treeRes.status === "fulfilled") {
    try {
      //const pagesData = await pagesRes.value.json();
      const enlace = `https://TaylorBundy.github.io/${repo}`;
      // if (validator.isURL(enlace)) {
      //   console.log("existe");
      // }
      //const existe = await urlExiste(enlace);
      const result = await obtenerPaginaValida(enlace);
      const paginaValida = result.url;
      //console.log(isValidUrl(enlace)); // true
      //console.log(isValidUrl("invalid-url")); // false
      console.log(result.url);

      //if (pagesData.url) {
      // iframe.src = enlace;
      document.getElementById("pagesLink").href = paginaValida;
      //urlPagina.href = paginaValida;
      //urlPagina.title = `Click para visitar la pagina del repositorio:\n${paginaValida}`;
      //}
    } catch (e) {
      console.warn("No se pudo procesar GitHub Pages");
    }
  } else {
    console.warn("No se pudo obtener GitHub Pages");
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

async function urlExiste2(url) {
  try {
    console.log(url);
    //const res = await fetch(`${API}/check_url?url=${encodeURIComponent(url)}`);
    const res = await fetch(`${API}/check_url?url=${url}`);
    const data = await res.json();
    return data.ok;
  } catch {
    return false;
  }
}

async function urlExiste(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
    });

    // En no-cors no podés ver status → asumimos que respondió
    return true;
  } catch (error) {
    return false;
  }
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

async function obtenerPaginaValida(baseUrl) {
  try {
    const res = await fetch(
      `${API}/check_pages?url=${encodeURIComponent(baseUrl)}`,
    );
    const data = await res.json();

    return data;
  } catch {
    return { ok: false };
  }
}

async function obtenerRepo(owner, repo) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  const data = await res.json();
  return data;
}
async function obtenerTodo(owner, repo) {
  const [info, ramas, commits, contenido, paginas] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`).then((r) =>
      r.json(),
    ),
    fetch(`https://api.github.com/repos/${owner}/${repo}/branches`).then((r) =>
      r.json(),
    ),
    fetch(`https://api.github.com/repos/${owner}/${repo}/commits`).then((r) =>
      r.json(),
    ),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contents`).then((r) =>
      r.json(),
    ),
    fetch(`https://api.github.com/repos/${owner}/${repo}/pages`).then((r) =>
      r.json(),
    ),
  ]);

  return { contenido };
}
// Uso
async function buscarPorNombre(owner, repo, archivo) {
  const res = await fetch(
    `https://api.github.com/search/code?q=${archivo}+repo:${owner}/${repo}`,
  );
  const data = await res.json();
  return data.items;
}

async function buscarArchivo(owner, repo, archivo) {
  const res = await fetch(
    `${API}/buscar?owner=${owner}&repo=${repo}&archivo=${archivo}`,
  );
  const datos = await res.json();
  console.log(datos);
  //return await res.json();
  return datos;
}

async function buscarIndex2(owner, repo, path = "") {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents`;

  const res = await fetch(url);
  const data = await res.json();
  console.log(data);

  let resultados = [];

  for (const item of data) {
    // 📄 Si es archivo
    if (item.type === "file" && item.name.toLowerCase() === "index.html") {
      resultados.push({
        path: item.path,
        url: item.html_url,
      });
    }

    // 📁 Si es carpeta → recursion
    if (item.type === "dir") {
      const subResultados = await buscarIndex(owner, repo, item.path);
      resultados = resultados.concat(subResultados);
    }
  }

  return resultados;
}
async function buscarIndexRapido(owner, repo) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
  );

  const data = await res.json();

  return data.tree
    .filter((item) => item.path.toLowerCase().endsWith("index.html"))
    .map((item) => ({
      path: item.path,
      url: `https://github.com/${owner}/${repo}/blob/main/${item.path}`,
    }));
}

async function obtenerPages(owner, repo) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pages`,
  );

  if (!res.ok) return null;

  return await res.json();
}

async function obtenerTree(owner, repo, branch = "main") {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
  );

  return await res.json();
}

function buscarIndex(tree, basePath = "") {
  return tree.tree.find((item) => {
    return (
      item.path.toLowerCase() ===
        `${basePath.replace(/^\//, "")}/index.html`.replace(/^\/+/, "") ||
      item.path.toLowerCase().endsWith("/index.html")
    );
  });
}

function construirURL(owner, repo, path) {
  const base = `https://${owner}.github.io/${repo}`;

  // quitar index.html
  const limpio = path.replace(/index\.html$/i, "");

  return `${base}/${limpio}`;
}

async function validarURL(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function detectarGitHubPages(owner, repo) {
  const pages = await obtenerPages(owner, repo);
  if (!pages) return null;

  const branch = pages.source.branch;
  const basePath = pages.source.path || "";

  const tree = await obtenerTree(owner, repo, branch);

  const index = buscarIndex(tree, basePath);
  if (!index) return null;

  const url = construirURL(owner, repo, index.path);

  const ok = await validarURL(url);

  return {
    configurada: true,
    url,
    funcional: ok,
    path: index.path,
  };
}
