function destinoPorPerfil(usuario) {
    const userRole = (usuario?.tipo || usuario?.role || "").trim().toUpperCase();
    const pages = {
        ADMIN: "../Gestor/gestor.html",
        GESTOR: "../Gestor/gestor.html",
        RESPONSAVEL: "../Empresa/nexus.html",
        COLABORADOR: "../index.html"
    };

    return pages[userRole] || null;
}

window.loginController = function () {
    return {
        carregando: false,

        form: {
            email: '',
            senha: ''
        },

        async realizarLogin() {
            if (!this.form.email || !this.form.senha) {
                alert("Preencha o e-mail e a senha.");
                return;
            }

            this.carregando = true;

            try {
                const dados = await apiRequest("/usuarios/login", {
                    method: "POST",
                    body: JSON.stringify({
                        email: this.form.email.trim().toLowerCase(),
                        senha: this.form.senha
                    })
                });

                const user = dados?.usuario;
                if (!user || typeof user !== "object") {
                    throw new Error("A API retornou dados de usuário inválidos.");
                }

                const destino = destinoPorPerfil(user);
                if (!destino) {
                    throw new Error("Este tipo de conta ainda não possui uma página de acesso.");
                }

                iniciarSessaoAuth(dados);
                try {
                    localStorage.setItem("user", JSON.stringify(user));
                } catch (erro) {
                    limparSessaoAuth();
                    throw erro;
                }

                window.location.href = destino;
            } catch (erro) {
                if ([401, 404, 409].includes(erro?.status)) {
                    alert("E-mail ou senha inválidos.");
                } else {
                    alert(erro?.message || "Não foi possível entrar. Tente novamente.");
                }
            } finally {
                this.carregando = false;
            }
        }
    };
};