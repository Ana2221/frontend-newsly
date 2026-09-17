function userLoad() {
  return {
    user: null,
    currentTab: "painel",
    sidebarOpen: true,
    mobileMenuOpen: false,
    async init() {
      const response = localStorage.getItem("user");
      this.user = response ? JSON.parse(response) : null;
      await this.initEmpresa();
    },

    async initEmpresa() {
      if (!this.user || !this.user.empresaId) {
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
      if (this.user.tipo === "RESPONSAVEL" && this.user.empresa) {
        console.log("Empresa já carregada:", this.user.empresa);
        return;
      }
      const data = await apiRequest(`/empresas/${encodeURIComponent(this.user.empresaId)}`);
      this.user.empresa = data;
      console.log("usuario carregada:", this.user);
      console.log("Empresa carregada:", data);
    },

    async criarNoticia() {
      const payload = {
        titulo: this.form.titulo.trim(),
        conteudo: this.form.conteudo.trim(),
        empresaId: this.user.empresaId,
        publicadaEm: new Date().toISOString().slice(0, 19),
      };

      await apiRequest("/noticias", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("Notícia criada com sucesso!");
      this.form.titulo = "";
      this.form.descricao = "";
      this.form.conteudo = "";
      await this.initEmpresa();
    },
  };
}
