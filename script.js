// ============================
// SUPABASE CONFIG
// ============================
const SUPABASE_URL = "https://nidtmahrtqkanpgbnkss.supabase.co";
const SUPABASE_KEY = "sb_publishable_o2ER95WiJiKbeS1ax0SRKA_3yDQEMBC";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================
// HELPERS
// ============================
function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  const valor = document.getElementById("valor").value;
  const vencimento = document.getElementById("vencimento").value;
  const fixa = document.getElementById("fixa").checked;

  if (!descricao || !valor) {
    alert("Preencha descrição e valor.");
    return;
  }

  const { error } = await supabaseClient
    .from("contas")
    .insert([
      {
        descricao,
        valor,
        vencimento: vencimento || null,
        fixa,
        paga: false,
        mes: mesAtual()
      }
    ]);

  if (error) {
    alert("Erro ao salvar conta");
    console.error(error);
  } else {
    limparFormulario();
    carregarContas();
  }
}

// ============================
// LISTAR CONTAS
// ============================
async function carregarContas() {
  const { data, error } = await supabaseClient
    .from("contas")
    .select("*")
    .order("created_at", { ascending: false });

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
  await supabaseClient
    .from("contas")
    .update({ paga: true })
    .eq("id", id);

  carregarContas();
}

// ============================
// RENDER
// ============================
function renderizar(contas) {
  const lista = document.getElementById("listaContas");
  lista.innerHTML = "";

  contas.forEach(c => {
    const card = document.createElement("div");
    card.className = "card";

    if (c.paga) card.classList.add("paga");

    card.innerHTML = `
      <h3>${c.descricao}</h3>
      <p>R$ ${parseFloat(c.valor).toFixed(2)}</p>
      <p>Vencimento: ${c.vencimento || "não informado"}</p>
      <p>Tipo: ${c.fixa ? "Fixa" : "Avulsa"}</p>
      ${!c.paga ? `<button onclick="pagarConta('${c.id}')">Pagar</button>` : ""}
    `;

    lista.appendChild(card);
  });
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

// ==============================
// LISTA DE CONTAS
// ==============================
let contas = [];

function addConta() {
    const descricao = document.getElementById("descricao").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const vencimento = document.getElementById("vencimento").value;
    const fixa = document.getElementById("fixa").checked;

    if (!descricao || !valor || !vencimento) {
        alert("Preencha todos os campos!");
        return;
    }

    contas.push({
        descricao,
        valor,
        vencimento,
        fixa,
        status: "aberta"
    });

    renderContas();
    openTab("tab-list");

    // limpar campos
    document.getElementById("descricao").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("vencimento").value = "";
    document.getElementById("fixa").checked = false;
}

// ==============================
// RENDERIZAÇÃO
// ==============================
function renderContas() {
    const lista = document.getElementById("listaContas");
    lista.innerHTML = "";

    // Agrupar por mês
    const grupos = {};
    contas.forEach(c => {
        const mes = new Date(c.vencimento).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
        if (!grupos[mes]) grupos[mes] = [];
        grupos[mes].push(c);
    });

    // Criar HTML
    for (const mes in grupos) {
        const header = document.createElement("div");
        header.className = "mes-header";
        header.textContent = mes;
        lista.appendChild(header);

        const body = document.createElement("div");
        body.className = "mes-body";

        grupos[mes].forEach(c => {
            const card = document.createElement("div");
            card.className = `card-conta ${c.status}`;

            const info = document.createElement("div");
            info.className = "info";
            info.innerHTML = `
                <span>${c.descricao}</span>
                <span>R$ ${c.valor.toFixed(2)} - Vencimento: ${new Date(c.vencimento).toLocaleDateString("pt-BR")}</span>
            `;

            const acoes = document.createElement("div");
            acoes.className = "acoes";

            const btnPagar = document.createElement("button");
            btnPagar.textContent = "Pagar";
            btnPagar.onclick = () => {
                c.status = "paga";
                renderContas();
            };

            const btnExcluir = document.createElement("button");
            btnExcluir.textContent = "Excluir";
            btnExcluir.onclick = () => {
                contas = contas.filter(x => x !== c);
                renderContas();
            };

            acoes.appendChild(btnPagar);
            acoes.appendChild(btnExcluir);

            card.appendChild(info);
            card.appendChild(acoes);
            body.appendChild(card);
        });

        lista.appendChild(body);
    }
}
