// Aggiungi il contenuto HTML
document.getElementById("contacts-tab").innerHTML = `
  <section>
    <h2>Ugly Contacts</h2>
    <div style="margin: 10px 0;">
      <input type="text" id="contactName" placeholder="Nome contatto">
      <input type="text" id="contactInfo" placeholder="Info (email, telefono, etc.)">
      <button onclick="addContact()">➕ Aggiungi</button>
    </div>
    <div id="contactsList" style="margin-top: 20px;"></div>
  </section>
`;

// Funzione per caricare i contatti
function loadUglyContacts() {
  if (!user.is) return;
  
  const contactsList = document.getElementById("contactsList");
  contactsList.innerHTML = '';

  // Usa un nodo specifico per i contatti dell'utente
  const contactsNode = `${user.is.pub}/contacts`;
  gun.get(contactsNode).map().once((contact, id) => {
    if (contact) {
      addContactToUI(contact, id);
    }
  });
}

// Funzione per aggiungere un contatto
async function addContact() {
  if (!user.is) {
    alert('Devi essere autenticato per aggiungere contatti');
    return;
  }

  const nameInput = document.getElementById('contactName');
  const infoInput = document.getElementById('contactInfo');
  
  const name = nameInput.value.trim();
  const info = infoInput.value.trim();

  if (!name || !info) {
    alert('Inserisci sia il nome che le informazioni del contatto');
    return;
  }

  const contact = {
    name: name,
    info: info,
    ts: Date.now()
  };

  // Usa un nodo specifico per i contatti dell'utente
  const contactsNode = `${user.is.pub}/contacts`;
  gun.get(contactsNode).set(contact, (ack) => {
    if (ack.err) {
      console.error('Errore salvataggio contatto:', ack.err);
      alert('Errore nel salvataggio del contatto');
    } else {
      nameInput.value = '';
      infoInput.value = '';
      addAmbientSound({ type: 'success' });
    }
  });
}

// Funzione per eliminare un contatto
function deleteContact(id) {
  if (confirm('Vuoi davvero eliminare questo contatto?')) {
    const contactsNode = `${user.is.pub}/contacts`;
    gun.get(contactsNode).get(id).put(null);
    document.getElementById(`contact-${id}`)?.remove();
    addAmbientSound({ type: 'delete' });
  }
}

// Funzione per aggiungere un contatto alla UI
function addContactToUI(contact, id) {
  const contactsList = document.getElementById("contactsList");
  
  const contactDiv = document.createElement('div');
  contactDiv.id = `contact-${id}`;
  contactDiv.className = 'contact-card'; // Aggiungiamo una classe per lo styling
  contactDiv.style.border = '2px solid black';
  contactDiv.style.padding = '10px';
  contactDiv.style.margin = '5px 0';
  contactDiv.style.backgroundColor = 'var(--card-bg)'; // Usa una variabile CSS per il background
  contactDiv.style.color = 'var(--text-color)'; // Usa una variabile CSS per il testo
  contactDiv.style.display = 'flex';
  contactDiv.style.justifyContent = 'space-between';
  contactDiv.style.alignItems = 'center';

  contactDiv.innerHTML = `
    <div>
      <strong>${contact.name}</strong>
      <br>
      <span>${contact.info}</span>
      <br>
      <small>${new Date(contact.ts).toLocaleString()}</small>
    </div>
    <button onclick="deleteContact('${id}')" 
            style="background: var(--ugly-pink); color: black;">
      🗑️
    </button>
  `;

  contactsList.appendChild(contactDiv);
}

// Rendi le funzioni disponibili globalmente
window.addContact = addContact;
window.deleteContact = deleteContact;
window.loadUglyContacts = loadUglyContacts;

// Inizializza il modulo
loadUglyContacts(); 