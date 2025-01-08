// Riferimenti agli elementi DOM
const usernameField = document.getElementById("username");
const passwordField = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const userStatus = document.getElementById("userStatus");
const appDiv = document.getElementById("app");
const accountSection = document.querySelector("section:first-of-type"); // Sezione account

// Crea il pulsante logout
const logoutBtn = document.createElement('button');
logoutBtn.textContent = '🚪 Logout';
logoutBtn.onclick = logout;
logoutBtn.style.margin = '10px';
logoutBtn.style.display = 'none';

// Crea un div per il logout e lo status
const logoutContainer = document.createElement('div');
logoutContainer.style.textAlign = 'right';
logoutContainer.style.padding = '10px';
logoutContainer.style.display = 'none';
logoutContainer.appendChild(logoutBtn);
logoutContainer.appendChild(userStatus);

// Inserisci il container dopo la sezione account
accountSection.after(logoutContainer);

function updateUIForLoggedUser(username) {
  // Nascondi la sezione account
  accountSection.style.display = 'none';
  
  // Mostra il container del logout
  logoutContainer.style.display = 'block';
  
  // Aggiorna lo status e mostra l'app
  userStatus.textContent = "Loggato come: " + username;
  appDiv.classList.remove("hidden");
  
  // Mostra il pulsante logout
  logoutBtn.style.display = 'inline-block';
}

function updateUIForLoggedOut() {
  // Mostra la sezione account
  accountSection.style.display = 'block';
  
  // Nascondi il container del logout
  logoutContainer.style.display = 'none';
  
  // Resetta e nascondi tutto
  userStatus.textContent = 'Non autenticato';
  appDiv.classList.add('hidden');
  usernameField.value = '';
  passwordField.value = '';
  logoutBtn.style.display = 'none';
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
loginBtn.addEventListener("click", function () {
  const uname = usernameField.value.trim();
  const upass = passwordField.value.trim();
  
  if (!uname || !upass) {
    alert("Inserisci username e password.");
    return;
  }

  user.auth(uname, upass, function (ack) {
    if (ack.err) {
      alert("Errore login: " + ack.err);
    } else {
      updateUIForLoggedUser(uname);
      setTimeout(loadAllData, 500);
    }
  });
});

// Controllo sessione esistente
user.recall({ sessionStorage: true }, function (ack) {
  if (ack.err) {
    console.error("Errore recall:", ack.err);
    return;
  }
  if (user.is) {
    updateUIForLoggedUser(user.is.alias);
    setTimeout(loadAllData, 500);
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
  user.leave();
  localStorage.clear();
  sessionStorage.clear();
  updateUIForLoggedOut();
  addAmbientSound({ type: 'delete' });
  setTimeout(() => window.location.reload(), 500);
}

// Gestisci visibilità anche sugli eventi di Gun
gun.on('auth', (ack) => {
  if (user.is) {
    logoutBtn.style.display = 'inline-block';
  } else {
    logoutBtn.style.display = 'none';
  }
}); 