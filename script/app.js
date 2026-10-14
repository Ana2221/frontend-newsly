function dashboard() {
    return {
        stats: [],
        noticias: [],
        membrosRecentes: [],
        diretorias: [],
        getInitials(nome) {
            if (!nome) return "";
            return nome
                .split(" ")
                .map(n => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
        }
    };
}

function membrosPage() {
    return {
        search: '',
        cargoFiltro: '',
        membros: [],
        membrosFiltrados() {
            return this.membros.filter(membro => {
                const pesquisa = (membro?.nome || '').toLowerCase().includes(this.search.toLowerCase());
                const cargo = this.cargoFiltro === '' || membro?.cargo === this.cargoFiltro;
                return pesquisa && cargo;
            });
        },
        getInitials(nome) {
            if (!nome) return '';
            return nome
                .split(' ')
                .map(parte => parte[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
        }
    };
}

function diretoriasPage() {
    return {
        diretorias: []
    };
}

function historicoPage() {
    return {
        eventos: []
    };
}

function noticiasPage() {
    return {
        search: '',
        categoria: '',
        modal: false,
        noticiaAtual: {},
        noticias: [],
        noticiasFiltradas() {
            return this.noticias.filter(noticia => {
                const pesquisa = (noticia?.titulo || '').toLowerCase().includes(this.search.toLowerCase());
                const categoriaValida = this.categoria === '' || noticia?.categoria === this.categoria;
                return pesquisa && categoriaValida;
            });
        },
        abrirModal(noticia) {
            this.noticiaAtual = noticia;
            this.modal = true;
        }
    };
}

function empresasPage() {
    return {
        search: "",
        carregando: true,
        erro: "",
        empresas: [],

        async init() {
            try {
                const empresasApi = await buscarEmpresas();
                this.empresas = empresasApi.map(empresa => ({
                    ...empresa,
                    membros: empresa.integrantes,
                    diretoria: empresa.servicos.join(" ")
                }));
            } catch (error) {
                this.erro = "Não foi possível atualizar as empresas agora.";
                console.error(error);
            } finally {
                this.carregando = false;
            }
        },

        empresasFiltradas() {
            const termo = this.search.trim().toLowerCase();

            if (!termo) {
                return this.empresas;
            }

            return this.empresas.filter(empresa =>
                [empresa.nome, empresa.descricao, empresa.diretoria, empresa.responsavel]
                    .join(" ")
                    .toLowerCase()
                    .includes(termo)
            );
        }
    };
}

function noticiaDetalhePage() {
    return {
        noticia: null,
        carregando: true,
        erro: "",
        origem: "home",

        get linkVoltar() {
            const destinos = {
                home: "../index.html",
                noticias: "noticias.html",
                nexus: "../Empresa/nexus.html?tab=noticias&view=1",
                gestor: "../Gestor/gestor.html?tab=noticias"
            };
            return destinos[this.origem] || destinos.home;
        },

        async init() {
            this.carregando = true;
            this.erro = "";
            this.noticia = null;
            const parametros = new URLSearchParams(window.location.search);
            const id = parametros.get("id");
            const origem = parametros.get("origem");
            this.origem = ["home", "noticias", "nexus", "gestor"].includes(origem) ? origem : "home";

            if (!id) {
                this.erro = "Não foi possível identificar a notícia solicitada.";
                this.carregando = false;
                return;
            }

            try {
                const resposta = await apiRequest(`/noticias/${encodeURIComponent(id)}`);
                const noticia = resposta?.noticia || resposta;
                if (!noticia || typeof noticia !== "object" || Array.isArray(noticia)) {
                    throw new Error("A API não retornou uma notícia válida.");
                }
                this.noticia = normalizarNoticiaApi(noticia);
                document.title = `${this.noticia.titulo} | Newsly`;
            } catch (error) {
                this.erro = /failed to fetch|networkerror|load failed/i.test(error?.message || "")
                    ? "Não foi possível conectar ao servidor. Verifique se o backend está ativo e tente novamente."
                    : error?.message || "Não foi possível carregar esta notícia.";
                console.error("Não foi possível carregar a notícia.", error);
            } finally {
                this.carregando = false;
            }
        }
    };
}

function gestorPage() {
    return {
        currentTab: "solicitacoes",
        modalEJ: false,
        carregando: true,
        erroEmpresas: "",
        erroNoticias: "",
        carregandoSolicitacoes: true,
        erroSolicitacoes: "",
        mensagemSolicitacoes: "",
        solicitacaoEmProcessamento: null,
        buscaEmpresa: "",
        buscaNoticia: "",
        motivosRecusa: {},
        enviandoEJ: false,
        erroEJ: "",
        deduplicandoUsuarios: false,
        erroDeduplicacao: "",
        resultadoDeduplicacao: null,
        gestor: null,
        empresas: [],
        noticias: [],
        solicitacoes: [],
        novaEJ: {
            nome: "",
            cnpj: ""
        },

        async init() {
            try {
                this.gestor = JSON.parse(localStorage.getItem("user") || "null");
            } catch (error) {
                this.erroSolicitacoes = "Não foi possível ler a sessão. Entre novamente.";
            }
            if (new URLSearchParams(window.location.search).get("tab") === "noticias") {
                this.currentTab = "noticias";
            }
            await this.carregarDados();
        },

        get sessaoGestorValida() {
            const tipo = (this.gestor?.tipo || this.gestor?.role || "").toUpperCase();
            return tipo === "GESTOR" && Number.isFinite(Number(this.gestor?.id)) && Number(this.gestor.id) > 0;
        },

        linkDetalheNoticia(noticia) {
            return noticia?.id
                ? `../Newsly/noticia.html?id=${encodeURIComponent(noticia.id)}&origem=gestor`
                : "../Newsly/noticias.html";
        },

        normalizarListaSolicitacoes(resultado) {
            const lista = Array.isArray(resultado) ? resultado : resultado?.content || [];
            if (!this.sessaoGestorValida || !Array.isArray(lista)) return [];

            return lista.filter(solicitacao =>
                solicitacao.status === "PENDENTE" &&
                String(solicitacao.gestorId) === String(this.gestor.id)
            );
        },

        mensagemErro(error, fallback) {
            const detalhe = error?.message || "";
            if (/failed to fetch|networkerror|load failed/i.test(detalhe)) {
                return "Não foi possível conectar ao servidor. Verifique se o backend está ativo e tente novamente.";
            }
            if (/\b(400|422)\b/.test(detalhe)) {
                return `Confira os dados informados. ${detalhe}`;
            }
            if (/\b(409)\b/.test(detalhe)) {
                return `Este registro já existe ou não pode ser cadastrado nessa situação. ${detalhe}`;
            }
            if (/\b(404)\b/.test(detalhe)) {
                return `O recurso solicitado não foi encontrado. ${detalhe}`;
            }
            return detalhe || fallback;
        },

        get totalColaboradores() {
            return this.empresas.reduce((total, empresa) => total + empresa.colaboradores.length, 0);
        },

        get totalDiretorias() {
            return this.empresas.reduce((total, empresa) => total + empresa.diretorias.length, 0);
        },

        empresasFiltradas() {
            const termo = this.buscaEmpresa.trim().toLowerCase();
            if (!termo) return this.empresas;

            return this.empresas.filter(empresa =>
                [empresa.nome, empresa.cnpj].join(" ").toLowerCase().includes(termo)
            );
        },

        noticiasFiltradas() {
            const termo = this.buscaNoticia.trim().toLowerCase();
            if (!termo) return this.noticias;

            return this.noticias.filter(noticia =>
                [noticia.titulo, noticia.conteudo, noticia.empresaNome]
                    .join(" ")
                    .toLowerCase()
                    .includes(termo)
            );
        },

        async carregarDados() {
            this.carregando = true;
            this.erroEmpresas = "";
            this.erroNoticias = "";

            const [empresasResult, noticiasResult, solicitacoesResult] = await Promise.allSettled([
                buscarEmpresas(),
                apiRequest("/noticias"),
                this.sessaoGestorValida
                    ? api.solicitacoes.pendentesPorGestor(this.gestor.id)
                    : Promise.reject(new Error("Entre com uma conta de gestor para consultar as solicitações."))
            ]);

            if (empresasResult.status === "fulfilled") {
                this.empresas = empresasResult.value;
            } else {
                this.erroEmpresas = this.mensagemErro(empresasResult.reason, "Não foi possível carregar as empresas.");
            }

            if (noticiasResult.status === "fulfilled") {
                const data = noticiasResult.value;
                const lista = Array.isArray(data) ? data : data?.content || data?.noticias || [];
                this.noticias = lista.map(noticia => {
                    const normalizada = normalizarNoticiaApi(noticia);
                    const empresa = this.empresas.find(item => String(item.id) === String(normalizada.empresaId));
                    return { ...normalizada, empresaNome: noticia.empresaNome || empresa?.nome || "Empresa não informada" };
                });
            } else {
                this.erroNoticias = this.mensagemErro(noticiasResult.reason, "Não foi possível carregar as notícias.");
            }

            if (solicitacoesResult.status === "fulfilled") {
                this.solicitacoes = this.normalizarListaSolicitacoes(solicitacoesResult.value);
                this.erroSolicitacoes = "";
            } else {
                this.solicitacoes = [];
                this.erroSolicitacoes = this.mensagemErro(solicitacoesResult.reason, "Não foi possível carregar as solicitações.");
            }

            this.carregando = false;
            this.carregandoSolicitacoes = false;
        },

        async carregarSolicitacoes() {
            if (!this.sessaoGestorValida) {
                this.erroSolicitacoes = "Entre com uma conta de gestor para consultar as solicitações.";
                return;
            }

            this.carregandoSolicitacoes = true;
            this.erroSolicitacoes = "";
            try {
                const resultado = await api.solicitacoes.pendentesPorGestor(this.gestor.id);
                this.solicitacoes = this.normalizarListaSolicitacoes(resultado);
                this.erroSolicitacoes = "";
            } catch (error) {
                this.erroSolicitacoes = this.mensagemErro(error, "Não foi possível carregar as solicitações.");
            } finally {
                this.carregandoSolicitacoes = false;
            }
        },

        async deduplicarUsuarios() {
            this.erroDeduplicacao = "";
            this.resultadoDeduplicacao = null;

            if (!this.sessaoGestorValida) {
                this.erroDeduplicacao = "Entre com uma conta de gestor para deduplicar usuários.";
                return;
            }

            if (this.deduplicandoUsuarios) return;

            const confirmado = window.confirm(
                "Esta ação excluirá permanentemente usuários com nomes repetidos, mantendo apenas o registro de menor ID. Deseja continuar?"
            );
            if (!confirmado) return;

            this.deduplicandoUsuarios = true;
            try {
                const resultado = await api.gestores.deduplicarUsuarios();
                this.resultadoDeduplicacao = {
                    totalRemovidos: Number(resultado?.totalRemovidos) || 0,
                    usuariosRemovidos: Array.isArray(resultado?.usuariosRemovidos)
                        ? resultado.usuariosRemovidos
                        : [],
                    mensagem: resultado?.mensagem || "Deduplicação concluída."
                };
            } catch (error) {
                if (error?.status === 409) {
                    this.resultadoDeduplicacao = {
                        totalRemovidos: 0,
                        usuariosRemovidos: [],
                        mensagem: error.message || "Nenhuma duplicata de usuário encontrada."
                    };
                } else {
                    this.erroDeduplicacao = this.mensagemErro(
                        error,
                        "Não foi possível deduplicar os usuários."
                    );
                }
            } finally {
                this.deduplicandoUsuarios = false;
            }
        },

        async aceitarSolicitacao(solicitacaoId) {
            await this.responderSolicitacao(solicitacaoId, "ACEITA");
        },

        async recusarSolicitacao(solicitacaoId) {
            await this.responderSolicitacao(solicitacaoId, "RECUSADA");
        },

        async responderSolicitacao(solicitacaoId, decisao) {
            this.erroSolicitacoes = "";
            this.mensagemSolicitacoes = "";
            this.solicitacaoEmProcessamento = solicitacaoId;

            try {
                if (decisao === "ACEITA") {
                    await api.solicitacoes.aceitar(solicitacaoId);
                    this.mensagemSolicitacoes = "Solicitação aceita.";
                } else {
                    await api.solicitacoes.recusar(solicitacaoId, this.motivosRecusa[solicitacaoId]?.trim());
                    this.mensagemSolicitacoes = "Solicitação recusada.";
                    delete this.motivosRecusa[solicitacaoId];
                }
                await this.carregarSolicitacoes();
            } catch (error) {
                this.erroSolicitacoes = this.mensagemErro(error, "Não foi possível atualizar a solicitação.");
            } finally {
                this.solicitacaoEmProcessamento = null;
            }
        },

        async cadastrarEJ() {
            this.erroEJ = "";
            this.enviandoEJ = true;

            const payload = {
                nome: this.novaEJ.nome.trim(),
                cnpj: this.novaEJ.cnpj.trim()
            };

            try {
                await apiRequest("/empresas", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                await this.carregarDados();

                this.modalEJ = false;
                this.novaEJ = { nome: "", cnpj: "" };
            } catch (error) {
                this.erroEJ = this.mensagemErro(error, "Não foi possível cadastrar a empresa.");
                console.error(error);
            } finally {
                this.enviandoEJ = false;
            }
        }
    };
}

function normalizarNoticiaApi(noticia = {}) {
    const titulo = noticia.titulo || noticia.title || "Sem título";
    const conteudo = noticia.conteudo || noticia.descricao || noticia.content || noticia.description || "";
    const categoria = noticia.categoria || noticia.tipo || noticia.category || "Notícia";
    const publicadaEm = noticia.publicadaEm || noticia.publicadoEm || noticia.dataPublicacao ||
        noticia.data || noticia.createdAt || noticia.created_at || "";
    const dataPublicacao = publicadaEm ? new Date(publicadaEm) : null;
    const imagemUrl = [noticia.imagemUrl, noticia.imagem, noticia.imageUrl, noticia.image]
        .find(valor => typeof valor === "string" && valor.trim()) || "";
    const empresa = noticia.empresa && typeof noticia.empresa === "object" ? noticia.empresa : {};
    const autor = noticia.autor && typeof noticia.autor === "object" ? noticia.autor.nome : noticia.autor;
    const imagem = imagemUrl.startsWith("/") ? `${API_BASE_URL}${imagemUrl}` : imagemUrl;

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
        empresaId: noticia.empresaId ?? empresa.id ?? empresa.empresaId,
        empresaNome: noticia.empresaNome || empresa.nome || empresa.name || "",
        imagemUrl,
        img: imagem || "../static/Union.svg",
        autor: typeof autor === "string" ? autor : noticia.autorNome || "",
        tempo: ""
    };
}

function homePage() {
    return {
        empresas: [],
        noticias: [],
        carregando: true,
        erro: "",

        linkDetalheNoticia(noticia) {
            return noticia?.id
                ? `Newsly/noticia.html?id=${encodeURIComponent(noticia.id)}&origem=home`
                : "Newsly/noticias.html";
        },

        async init() {
            try {
                const [empresasApi, noticiasApi] = await Promise.all([
                    buscarEmpresas().catch(() => []),
                    apiRequest("/noticias").catch(() => [])
                ]);

                this.empresas = Array.isArray(empresasApi) ? empresasApi.slice(0, 3) : [];
                const lista = Array.isArray(noticiasApi) ? noticiasApi : [];
                this.noticias = lista.map(noticia => {
                    const normalizada = normalizarNoticiaApi(noticia);
                    return normalizada.imagemUrl
                        ? normalizada
                        : { ...normalizada, img: "static/Union.svg" };
                }).slice(0, 3);
            } catch (error) {
                this.erro = "Não foi possível carregar os destaques agora.";
                console.error(error);
            } finally {
                this.carregando = false;
            }
        }
    };
}

function companyPage() {
    return {
        empresa: null,
        carregando: true,
        erro: "",
        async init() {
            const empresaId = new URLSearchParams(window.location.search).get("id");
            if (!empresaId) {
                this.erro = "Empresa não informada.";
                this.carregando = false;
                return;
            }

            try {
                const empresa = await apiRequest(`/empresas/${encodeURIComponent(empresaId)}`);
                this.empresa = normalizarEmpresa(empresa);
            } catch (error) {
                this.erro = "Não foi possível carregar a empresa.";
                console.error(error);
            } finally {
                this.carregando = false;
            }
        }
    };
}

function noticiasPublicasPage() {
    return {
        activeFilter: "Todas",
        carregando: true,
        erro: "",
        noticias: [],

        linkDetalheNoticia(noticia) {
            return noticia?.id
                ? `noticia.html?id=${encodeURIComponent(noticia.id)}&origem=noticias`
                : "noticias.html";
        },

        async init() {
            try {
                const data = await apiRequest("/noticias");
                const lista = Array.isArray(data) ? data : data?.content || [];

                this.noticias = lista.map(normalizarNoticiaApi);
            } catch (error) {
                this.erro = "Não foi possível carregar as notícias.";
                console.error(error);
            } finally {
                this.carregando = false;
            }
        },

        noticiasVisiveis() {
            if (this.activeFilter === "Todas") return this.noticias;
            return this.noticias.filter(noticia =>
                (noticia.tipo || noticia.categoria || "").toLowerCase() === this.activeFilter.toLowerCase()
            );
        }
    };
}