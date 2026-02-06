// ============================
// SUPABASE CONFIG
// ============================
const SUPABASE_URL = "https://nidtmahrtqkanpgbnkss.supabase.co";
const SUPABASE_KEY = "sb_publishable_o2ER95WiJiKbeS1ax0SRKA_3yDQEMBC";

const supabase = supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);

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

  const { error } = await supabase
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
  const { data, error } = await supabase
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
  await supabase
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
