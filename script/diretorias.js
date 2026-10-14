function diretoriasEmpresaPage() {
    const dataAtual = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);

    return {
        openCreateDir: false,
        openCreateFuncao: false,
        criandoFuncao: false,
        salvandoDiretoria: false,
        carregandoColaboradores: false,
        carregandoFuncoes: false,
        erroFuncao: '',
        erroDiretorTemp: '',
        erroColaboradores: '',
        erroFuncoes: '',
        novaFuncao: {
            nome: '',
            descricao: ''
        },
        opcoesColaboradores: [],
        funcoesDisponiveis: [],
        permissoesDisponiveis: ['LEITOR', 'ESCRITOR'],
        formDir: {
            nome: '',
            criadaEm: dataAtual(),
            diretores: []
        },
        diretorTemp: {
            id: null,
            colaboradorId: null,
            colaboradorNome: '',
            funcaoId: null,
            funcao: '',
            permissoes: []
        },
        async carregarColaboradores() {
            this.carregandoColaboradores = true;
            this.erroColaboradores = '';
            try {
                const data = await apiRequest('/colaboradores');
                const lista = Array.isArray(data) ? data : data?.content || [];
                this.opcoesColaboradores = lista
                    .map(colaborador => ({
                        id: Number(colaborador?.id),
                        nome: colaborador?.nome || colaborador?.name || '',
                        email: colaborador?.email || '',
                        cargo: colaborador?.cargo || '',
                        status: colaborador?.status || ''
                    }))
                    .filter(item => Number.isSafeInteger(item.id) && item.id > 0 && item.nome);
            } catch (error) {
                console.error('Falha ao carregar colaboradores para diretoria:', error);
                this.opcoesColaboradores = [];
                this.erroColaboradores = error.message || 'Não foi possível carregar os colaboradores.';
            } finally {
                this.carregandoColaboradores = false;
            }
        },
        async carregarFuncoes() {
            this.carregandoFuncoes = true;
            this.erroFuncoes = '';
            try {
                const data = await api.funcoes.listar();
                const lista = Array.isArray(data) ? data : data?.content || [];
                this.funcoesDisponiveis = lista
                    .map(funcao => ({
                        id: Number(funcao?.id),
                        nome: funcao?.nome || funcao?.titulo || '',
                        descricao: funcao?.descricao || ''
                    }))
                    .filter(item => Number.isSafeInteger(item.id) && item.id > 0 && item.nome);
            } catch (error) {
                console.error('Falha ao carregar funções para diretoria:', error);
                this.funcoesDisponiveis = [];
                this.erroFuncoes = error.message || 'Não foi possível carregar as funções.';
            } finally {
                this.carregandoFuncoes = false;
            }
        },
        async criarFuncao() {
            const nome = this.novaFuncao.nome.trim();
            if (!nome) {
                this.erroFuncao = 'Informe o nome da função.';
                return;
            }

            this.criandoFuncao = true;
            this.erroFuncao = '';
            try {
                const criada = await api.funcoes.criar({
                    nome,
                    descricao: this.novaFuncao.descricao.trim()
                });
                const funcao = {
                    id: Number(criada?.id),
                    nome: criada?.nome || nome,
                    descricao: criada?.descricao || this.novaFuncao.descricao.trim()
                };
                if (!Number.isSafeInteger(funcao.id) || funcao.id <= 0) {
                    throw new Error('A função foi criada, mas a API não retornou um ID válido.');
                }

                this.funcoesDisponiveis.push(funcao);
                this.novaFuncao = { nome: '', descricao: '' };
                this.openCreateFuncao = false;
                await Swal.fire({
                    title: 'Função criada!',
                    text: 'A função foi cadastrada com sucesso.',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                });
            } catch (error) {
                console.error('Erro ao criar função:', error);
                this.erroFuncao = error.message || 'Não foi possível criar a função.';
            } finally {
                this.criandoFuncao = false;
            }
        },
        normalizarPermissoes(permissoes) {
            const lista = Array.isArray(permissoes)
                ? permissoes
                : String(permissoes || '').split(',').map(item => item.trim()).filter(Boolean);

            return lista
                .map(item => String(item).toUpperCase())
                .filter(item => ['LEITOR', 'ESCRITOR'].includes(item));
        },
        registrarAlteracaoDiretor(origem) {
            console.info('[Diretoria] Membro diretor alterado', {
                origem,
                colaboradorId: Number(this.diretorTemp.colaboradorId) || null,
                funcaoId: Number(this.diretorTemp.funcaoId) || null,
                permissoes: this.normalizarPermissoes(this.diretorTemp.permissoes)
            });
        },
        adicionarDiretor() {
            this.erroDiretorTemp = '';
            const colaboradorId = Number(this.diretorTemp.colaboradorId);
            const funcaoId = Number(this.diretorTemp.funcaoId);

            if (!Number.isSafeInteger(colaboradorId) || colaboradorId <= 0) {
                this.erroDiretorTemp = 'Selecione um colaborador cadastrado.';
                return false;
            }
            if (!Number.isSafeInteger(funcaoId) || funcaoId <= 0) {
                this.erroDiretorTemp = 'Selecione uma função válida.';
                return false;
            }

            const membro = this.opcoesColaboradores.find(item => item.id === colaboradorId);
            const funcao = this.funcoesDisponiveis.find(item => item.id === funcaoId);
            if (!membro || !funcao) {
                this.erroDiretorTemp = 'O colaborador ou a função selecionada não está mais disponível. Atualize a lista e tente novamente.';
                return false;
            }

            if (this.formDir.diretores.some(item => Number(item.colaboradorId) === colaboradorId)) {
                this.erroDiretorTemp = 'Esse colaborador já foi adicionado à diretoria.';
                return false;
            }

            const diretor = {
                colaboradorId: membro.id,
                colaboradorNome: membro.nome,
                email: membro.email,
                funcaoId: funcao.id,
                funcaoNome: funcao.nome,
                permissoes: this.normalizarPermissoes(this.diretorTemp.permissoes)
            };
            this.formDir.diretores.push(diretor);
            console.info('[Diretoria] Membro diretor adicionado', {
                colaboradorId: diretor.colaboradorId,
                funcaoId: diretor.funcaoId,
                permissoes: [...diretor.permissoes]
            });

            this.diretorTemp = {
                id: null,
                colaboradorId: null,
                colaboradorNome: '',
                funcaoId: null,
                funcao: '',
                permissoes: []
            };
            this.erroDiretorTemp = '';
            return true;
        },
        removerDiretor(index) {
            const [diretor] = this.formDir.diretores.splice(index, 1);
            if (diretor) {
                console.info('[Diretoria] Membro diretor removido', {
                    colaboradorId: diretor.colaboradorId,
                    funcaoId: diretor.funcaoId,
                    permissoes: [...diretor.permissoes]
                });
            }
        },
        async submeterFormulario() {
            if (this.salvandoDiretoria) return;

            if (this.formDir.nome.trim() === '') {
                alert('Informe o nome da diretoria.');
                return;
            }

            const rascunhoPreenchido = [
                this.diretorTemp.colaboradorId,
                this.diretorTemp.funcaoId
            ].some(valor => String(valor ?? '').trim() !== '') ||
                this.diretorTemp.permissoes.length > 0;
            if (rascunhoPreenchido && !this.adicionarDiretor()) {
                return;
            }

            const criadaEm = String(this.formDir.criadaEm || '').trim();
            const timestampCriacao = Date.parse(`${criadaEm}T00:00:00Z`);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(criadaEm) ||
                Number.isNaN(timestampCriacao) ||
                new Date(timestampCriacao).toISOString().slice(0, 10) !== criadaEm) {
                await Swal.fire({
                    title: 'Data inválida',
                    text: 'Informe uma data válida para a criação da diretoria.',
                    icon: 'warning',
                    confirmButtonText: 'Ok'
                });
                return;
            }

            const membrosSemIds = this.formDir.diretores.filter(item =>
                !Number.isSafeInteger(Number(item.colaboradorId)) ||
                Number(item.colaboradorId) <= 0 ||
                !Number.isSafeInteger(Number(item.funcaoId)) ||
                Number(item.funcaoId) <= 0
            );
            if (membrosSemIds.length) {
                await Swal.fire({
                    title: 'Dados dos membros incompletos',
                    text: 'Selecione um colaborador cadastrado e uma função válida para cada membro.',
                    icon: 'warning',
                    confirmButtonText: 'Ok'
                });
                return;
            }

            const empresaId = Number(this.user?.empresaId ?? this.user?.empresa?.id);
            if (!empresaId) {
                alert('Não foi possível identificar a empresa da sessão.');
                return;
            }

            const payloadDiretoria = {
                nome: this.formDir.nome.trim(),
                criadaEm,
                empresaId,
                diretores: this.formDir.diretores.map(item => ({
                    colaboradorId: Number(item.colaboradorId),
                    funcaoId: Number(item.funcaoId),
                    permissoes: this.normalizarPermissoes(item.permissoes)
                }))
            };

            this.salvandoDiretoria = true;
            try {
                console.info('[Diretoria] Enviando POST /diretorias', JSON.stringify(payloadDiretoria, null, 2));
                await api.diretorias.criar(payloadDiretoria);

                this.formDir = { nome: '', criadaEm: dataAtual(), diretores: [] };
                this.diretorTemp = {
                    id: null,
                    colaboradorId: null,
                    colaboradorNome: '',
                    funcaoId: null,
                    funcao: '',
                    permissoes: []
                };
                this.openCreateDir = false;
                try {
                    await this.initEmpresa();
                } catch (error) {
                    console.error('Diretoria criada, mas não foi possível atualizar os dados da empresa:', error);
                }
                await Swal.fire({
                    title: 'Diretoria criada!',
                    text: 'A diretoria foi criada. A lista exibirá somente os dados retornados pela API.',
                    icon: 'success',
                    confirmButtonText: 'Ok'
                });
            } catch (error) {
                console.error('Erro ao criar diretoria:', error);
                await Swal.fire({
                    title: 'Erro ao criar diretoria',
                    text: error.message || 'Não foi possível criar a diretoria.',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                });
            } finally {
                this.salvandoDiretoria = false;
            }
        },
        init() {
            this.carregarColaboradores();
            this.carregarFuncoes();
        }
    };
}
