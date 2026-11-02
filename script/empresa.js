async function carregarEmpresa() {
  const empresaId = new URLSearchParams(window.location.search).get("id");
  let empresa;

  try {
    empresa = normalizarEmpresa(await apiRequest(`/empresas/${encodeURIComponent(empresaId)}`));
  } catch (error) {
    console.error("Não foi possível carregar a empresa.", error);
  }

  if (!empresa) {
    document.title = "Empresa não encontrada | Newsly";
    document.getElementById("company-name").textContent = "Empresa não encontrada";
    document.getElementById("company-description").textContent =
      "Confira a lista de empresas e selecione uma opção válida.";
    return;
  }

  document.title = `${empresa.nome} | Newsly`;
  document.getElementById("company-name").textContent = empresa.nome;
  document.getElementById("company-year").textContent = empresa.ano;
  document.getElementById("company-description").textContent = empresa.descricao;
  const cover = document.getElementById("company-cover");
  // cover.src = empresa.capa;
  // cover.alt = `Imagem da ${empresa.nome}`;
  // cover.onerror = () => {
  //   cover.src = `../static/${empresa.nome}.svg`;
  // };
  const logo = document.getElementById("company-logo");
  logo.src = empresa.logo;
  logo.alt = `Logo da ${empresa.nome}`;
  logo.onerror = () => {
    logo.onerror = null;
    logo.src = "../static/Union.svg";
  };
  document.getElementById("company-about").textContent = empresa.sobre;
  document.getElementById("company-contact").textContent =
    `Responsável: ${empresa.responsavel} | ${empresa.integrantes} ${Number(empresa.integrantes) === 1 ? "integrante" : "integrantes"}.`;
  document.getElementById("company-members").textContent =
    `${empresa.integrantes} integrantes`;

  const services = document.getElementById("company-services");
  services.replaceChildren(...empresa.servicos.map((servico, index) => {
    const item = document.createElement("li");
    item.className = "group flex items-center justify-between rounded-xl border border-border bg-background px-4 py-4";

    const content = document.createElement("span");
    content.className = "flex items-center gap-3";

    const number = document.createElement("span");
    number.className = "text-xs font-semibold text-muted";
    number.textContent = String(index + 1).padStart(2, "0");

    const name = document.createElement("span");
    name.className = "text-sm font-semibold";
    name.textContent = String(servico);

    content.append(number, name);
    item.append(content);
    return item;
  }));

  const servicesGrid = document.getElementById("company-services-grid");
  servicesGrid.replaceChildren(...empresa.servicos.map(servico => {
    const article = document.createElement("article");
    article.className = "flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft";

    const title = document.createElement("h3");
    title.className = "text-lg font-bold";
    title.textContent = String(servico);

    const description = document.createElement("p");
    description.className = "mt-4 flex-1 text-sm leading-relaxed text-muted";
    description.textContent = `Solução personalizada desenvolvida de acordo com as necessidades da ${empresa.nome}.`;

    article.append(title, description);
    return article;
  }));

  const email = empresa.contato?.email || `${empresaId}@newsly.com`;
  const emailLink = document.getElementById("company-email");
  emailLink.href = `mailto:${email}`;
  emailLink.lastChild.textContent = ` ${email}`;
}

document.addEventListener("DOMContentLoaded", carregarEmpresa);
