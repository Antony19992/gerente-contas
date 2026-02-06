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

// ============================
// LOAD
// ============================
document.addEventListener("DOMContentLoaded", () => {
  carregarContas();
});

// ============================
// ADICIONAR CONTA
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
    .insert([
      {
        descricao,
        valor,
        vencimento,
        fixa,
        paga: false,
        mes: mesLabel(vencimento)
      }
    ]);

  if (error) {
    alert("Erro ao salvar conta");
    console.error(error);
  } else {
    limparFormulario();
    carregarContas();
    openTab("tab-list");
  }
}

// ============================
// LISTAR CONTAS
// ============================
async function carregarContas() {
  const { data, error } = await supabaseClient
    .from("contas")
    .select("*")
    .order("vencimento", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  renderizar(data);
}

// ============================
// PAGAR CONTA
// ============================
async function pagarConta(id) {
  const { error } = await supabaseClient
    .from("contas")
    .update({ paga: true })
    .eq("id", id);

  if (error) console.error(error);
  carregarContas();
}

// ============================
// EXCLUIR CONTA
// ============================
async function excluirConta(id) {
  const { error } = await supabaseClient
    .from("contas")
    .delete()
    .eq("id", id);

  if (error) console.error(error);
  carregarContas();
}

// ============================
// RENDER
// ============================
function renderizar(contas) {
  const lista = document.getElementById("listaContas");
  lista.innerHTML = "";

  // Agrupar por mês
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

// ============================
// LIMPAR
// ============================
function limparFormulario() {
  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
  document.getElementById("vencimento").value = "";
  document.getElementById("fixa").checked = false;
}

// ==============================
// CONTROLE DE ABAS
// ==============================
function openTab(tabId) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tabId).classList.add("active");
}
