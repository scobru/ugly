/****************************************
 * Esempio di inizializzazione GUN e user
 ****************************************/
// Se non li hai già, puoi decommentare queste righe:
// const gun = Gun();
// const user = gun.user();

// Esempio di funzione vuota se non hai suoni
function addAmbientSound(params) {
  console.log('Suono di ambiente:', params);
}

/***********************************************************
 * Aggiunta dinamica dell'HTML per la sezione "Ugly Mail"
 ***********************************************************/
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

/***************************************************
 *  Rendi globali le funzioni, se ti serve farlo
 ***************************************************/
window.sendMail = sendMail;
window.clearMailbox = clearMailbox;

/***************************************************************
 * Funzione per ottenere la chiave epub (chiave pubblica effimera)
 * di un utente a partire dal suo alias
 ***************************************************************/
async function getLatestEpub(alias) {
  return new Promise((resolve) => {
    console.log('Cerco epub per:', alias);
    
    // Cerchiamo i dati dell'utente in base all'alias
    gun.get(`~@${alias}`).once((data) => {
      console.log('Dati utente trovati:', data);
      
      if (!data) {
        console.warn('Nessun dato trovato per:', alias);
        resolve(null);
        return;
      }

      // Trova la chiave pubblica (pair) più recente, in modo semplificato
      let pubKey = null;
      for (let key in data) {
        if (key.startsWith('~')) {
          pubKey = key;
          break;
        }
      }

      if (!pubKey) {
        console.warn('Nessuna chiave pubblica trovata per:', alias);
        resolve(null);
        return;
      }

      console.log('Chiave pubblica trovata:', pubKey);

      // Una volta trovata la "root" (~pubKey), otteniamo i dettagli: epub, ecc.
      gun.get(pubKey).once((userData) => {
        console.log('Dati utente completi:', userData);
        
        if (!userData || !userData.epub) {
          console.warn('Epub non trovato per:', alias);
          resolve(null);
          return;
        }

        console.log('Epub trovato:', userData.epub);
        resolve(userData.epub);
      });
    });
  });
}

/*********************************************************
 * Funzione per inviare una mail cifrata con ECDH (epub)
 *********************************************************/
async function sendMail() {
  const mailTo = document.getElementById('mailTo');
  const mailSubject = document.getElementById('mailSubject');
  const mailContent = document.getElementById('mailContent');

  // Verifica che tutti gli elementi HTML esistano
  if (!mailTo || !mailSubject || !mailContent) {
    console.error('Elementi form mail non trovati');
    return;
  }

  const to = mailTo.value.trim();
  const subject = mailSubject.value.trim();
  const content = mailContent.value.trim();

  // Log dei valori per debug
  console.log('Valori form:', {
    to,
    subject,
    content,
    userIs: user.is
  });

  // Validazione
  const validationErrors = [];
  if (!user.is) {
    validationErrors.push('Devi essere autenticato per inviare mail');
  }
  if (!to) {
    validationErrors.push('Inserisci il destinatario');
  }
  if (!subject) {
    validationErrors.push('Inserisci l\'oggetto');
  }
  if (!content) {
    validationErrors.push('Inserisci il contenuto');
  }

  if (validationErrors.length > 0) {
    alert('Errori:\n' + validationErrors.join('\n'));
    return;
  }

  try {
    console.log('Inizio processo invio mail a:', to);
    console.log('Mittente (alias):', user.is.alias);
    console.log('Chiave epub mittente:', user.is.epub);
    
    // Disabilita il pulsante durante l'invio
    const sendButton = document.querySelector('button[onclick="sendMail()"]');
    if (sendButton) {
      sendButton.disabled = true;
      sendButton.textContent = '📨 Invio in corso...';
    }

    // 1. Cerca la chiave epub del destinatario
    const to_epub = await getLatestEpub(to);
    console.log('Risultato ricerca epub destinatario:', to_epub);
    
    if (!to_epub) {
      alert('Destinatario non trovato o chiave epub non disponibile');
      return;
    }

    // 2. Prepara i dati della mail
    const timestamp = Date.now();
    const mailData = {
      from: user.is.alias,
      to: to,
      subject: subject,
      content: content,
      timestamp: timestamp
    };

    // 3. Cripta usando la chiave ephemeral (ECDH)
    console.log('ECDH + AES: secret con:', {
      'destinatario_epub': to_epub,
      'mie_chiavi': user._.sea
    });

    const secret = await SEA.secret(to_epub, user._.sea);
    console.log('Secret generato:', !!secret);

    const encryptedContent = await SEA.encrypt(JSON.stringify(mailData), secret);
    console.log('Contenuto crittato:', !!encryptedContent);

    // 4. Salva nella mailbox pubblica: "mails"
    const mailPackage = {
      to: to,
      from: user.is.alias,
      data: encryptedContent,
      timestamp: timestamp,
      epub: user.is.epub // Necessario per far decrittare al destinatario
    };

    console.log('Salvataggio mail pubblica...');
    await new Promise((resolve) => {
      gun.get('mails').set(mailPackage, ack => {
        console.log('Risposta salvataggio:', ack);
        resolve(ack);
      });
    });

    // 5. Salva una copia in "sent_mails" (non criptata, a discrezione)
    console.log('Salvataggio copia inviata...');
    await new Promise((resolve) => {
      user.get('sent_mails').set(mailData, ack => {
        console.log('Risposta salvataggio inviata:', ack);
        resolve(ack);
      });
    });

    // 6. Pulisci form e notifica
    mailTo.value = '';
    mailSubject.value = '';
    mailContent.value = '';

    addAmbientSound({ type: 'success' });
    alert('Mail inviata con successo!');
    
    console.log('Processo invio completato');
  } catch (e) {
    console.error('Errore dettagliato invio mail:', e);
    alert('Errore nell\'invio della mail: ' + e.message);
  } finally {
    // Riabilita il pulsante
    const sendButton = document.querySelector('button[onclick="sendMail()"]');
    if (sendButton) {
      sendButton.disabled = false;
      sendButton.textContent = '📧 Invia';
    }
  }
}

/***************************************************************
 * Validazione del form in tempo reale (disabilita bottone se vuoto)
 ***************************************************************/
document.addEventListener('DOMContentLoaded', () => {
  const mailTo = document.getElementById('mailTo');
  const mailSubject = document.getElementById('mailSubject');
  const mailContent = document.getElementById('mailContent');
  const sendButton = document.querySelector('button[onclick="sendMail()"]');

  function validateForm() {
    const isValid = mailTo.value.trim() && 
                    mailSubject.value.trim() && 
                    mailContent.value.trim() && 
                    user.is; // deve esserci un utente loggato
    
    if (sendButton) {
      sendButton.disabled = !isValid;
    }
  }

  // Ascolta gli eventi di input
  [mailTo, mailSubject, mailContent].forEach(element => {
    if (element) {
      element.addEventListener('input', validateForm);
    }
  });

  // Validazione iniziale
  validateForm();
});

/**************************************************************
 * Funzione di inizializzazione per caricare le mail all'avvio
 **************************************************************/
let mailInitialized = false;
let currentUser = null;
let processedMails = new Set();

async function loadUglyMail() {
  if (!user.is) {
    console.log('Utente non autenticato, non carico le mail');
    return;
  }

  // Se l'utente è cambiato, resetta tutto
  if (currentUser !== user.is.alias) {
    console.log('Cambio utente rilevato, resetto stato...');
    currentUser = user.is.alias;
    processedMails = new Set();
    mailInitialized = false;
  }

  if (mailInitialized) {
    console.log('Mail già inizializzate per:', currentUser);
    return;
  }

  console.log('Inizializzazione mail per:', user.is.alias);
  mailInitialized = true;

  const mailBox = document.getElementById('mailsList');
  if (!mailBox) {
    console.error('Elemento mailsList non trovato');
    return;
  }
  
  mailBox.innerHTML = '';

  try {
    // Carica le mail ricevute
    gun.get('mails').map().on(async function(mail, id) {
      if (!mail) {
        console.log('Mail nulla:', id);
        return;
      }

      if (processedMails.has(id)) {
        console.log('Mail già processata:', id);
        return;
      }

      if (mail.to !== user.is.alias) {
        console.log('Mail non per questo utente:', mail.to);
        return;
      }
      
      console.log('Processamento nuova mail:', id, mail);
      processedMails.add(id);

      try {
        // Se manca l'epub, proviamo a recuperarla
        if (!mail.epub) {
          console.warn('Mail senza epub, provo a recuperarlo dal mittente...');
          mail.epub = await getLatestEpub(mail.from);
          if (!mail.epub) {
            console.error('Impossibile recuperare epub del mittente:', mail.from);
            return;
          }
        }

        // ECDH: decritta usando la tua chiave privata e l'epub del mittente
        console.log('Tentativo decrittazione con:', {
          epub_mittente: mail.epub,
          mie_chiavi: user._.sea
        });

        const secret = await SEA.secret(mail.epub, user._.sea);
        console.log('Secret generato:', !!secret);
        
        const decryptedData = await SEA.decrypt(mail.data, secret);
        console.log('Risultato decrittazione:', !!decryptedData);
        
        if (!decryptedData) {
          console.error('Mail non decrittabile:', id);
          return;
        }

        let mailData = JSON.parse(decryptedData);
        console.log('Mail decrittata con successo:', mailData);
        
        mailData.id = id;
        mailData.type = 'received';
        
        addMailToBox(mailData);

      } catch (e) {
        console.error('Errore processamento mail ricevuta:', id, e);
      }
    });

    // Carica le mail inviate
    console.log('Caricamento mail inviate...');
    user.get('sent_mails').map().on(function(mail, id) {
      if (!mail || processedMails.has(id)) return;
      
      console.log('Processamento mail inviata:', id, mail);
      processedMails.add(id);
      mail.id = id;
      mail.type = 'sent';
      addMailToBox(mail);
    });
  } catch (e) {
    console.error('Errore generale caricamento mail:', e);
    mailInitialized = false;
  }
}

/************************************************************
 * Ascolta gli eventi di autenticazione su GUN e carica le mail
 ************************************************************/
gun.on('auth', () => {
  console.log('Evento gun.on("auth"): utente:', user.is?.alias);
  if (user.is) {
    setTimeout(loadUglyMail, 500);
  }
});

user.on('auth', () => {
  console.log('Evento user.on("auth"): utente:', user.is?.alias);
  if (user.is) {
    setTimeout(loadUglyMail, 500);
  }
});

/*********************************************
 * Aggiunge la mail alla UI (lista mailsList)
 *********************************************/
function addMailToBox(mail) {
  console.log('Tentativo di aggiungere mail alla UI:', mail);
  
  const mailBox = document.getElementById('mailsList');
  if (!mailBox) {
    console.error('mailsList non trovato');
    return;
  }

  // Evita duplicati
  const existingMail = document.getElementById(`mail-${mail.id}`);
  if (existingMail) {
    console.log('Mail già presente nella UI:', mail.id);
    return;
  }

  // Verifica campi obbligatori
  if (!mail.id || !mail.type || !mail.subject || !mail.content || !mail.timestamp) {
    console.error('Mail mancante di campi obbligatori:', mail);
    return;
  }

  const mailDiv = document.createElement('div');
  mailDiv.id = `mail-${mail.id}`;
  mailDiv.style.border = '2px solid black';
  mailDiv.style.padding = '10px';
  mailDiv.style.margin = '5px 0';
  mailDiv.style.background = (mail.type === 'received') ? 'var(--ugly-yellow)' : 'white';
  
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

  console.log('Mail aggiunta con successo alla UI:', mail.id);

  // Se la mail è molto recente, facciamo un suono di notifica
  if (mail.timestamp > Date.now() - 1000) {
    addAmbientSound({ type: 'mail' });
  }
}

/*******************************************************************
 * Funzione per svuotare completamente la casella di posta (per test)
 *******************************************************************/
async function clearMailbox() {
  if (!confirm('Sei sicuro di voler eliminare tutte le mail? Questa azione non può essere annullata.')) {
    return;
  }

  try {
    // Rimuovi mail ricevute
    gun.get('mails').map().once((mail, id) => {
      if (mail && mail.to === user.is.alias) {
        gun.get('mails').get(id).put(null);
      }
    });

    // Rimuovi mail inviate
    user.get('sent_mails').map().once((mail, id) => {
      user.get('sent_mails').get(id).put(null);
    });

    // Pulisci l'UI
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
