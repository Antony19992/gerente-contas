// ============================
// SUPABASE CONFIG
// ============================
const SUPABASE_URL = "https://nidtmahrtqkanpgbnkss.supabase.co";
const SUPABASE_KEY = "sb_publishable_o2ER95WiJiKbeS1ax0SRKA_3yDQEMBC";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================
// HELPERS
// ============================
function mesLabel(dateStr) {
  if (!dateStr) return "Sem vencimento";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function statusClass(conta) {
  if (conta.paga) return "paga";
  if (conta.vencimento && new Date(conta.vencimento) < new Date()) return "atrasada";
  return "aberta";
}

function primeiroDiaProximoMes() {
  const hoje = new Date();
  const ano = hoje.getMonth() === 11 ? hoje.getFullYear() + 1 : hoje.getFullYear();
  const mes = hoje.getMonth() === 11 ? 0 : hoje.getMonth() + 1;
  return new Date(ano, mes, 1);
}

// ============================
// LOAD
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  await gerarFixasProximoMes();
  carregarContas();
  carregarEntradas();
});

// ============================
// CONTAS
// ============================
async function addConta() {
  const descricao = document.getElementById("descricao").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const vencimento = document.getElementById("vencimento").value;
  const fixa = document.getElementById("fixa").checked;

  if (!descricao || !valor || !vencimento) {
    alert("Preencha todos os campos!");
    return;
  }

  const { error } = await supabaseClient
    .from("contas")
    .insert([{ descricao, valor, vencimento, fixa, paga: false, mes: mesLabel(vencimento) }]);

  if (error) {
    alert("Erro ao salvar conta");
    console.error(error);
  } else {
    limparFormularioConta();
    carregarContas();
    openTab("tab-list");
  }
}

async function carregarContas() {
  const { data, error } = await supabaseClient
    .from("contas")
    .select("*")
    .order("vencimento", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }
  renderizarContas(data);
}

async function pagarConta(id) {
  const { error } = await supabaseClient.from("contas").update({ paga: true }).eq("id", id);
  if (error) console.error(error);
  carregarContas();
}

async function excluirConta(id) {
  const { error } = await supabaseClient.from("contas").delete().eq("id", id);
  if (error) console.error(error);
  carregarContas();
}

function renderizarContas(contas) {
  const lista = document.getElementById("listaContas");
  lista.innerHTML = "";

  const abertas = contas.filter(c => !c.paga);
  const pagas = contas.filter(c => c.paga);

  renderizarGrupoContas(abertas, lista, "Contas em aberto / atrasadas");
  renderizarGrupoContas(pagas, lista, "Contas pagas");
}

function renderizarGrupoContas(contas, lista, titulo) {
  if (contas.length === 0) return;

  const tituloDiv = document.createElement("div");
  tituloDiv.className = "grupo-titulo";
  tituloDiv.textContent = titulo;
  lista.appendChild(tituloDiv);

  const grupos = {};
  contas.forEach(c => {
    const mes = mesLabel(c.vencimento);
    if (!grupos[mes]) grupos[mes] = [];
    grupos[mes].push(c);
  });

  for (const mes in grupos) {
    const header = document.createElement("div");
    header.className = "mes-header";
    header.textContent = mes;
    lista.appendChild(header);

    const body = document.createElement("div");
    body.className = "mes-body";

    grupos[mes].forEach(c => {
      const card = document.createElement("div");
      card.className = `card-conta ${statusClass(c)}`;

      const info = document.createElement("div");
      info.className = "info";
      info.innerHTML = `
        <span>${c.descricao}</span>
        <span>R$ ${parseFloat(c.valor).toFixed(2)} - Vencimento: ${c.vencimento ? new Date(c.vencimento).toLocaleDateString("pt-BR") : "não informado"}</span>
        <span>${c.fixa ? "Conta fixa" : "Conta avulsa"}</span>
      `;

      const acoes = document.createElement("div");
      acoes.className = "acoes";

      if (!c.paga) {
        const btnPagar = document.createElement("button");
        btnPagar.textContent = "Pagar";
        btnPagar.onclick = () => pagarConta(c.id);
        acoes.appendChild(btnPagar);
      }

      const btnExcluir = document.createElement("button");
      btnExcluir.textContent = "Excluir";
      btnExcluir.onclick = () => excluirConta(c.id);
      acoes.appendChild(btnExcluir);

      card.appendChild(info);
      card.appendChild(acoes);
      body.appendChild(card);
    });

    lista.appendChild(body);
  }
}

function limparFormularioConta() {
  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("vencimento").value = "";
  document.getElementById("fixa").checked = false;
}

// ==============================
// CONTROLE DE ABAS
// ==============================
function openTab(tabId) {
  // Remove a classe "active" de todas as abas
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  // Adiciona a classe "active" apenas na aba selecionada
  const target = document.getElementById(tabId);
  if (target) {
    target.classList.add("active");
  }
}



async function gerarFixasProximoMes() {
  const proximoMesData = primeiroDiaProximoMes();
  const proximoMesLabel = mesLabel(proximoMesData.toISOString().split("T")[0]);

  const { data: existentes } = await supabaseClient
    .from("contas")
    .select("*")
    .eq("mes", proximoMesLabel)
    .eq("fixa", true);

  if (existentes && existentes.length > 0) return;

  const { data: fixas } = await supabaseClient.from("contas").select("*").eq("fixa", true);

  const novas = fixas.map(c => ({
    descricao: c.descricao,
    valor: c.valor,
    vencimento: proximoMesData.toISOString().split("T")[0],
    fixa: true,
    paga: false,
    mes: proximoMesLabel
  }));

  if (novas.length > 0) {
    await supabaseClient.from("contas").insert(novas);
  }
}

// ============================
// ENTRADAS (GANHOS)
// ============================
async function addEntrada() {
  const descricao = document.getElementById("descricaoEntrada").value;
  const valor = parseFloat(document.getElementById("valorEntrada").value);
  const data = document.getElementById("dataEntrada").value;
  const fixa = document.getElementById("fixaEntrada").checked;

  if (!descricao || !valor || !data) {
    alert("Preencha todos os campos!");
    return;
  }

  const { error } = await supabaseClient
    .from("entradas")
    .insert([{ descricao, valor, data, fixa }]);

  if (error) {
    alert("Erro ao salvar entrada");
    console.error(error);
  } else {
    limparFormEntrada();
    carregarEntradas();
  }
}

async function carregarEntradas() {
  const { data, error } = await supabaseClient
    .from("entradas")
    .select("*")
    .order("data", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }
  renderizarEntradas(data);
}

function renderizarEntradas(entradas) {
  const lista = document.getElementById("entradas");
  lista.innerHTML = "";

  if (entradas.length === 0) {
    lista.textContent = "Nenhuma entrada cadastrada.";
    return;
  }

  entradas.forEach(e => {
    const card = document.createElement("div");
    card.className = "card-entrada";

    card.innerHTML = `
      <div class="entrada-header">
        <h3>${e.descricao}</h3>
        <span class="valor">R$ ${parseFloat(e.valor).toFixed(2)}</span>
      </div>
      <div class="entrada-body">
        <p><strong>Data:</strong> ${new Date(e.data).toLocaleDateString("pt-BR")}</p>
        <p><strong>Tipo:</strong> ${e.fixa ? "Renda fixa" : "Entrada avulsa"}</p>
      </div>
    `;

    lista.appendChild(card);
  });
}

function limparFormEntrada() {
  document.getElementById("descricaoEntrada").value = "";
  document.getElementById("valorEntrada").value = "";
  document.getElementById("dataEntrada").value = "";
  document.getElementById("fixaEntrada").checked
}