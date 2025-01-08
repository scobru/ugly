// Riferimenti agli elementi DOM
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const userStatus = document.getElementById("userStatus");
const appDiv = document.getElementById("app");
const accountSection = document.querySelector("section:first-of-type"); // Sezione account

// Crea il pulsante logout
const logoutBtn = document.createElement("button");
logoutBtn.textContent = "🚪 Logout";
logoutBtn.style.margin = "10px";
logoutBtn.style.padding = "5px 15px";
logoutBtn.style.cursor = "pointer";
logoutBtn.style.backgroundColor = "var(--ugly-pink)";
logoutBtn.style.border = "2px solid black";
logoutBtn.style.borderRadius = "5px";
logoutBtn.style.display = "none";

// Aggiungi l'event listener direttamente
logoutBtn.addEventListener("click", logout);

// Crea un div per il logout e lo status
const logoutContainer = document.createElement("div");
logoutContainer.style.textAlign = "right";
logoutContainer.style.padding = "10px";
logoutContainer.style.display = "none";
logoutContainer.style.position = "fixed";
logoutContainer.style.top = "10px";
logoutContainer.style.right = "10px";
logoutContainer.style.zIndex = "1000";
logoutContainer.appendChild(logoutBtn);
logoutContainer.appendChild(userStatus);

// Inserisci il container nel documento
document.body.appendChild(logoutContainer);

// Aggiungi una variabile per tracciare lo stato dell'autenticazione
let isAuthenticating = false;

function updateUIForLoggedUser(username) {
  // Nascondi la sezione account
  accountSection.style.display = "none";
  
  // Mostra il container del logout
  logoutContainer.style.display = "block";
  
  // Aggiorna lo status e mostra l'app
  userStatus.textContent = "Loggato come: " + username;
  userStatus.style.marginLeft = "10px";
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
    loadUglyCalendar();
    loadUglyReminders();
    loadUglyContacts();
    loadUglyFiles();
    loadUglyVoice();
    loadUglyChat();
    loadUglyMail();
    console.log("Dati caricati con successo");
  } catch (e) {
    console.error("Errore nel caricamento dei dati:", e);
  }
}

function logout() {
  if (isAuthenticating) {
    console.log("Autenticazione in corso, attendi...");
    return;
  }

  try {
    isAuthenticating = true;
    console.log("Inizio processo di logout...");

    // Pulisci i dati dell'utente
    if (user.is) {
      user.leave();
      console.log("Utente disconnesso da Gun");
    }

    // Pulisci storage
    localStorage.clear();
    sessionStorage.clear();
    console.log("Storage pulito");

    // Aggiorna UI
    updateUIForLoggedOut();
    console.log("UI aggiornata");

    // Effetto sonoro
    addAmbientSound({ type: "delete" });

    // Ricarica la pagina dopo un breve delay
    setTimeout(() => {
      console.log("Ricarico la pagina...");
      window.location.href = window.location.pathname;
    }, 500);

  } catch (error) {
    console.error("Errore durante il logout:", error);
    alert("Errore durante il logout: " + error.message);
  } finally {
    isAuthenticating = false;
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
