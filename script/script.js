// const API_BASE_URL = "https://backend-newsly.onrender.com";
const API_BASE_URL = "http://localhost:8080";
window.NEWSLY_API_BASE_URL = API_BASE_URL;

const AUTH_SESSION_KEY = "newsly.auth";

async function apiRequest(path, options = {}) {
  const url = new URL(path, `${API_BASE_URL}/`);
  const isLoginRequest = url.pathname === "/usuarios/login";
  const headers = new Headers(options.headers || {});

  if (options.body !== undefined && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (url.origin === new URL(API_BASE_URL).origin && !isLoginRequest) {
    const sessao = obterSessaoAuth();
    if (sessao) {
      headers.set("Authorization", `${sessao.tokenType} ${sessao.accessToken}`);
    }
  }

  const response = await fetch(url.href, {
    ...options,
    headers
  });

  return respostaDaApi(response, { limparSessaoEm401: !isLoginRequest });
}

function iniciarSessaoAuth({ accessToken, tokenType, expiresIn }) {
  const duracao = Number(expiresIn);
  if (
    typeof accessToken !== "string" ||
    !accessToken.trim() ||
    typeof tokenType !== "string" ||
    tokenType.toLowerCase() !== "bearer" ||
    !Number.isFinite(duracao) ||
    duracao <= 0
  ) {
    throw new Error("A API retornou dados de autenticação inválidos.");
  }

  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
    accessToken,
    tokenType: "Bearer",
    expiresAt: Date.now() + duracao * 1000
  }));
}

function limparSessaoAuth() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem("user");
}

function obterSessaoAuth() {
  const valor = sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!valor) return null;

  let sessao;
  try {
    sessao = JSON.parse(valor);
  } catch {
    limparSessaoAuth();
    throw new Error("A sessão armazenada é inválida. Entre novamente.");
  }

  if (
    typeof sessao?.accessToken !== "string" ||
    !sessao.accessToken ||
    sessao.tokenType !== "Bearer" ||
    !Number.isFinite(sessao.expiresAt)
  ) {
    limparSessaoAuth();
    throw new Error("A sessão armazenada é inválida. Entre novamente.");
  }

  if (Date.now() >= sessao.expiresAt) {
    limparSessaoAuth();
    return null;
  }

  return sessao;
}

function normalizarEmpresa(empresa) {
  const id = empresa.id ?? empresa.empresaId ?? empresa.slug ?? empresa.nome;
  const contato = empresa.contato || {};
  const servicos = empresa.servicos || empresa.servicosOferecidos ||
    (Array.isArray(empresa.diretorias) ? empresa.diretorias.map(diretoria => `Diretoria ${diretoria.id}`) : []);
  const colaboradores = Array.isArray(empresa.colaboradores) ? empresa.colaboradores : [];
  const logoUrl = empresa.logoUrl || empresa.logo || "";
  const logo = logoUrl.startsWith("/") ? `${API_BASE_URL}${logoUrl}` : logoUrl || "../static/Union.svg";

  return {
    ...empresa,
    id: String(id),
    nome: empresa.nome || "Empresa sem nome",
    ano: empresa.ano || empresa.anoFundacao || "",
    logo,
    logoUrl,
    capa: empresa.capa || logo,
    descricao: empresa.descricao || "Empresa júnior cadastrada na federação.",
    sobre: empresa.sobre || empresa.descricao || "",
    responsavel: empresa.responsavel?.nome || empresa.responsavelNome || "Não informado",
    integrantes: empresa.integrantes ?? empresa.membros ?? colaboradores.length,
    colaboradores,
    servicos: Array.isArray(servicos) ? servicos : [servicos].filter(Boolean),
    contato,
  };
}

async function buscarEmpresas() {
  const data = await apiRequest("/empresas");
  const lista = Array.isArray(data) ? data : data.empresas || data.content;
  if (!Array.isArray(lista)) {
    throw new Error("A API retornou um formato de empresas inválido");
  }

  return lista.map(normalizarEmpresa);
}

async function respostaDaApi(response, { limparSessaoEm401 = false } = {}) {
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detalhes = data?.errors?.map(erro => `${erro.field}: ${erro.message}`).join("; ");
    const erro = new Error(detalhes || data?.message || `Erro HTTP ${response.status}`);
    erro.status = response.status;

    if (response.status === 401 && limparSessaoEm401) {
      limparSessaoAuth();
      redirecionarParaLogin();
    }

    throw erro;
  }
  return data;
}

function redirecionarParaLogin() {
  if (/\/Newsly\/login\.html$/i.test(window.location.pathname.replace(/\\/g, "/"))) return;
  window.location.assign(urlLogin());
}

function encerrarSessao() {
  limparSessaoAuth();
  window.location.assign(urlLogin());
}

function urlLogin() {
  const pathname = window.location.pathname.replace(/\\/g, "/");
  return /\/Newsly\//i.test(pathname)
    ? "login.html"
    : /\/(Empresa|Gestor)\//i.test(pathname)
      ? "../Newsly/login.html"
      : "Newsly/login.html";
}