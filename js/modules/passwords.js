// Aggiungi il contenuto HTML
document.getElementById("passwords-tab").innerHTML = `
  <section>
    <h2>Ugly Passwords</h2>
    <div style="margin: 10px 0;">
      <input type="text" id="passwordTitle" placeholder="Titolo/Sito">
      <input type="password" id="passwordValue" placeholder="Password">
      <button onclick="addPassword()">➕ Aggiungi</button>
    </div>
    <div id="passwordsList" style="margin-top: 20px;"></div>
  </section>
`;

// Funzione per generare un ID sicuro per il DOM
function getSafeId(gunId) {
  return 'pwd-' + btoa(gunId).replace(/[+/=]/g, '_');
}

// Funzione per salvare i valori crittati in memoria
const encryptedValues = new Map();

// Funzione per caricare le password
function loadUglyPasswords() {
  if (!user.is) return;
  
  const passwordsList = document.getElementById("passwordsList");
  passwordsList.innerHTML = '';

  // Usa un nodo specifico per le password dell'utente
  const pwdNode = `${user.is.pub}/passwords`;
  gun.get(pwdNode).map().once((password, id) => {
    if (password) {
      addPasswordToUI(password, id);
    }
  });
}

// Funzione per aggiungere una password
async function addPassword() {
  if (!user.is) {
    alert('Devi essere autenticato per aggiungere password');
    return;
  }

  const titleInput = document.getElementById('passwordTitle');
  const valueInput = document.getElementById('passwordValue');
  
  const title = titleInput.value.trim();
  const value = valueInput.value.trim();

  if (!title || !value) {
    alert('Inserisci sia il titolo che la password');
    return;
  }

  // Cripta la password prima di salvarla
  const encrypted = await SEA.encrypt(value, user._.sea);

  const password = {
    title: title,
    value: encrypted,
    ts: Date.now()
  };

  // Usa un nodo specifico per le password dell'utente
  const pwdNode = `${user.is.pub}/passwords`;
  gun.get(pwdNode).set(password, (ack) => {
    if (ack.err) {
      console.error('Errore salvataggio password:', ack.err);
      alert('Errore nel salvataggio della password');
    } else {
      titleInput.value = '';
      valueInput.value = '';
      addAmbientSound({ type: 'success' });
    }
  });
}

// Funzione per eliminare una password
function deletePassword(id) {
  if (confirm('Vuoi davvero eliminare questa password?')) {
    const pwdNode = `${user.is.pub}/passwords`;
    gun.get(pwdNode).get(id).put(null);
    document.getElementById(getSafeId(id))?.remove();
    encryptedValues.delete(id); // Rimuovi il valore crittato dalla memoria
    addAmbientSound({ type: 'delete' });
  }
}

// Funzione per mostrare/nascondere una password
async function togglePasswordVisibility(id) {
  const safeId = getSafeId(id);
  const valueSpan = document.querySelector(`#${safeId} .password-value`);
  const toggleBtn = document.querySelector(`#${safeId} .toggle-btn`);
  
  if (valueSpan.textContent === '••••••••') {
    const encryptedValue = encryptedValues.get(id);
    if (!encryptedValue) {
      console.error('Valore crittato non trovato');
      return;
    }
    const decrypted = await SEA.decrypt(encryptedValue, user._.sea);
    valueSpan.textContent = decrypted;
    toggleBtn.textContent = '👁️';
  } else {
    valueSpan.textContent = '••••••••';
    toggleBtn.textContent = '👁️‍🗨️';
  }
}

// Funzione per aggiungere una password alla UI
function addPasswordToUI(password, id) {
  const passwordsList = document.getElementById("passwordsList");
  const safeId = getSafeId(id);
  
  // Salva il valore crittato in memoria
  encryptedValues.set(id, password.value);
  
  const passwordDiv = document.createElement('div');
  passwordDiv.id = safeId;
  passwordDiv.style.border = '2px solid black';
  passwordDiv.style.padding = '10px';
  passwordDiv.style.margin = '5px 0';
  passwordDiv.style.backgroundColor = 'white';
  passwordDiv.style.display = 'flex';
  passwordDiv.style.justifyContent = 'space-between';
  passwordDiv.style.alignItems = 'center';

  passwordDiv.innerHTML = `
    <div>
      <strong>${password.title}</strong>
      <br>
      <span class="password-value">••••••••</span>
      <br>
      <small>${new Date(password.ts).toLocaleString()}</small>
    </div>
    <div>
      <button onclick="togglePasswordVisibility('${id}')" class="toggle-btn">👁️‍🗨️</button>
      <button onclick="deletePassword('${id}')" style="background: var(--ugly-pink);">🗑️</button>
    </div>
  `;

  passwordsList.appendChild(passwordDiv);
}

// Rendi le funzioni disponibili globalmente
window.addPassword = addPassword;
window.deletePassword = deletePassword;
window.togglePasswordVisibility = togglePasswordVisibility;
window.loadUglyPasswords = loadUglyPasswords;

// Inizializza il modulo
loadUglyPasswords(); 