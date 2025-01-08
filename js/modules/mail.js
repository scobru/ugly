// Aggiungi il contenuto HTML
document.getElementById("mail-tab").innerHTML = `
  <section>
    <h2>Ugly Mail</h2>
    <div style="margin: 10px 0;">
      <input type="text" id="mailTo" placeholder="A chi vuoi scrivere?">
      <input type="text" id="mailSubject" placeholder="Oggetto">
      <textarea id="mailContent" rows="4" placeholder="Scrivi il tuo messaggio..."></textarea>
      <button onclick="sendMail()">📧 Invia</button>
    </div>
    <div style="margin: 10px 0; display: flex; justify-content: space-between; align-items: center;">
      <h3>Casella di posta</h3>
      <button onclick="clearMailbox()" style="background: var(--ugly-pink); padding: 5px 10px; border: 2px solid black;">
        🗑️ Svuota casella
      </button>
    </div>
    <div id="mailsList" style="margin-top: 20px;"></div>
  </section>
`;

// Rendi globali le funzioni
window.sendMail = sendMail;
window.clearMailbox = clearMailbox;

// Funzione per inviare una mail
async function sendMail() {
  const to = document.getElementById('mailTo').value.trim();
  const subject = document.getElementById('mailSubject').value.trim();
  const content = document.getElementById('mailContent').value.trim();

  if (!to || !subject || !content || !user.is) {
    alert('Compila tutti i campi!');
    return;
  }

  try {
    // Cerca la chiave pubblica del destinatario
    let to_pub = await new Promise((resolve) => {
      gun.get(`~@${to}`).once((data) => {
        if (!data) {
          resolve(null);
          return;
        }
        for (let key in data) {
          if (key.startsWith('~')) {
            resolve(key.slice(1));
            return;
          }
        }
        resolve(null);
      });
    });

    if (!to_pub) {
      alert('Destinatario non trovato!');
      return;
    }

    const timestamp = Date.now();
    
    // Crea il messaggio
    const mailData = {
      from: user.is.alias,
      to: to,
      subject: subject,
      content: content,
      timestamp: timestamp
    };

    // Cripta il messaggio con la chiave condivisa
    const secret = await SEA.secret(to_pub, user._.sea);
    const encryptedMail = await SEA.encrypt(JSON.stringify(mailData), secret);

    // Salva nella mailbox pubblica
    gun.get('mails').set({
      to: to,
      from: user.is.alias,
      data: encryptedMail,
      timestamp: timestamp
    });

    // Salva nelle mail inviate (non criptato)
    user.get('sent_mails').set(mailData);

    // Pulisci form
    document.getElementById('mailTo').value = '';
    document.getElementById('mailSubject').value = '';
    document.getElementById('mailContent').value = '';

    addAmbientSound({ type: 'success' });
    alert('Mail inviata con successo!');
  } catch (e) {
    console.error('Errore invio mail:', e);
    alert('Errore nell\'invio della mail');
  }
}

// Funzione per caricare le mail
async function loadUglyMail() {
  const mailBox = document.getElementById('mailsList');
  if (!mailBox) return;
  
  mailBox.innerHTML = '';
  const processedMails = new Set();

  // Carica le mail ricevute
  gun.get('mails').map().on(async function(mail, id) {
    if (!mail || processedMails.has(id) || mail.to !== user.is.alias) return;
    
    try {
      processedMails.add(id);
      
      // Trova la chiave pubblica del mittente
      const from_pub = await new Promise(resolve => {
        gun.get(`~@${mail.from}`).once((data) => {
          if (!data) {
            resolve(null);
            return;
          }
          for (let key in data) {
            if (key.startsWith('~')) {
              resolve(key.slice(1));
              return;
            }
          }
          resolve(null);
        });
      });

      if (!from_pub) {
        console.error('Mittente non trovato:', mail.from);
        return;
      }

      // Decripta usando la chiave condivisa
      const secret = await SEA.secret(from_pub, user._.sea);
      let decryptedData;
      try {
        decryptedData = await SEA.decrypt(mail.data, secret);
      } catch (decryptError) {
        console.warn('Errore prima decrittazione, riprovo...', decryptError);
        // Riprova con una chiave diversa
        const altSecret = await SEA.secret(user._.sea.pub, from_pub);
        decryptedData = await SEA.decrypt(mail.data, altSecret);
      }
      
      if (!decryptedData) {
        console.error('Mail non decrittabile:', id);
        return;
      }

      let mailData;
      try {
        mailData = JSON.parse(decryptedData);
      } catch (parseError) {
        console.error('Errore parsing mail:', parseError);
        return;
      }

      mailData.id = id;
      mailData.type = 'received';
      
      addMailToBox(mailData);
    } catch (e) {
      console.error('Errore processamento mail:', e);
    }
  });

  // Carica le mail inviate
  user.get('sent_mails').map().on(function(mail, id) {
    if (!mail || processedMails.has(id)) return;
    
    try {
      processedMails.add(id);
      mail.id = id;
      mail.type = 'sent';
      addMailToBox(mail);
    } catch (e) {
      console.error('Errore processamento mail inviata:', e);
    }
  });
}

// Inizializza il modulo
loadUglyMail();

// Funzione per visualizzare una mail
function addMailToBox(mail) {
  const mailBox = document.getElementById('mailsList');
  const existingMail = document.getElementById(`mail-${mail.id}`);
  
  if (existingMail) return;

  const mailDiv = document.createElement('div');
  mailDiv.id = `mail-${mail.id}`;
  mailDiv.style.border = '2px solid black';
  mailDiv.style.padding = '10px';
  mailDiv.style.margin = '5px 0';
  mailDiv.style.background = mail.type === 'received' ? 'var(--ugly-yellow)' : 'white';
  
  mailDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>${mail.type === 'received' ? 'Da: ' + mail.from : 'A: ' + mail.to}</strong>
        <br>
        <span style="font-size: 1.1em;">${mail.subject}</span>
        <br>
        <small>${new Date(mail.timestamp).toLocaleString()}</small>
      </div>
      <span style="padding: 5px; border-radius: 5px; background: ${mail.type === 'received' ? '#51cf66' : '#4dabf7'}; color: white;">
        ${mail.type === 'received' ? '📥 Ricevuta' : '📤 Inviata'}
      </span>
    </div>
    <div style="margin-top: 10px; white-space: pre-wrap;">
      ${mail.content}
    </div>
  `;

  // Inserisci in ordine cronologico (più recenti in alto)
  let inserted = false;
  for (let child of mailBox.children) {
    const childTime = parseInt(child.id.split('-')[1]);
    if (mail.timestamp > childTime) {
      mailBox.insertBefore(mailDiv, child);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    mailBox.appendChild(mailDiv);
  }

  // Suono di notifica per nuove mail
  if (mail.timestamp > Date.now() - 1000) {
    addAmbientSound({ type: 'mail' });
  }
}

// Funzione per svuotare la casella di posta
async function clearMailbox() {
  if (!confirm('Sei sicuro di voler eliminare tutte le mail? Questa azione non può essere annullata.')) {
    return;
  }

  try {
    // Rimuovi tutte le mail ricevute
    gun.get('mails').map().once((mail, id) => {
      if (mail && mail.to === user.is.alias) {
        gun.get('mails').get(id).put(null);
      }
    });

    // Rimuovi tutte le mail inviate
    user.get('sent_mails').map().once((mail, id) => {
      user.get('sent_mails').get(id).put(null);
    });

    // Pulisci la visualizzazione
    const mailsList = document.getElementById('mailsList');
    if (mailsList) {
      mailsList.innerHTML = '';
    }

    addAmbientSound({ type: 'delete' });
    alert('Casella di posta svuotata con successo!');
  } catch (e) {
    console.error('Errore svuotamento casella:', e);
    alert('Errore durante lo svuotamento della casella');
  }
} 