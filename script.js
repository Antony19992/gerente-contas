let db;
let SQL;

// ================= INIT =================

initSqlJs({
  locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${f}`
}).then(sql => {
  SQL = sql;
  localStorage.removeItem("db"); // RESET TOTAL
  createDatabase();
});

// ================= DATABASE =================

function createDatabase(){

  db = new SQL.Database();

  db.run(`
    CREATE TABLE contas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descricao TEXT NOT NULL,
      valor REAL NOT NULL,
      vencimento TEXT NOT NULL,
      fixa INTEGER DEFAULT 0,
      paga INTEGER DEFAULT 0,
      mes TEXT NOT NULL
    )
  `);

  saveDB();
  render();
}

function saveDB(){
  const data = db.export();
  localStorage.setItem("db", btoa(String.fromCharCode(...data)));
}

// ================= ABAS =================

function openTab(tab){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.getElementById(tab).classList.add("active");
}

// ================= ADD =================

function addConta(){

  const d = desc.value.trim();
  const v = parseFloat(valor.value);
  const venc = vencimento.value;
  const fixa = document.getElementById("fixa").checked ? 1 : 0;

  if(!d || !v || !venc){
    alert("Preencha todos os campos");
    return;
  }

  const mes = venc.slice(0,7);

  db.run(`
    INSERT INTO contas
    (descricao,valor,vencimento,fixa,paga,mes)
    VALUES (?,?,?,?,0,?)
  `,[d,v,venc,fixa,mes]);

  saveDB();

  desc.value="";
  valor.value="";
  vencimento.value="";
  fixa.checked=false;

  render();
  openTab("tab-list");
}

// ================= FIXAS =================

function gerarFixas(){

  const mesAtual = new Date().toISOString().slice(0,7);

  const res = db.exec(`
    SELECT descricao,valor,vencimento
    FROM contas
    WHERE fixa=1 AND mes!=?
  `,[mesAtual]);

  if(!res.length) return;

  res[0].values.forEach(c=>{
    db.run(`
      INSERT INTO contas
      (descricao,valor,vencimento,fixa,paga,mes)
      VALUES (?,?,?,1,0,?)
    `,[c[0],c[1],`${mesAtual}-05`,mesAtual]);
  });

  saveDB();
}

// ================= PAGAR =================

function pagar(id){
  db.run(`UPDATE contas SET paga=1 WHERE id=?`,[id]);
  saveDB();
  render();
}

// ================= RENDER =================

function render(){

  gerarFixas();

  const lista = document.getElementById("lista");
  lista.innerHTML="";

  const res = db.exec(`
    SELECT * FROM contas
    ORDER BY mes DESC, vencimento
  `);

  if(!res.length){
    lista.innerHTML="<p>Nenhuma conta cadastrada</p>";
    return;
  }

  const grupos={};

  res[0].values.forEach(c=>{
    if(!grupos[c[6]]) grupos[c[6]]=[];
    grupos[c[6]].push(c);
  });

  for(const mes in grupos){

    const bloco=document.createElement("div");
    bloco.className="mes";

    const header=document.createElement("div");
    header.className="mes-header";
    header.innerText=mes;

    const body=document.createElement("div");
    body.className="mes-body open";

    header.onclick=()=>body.classList.toggle("open");

    const hoje=new Date().toISOString().slice(0,10);

    const atrasadas=[];
    const abertas=[];
    const pagas=[];

    grupos[mes].forEach(c=>{
      if(c[5]==1) pagas.push(c);
      else if(c[3] < hoje) atrasadas.push(c);
      else abertas.push(c);
    });

    body.innerHTML+=renderGrupo("🔴 Atrasadas", atrasadas);
    body.innerHTML+=renderGrupo("🟡 Em aberto", abertas);
    body.innerHTML+=renderGrupo("🟢 Pagas", pagas);

    bloco.appendChild(header);
    bloco.appendChild(body);
    lista.appendChild(bloco);
  }
}

// ================= CARD =================

function renderGrupo(titulo, lista){

  if(lista.length===0) return "";

  let html = `<h4 class="grupo-titulo">${titulo}</h4>`;

  lista.forEach(c=>{
    html+=`
      <div class="card-conta">
        <div class="info">
          <strong>${c[1]}</strong>
          <span>R$ ${Number(c[2]).toFixed(2)}</span>
          <span>Venc: ${formatDate(c[3])}</span>
        </div>

        ${c[5]==0 ? `<button onclick="pagar(${c[0]})">Pagar</button>`:""}
      </div>
    `;
  });

  return html;
}

// ================= DATE =================

function formatDate(d){
  return d.split("-").reverse().join("/");
}
