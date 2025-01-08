// Riferimenti agli elementi DOM
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const userStatus = document.getElementById("userStatus");
const appDiv = document.getElementById("app");
const accountSection = document.querySelector("section:first-of-type"); // Sezione account

// Aggiungi una variabile per tracciare lo stato dell'autenticazione
let isAuthenticating = false;

// Stile dello status utente
if (userStatus) {
  userStatus.style.marginRight = "10px";
}

// Crea il pulsante logout
const logoutBtn = document.createElement("button");
logoutBtn.textContent = "🚪 Logout";
logoutBtn.style.padding = "5px 15px";
logoutBtn.style.cursor = "pointer";
logoutBtn.style.backgroundColor = "var(--ugly-pink)";
logoutBtn.style.border = "2px solid black";
logoutBtn.style.borderRadius = "5px";
logoutBtn.style.display = "none";

// Aggiungi l'event listener per il logout
logoutBtn.addEventListener("click", logout);

// Crea il container per logout e status
const logoutContainer = document.createElement("div");
logoutContainer.style.display = "none";
logoutContainer.style.alignItems = "center";
logoutContainer.style.gap = "10px";

// Assembla il container
logoutContainer.appendChild(userStatus);
logoutContainer.appendChild(logoutBtn);

// Inserisci nel container auth
const authContainer = document.getElementById("auth-container");
if (authContainer) {
  authContainer.appendChild(logoutContainer);
}

function updateUIForLoggedUser(username) {
  // Nascondi la sezione account
  accountSection.style.display = "none";
  
  // Mostra il container del logout
  logoutContainer.style.display = "flex";
  
  // Aggiorna lo status e mostra l'app
  userStatus.textContent = "Loggato come: " + username;
  appDiv.classList.remove("hidden");
  
  // Mostra il pulsante logout
  logoutBtn.style.display = "inline-block";
}

function updateUIForLoggedOut() {
  // Mostra la sezione account
  accountSection.style.display = "block";

  // Nascondi il container del logout
  logoutContainer.style.display = "none";

  // Resetta e nascondi tutto
  userStatus.textContent = "Non autenticato";
  appDiv.classList.add("hidden");
  usernameField.value = "";
  passwordField.value = "";
  logoutBtn.style.display = "none";
}

// Creazione account
signupBtn.addEventListener("click", function () {
  const uname = usernameField.value.trim();
  const upass = passwordField.value.trim();

  if (!uname || !upass) {
    alert("Inserisci username e password.");
    return;
  }

  user.create(uname, upass, function (ack) {
    if (ack.err) {
      alert("Errore creazione account: " + ack.err);
    } else {
      alert("Account creato! Ora effettua il login.");
    }
  });
});

// Login
loginBtn.addEventListener("click", async function () {
  if (isAuthenticating) {
    console.log("Autenticazione già in corso, attendi...");
    return;
  }

  const uname = usernameField.value.trim();
  const upass = passwordField.value.trim();

  if (!uname || !upass) {
    alert("Inserisci username e password.");
    return;
  }

  try {
    isAuthenticating = true;
    loginBtn.disabled = true;
    signupBtn.disabled = true;

    // Se l'utente è già autenticato, fai prima il logout
    if (user.is) {
      console.log("Utente già autenticato, eseguo logout...");
      user.leave();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("Tentativo di autenticazione per:", uname);
    await user.auth(uname, upass, function (ack) {
      if (ack.err) {
        alert("Errore login: " + ack.err);
      } else {
        updateUIForLoggedUser(uname);
        setTimeout(loadAllData, 500);
      }
    });

    console.log("Login effettuato con successo per:", uname);
    updateUIForLoggedUser(uname);
    // Aspetta un momento per assicurarsi che Gun sia pronto
    setTimeout(loadAllData, 1000);
  } catch (error) {
    console.error("Errore login:", error);
    alert("Errore login: " + error.message);
    updateUIForLoggedOut();
  } finally {
    isAuthenticating = false;
    loginBtn.disabled = false;
    signupBtn.disabled = false;
  }
});

// Controllo sessione esistente
user.recall({ sessionStorage: true }, async function (ack) {
  if (isAuthenticating) return;

  if (ack.err) {
    console.error("Errore recall:", ack.err);
    return;
  }

  try {
    isAuthenticating = true;
    if (user.is) {
      console.log("Sessione esistente trovata per:", user.is.alias);
      updateUIForLoggedUser(user.is.alias);
      // Aspetta un momento per assicurarsi che Gun sia pronto
      setTimeout(loadAllData, 1000);
    }
  } finally {
    isAuthenticating = false;
  }
});

// Funzione per caricare tutti i dati dopo il login
function loadAllData() {
  console.log("Caricamento dati...");
  try {
    loadUglyText();
    loadUglyNotes();
    loadUglyTodo();
    loadUglyPasswords();
    loadUglyCalendar();
    loadUglyReminders();
    loadUglyContacts();
    loadUglyFiles();
    loadUglyChat();
    loadUglyMail();
    // loadUglyVoice();    // Gestito separatamente
    console.log("Dati caricati con successo");
  } catch (e) {
    console.error("Errore nel caricamento dei dati:", e);
  }
}

// Funzione di logout migliorata
function logout() {
  console.log('Inizio processo logout...');
  
  try {
    // Disabilita il pulsante durante il logout
    const logoutBtn = document.querySelector('button[onclick="logout()"]');
    if (logoutBtn) {
      logoutBtn.disabled = true;
      logoutBtn.textContent = '🔄 Logout in corso...';
    }

    // Pulisci le variabili di stato delle mail
    window.currentUser = null;
    window.processedMails = new Set();
    window.mailInitialized = false;

    // Pulisci la UI
    const mailsList = document.getElementById('mailsList');
    if (mailsList) {
      mailsList.innerHTML = '';
    }

    // Disconnetti l'utente da Gun
    if (user.is) {
      user.leave();
      console.log('Utente disconnesso da Gun');
    }

    // Pulisci storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('Storage pulito');

    // Aggiorna UI
    const userStatus = document.getElementById('userStatus');
    const appDiv = document.getElementById('app');
    const accountSection = document.querySelector('section:first-of-type');
    
    if (userStatus) userStatus.textContent = 'Non autenticato';
    if (appDiv) appDiv.classList.add('hidden');
    if (accountSection) accountSection.style.display = 'block';

    // Pulisci i campi di input
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    if (usernameField) usernameField.value = '';
    if (passwordField) passwordField.value = '';

    // Effetto sonoro
    addAmbientSound({ type: 'delete' });

    // Ricarica la pagina dopo un breve delay
    setTimeout(() => {
      console.log('Ricarico la pagina...');
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('Errore durante il logout:', error);
    alert('Errore durante il logout: ' + error.message);
  }
}

// Gestisci visibilità anche sugli eventi di Gun
gun.on("auth", (ack) => {
  if (user.is) {
    logoutBtn.style.display = "inline-block";
  } else {
    logoutBtn.style.display = "none";
  }
});

// Rendi il logout disponibile globalmente
window.logout = logout;
