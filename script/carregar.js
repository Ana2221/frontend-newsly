function userLoad() {
  return {
    user: null,
    currentTab: "painel",
    sidebarOpen: true,
    mobileMenuOpen: false,
    gestores: [],
    solicitacoes: [],
    gestorSelecionadoId: "",
    noticiaSemSolicitacaoId: null,
    carregandoSolicitacoes: false,
    enviandoSolicitacao: false,
    solicitacaoEmCancelamento: null,
    imagemNoticiaEnviadaArquivo: null,
    erroSolicitacao: "",
    erroSolicitacoes: "",
    erroEmpresa: "",
    carregandoEmpresa: false,
    mensagemSolicitacao: "",
    async init() {
      try {
        const response = localStorage.getItem("user");
        this.user = response ? JSON.parse(response) : null;
      } catch (error) {
        this.erroSolicitacoes = "Não foi possível ler sua sessão. Entre novamente.";
        return;
      }

      if (new URLSearchParams(window.location.search).get("tab") === "noticias") {
        this.currentTab = "noticias";
      }

      if (!this.user) {
        this.erroSolicitacoes = "Entre com uma conta de responsável para gerenciar solicitações.";
        return;
      }

      await Promise.all([
        this.initEmpresa().catch((error) => {
          this.erroEmpresa = error.message || "Não foi possível carregar os dados da empresa.";
        }),
        this.carregarGestores(),
        this.carregarSolicitacoes(),
      ]);
    },

    linkDetalheNoticia(noticia) {
      return noticia?.id
        ? `../Newsly/noticia.html?id=${encodeURIComponent(noticia.id)}&origem=nexus`
        : "../Newsly/noticias.html";
    },

    async carregarGestores() {
      try {
        const resultado = await api.gestores.listar();
        this.gestores = Array.isArray(resultado) ? resultado : resultado?.content || [];
        if (!this.gestorSelecionadoId && this.gestores.length) {
          this.gestorSelecionadoId = String(this.gestores[0].id);
        }
      } catch (error) {
        this.erroSolicitacao = error.message || "Não foi possível carregar a lista de gestores.";
      }
    },

    async carregarSolicitacoes() {
      if (!this.user?.id) {
        this.erroSolicitacoes = "Sua conta não possui um identificador válido para consultar solicitações.";
        return;
      }

      this.carregandoSolicitacoes = true;
      this.erroSolicitacoes = "";
      try {
        const resultado = await api.solicitacoes.porResponsavel(this.user.id);
        this.solicitacoes = Array.isArray(resultado) ? resultado.filter(e => e.status === "PENDENTE") : resultado?.content || [];
      } catch (error) {
        this.erroSolicitacoes = error.message || "Não foi possível carregar suas solicitações.";
      } finally {
        this.carregandoSolicitacoes = false;
      }
    },

    async initEmpresa() {
      if (!this.user) {
        this.erroEmpresa = "Não foi possível identificar a sessão do usuário.";
        return;
      }

      const empresaId = this.user?.empresaId || this.user?.empresa?.id;
      if (!empresaId) {
        this.user.empresa = null;
        this.erroEmpresa = "Sua conta não está vinculada a uma empresa.";
        const result = await Swal.fire({
          title: "Deseja cadastrar a sua empresa?",
          icon: "info",
        
          showCloseButton: true,
          showCancelButton: true,
          focusConfirm: false,
          confirmButtonText: `
    Sim
  `,
          confirmButtonAriaLabel: "Thumbs up, great!",
          cancelButtonText: `
    Não
  `,
          cancelButtonAriaLabel: "Thumbs down",
        });
        console.warn("Usuário não possui empresa associada.");
        if (result.isConfirmed) {
          window.location.href = "teste2.html";
        }
        return;
      }

      this.carregandoEmpresa = true;
      this.erroEmpresa = "";
      this.user.empresa = null;
      try {
        const data = await apiRequest(`/empresas/${encodeURIComponent(empresaId)}`);
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          throw new Error("A API retornou dados inválidos para a empresa.");
        }
        const noticias = Array.isArray(data.noticias)
          ? data.noticias.map((noticia) => {
            const normalizada = normalizarNoticiaApi(noticia);
            return {
              ...normalizada,
              empresaNome: normalizada.empresaNome || data.nome || "",
            };
          })
          : [];
        this.user.empresa = { ...data, noticias };
      } catch (error) {
        this.erroEmpresa = error.message || "Não foi possível carregar os dados da empresa.";
        console.error("Não foi possível carregar os dados da empresa.", error);
      } finally {
        this.carregandoEmpresa = false;
      }
    },

    async criarNoticia(form) {
      this.erroSolicitacao = "";
      this.mensagemSolicitacao = "";

      if (!this.user?.id || !this.user?.empresaId) {
        this.erroSolicitacao = "Sua conta não está vinculada a uma empresa. Atualize seu cadastro antes de enviar.";
        return;
      }
      if (!this.gestorSelecionadoId) {
        this.erroSolicitacao = "Selecione o gestor que receberá a solicitação.";
        return;
      }

      this.enviandoSolicitacao = true;
      try {
        if (!this.noticiaSemSolicitacaoId) {
          const noticia = await api.noticias.criar({
            titulo: form.titulo.trim(),
            conteudo: form.conteudo.trim(),
            publicadaEm: new Date().toISOString().slice(0, 19),
            empresaId: Number(this.user.empresaId),
          });
          this.noticiaSemSolicitacaoId = noticia?.id;
          if (!this.noticiaSemSolicitacaoId) {
            throw new Error("A notícia foi criada, mas a API não retornou seu ID. Entre em contato com o suporte.");
          }
        }

        if (form.imagem && this.imagemNoticiaEnviadaArquivo !== form.imagem) {
          await api.noticias.uploadImagem(this.noticiaSemSolicitacaoId, form.imagem);
          this.imagemNoticiaEnviadaArquivo = form.imagem;
        }

        const gestorId = Number(this.gestorSelecionadoId);
        try {
          await api.solicitacoes.criar({
            responsavelId: Number(this.user.id),
            gestorId,
            noticiaId: Number(this.noticiaSemSolicitacaoId),
          });
        } catch (error) {
          await this.carregarSolicitacoes();
          const jaEnviada = this.solicitacoes.some((solicitacao) =>
            String(solicitacao.noticiaId) === String(this.noticiaSemSolicitacaoId) &&
            String(solicitacao.gestorId) === String(gestorId) &&
            solicitacao.status === "PENDENTE"
          );
          if (!jaEnviada) throw error;
        }

        this.noticiaSemSolicitacaoId = null;
  this.imagemNoticiaEnviadaArquivo = null;
        this.mensagemSolicitacao = "Solicitação enviada ao gestor.";
  if (form.previewImagem?.startsWith("blob:")) URL.revokeObjectURL(form.previewImagem);
        form.titulo = "";
        form.descricao = "";
        form.autor = "";
        form.categoria = "Institucional";
        form.data = new Date().toISOString().split("T")[0];
        form.conteudo = "";
        form.imagem = null;
        form.previewImagem = "";
        const inputImagem = document.getElementById("noticia-imagem");
        if (inputImagem) inputImagem.value = "";
        await this.carregarSolicitacoes();
        await this.initEmpresa();
      } catch (error) {
        this.erroSolicitacao = error.message || "Não foi possível enviar a solicitação.";
      } finally {
        this.enviandoSolicitacao = false;
      }
    },

    async cancelarSolicitacao(solicitacaoId) {
      this.erroSolicitacoes = "";
      this.solicitacaoEmCancelamento = solicitacaoId;
      try {
        await api.solicitacoes.cancelar(solicitacaoId);
        await this.carregarSolicitacoes();
      } catch (error) {
        this.erroSolicitacoes = error.message || "Não foi possível cancelar a solicitação.";
      } finally {
        this.solicitacaoEmCancelamento = null;
      }
    },
  };
}
