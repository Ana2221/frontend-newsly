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

function gestorPage() {
    return {
        currentTab: "painel",
        modalNoticia: false,
        modalEJ: false,
        enviandoEJ: false,
        erroEJ: "",
        enviandoNoticia: false,
        erroNoticia: "",
        empresas: [],
        novaNoticia: {
            titulo: "",
            empresaId: "",
            conteudo: ""
        },
        novaEJ: {
            nome: "",
            cnpj: "",
            universidade: "",
            area: "Consultoria",
            cidade: "",
            presidente: "",
            email: "",
            membros: 0,
            ano: "",
            descricao: ""
        },

        async init() {
            try {
                this.empresas = await buscarEmpresas();
                if (this.empresas.length) this.novaNoticia.empresaId = this.empresas[0].id;
            } catch (error) {
                console.error(error);
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
                const criada = await apiRequest("/empresas", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                this.modalEJ = false;
                this.novaEJ = {
                    nome: "", cnpj: "", universidade: "", area: "Consultoria", cidade: "",
                    presidente: "", email: "", membros: 0, ano: "", descricao: ""
                };
                alert(`Empresa ${criada?.nome || payload.nome} cadastrada com sucesso.`);
            } catch (error) {
                this.erroEJ = "Não foi possível cadastrar a empresa. Verifique se o backend está ativo.";
                console.error(error);
            } finally {
                this.enviandoEJ = false;
            }
        },

        async criarNoticiaGestor() {
            this.erroNoticia = "";
            this.enviandoNoticia = true;
            const payload = {
                titulo: this.novaNoticia.titulo.trim(),
                conteudo: this.novaNoticia.conteudo.trim(),
                publicadaEm: new Date().toISOString().slice(0, 19),
                empresaId: Number(this.novaNoticia.empresaId)
            };

            try {
                await apiRequest("/noticias", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });
                this.modalNoticia = false;
                this.novaNoticia = { titulo: "", empresaId: this.empresas[0]?.id || "", conteudo: "" };
                alert("Notícia criada com sucesso.");
            } catch (error) {
                this.erroNoticia = error.message || "Não foi possível criar a notícia.";
            } finally {
                this.enviandoNoticia = false;
            }
        }
    };
}

function normalizarNoticiaApi(noticia = {}) {
    return {
        id: noticia.id,
        titulo: noticia.titulo || "Sem título",
        conteudo: noticia.conteudo || noticia.descricao || "",
        descricao: noticia.conteudo || noticia.descricao || "",
        categoria: noticia.categoria || "Institucional",
        tipo: noticia.categoria || "Institucional",
        data: noticia.publicadaEm
            ? new Date(noticia.publicadaEm).toLocaleDateString("pt-BR")
            : "",
        publicadaEm: noticia.publicadaEm,
        empresaId: noticia.empresaId,
        empresaNome: noticia.empresaNome || "Empresa",
        img: noticia.imagem || "../static/Union.svg",
        tempo: ""
    };
}

function homePage() {
    return {
        empresas: [],
        noticias: [],
        carregando: true,
        erro: "",

        async init() {
            try {
                const [empresasApi, noticiasApi] = await Promise.all([
                    buscarEmpresas().catch(() => []),
                    apiRequest("/noticias").catch(() => [])
                ]);

                this.empresas = Array.isArray(empresasApi) ? empresasApi.slice(0, 3) : [];
                const lista = Array.isArray(noticiasApi) ? noticiasApi : [];
                this.noticias = lista.map(normalizarNoticiaApi).slice(0, 3);
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