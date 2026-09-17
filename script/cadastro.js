function cadastroController() {
  return {
    form: {
      nome: '',
      email: '',
      telefone: '',
      tipo: 'COLABORADOR',
      senha: '',
      empresaId: '',
      atividade: true,
      permissoes: ['LEITOR']
    },

    getPayload() {
      const nome = this.form.nome.trim();
      const email = this.form.email.trim().toLowerCase();
      const telefone = this.form.telefone.trim();

      if (!nome || !email || !this.form.senha) {
        throw new Error('Preencha nome, email e senha.');
      }

      if (this.form.senha.length < 6) {
        throw new Error('A senha precisa ter pelo menos 6 caracteres.');
      }

      const base = {
        nome,
        senha: this.form.senha,
        tipo: this.form.tipo,
        contato: {
          email,
          telefone
        }
      };

      if (this.form.tipo === 'COLABORADOR') {
        return {
          ...base,
          atividade: Boolean(this.form.atividade),
          empresaId: this.form.empresaId ? Number(this.form.empresaId) : undefined
        };
      }

      if (this.form.tipo === 'RESPONSAVEL') {
        return {
          ...base,
          empresaId: this.form.empresaId ? Number(this.form.empresaId) : undefined,
          permissoes: Array.isArray(this.form.permissoes) && this.form.permissoes.length ? this.form.permissoes : ['LEITOR']
        };
      }

      return {
        ...base,
        permissoes: Array.isArray(this.form.permissoes) && this.form.permissoes.length ? this.form.permissoes : ['LEITOR']
      };
    },

    async submeterCadastro() {
      try {
        const payload = this.getPayload();

        console.log('Enviando dados de cadastro:', payload);

        await apiRequest('/usuarios', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        alert(`Conta criada com sucesso! Bem-vindo, ${payload.nome}.`);
        this.limparFormulario();
      } catch (error) {
        console.error(error);
        alert(error.message || 'Erro ao cadastrar usuário.');
      }
    },

    limparFormulario() {
      this.form.nome = '';
      this.form.email = '';
      this.form.telefone = '';
      this.form.tipo = 'COLABORADOR';
      this.form.senha = '';
      this.form.empresaId = '';
      this.form.atividade = true;
      this.form.permissoes = ['LEITOR'];
    }
  };
}