(function (global) {
  const API_BASE_URL = "http://localhost:8080";

  const routes = {
    usuarios: {
      base: "/usuarios",
      login: "/usuarios/login",
      listar: "/usuarios",
      buscarPorId: (id) => `/usuarios/${encodeURIComponent(id)}`,
      criar: "/usuarios",
      atualizar: (id) => `/usuarios/${encodeURIComponent(id)}`,
      remover: (id) => `/usuarios/${encodeURIComponent(id)}`,
    },
    colaboradores: {
      base: "/colaboradores",
      listar: "/colaboradores",
      buscarPorId: (id) => `/colaboradores/${encodeURIComponent(id)}`,
      criar: "/colaboradores",
      atualizar: (id) => `/colaboradores/${encodeURIComponent(id)}`,
      remover: (id) => `/colaboradores/${encodeURIComponent(id)}`,
    },
    gestores: {
      base: "/gestores",
      listar: "/gestores",
      buscarPorId: (id) => `/gestores/${encodeURIComponent(id)}`,
      criar: "/gestores",
      atualizar: (id) => `/gestores/${encodeURIComponent(id)}`,
      remover: (id) => `/gestores/${encodeURIComponent(id)}`,
      deduplicarUsuarios: "/gestores/deduplicar-usuarios",
    },
    responsaveis: {
      base: "/responsaveis",
      listar: "/responsaveis",
      buscarPorId: (id) => `/responsaveis/${encodeURIComponent(id)}`,
      criar: "/responsaveis",
      atualizar: (id) => `/responsaveis/${encodeURIComponent(id)}`,
      remover: (id) => `/responsaveis/${encodeURIComponent(id)}`,
    },
    empresas: {
      base: "/empresas",
      listar: "/empresas",
      buscarPorId: (id) => `/empresas/${encodeURIComponent(id)}`,
      criar: "/empresas",
      atualizar: (id) => `/empresas/${encodeURIComponent(id)}`,
      remover: (id) => `/empresas/${encodeURIComponent(id)}`,
      uploadLogo: (id) => `/empresas/${encodeURIComponent(id)}/logo`,
      adicionarMembro: (idMembro, idEmpresa) => `/empresas/adicionar-membro/${encodeURIComponent(idMembro)}/${encodeURIComponent(idEmpresa)}`,
    },
    diretorias: {
      base: "/diretorias",
      listar: "/diretorias",
      buscarPorId: (id) => `/diretorias/${encodeURIComponent(id)}`,
      criar: "/diretorias",
      atualizar: (id) => `/diretorias/${encodeURIComponent(id)}`,
      remover: (id) => `/diretorias/${encodeURIComponent(id)}`,
    },
    diretores: {
      base: "/diretores",
      listar: "/diretores",
      buscarPorId: (id) => `/diretores/${encodeURIComponent(id)}`,
      criar: "/diretores",
      atualizar: (id) => `/diretores/${encodeURIComponent(id)}`,
      remover: (id) => `/diretores/${encodeURIComponent(id)}`,
    },
    funcoes: {
      base: "/funcoes",
      listar: "/funcoes",
      buscarPorId: (id) => `/funcoes/${encodeURIComponent(id)}`,
      criar: "/funcoes",
      atualizar: (id) => `/funcoes/${encodeURIComponent(id)}`,
      remover: (id) => `/funcoes/${encodeURIComponent(id)}`,
    },
    noticias: {
      base: "/noticias",
      listar: "/noticias",
      buscarPorId: (id) => `/noticias/${encodeURIComponent(id)}`,
      criar: "/noticias",
      atualizar: (id) => `/noticias/${encodeURIComponent(id)}`,
      remover: (id) => `/noticias/${encodeURIComponent(id)}`,
      uploadImagem: (id) => `/noticias/${encodeURIComponent(id)}/imagem`,
    },
    solicitacoes: {
      base: "/solicitacoes",
      listar: "/solicitacoes",
      buscarPorId: (id) => `/solicitacoes/${encodeURIComponent(id)}`,
      porResponsavel: (id) => `/solicitacoes/responsavel/${encodeURIComponent(id)}`,
      porGestor: (id) => `/solicitacoes/gestor/${encodeURIComponent(id)}`,
      pendentesPorGestor: (id) => `/solicitacoes/gestor/${encodeURIComponent(id)}/pendentes`,
      criar: "/solicitacoes",
      aceitar: (id) => `/solicitacoes/${encodeURIComponent(id)}/aceitar`,
      recusar: (id) => `/solicitacoes/${encodeURIComponent(id)}/recusar`,
      cancelar: (id) => `/solicitacoes/${encodeURIComponent(id)}/cancelar`,
    },
    comentarios: {
      base: "/comentarios",
      listar: "/comentarios",
      buscarPorId: (id) => `/comentarios/${encodeURIComponent(id)}`,
      porNoticia: (idNoticia) => `/comentarios/noticia/${encodeURIComponent(idNoticia)}`,
      criar: "/comentarios",
      atualizar: (id) => `/comentarios/${encodeURIComponent(id)}`,
      remover: (id) => `/comentarios/${encodeURIComponent(id)}`,
    },
  };

  function request(path, options = {}) {
    const finalUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
    const headers = {
      Accept: "application/json",
      ...(options.headers || {}),
    };

    if (!(options.body instanceof FormData) && options.body !== undefined && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(finalUrl, {
      ...options,
      headers,
    }).then(handleResponse);
  }

  function handleResponse(response) {
    if (response.status === 204) {
      return null;
    }

    return response.text().then((text) => {
      const data = text ? JSON.parse(text) : null;

      if (!response.ok) {
        const details = Array.isArray(data?.errors)
          ? data.errors.map((erro) => `${erro.field || "campo"}: ${erro.message || "inválido"}`).join("; ")
          : "";

        const error = new Error(details || data?.message || `Erro HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return data;
    });
  }

  function normalizarEmpresa(empresa = {}) {
    const id = empresa.id ?? empresa.empresaId ?? empresa.slug ?? empresa.nome;
    const contato = empresa.contato || {};
    const colaboradores = Array.isArray(empresa.colaboradores) ? empresa.colaboradores : [];
    const imagemLogo = empresa.logoUrl || empresa.logo;
    const logo = typeof imagemLogo === "string" && imagemLogo.startsWith("/")
      ? `${API_BASE_URL}${imagemLogo}`
      : imagemLogo || "../static/Union.svg";
    const servicos = empresa.servicos || empresa.servicosOferecidos ||
      (Array.isArray(empresa.diretorias)
        ? empresa.diretorias.map((diretoria) => `Diretoria ${diretoria.id}`)
        : []);

    return {
      ...empresa,
      id: String(id),
      nome: empresa.nome || "Empresa sem nome",
      ano: empresa.ano || empresa.anoFundacao || "",
      logo,
      logoUrl: empresa.logoUrl || "",
      capa: empresa.capa || logo,
      descricao: empresa.descricao || "Empresa júnior cadastrada na federação.",
      sobre: empresa.sobre || empresa.descricao || "",
      responsavel: empresa.responsavel || empresa.responsavelNome || "Não informado",
      integrantes: empresa.integrantes ?? empresa.membros ?? colaboradores.length,
      colaboradores,
      servicos: Array.isArray(servicos) ? servicos : [servicos].filter(Boolean),
      contato,
    };
  }

  function normalizarNoticia(noticia = {}) {
    const titulo = noticia.titulo || noticia.title || "Sem título";
    const conteudo = noticia.conteudo || noticia.descricao || noticia.content || noticia.description || "";
    const categoria = noticia.categoria || noticia.tipo || noticia.category || "Notícia";
    const publicadaEm = noticia.publicadaEm || noticia.publicadoEm || noticia.dataPublicacao ||
      noticia.data || noticia.createdAt || noticia.created_at || "";
    const dataPublicacao = publicadaEm ? new Date(publicadaEm) : null;
    const imagemUrl = [noticia.imagemUrl, noticia.imagem, noticia.imageUrl, noticia.image]
      .find((valor) => typeof valor === "string" && valor.trim()) || "";
    const empresa = noticia.empresa && typeof noticia.empresa === "object" ? noticia.empresa : {};
    const autor = noticia.autor && typeof noticia.autor === "object" ? noticia.autor.nome : noticia.autor;

    return {
      ...noticia,
      id: noticia.id ?? noticia.noticiaId,
      titulo,
      conteudo: typeof conteudo === "string" ? conteudo : "",
      descricao: typeof conteudo === "string" ? conteudo : "",
      categoria,
      tipo: categoria,
      data: dataPublicacao && !Number.isNaN(dataPublicacao.getTime())
        ? dataPublicacao.toLocaleDateString("pt-BR")
        : "",
      publicadaEm,
      imagemUrl,
      img: imagemUrl.startsWith("/") ? `${API_BASE_URL}${imagemUrl}` : imagemUrl || "../static/Union.svg",
      empresaId: noticia.empresaId ?? empresa.id ?? empresa.empresaId,
      empresaNome: noticia.empresaNome || empresa.nome || empresa.name || "",
      autor: typeof autor === "string" ? autor : noticia.autorNome || "",
      tempo: "",
    };
  }

  function normalizarComentario(comentario = {}) {
    return {
      id: comentario.id,
      conteudo: comentario.conteudo || "",
      publicadoEm: comentario.publicadoEm || comentario.publicadaEm,
      noticiaId: comentario.noticiaId,
      comentarioPaiId: comentario.comentarioPaiId ?? null,
      respostas: Array.isArray(comentario.respostas) ? comentario.respostas.map(normalizarComentario) : [],
    };
  }

  function normalizarUsuario(usuario = {}) {
    const contato = usuario.contato || {};

    return {
      id: usuario.id,
      nome: usuario.nome || "",
      tipo: usuario.tipo || "USUARIO",
      email: contato.email || usuario.email || "",
      telefone: contato.telefone || usuario.telefone || "",
      atividade: usuario.atividade ?? false,
      empresaId: usuario.empresaId || null,
      permissoes: Array.isArray(usuario.permissoes) ? usuario.permissoes : [],
      matricula: usuario.matricula || "",
      contato,
    };
  }

  function normalizarDiretoria(diretoria = {}) {
    return {
      id: diretoria.id,
      criadaEm: diretoria.criadaEm,
      empresaId: diretoria.empresaId,
      empresaNome: diretoria.empresaNome || "",
      diretores: Array.isArray(diretoria.diretores) ? diretoria.diretores : [],
    };
  }

  function normalizarDiretor(diretor = {}) {
    return {
      id: diretor.id,
      colaboradorId: diretor.colaboradorId,
      colaboradorNome: diretor.colaboradorNome || "",
      funcao: diretor.funcao || null,
      diretoria: diretoria.diretoria || null,
      permissoes: Array.isArray(diretor.permissoes) ? diretor.permissoes : [],
    };
  }

  function normalizarFuncao(funcao = {}) {
    return {
      id: funcao.id,
      nome: funcao.nome || "",
      descricao: funcao.descricao || "",
    };
  }

  const api = {
    baseUrl: API_BASE_URL,
    routes,
    request,
    normalizarEmpresa,
    normalizarNoticia,
    normalizarComentario,
    normalizarUsuario,
    normalizarDiretoria,
    normalizarDiretor,
    normalizarFuncao,

    usuarios: {
      login: (payload) => request(routes.usuarios.login, { method: "POST", body: JSON.stringify(payload) }),
      listar: () => request(routes.usuarios.listar),
      buscarPorId: (id) => request(routes.usuarios.buscarPorId(id)),
      criar: (payload) => request(routes.usuarios.criar, { method: "POST", body: JSON.stringify(payload) }),
      atualizar: (id, payload) => request(routes.usuarios.atualizar(id), { method: "PUT", body: JSON.stringify(payload) }),
      remover: (id) => request(routes.usuarios.remover(id), { method: "DELETE" }),
    },

    colaboradores: {
      listar: () => request(routes.colaboradores.listar),
      buscarPorId: (id) => request(routes.colaboradores.buscarPorId(id)),
      criar: (payload) => request(routes.colaboradores.criar, { method: "POST", body: JSON.stringify(payload) }),
      atualizar: (id, payload) => request(routes.colaboradores.atualizar(id), { method: "PUT", body: JSON.stringify(payload) }),
      remover: (id) => request(routes.colaboradores.remover(id), { method: "DELETE" }),
    },

    gestores: {
      listar: () => request(routes.gestores.listar),
      buscarPorId: (id) => request(routes.gestores.buscarPorId(id)),
      criar: (payload) => request(routes.gestores.criar, { method: "POST", body: JSON.stringify(payload) }),
      atualizar: (id, payload) => request(routes.gestores.atualizar(id), { method: "PUT", body: JSON.stringify(payload) }),
      remover: (id) => request(routes.gestores.remover(id), { method: "DELETE" }),
      deduplicarUsuarios: () => request(routes.gestores.deduplicarUsuarios, { method: "DELETE" }),
    },

    responsaveis: {
      listar: () => request(routes.responsaveis.listar),
      buscarPorId: (id) => request(routes.responsaveis.buscarPorId(id)),
      criar: (payload) => request(routes.responsaveis.criar, { method: "POST", body: JSON.stringify(payload) }),
      atualizar: (id, payload) => request(routes.responsaveis.atualizar(id), { method: "PUT", body: JSON.stringify(payload) }),
      remover: (id) => request(routes.responsaveis.remover(id), { method: "DELETE" }),
    },

    empresas: {
      listar: () => request(routes.empresas.listar),
      buscarPorId: (id) => request(routes.empresas.buscarPorId(id)),
      criar: (payload) => request(routes.empresas.criar, { method: "POST", body: JSON.stringify(payload) }),
      atualizar: (id, payload) => request(routes.empresas.atualizar(id), { method: "PUT", body: JSON.stringify(payload) }),
      remover: (id) => request(routes.empresas.remover(id), { method: "DELETE" }),
      uploadLogo: (id, arquivo) => {
        const formData = new FormData();
        formData.append("arquivo", arquivo);
        return request(routes.empresas.uploadLogo(id), { method: "PATCH", body: formData });
      },
      adicionarMembro: (idMembro, idEmpresa) => request(routes.empresas.adicionarMembro(idMembro, idEmpresa), { method: "PATCH" }),
    },

    diretorias: {
      listar: () => request(routes.diretorias.listar),
      buscarPorId: (id) => request(routes.diretorias.buscarPorId(id)),
      criar: (payload) => request(routes.diretorias.criar, { method: "POST", body: JSON.stringify(payload) }),
      atualizar: (id, payload) => request(routes.diretorias.atualizar(id), { method: "PUT", body: JSON.stringify(payload) }),
      remover: (id) => request(routes.diretorias.remover(id), { method: "DELETE" }),
    },

    diretores: {
      listar: () => request(routes.diretores.listar),
      buscarPorId: (id) => request(routes.diretores.buscarPorId(id)),
      criar: (payload) => request(routes.diretores.criar, { method: "POST", body: JSON.stringify(payload) }),
      atualizar: (id, payload) => request(routes.diretores.atualizar(id), { method: "PUT", body: JSON.stringify(payload) }),
      remover: (id) => request(routes.diretores.remover(id), { method: "DELETE" }),
    },

    funcoes: {
      listar: () => request(routes.funcoes.listar),
      buscarPorId: (id) => request(routes.funcoes.buscarPorId(id)),
      criar: (payload) => request(routes.funcoes.criar, { method: "POST", body: JSON.stringify(payload) }),
      atualizar: (id, payload) => request(routes.funcoes.atualizar(id), { method: "PUT", body: JSON.stringify(payload) }),
      remover: (id) => request(routes.funcoes.remover(id), { method: "DELETE" }),
    },

    noticias: {
      listar: () => request(routes.noticias.listar),
      buscarPorId: (id) => request(routes.noticias.buscarPorId(id)),
      criar: (payload) => request(routes.noticias.criar, { method: "POST", body: JSON.stringify(payload) }),
      atualizar: (id, payload) => request(routes.noticias.atualizar(id), { method: "PUT", body: JSON.stringify(payload) }),
      remover: (id) => request(routes.noticias.remover(id), { method: "DELETE" }),
      uploadImagem: (id, arquivo) => {
        const formData = new FormData();
        formData.append("arquivo", arquivo);
        return request(routes.noticias.uploadImagem(id), { method: "PATCH", body: formData });
      },
    },

    solicitacoes: {
      listar: () => request(routes.solicitacoes.listar),
      buscarPorId: (id) => request(routes.solicitacoes.buscarPorId(id)),
      porResponsavel: (id) => request(routes.solicitacoes.porResponsavel(id)),
      porGestor: (id) => request(routes.solicitacoes.porGestor(id)),
      pendentesPorGestor: (id) => request(routes.solicitacoes.pendentesPorGestor(id)),
      criar: (payload) => request(routes.solicitacoes.criar, { method: "POST", body: JSON.stringify(payload) }),
      aceitar: (id) => request(routes.solicitacoes.aceitar(id), { method: "PATCH" }),
      recusar: (id, motivoRecusa) => request(routes.solicitacoes.recusar(id), {
        method: "PATCH",
        ...(motivoRecusa ? { body: JSON.stringify({ motivoRecusa }) } : {}),
      }),
      cancelar: (id) => request(routes.solicitacoes.cancelar(id), { method: "PATCH" }),
    },

    comentarios: {
      listar: () => request(routes.comentarios.listar),
      buscarPorId: (id) => request(routes.comentarios.buscarPorId(id)),
      porNoticia: (idNoticia) => request(routes.comentarios.porNoticia(idNoticia)),
      criar: (payload) => request(routes.comentarios.criar, { method: "POST", body: JSON.stringify(payload) }),
      atualizar: (id, payload) => request(routes.comentarios.atualizar(id), { method: "PUT", body: JSON.stringify(payload) }),
      remover: (id) => request(routes.comentarios.remover(id), { method: "DELETE" }),
    },
  };

  const compat = {
    apiRequest: request,
    respostaDaApi: handleResponse,
    buscarEmpresas: async function () {
      const data = await api.empresas.listar();
      const lista = Array.isArray(data) ? data : data?.empresas || data?.content || [];

      if (!Array.isArray(lista)) {
        throw new Error("A API retornou um formato de empresas inválido");
      }

      return lista.map(normalizarEmpresa);
    },
    normalizarEmpresa,
    normalizarNoticia,
    normalizarComentario,
    normalizarUsuario,
    normalizarDiretoria,
    normalizarDiretor,
    normalizarFuncao,
  };

  Object.assign(api, compat);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof global !== "undefined") {
    global.NewslyAPI = api;
    global.api = api;
    global.apiRequest = request;
    global.respostaDaApi = handleResponse;
    global.buscarEmpresas = compat.buscarEmpresas;
    global.normalizarEmpresa = normalizarEmpresa;
    global.normalizarNoticiaApi = normalizarNoticia;
    global.normalizarComentario = normalizarComentario;
  }
})(typeof window !== "undefined" ? window : globalThis);
