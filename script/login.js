window.loginController = function () {
    return {
        carregando: false,

        form: {
            email: '',
            senha: ''
        },

        async realizarLogin() {
            console.log("Realizando login com os dados:", this.form);

            if (!this.form.email || !this.form.senha) {
                alert("Preencha email e senha.");
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

                const user = dados || {};
                const userRole = (user.tipo || user.role || "").toUpperCase();

                const pages = {
                    RESPONSAVEL: "../Empresa/nexus.html",
                    COLABORADOR: "home.html",
                    GESTOR: "../Gestor/gestor.html"
                };

                localStorage.setItem("user", JSON.stringify(user));

                const destino = pages[userRole];
                if (!destino) {
                    throw new Error(`Tipo de usuário sem página: ${userRole || "indefinido"}`);
                }

                window.location.href = destino;
            } catch (erro) {
                console.error(erro);
                alert(erro?.message || "Email ou senha inválidos.");
            } finally {
                this.carregando = false;
            }
        }
    };
};