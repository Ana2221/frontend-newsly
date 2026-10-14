# API Newsly — Mapeamento de Rotas

> Base URL: `http://localhost:8080`
> Content-Type: `application/json`

---

## Padrão de Erros

Todas as rotas retornam erros neste formato:

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Usuário não encontrado com id: 1",
  "timestamp": "2026-08-17T12:00:00"
}
```

Erros de validação incluem o campo `errors`:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Erro de validação nos campos enviados",
  "timestamp": "2026-08-17T12:00:00",
  "errors": [
    { "field": "nome", "message": "Nome é obrigatório" }
  ]
}
```

| Código | Significado |
|--------|-------------|
| `200` | OK |
| `201` | Criado com sucesso |
| `204` | Sem conteúdo (exclusão) |
| `400` | Dados inválidos |
| `404` | Recurso não encontrado |
| `409` | Conflito de negócio |
| `500` | Erro interno |

---

## Usuários `/usuarios`

### POST `/usuarios`
Cria um usuário do tipo informado no campo `tipo`.

**Request Body:**
```json
{
  "tipo": "COLABORADOR",
  "nome": "Ana Silva",
  "senha": "senha123",
  "contato": {
    "telefone": "11999999999",
    "email": "ana@email.com"
  },
  "atividade": true,
  "empresaId": 1,
  "permissoes": ["LEITOR", "ESCRITOR"]
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipo` | `TipoUsuario` | ✅ | `USUARIO`, `COLABORADOR`, `GESTOR` ou `RESPONSAVEL` |
| `nome` | `String` | ✅ | Máx. 150 caracteres |
| `senha` | `String` | ✅ | Entre 6 e 255 caracteres |
| `contato.telefone` | `String` | ❌ | Máx. 20 caracteres |
| `contato.email` | `String` | ❌ | Formato de e-mail válido |
| `atividade` | `Boolean` | ⚠️ | Obrigatório se `tipo = COLABORADOR` |
| `empresaId` | `Long` | ❌ | Obrigatório para `COLABORADOR` e `RESPONSAVEL` |
| `permissoes` | `List<Permissao>` | ❌ | `LEITOR`, `ESCRITOR`. Usado por `GESTOR` e `RESPONSAVEL` |

**Responses:**
- `201` — `CriarUsuarioResponseDTO` com o campo do tipo criado preenchido

---

### POST `/usuarios/login`
Autentica o usuário e retorna os dados do tipo real.

**Request Body:**
```json
{
  "email": "ana@email.com",
  "senha": "senha123"
}
```

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `email` | `String` | ✅ |
| `senha` | `String` | ✅ |

**Responses:**
- `200` — `ColaboradorResponseDTO` | `GestorResponseDTO` | `ResponsavelResponseDTO` (conforme o tipo do usuário)
- `404` — Usuário não encontrado
- `409` — E-mail ou senha inválidos

---

### GET `/usuarios`
Retorna todos os usuários com dados completos do tipo real.

**Responses:**
- `200` — `List<CriarUsuarioResponseDTO>`

---

### GET `/usuarios/{id}`
Retorna um usuário pelo ID com dados completos do tipo real.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `Long` | ID do usuário |

**Responses:**
- `200` — `CriarUsuarioResponseDTO`
- `404` — Usuário não encontrado

---

### PUT `/usuarios/{id}`
Atualiza os dados base do usuário. Campos `null` não sobrescrevem os valores originais.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `Long` | ID do usuário |

**Request Body:**
```json
{
  "nome": "Ana Costa",
  "senha": "novaSenha123",
  "contato": {
    "telefone": "11988888888",
    "email": "ana@email.com"
  }
}
```

**Responses:**
- `200` — `CriarUsuarioResponseDTO`
- `404` — Usuário não encontrado

---

### DELETE `/usuarios/{id}`

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | `Long` | ID do usuário |

**Responses:**
- `204` — Removido com sucesso
- `404` — Usuário não encontrado

---

## Colaboradores `/colaboradores`

### POST `/colaboradores`

**Request Body:**
```json
{
  "nome": "Ana Silva",
  "senha": "senha123",
  "contato": { "telefone": "11999999999", "email": "ana@email.com" },
  "atividade": true,
  "empresaId": 1
}
```

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `nome` | `String` | ❌ |
| `senha` | `String` | ❌ |
| `contato` | `ContatoRequestDTO` | ❌ |
| `atividade` | `Boolean` | ❌ |
| `empresaId` | `Long` | ❌ |

**Responses:** `201` — `ColaboradorResponseDTO`

---

### GET `/colaboradores` — `200` `List<ColaboradorResponseDTO>`
### GET `/colaboradores/{id}` — `200` `ColaboradorResponseDTO` / `404`
### PUT `/colaboradores/{id}` — `200` `ColaboradorResponseDTO` / `404`
### DELETE `/colaboradores/{id}` — `204` / `404`

**ColaboradorResponseDTO:**
```json
{
  "id": 1,
  "matricula": "uuid",
  "nome": "Ana Silva",
  "atividade": true,
  "contato": { "telefone": "...", "email": "..." },
  "empresaId": 1,
  "tipo": "COLABORADOR"
}
```

---

## Gestores `/gestores`

### POST `/gestores`

**Request Body:**
```json
{
  "nome": "Carlos Lima",
  "senha": "senha123",
  "contato": { "telefone": "11999999999", "email": "carlos@email.com" },
  "permissoes": ["LEITOR", "ESCRITOR"]
}
```

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `nome` | `String` | ✅ |
| `senha` | `String` | ✅ |
| `contato` | `ContatoRequestDTO` | ❌ |
| `permissoes` | `List<Permissao>` | ❌ |

**Responses:** `201` — `GestorResponseDTO`

---

### GET `/gestores` — `200` `List<GestorResponseDTO>`
### GET `/gestores/{id}` — `200` `GestorResponseDTO` / `404`
### PUT `/gestores/{id}` — `200` `GestorResponseDTO` / `404`
### DELETE `/gestores/{id}` — `204` / `404`

**GestorResponseDTO:**
```json
{
  "id": 2,
  "matricula": "uuid",
  "nome": "Carlos Lima",
  "contato": { "telefone": "...", "email": "..." },
  "permissoes": ["ESCRITOR"],
  "tipo": "GESTOR"
}
```

---

## Responsáveis `/responsaveis`

### POST `/responsaveis`

**Request Body:**
```json
{
  "nome": "Maria Costa",
  "senha": "senha123",
  "contato": { "telefone": "11999999999", "email": "maria@email.com" },
  "permissoes": ["ESCRITOR"],
  "empresaId": 1
}
```

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `nome` | `String` | ✅ |
| `senha` | `String` | ✅ |
| `contato` | `ContatoRequestDTO` | ❌ |
| `permissoes` | `List<Permissao>` | ❌ |
| `empresaId` | `Long` | ❌ |

**Responses:** `201` — `ResponsavelResponseDTO`
> `409` se a empresa já possuir um responsável cadastrado.

---

### GET `/responsaveis` — `200` `List<ResponsavelResponseDTO>`
### GET `/responsaveis/{id}` — `200` `ResponsavelResponseDTO` / `404`
### PUT `/responsaveis/{id}` — `200` `ResponsavelResponseDTO` / `404`
### DELETE `/responsaveis/{id}` — `204` / `404`

**ResponsavelResponseDTO:**
```json
{
  "id": 3,
  "matricula": "uuid",
  "nome": "Maria Costa",
  "contato": { "telefone": "...", "email": "..." },
  "permissoes": ["ESCRITOR"],
  "empresaId": 1,
  "tipo": "RESPONSAVEL"
}
```

---

## Empresas `/empresas`

### POST `/empresas`

**Request Body:**
```json
{
  "nome": "Nite Jr",
  "cnpj": "12.345.678/0001-90"
}
```

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| `nome` | `String` | ✅ | Máx. 150 caracteres |
| `cnpj` | `String` | ✅ | Formato `XX.XXX.XXX/XXXX-XX` |

**Responses:** `201` — `EmpresaJrResponseDTO`
> `409` se o CNPJ já estiver cadastrado.

---

### PATCH `/empresas/adicionar-membro/{idmembro}/{idempresa}`
Adiciona um colaborador à empresa.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `idmembro` | `Long` | ID do colaborador |
| `idempresa` | `Long` | ID da empresa |

**Responses:** `200`

---

### GET `/empresas` — `200` `List<EmpresaJrResponseDTO>`
### GET `/empresas/{id}` — `200` `EmpresaJrResponseDTO` / `404`
### PUT `/empresas/{id}` — `200` `EmpresaJrResponseDTO` / `404`
### DELETE `/empresas/{id}` — `204` / `404`

**EmpresaJrResponseDTO:**
```json
{
  "id": 1,
  "nome": "Nite Jr",
  "cnpj": "12.345.678/0001-90",
  "colaboradores": [ ...ColaboradorResponseDTO ],
  "diretorias": [ ...DiretoriaResponseDTO ],
  "noticias": [ ...NoticiaResponseDTO ]
}
```

---

## Diretorias `/diretorias`

### POST `/diretorias`

**Request Body:**
```json
{
  "criadaEm": "2024-01-01",
  "empresaId": 1
}
```

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `criadaEm` | `LocalDate` | ❌ |
| `empresaId` | `Long` | ✅ |

**Responses:** `201` — `DiretoriaResponseDTO`

---

### GET `/diretorias` — `200` `List<DiretoriaResponseDTO>`
### GET `/diretorias/{id}` — `200` `DiretoriaResponseDTO` / `404`
### PUT `/diretorias/{id}` — `200` `DiretoriaResponseDTO` / `404`
### DELETE `/diretorias/{id}` — `204` / `404`

**DiretoriaResponseDTO:**
```json
{
  "id": 1,
  "criadaEm": "2024-01-01",
  "empresaId": 1,
  "empresaNome": "Nite Jr",
  "diretores": [
    {
      "id": 5,
      "colaboradorId": 5,
      "colaboradorNome": "Ana Silva",
      "funcao": { "id": 1, "nome": "Presidente", "descricao": "..." },
      "permissoes": ["ESCRITOR"]
    }
  ]
}
```

---

## Diretores `/diretores`

### POST `/diretores`

**Request Body:**
```json
{
  "colaboradorId": 5,
  "funcaoId": 1,
  "diretoriaId": 1,
  "permissoes": ["ESCRITOR"]
}
```

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `colaboradorId` | `Long` | ✅ |
| `funcaoId` | `Long` | ✅ |
| `diretoriaId` | `Long` | ✅ |
| `permissoes` | `List<Permissao>` | ❌ |

**Responses:** `201` — `DiretorResponseDTO`
> `409` se o colaborador já for diretor.

---

### GET `/diretores` — `200` `List<DiretorResponseDTO>`
### GET `/diretores/{id}` — `200` `DiretorResponseDTO` / `404`
### PUT `/diretores/{id}` — `200` `DiretorResponseDTO` / `404`
### DELETE `/diretores/{id}` — `204` / `404`

**DiretorResponseDTO:**
```json
{
  "id": 5,
  "colaboradorId": 5,
  "colaboradorNome": "Ana Silva",
  "funcao": { "id": 1, "nome": "Presidente", "descricao": "..." },
  "diretoria": { "id": 1, "criadaEm": "2024-01-01", "empresaId": 1, "empresaNome": "Nite Jr", "diretores": [] },
  "permissoes": ["ESCRITOR"]
}
```

---

## Funções `/funcoes`

### POST `/funcoes`

**Request Body:**
```json
{
  "nome": "Presidente",
  "descricao": "Responsável pela gestão geral"
}
```

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| `nome` | `String` | ✅ | Máx. 100 caracteres |
| `descricao` | `String` | ❌ | Máx. 500 caracteres |

**Responses:** `201` — `FuncaoResponseDTO`
> `409` se já existir uma função com o mesmo nome.

---

### GET `/funcoes` — `200` `List<FuncaoResponseDTO>`
### GET `/funcoes/{id}` — `200` `FuncaoResponseDTO` / `404`
### PUT `/funcoes/{id}` — `200` `FuncaoResponseDTO` / `404`
### DELETE `/funcoes/{id}` — `204` / `404`

**FuncaoResponseDTO:**
```json
{
  "id": 1,
  "nome": "Presidente",
  "descricao": "Responsável pela gestão geral"
}
```

---

## Notícias `/noticias`

### POST `/noticias`

**Request Body:**
```json
{
  "titulo": "Nova parceria firmada",
  "conteudo": "A empresa firmou uma nova parceria...",
  "publicadaEm": "2026-08-17T10:00:00",
  "empresaId": 1
}
```

| Campo | Tipo | Obrigatório | Validação |
|-------|------|-------------|-----------|
| `titulo` | `String` | ✅ | Máx. 255 caracteres |
| `conteudo` | `String` | ✅ | — |
| `publicadaEm` | `LocalDateTime` | ✅ | — |
| `empresaId` | `Long` | ✅ | — |

**Responses:** `201` — `NoticiaResponseDTO`

---

### GET `/noticias` — `200` `List<NoticiaResponseDTO>`
### GET `/noticias/{id}` — `200` `NoticiaResponseDTO` / `404`
### PUT `/noticias/{id}` — `200` `NoticiaResponseDTO` / `404`
### DELETE `/noticias/{id}` — `204` / `404`

**NoticiaResponseDTO:**
```json
{
  "id": 1,
  "titulo": "Nova parceria firmada",
  "conteudo": "...",
  "publicadaEm": "2026-08-17T10:00:00",
  "empresaId": 1,
  "empresaNome": "Nite Jr"
}
```

---

## Solicitações de Publicação `/solicitacoes`

O responsável cria a notícia e envia sua solicitação para um gestor específico. O gestor pode aceitar ou recusar solicitações pendentes; o responsável pode cancelar as suas enquanto estiverem pendentes.

### POST `/solicitacoes`

**Request Body:**
```json
{
  "responsavelId": 1,
  "gestorId": 2,
  "noticiaId": 3
}
```

**Responses:** `201` — `SolicitacaoResponseDTO` / `404` se uma referência não existir / `409` se já houver solicitação pendente para a mesma notícia e gestor.

### PATCH `/solicitacoes/{id}/aceitar`
Aceita uma solicitação pendente. Somente o gestor destinatário pode executar esta ação.

### PATCH `/solicitacoes/{id}/recusar`
Recusa uma solicitação pendente. Somente o gestor destinatário pode executar esta ação.

**Request Body (opcional):** `{ "motivoRecusa": "Conteúdo fora do padrão." }`

### PATCH `/solicitacoes/{id}/cancelar`
Cancela uma solicitação pendente. Somente o responsável que a criou pode executar esta ação.

### GET `/solicitacoes`
### GET `/solicitacoes/{id}`
### GET `/solicitacoes/responsavel/{responsavelId}`
### GET `/solicitacoes/gestor/{gestorId}`
### GET `/solicitacoes/gestor/{gestorId}/pendentes`

As listagens por responsável e gestor retornam todos os status; a rota `/pendentes` retorna somente solicitações pendentes do gestor.

**SolicitacaoResponseDTO:** `id`, `responsavelId`, `responsavelNome`, `gestorId`, `gestorNome`, `noticiaId`, `noticiaTitulo`, `status`, `criadaEm`, `respondidaEm` (opcional) e `motivoRecusa` (opcional). Os status possíveis são `PENDENTE`, `ACEITA`, `RECUSADA` e `CANCELADA`.

---

## Comentários `/comentarios`

### POST `/comentarios`

**Request Body:**
```json
{
  "conteudo": "Ótima notícia!",
  "publicadoEm": "2026-08-17T11:00:00",
  "noticiaId": 1,
  "comentarioPaiId": null
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `conteudo` | `String` | ✅ | — |
| `publicadoEm` | `LocalDateTime` | ✅ | — |
| `noticiaId` | `Long` | ✅ | — |
| `comentarioPaiId` | `Long` | ❌ | Informar para criar uma resposta a outro comentário |

**Responses:** `201` — `ComentarioResponseDTO`

---

### GET `/comentarios` — `200` `List<ComentarioResponseDTO>`
### GET `/comentarios/{id}` — `200` `ComentarioResponseDTO` / `404`
### GET `/comentarios/noticia/{noticiaId}` — `200` `List<ComentarioResponseDTO>` (apenas comentários raiz)
### PUT `/comentarios/{id}` — `200` `ComentarioResponseDTO` / `404`
### DELETE `/comentarios/{id}` — `204` / `404`

**ComentarioResponseDTO:**
```json
{
  "id": 1,
  "conteudo": "Ótima notícia!",
  "publicadoEm": "2026-08-17T11:00:00",
  "noticiaId": 1,
  "comentarioPaiId": null,
  "respostas": [
    {
      "id": 2,
      "conteudo": "Concordo!",
      "publicadoEm": "2026-08-17T11:05:00",
      "noticiaId": 1,
      "comentarioPaiId": 1,
      "respostas": []
    }
  ]
}
```

---

## Resumo de Todas as Rotas

| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| `POST` | `/usuarios` | Cria usuário (qualquer tipo) | `201` |
| `POST` | `/usuarios/login` | Login | `200` |
| `GET` | `/usuarios` | Lista todos os usuários | `200` |
| `GET` | `/usuarios/{id}` | Busca usuário por ID | `200` |
| `PUT` | `/usuarios/{id}` | Atualiza dados base | `200` |
| `DELETE` | `/usuarios/{id}` | Remove usuário | `204` |
| `POST` | `/colaboradores` | Cria colaborador | `201` |
| `GET` | `/colaboradores` | Lista colaboradores | `200` |
| `GET` | `/colaboradores/{id}` | Busca colaborador | `200` |
| `PUT` | `/colaboradores/{id}` | Atualiza colaborador | `200` |
| `DELETE` | `/colaboradores/{id}` | Remove colaborador | `204` |
| `POST` | `/gestores` | Cria gestor | `201` |
| `GET` | `/gestores` | Lista gestores | `200` |
| `GET` | `/gestores/{id}` | Busca gestor | `200` |
| `PUT` | `/gestores/{id}` | Atualiza gestor | `200` |
| `DELETE` | `/gestores/{id}` | Remove gestor | `204` |
| `POST` | `/responsaveis` | Cria responsável | `201` |
| `GET` | `/responsaveis` | Lista responsáveis | `200` |
| `GET` | `/responsaveis/{id}` | Busca responsável | `200` |
| `PUT` | `/responsaveis/{id}` | Atualiza responsável | `200` |
| `DELETE` | `/responsaveis/{id}` | Remove responsável | `204` |
| `POST` | `/empresas` | Cria empresa | `201` |
| `PATCH` | `/empresas/adicionar-membro/{idmembro}/{idempresa}` | Adiciona membro | `200` |
| `GET` | `/empresas` | Lista empresas | `200` |
| `GET` | `/empresas/{id}` | Busca empresa | `200` |
| `PUT` | `/empresas/{id}` | Atualiza empresa | `200` |
| `DELETE` | `/empresas/{id}` | Remove empresa | `204` |
| `POST` | `/diretorias` | Cria diretoria | `201` |
| `GET` | `/diretorias` | Lista diretorias | `200` |
| `GET` | `/diretorias/{id}` | Busca diretoria | `200` |
| `PUT` | `/diretorias/{id}` | Atualiza diretoria | `200` |
| `DELETE` | `/diretorias/{id}` | Remove diretoria | `204` |
| `POST` | `/diretores` | Cria diretor | `201` |
| `GET` | `/diretores` | Lista diretores | `200` |
| `GET` | `/diretores/{id}` | Busca diretor | `200` |
| `PUT` | `/diretores/{id}` | Atualiza diretor | `200` |
| `DELETE` | `/diretores/{id}` | Remove diretor | `204` |
| `POST` | `/funcoes` | Cria função | `201` |
| `GET` | `/funcoes` | Lista funções | `200` |
| `GET` | `/funcoes/{id}` | Busca função | `200` |
| `PUT` | `/funcoes/{id}` | Atualiza função | `200` |
| `DELETE` | `/funcoes/{id}` | Remove função | `204` |
| `POST` | `/noticias` | Cria notícia | `201` |
| `GET` | `/noticias` | Lista notícias | `200` |
| `GET` | `/noticias/{id}` | Busca notícia | `200` |
| `PUT` | `/noticias/{id}` | Atualiza notícia | `200` |
| `DELETE` | `/noticias/{id}` | Remove notícia | `204` |
| `POST` | `/solicitacoes` | Envia solicitação de publicação | `201` |
| `PATCH` | `/solicitacoes/{id}/aceitar` | Gestor aceita solicitação | `200` |
| `PATCH` | `/solicitacoes/{id}/recusar` | Gestor recusa solicitação | `200` |
| `PATCH` | `/solicitacoes/{id}/cancelar` | Responsável cancela solicitação | `200` |
| `GET` | `/solicitacoes` | Lista solicitações | `200` |
| `GET` | `/solicitacoes/{id}` | Busca solicitação | `200` |
| `GET` | `/solicitacoes/responsavel/{responsavelId}` | Solicitações do responsável | `200` |
| `GET` | `/solicitacoes/gestor/{gestorId}` | Solicitações do gestor | `200` |
| `GET` | `/solicitacoes/gestor/{gestorId}/pendentes` | Pendentes do gestor | `200` |
| `POST` | `/comentarios` | Cria comentário | `201` |
| `GET` | `/comentarios` | Lista comentários | `200` |
| `GET` | `/comentarios/{id}` | Busca comentário | `200` |
| `GET` | `/comentarios/noticia/{noticiaId}` | Comentários raiz por notícia | `200` |
| `PUT` | `/comentarios/{id}` | Atualiza comentário | `200` |
| `DELETE` | `/comentarios/{id}` | Remove comentário | `204` |
