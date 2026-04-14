let token = "";
let archivoActual = "";
const nombreArchivo = document.querySelector("#NombreArchivo");
const urlPagina = document.getElementById("pagesLink");
const API = "https://my-github-dashboard.onrender.com";
let elNombre = "";
const html = "https://cdn-icons-png.flaticon.com/128/11806/11806874.png";
const css = "https://cdn-icons-png.flaticon.com/128/11806/11806853.png";
const txt = "https://cdn-icons-png.flaticon.com/128/11806/11806914.png";
const py = "https://cdn-icons-png.flaticon.com/128/9681/9681019.png";
const js = "https://cdn-icons-png.flaticon.com/128/11180/11180507.png";
const img = "https://cdn-icons-png.flaticon.com/512/16861/16861683.png";
const ico = "https://cdn-icons-png.flaticon.com/128/11609/11609634.png";

async function cargarRepos(prefijo = "") {
  // token = document.getElementById("token").value;
  const res = await fetch(`${API}/repos`);

  const repos = await res.json();

  const lista = document.getElementById("repos");
  lista.innerHTML = "";

  repos.forEach((r, index) => {
    const numero = prefijo === "" ? `${index + 1}. ` : "";
    //console.log(numero);
    const divNumero = document.createElement("div");
    const divTexto = document.createElement("div");
    const imgDiv = document.createElement("img");
    divNumero.classList.add("divNumero");
    divTexto.classList.add("divTexto");
    imgDiv.classList.add("imgDiv");
    imgDiv.src = "https://cdn-icons-png.flaticon.com/128/12542/12542638.png";
    const li = document.createElement("li");
    divNumero.textContent = `${numero}`;
    //divTexto.textContent = `🔹 ${r.name} ➡️`;
    divTexto.textContent = `${r.name}`;

    //li.textContent = `${numero}🔹 ${r.name} ➡️`;
    li.title = `Presione para mostrar contenido de:\n"${r.name}"`;
    //li.onclick = () => clonarRepo(r);
    li.onclick = async () => {
      //cargarRepos();
      await clonarRepo(r);
      cargarArbol(r.name);
    };
    li.appendChild(divNumero);
    li.appendChild(divTexto);
    li.appendChild(imgDiv);
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

// async function cargarArbol2(repo) {
//   const res = await fetch(`${API}/tree?repo=${repo}`);
//   const data = await res.json();

//   const tree = document.getElementById("tree");
//   tree.innerHTML = "";

//   renderTree(data, tree);
// }

// async function cargarArbol3(repo) {
//   const tree = document.getElementById("tree");
//   const iframe = document.getElementById("repoPage");

//   tree.innerHTML = "Cargando...";
//   iframe.src = ""; // limpiar

//   try {
//     // 👇 ejecuta ambas cosas al mismo tiempo
//     // const [treeRes, pagesRes] = await Promise.all([
//     //   fetch(`${API}/tree?repo=${repo}`),
//     //   fetch(`${API}/pages?repo=${repo}`),
//     // ]);
//     const treeRes = await fetch(`${API}/tree?repo=${repo}`);

//     const treeData = await treeRes.json();
//     console.log(treeData);
//     const pagesRes = await fetch(`${API}/pages?repo=${repo}`);
//     const pagesData = await pagesRes.json();

//     // 🌳 renderizar archivos
//     tree.innerHTML = "";
//     renderTree(treeData, tree);

//     // 🌐 mostrar github pages
//     // if (pagesData.url) {
//     //   iframe.src = pagesData.url;
//     // } else {
//     //   iframe.src = "";
//     //   iframe.outerHTML = "<p>Este repositorio no tiene GitHub Pages</p>";
//     // }
//     if (pagesData.url) {
//       iframe.src = pagesData.url;
//       document.getElementById("pagesLink").href = pagesData.url;
//     } else {
//       iframe.src = "";
//     }
//   } catch (err) {
//     console.error(err);
//     //tree.innerHTML = "Error cargando repositorio";
//   }
// }

async function cargarArbol(repo) {
  const tree = document.getElementById("tree");

  tree.innerHTML = "Cargando...";
  //iframe.src = "";

  const [treeRes, pagesRes, info] = await Promise.allSettled([
    fetch(`${API}/tree?repo=${repo}`),
    //fetch(`https://api.github.com/repos/TaylorBundy`),
    //fetch(`${API}/pages?repo=${repo}`),
  ]);

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
      const paginaValida = await result.url;
      //console.log(paginaValida);
      if (!paginaValida) {
        detectarGitHubPages("taylorbundy", repo).then((res) => {
          //console.log("Encontrados:", res.url);
          //document.getElementById("pagesLink").href = res.url;
          urlPagina.href = res.url;
          urlPagina.title = `Click para visitar la pagina del repositorio:\n${res.url}`;
          urlPagina.style.display = "block";
        });
      } else {
        urlPagina.href = paginaValida;
        urlPagina.title = `Click para visitar la pagina del repositorio:\n${paginaValida}`;
        urlPagina.style.display = "block";
        //console.log(isValidUrl(enlace)); // true
        //console.log(isValidUrl("invalid-url")); // false
        //console.log(result);

        //if (pagesData.url) {
        // iframe.src = enlace;
        //document.getElementById("pagesLink").href = paginaValida;
      }
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

let contadorGlobal = 1;
let numeroFolder;
let numeroFile;

function renderTree(nodes, container, prefijo = "") {
  //nodes.forEach((node, index) => {
  nodes
    .filter((node) => node.name !== ".git") // 👈 ignorar .git
    .forEach((node, index) => {
      const div = document.createElement("div");
      div.classList.add("tree-item");
      // 👇 Solo numerar en la raíz
      const numero = prefijo === "" ? `${index + 1}. ` : "";
      const divNumero = document.createElement("div");
      const divTexto = document.createElement("div");
      const imgDiv = document.createElement("img");
      divNumero.classList.add("divNumero");
      divTexto.classList.add("divTexto");
      imgDiv.classList.add("imgDiv");
      //imgDiv.src = "https://cdn-icons-png.flaticon.com/128/12542/12542638.png";

      if (node.type === "folder") {
        //console.log(numero);
        //numeroFolder = contadorGlobal++;
        //console.log(numeroFolder);
        //div.textContent = "📁 " + node.name;
        divNumero.textContent = numero;
        //div.textContent = `${numero}📁 ${node.name}`;
        //divTexto.textContent = `📁 ${node.name}`;
        divTexto.textContent = `${node.name}`;
        imgDiv.src =
          "https://cdn-icons-png.flaticon.com/128/12075/12075374.png";
        div.title = `Presione para mostrar el contenido de:\n"${node.name}"`;
        div.classList.add("folder");

        const childrenContainer = document.createElement("div");
        childrenContainer.style.display = "none";
        childrenContainer.style.marginLeft = "15px";

        div.onclick = () => {
          childrenContainer.style.display =
            childrenContainer.style.display === "none" ? "block" : "none";
        };
        div.appendChild(divNumero);
        div.appendChild(imgDiv);
        div.appendChild(divTexto);
        container.appendChild(div);
        container.appendChild(childrenContainer);

        renderTree(node.children, childrenContainer);
      }

      if (node.type === "file") {
        //contadorGlobal = "";
        //console.log(index);
        //div.textContent = "📄 " + node.name;
        //numeroFile = contadorGlobal++;
        //console.log(index);
        //console.log(node);
        const archivo = node.name;
        if (archivo.includes("css")) {
          imgDiv.src = css;
        } else if (archivo.includes("txt")) {
          imgDiv.src = txt;
        } else if (archivo.includes("html")) {
          imgDiv.src = html;
        } else if (archivo.includes("py")) {
          imgDiv.src = py;
        } else if (archivo.includes("js")) {
          imgDiv.src = js;
        } else if (
          archivo.includes("avif") ||
          archivo.includes("png") ||
          archivo.includes("jpg")
        ) {
          imgDiv.src = img;
        } else if (archivo.includes("ico")) {
          imgDiv.src = ico;
        }
        divNumero.textContent = numero;
        //divTexto.textContent = `📄 ${node.name}`;
        divTexto.textContent = `${node.name}`;
        div.title = `Presione para editar el archivo:\n"${node.name}"`;
        div.classList.add("file");

        div.onclick = async () => {
          const res = await fetch(`${API}/file?path=${node.path}`);

          const contenido = await res.text();

          archivoActual = node.path;
          document.getElementById("editor").value = contenido;
          nombreArchivo.textContent = node.name;
        };
        div.appendChild(divNumero);
        div.appendChild(imgDiv);
        div.appendChild(divTexto);
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
  //console.log(cuenta);

  window.location.href = `https://my-github-dashboard.onrender.com/login?cuenta=${cuenta}`;
}

// async function urlExiste2(url) {
//   try {
//     //console.log(url);
//     //const res = await fetch(`${API}/check_url?url=${encodeURIComponent(url)}`);
//     const res = await fetch(`${API}/check_url?url=${url}`);
//     const data = await res.json();
//     return data.ok;
//   } catch {
//     return false;
//   }
// }

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
  //console.log(datos);
  //return await res.json();
  return datos;
}

async function buscarIndex2(owner, repo, path = "") {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents`;

  const res = await fetch(url);
  const data = await res.json();
  //console.log(data);

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
  //const pages = await obtenerPages(owner, repo);
  //if (!pages) return null;

  //const branch = pages.source.branch;
  //const basePath = pages.source.path || "";

  const tree = await obtenerTree(owner, repo);
  //console.log(tree);

  const index = buscarIndex(tree);
  //console.log(index);
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
