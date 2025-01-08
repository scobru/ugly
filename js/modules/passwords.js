// Aggiungi il contenuto HTML
document.getElementById("passwords-tab").innerHTML = `
  <section>
    <h2>Ugly Password Manager</h2>
    <p><strong>Nota:</strong> i dati qui sono crittografati nello spazio utente.</p>
    <input type="text" id="pwdDescription" placeholder="Descrizione o servizio" />
    <input type="text" id="pwdValue" placeholder="Password" />
    <button id="pwdButton">Salva Password</button>
    <div id="pwdList"></div>
  </section>
`;

// Riferimenti DOM
const pwdDesc = document.getElementById("pwdDescription");
const pwdVal = document.getElementById("pwdValue");
const pwdBtn = document.getElementById("pwdButton");
const pwdList = document.getElementById("pwdList");

pwdBtn.addEventListener("click", async function() {
  const desc = pwdDesc.value.trim();
  const pass = pwdVal.value.trim();
  
  if (!desc || !pass) {
    alert("Inserisci sia la descrizione che la password");
    return;
  }

  try {
    const encPass = await SEA.encrypt(pass, user._.sea);
    if (!encPass) throw new Error("Errore nella crittografia della password");

    const pwdData = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      desc: desc,
      pass: encPass,
      timestamp: Date.now()
    };

    user.get("uglyPasswords").set(pwdData);
    
    pwdDesc.value = "";
    pwdVal.value = "";
    
    addAmbientSound({ type: "password", desc: desc });
  } catch (e) {
    console.error("Errore salvataggio password:", e);
    alert("Errore nel salvataggio della password: " + e.message);
  }
});

// Gestione visualizzazione password
user.get("uglyPasswords").map().on(async function(data, id) {
  if (!data) {
    const existing = document.getElementById("pwd-" + id);
    if (existing) existing.remove();
    return;
  }

  let existing = document.getElementById("pwd-" + id);
  if (!existing) {
    existing = createPasswordEntry(data, id);
    pwdList.appendChild(existing);
  } else {
    existing.querySelector("span").textContent = data.desc;
  }
});

function createPasswordEntry(data, id) {
  const div = document.createElement("div");
  div.id = "pwd-" + id;

  const textNode = document.createElement("span");
  textNode.textContent = data.desc;

  const showBtn = document.createElement("button");
  showBtn.textContent = "Mostra password";
  showBtn.style.marginLeft = "10px";
  showBtn.addEventListener("click", async function() {
    try {
      const decPass = await SEA.decrypt(data.pass, user._.sea);
      showBtn.textContent = decPass;
      setTimeout(() => {
        showBtn.textContent = "Mostra password";
      }, 3000);
    } catch (e) {
      console.error("Errore decriptazione:", e);
      alert("Errore nella lettura della password");
    }
  });

  const deleteBtn = createDeleteButton();
  deleteBtn.addEventListener("click", function() {
    user.get("uglyPasswords").get(id).put(null);
    div.remove();
    uglySounds.play("delete");
  });

  div.appendChild(textNode);
  div.appendChild(showBtn);
  div.appendChild(deleteBtn);

  return div;
} 