function userLoad() {
  return {
    user: null,
    currentTab: "painel",
    sidebarOpen: true,
    mobileMenuOpen: false,
    solicitacoes: [],
    carregandoSolicitacoes: false,
    enviandoSolicitacao: false,
    solicitacaoEmCancelamento: null,
    erroSolicitacao: "",
    erroSolicitacoes: "",
    erroEmpresa: "",
    carregandoEmpresa: false,
    mensagemSolicitacao: "",
    modalEdicaoNoticia: false,
    salvandoEdicaoNoticia: false,
    arquivoEdicaoNoticia: null,
    imagemEdicaoPreview: "",
    erroEdicaoNoticia: "",
    mensagemEdicaoNoticia: "",
    erroNoticiasEmpresa: "",
    noticiaEmExclusao: null,
    noticiaEmEdicao: null,
    formularioEdicaoNoticia: {
      titulo: "",
      conteudo: "",
    },
    aplicarCorEmpresa(empresa = this.user?.empresa) {
      const configuracoes = empresa?.configurations || empresa?.configuration || {};
      const corValida = [empresa?.cor, configuracoes.color]
        .find(cor => /^#[0-9a-f]{6}$/i.test(cor || "")) || "#4f46e5";
      document.documentElement.style.setProperty("--empresa-cor", corValida);
    },
    atualizarEmpresaTema(empresa) {
      if (!this.user || !empresa) return;
      this.user.empresa = { ...(this.user.empresa || {}), ...empresa };
      this.aplicarCorEmpresa(this.user.empresa);
    },
    async init() {
      this.aplicarCorEmpresa();
      try {
        const response = localStorage.getItem("user");
        this.user = response ? JSON.parse(response) : null;
        this.aplicarCorEmpresa();
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
        this.carregarSolicitacoes(),
      ]);
    },

    sair() {
      encerrarSessao();
    },

    linkDetalheNoticia(noticia) {
      return noticia?.id
        ? `../Newsly/noticia.html?id=${encodeURIComponent(noticia.id)}&origem=nexus`
        : "../Newsly/noticias.html";
    },

    abrirEdicaoNoticia(noticia) {
      this.limparImagemEdicao();
      this.noticiaEmEdicao = noticia;
      this.formularioEdicaoNoticia = {
        titulo: noticia?.titulo || "",
        conteudo: noticia?.conteudo || noticia?.descricao || "",
      };
      this.erroEdicaoNoticia = "";
      this.mensagemEdicaoNoticia = "";
      this.imagemEdicaoPreview = "";
      this.modalEdicaoNoticia = true;
    },

    selecionarImagemEdicao(event) {
      const arquivo = event.target.files?.[0];
      this.erroEdicaoNoticia = "";
      this.limparImagemEdicao();
      if (!arquivo) return;

      if (!arquivo.type.startsWith("image/")) {
        this.erroEdicaoNoticia = "Selecione um arquivo de imagem válido.";
        event.target.value = "";
        return;
      }
      if (arquivo.size > 10 * 1024 * 1024) {
        this.erroEdicaoNoticia = "A imagem deve ter no máximo 10 MB.";
        event.target.value = "";
        return;
      }

      this.arquivoEdicaoNoticia = arquivo;
      this.imagemEdicaoPreview = URL.createObjectURL(arquivo);
    },

    limparImagemEdicao() {
      if (this.imagemEdicaoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(this.imagemEdicaoPreview);
      }
      this.arquivoEdicaoNoticia = null;
      this.imagemEdicaoPreview = "";
      const input = document.getElementById("editar-noticia-responsavel-imagem");
      if (input) input.value = "";
    },

    fecharEdicaoNoticia() {
      if (this.salvandoEdicaoNoticia) return;
      this.modalEdicaoNoticia = false;
      this.noticiaEmEdicao = null;
      this.limparImagemEdicao();
    },

    async salvarEdicaoNoticia() {
      this.erroEdicaoNoticia = "";
      const noticia = this.noticiaEmEdicao;
      const titulo = this.formularioEdicaoNoticia.titulo.trim();
      const conteudo = this.formularioEdicaoNoticia.conteudo.trim();
      const empresaId = noticia?.empresaId ?? this.user?.empresaId ?? this.user?.empresa?.id;

      if (!noticia?.id || !empresaId) {
        this.erroEdicaoNoticia = "Não foi possível identificar a notícia ou a empresa vinculada.";
        return;
      }
      if (!titulo || !conteudo) {
        this.erroEdicaoNoticia = "Informe o título e o conteúdo da notícia.";
        return;
      }

      this.salvandoEdicaoNoticia = true;
      let dadosNoticiaSalvos = false;
      try {
        const resposta = await api.noticias.atualizar(noticia.id, {
          titulo,
          conteudo,
          publicadaEm: noticia.publicadaEm,
          empresaId: Number(empresaId),
        });
        const noticiaAtualizada = resposta?.noticia || resposta || {};
        let noticiaAtualizadaCompleta = {
          ...noticia,
          ...noticiaAtualizada,
          titulo,
          conteudo,
          descricao: conteudo,
        };
        dadosNoticiaSalvos = true;
        this.atualizarNoticiaEmpresa(noticia.id, noticiaAtualizadaCompleta);

        if (this.arquivoEdicaoNoticia) {
          const respostaImagem = await api.noticias.uploadImagem(noticia.id, this.arquivoEdicaoNoticia);
          const dadosImagem = respostaImagem?.noticia || respostaImagem || {};
          noticiaAtualizadaCompleta = {
            ...noticiaAtualizadaCompleta,
            ...normalizarNoticiaApi({ ...noticiaAtualizadaCompleta, ...dadosImagem }),
          };
          this.atualizarNoticiaEmpresa(noticia.id, noticiaAtualizadaCompleta);
        }

        this.limparImagemEdicao();
        this.mensagemEdicaoNoticia = "Notícia atualizada com sucesso.";
        this.modalEdicaoNoticia = false;
        this.noticiaEmEdicao = null;
      } catch (error) {
        this.erroEdicaoNoticia = this.arquivoEdicaoNoticia && dadosNoticiaSalvos
          ? `Os dados da notícia podem ter sido salvos, mas o upload da imagem falhou. ${error.message || "Tente novamente."}`
          : error.message || "Não foi possível salvar as alterações da notícia.";
      } finally {
        this.salvandoEdicaoNoticia = false;
      }
    },

    atualizarNoticiaEmpresa(noticiaId, dadosAtualizados) {
      const noticias = this.user?.empresa?.noticias || [];
      this.user.empresa.noticias = noticias.map(item =>
        String(item.id) === String(noticiaId)
          ? {
            ...item,
            ...dadosAtualizados,
            descricao: dadosAtualizados.conteudo || item.descricao,
            empresaNome: item.empresaNome || this.user.empresa.nome || "",
          }
          : item
      );
    },

    async deletarNoticia(noticia) {
      this.erroNoticiasEmpresa = "";
      const empresaId = this.user?.empresaId || this.user?.empresa?.id;
      if (!noticia?.id || (noticia.empresaId && String(noticia.empresaId) !== String(empresaId))) {
        this.erroNoticiasEmpresa = "Não foi possível identificar uma notícia da sua empresa para excluir.";
        return;
      }

      const confirmado = window.confirm(`Deseja excluir a notícia "${noticia.titulo}"? Esta ação não pode ser desfeita.`);
      if (!confirmado) return;

      this.noticiaEmExclusao = noticia.id;
      try {
        await api.noticias.remover(noticia.id);
        this.user.empresa.noticias = (this.user.empresa.noticias || [])
          .filter(item => String(item.id) !== String(noticia.id));
        if (String(this.noticiaEmEdicao?.id) === String(noticia.id)) {
          this.fecharEdicaoNoticia();
        }
        this.mensagemEdicaoNoticia = "Notícia excluída com sucesso.";
      } catch (error) {
        this.erroNoticiasEmpresa = error.message || "Não foi possível excluir a notícia.";
      } finally {
        this.noticiaEmExclusao = null;
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
        this.solicitacoes = Array.isArray(resultado) ? resultado : resultado?.content || [];
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

      let empresaId = this.user?.empresaId || this.user?.empresa?.id;
      if (!empresaId && this.user.id) {
        try {
          const responsavel = await api.responsaveis.buscarPorId(this.user.id);
          empresaId = responsavel?.empresaId || responsavel?.empresa?.id;
          if (empresaId) {
            this.user = {
              ...this.user,
              empresaId,
              empresa: { ...(this.user.empresa || {}), ...(responsavel.empresa || {}), id: empresaId }
            };
            localStorage.setItem("user", JSON.stringify(this.user));
          }
        } catch (error) {
          this.erroEmpresa = error.message || "Não foi possível verificar a empresa vinculada à sua conta.";
          console.error("Não foi possível verificar a empresa vinculada à conta.", error);
          return;
        }
      }

      if (!empresaId) {
        this.user.empresa = null;
        const result = await Swal.fire({
          title: "Deseja cadastrar a sua empresa?",
          icon: "info",
        
          showCloseButton: true,
          showCancelButton: true,
          focusConfirm: false,
          confirmButtonText: "Sim",
          confirmButtonAriaLabel: "Sim, cadastrar a empresa",
          cancelButtonText: "Não",
          cancelButtonAriaLabel: "Não, voltar",
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
        this.aplicarCorEmpresa(this.user.empresa);
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
      this.enviandoSolicitacao = true;
      try {
        await api.solicitacoes.criar({
          titulo: form.titulo.trim(),
          conteudo: form.conteudo.trim(),
          publicadaEm: new Date().toISOString().slice(0, -1),
          empresaId: Number(this.user.empresaId),
          responsavelId: Number(this.user.id),
        }, form.imagem);
        this.mensagemSolicitacao = "Notícia enviada para submissão e análise da equipe.";
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
        this.erroSolicitacao = error.message || "Não foi possível enviar a notícia para análise.";
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
