async function carregarEmpresa() {
  const empresaId = new URLSearchParams(window.location.search).get("id");
  let empresa;

  try {
    empresa = normalizarEmpresa(await apiRequest(`/empresas/${encodeURIComponent(empresaId)}`));
  } catch (error) {
    console.error("Não foi possível carregar a empresa.", error);
  }

  if (!empresa) {
    document.title = "Empresa nao encontrada | Newsly";
    document.getElementById("company-name").textContent = "Empresa nao encontrada";
    document.getElementById("company-description").textContent =
      "Confira a lista de empresas e selecione uma opcao valida.";
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
    `Responsavel: ${empresa.responsavel} | ${empresa.integrantes} integrantes.`;
  document.getElementById("company-members").textContent =
    `${empresa.integrantes} integrantes`;

  const services = document.getElementById("company-services");
  services.innerHTML = empresa.servicos.map((servico, index) => `
    <li class="group flex items-center justify-between rounded-xl border border-border bg-background px-4 py-4">
      <span class="flex items-center gap-3">
        <span class="text-xs font-semibold text-muted">${String(index + 1).padStart(2, "0")}</span>
        <span class="text-sm font-semibold">${servico}</span>
      </span>
    </li>
  `).join("");

  const servicesGrid = document.getElementById("company-services-grid");
  servicesGrid.innerHTML = empresa.servicos.map(servico => `
    <article class="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h3 class="text-lg font-bold">${servico}</h3>
      <p class="mt-4 flex-1 text-sm leading-relaxed text-muted">
        Solucao personalizada desenvolvida de acordo com as necessidades da ${empresa.nome}.
      </p>
    </article>
  `).join("");

  const email = empresa.contato?.email || `${empresaId}@newsly.com`;
  const emailLink = document.getElementById("company-email");
  emailLink.href = `mailto:${email}`;
  emailLink.lastChild.textContent = ` ${email}`;
}

document.addEventListener("DOMContentLoaded", carregarEmpresa);
