const API_BASE_URL = "http://localhost:8080";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  return respostaDaApi(response);
}

function normalizarEmpresa(empresa) {
  const id = empresa.id ?? empresa.empresaId ?? empresa.slug ?? empresa.nome;
  const contato = empresa.contato || {};
  const servicos = empresa.servicos || empresa.servicosOferecidos ||
    (Array.isArray(empresa.diretorias) ? empresa.diretorias.map(diretoria => `Diretoria ${diretoria.id}`) : []);
  const colaboradores = Array.isArray(empresa.colaboradores) ? empresa.colaboradores : [];

  return {
    ...empresa,
    id: String(id),
    nome: empresa.nome || "Empresa sem nome",
    ano: empresa.ano || empresa.anoFundacao || "",
    logo: empresa.logo || "../static/Union.svg",
    capa: empresa.capa || empresa.logo || "../static/Union.svg",
    descricao: empresa.descricao || "Empresa júnior cadastrada na federação.",
    sobre: empresa.sobre || empresa.descricao || "",
    responsavel: empresa.responsavel || empresa.responsavelNome || "Não informado",
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

async function respostaDaApi(response) {
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detalhes = data?.errors?.map(erro => `${erro.field}: ${erro.message}`).join("; ");
    throw new Error(detalhes || data?.message || `Erro HTTP ${response.status}`);
  }
  return data;
}