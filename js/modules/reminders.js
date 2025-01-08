// Aggiungi il contenuto HTML
document.getElementById("reminders-tab").innerHTML = `
  <section>
    <h2>Ugly Reminders</h2>
    <div style="margin: 10px 0;">
      <input type="text" id="reminderText" placeholder="Cosa ti devo ricordare?">
      <input type="datetime-local" id="reminderDate">
      <button onclick="addReminder()">➕ Aggiungi</button>
    </div>
    <div id="remindersList"></div>
  </section>
`;

// Funzione di caricamento principale
function loadUglyReminders() {
  const remindersList = document.getElementById("remindersList");

  // Carica i promemoria esistenti
  user.get('reminders').map().on((reminder, id) => {
    if (reminder) updateRemindersList(reminder, id);
  });

  // Setup intervallo per controllare i promemoria
  setInterval(checkReminders, 60000); // Controlla ogni minuto
}

function addReminder() {
  const text = document.getElementById("reminderText").value;
  const date = document.getElementById("reminderDate").value;
  
  if (!text || !date) {
    alert('Inserisci testo e data');
    return;
  }

  const reminder = {
    text: text,
    date: new Date(date).getTime(),
    created: Date.now()
  };

  user.get('reminders').set(reminder);
  addAmbientSound({ type: 'success' });

  // Reset form
  document.getElementById("reminderText").value = '';
  document.getElementById("reminderDate").value = '';
}

function updateRemindersList(reminder, id) {
  const remindersList = document.getElementById("remindersList");
  const existingReminder = document.getElementById(`reminder-${id}`);
  const now = Date.now();
  const isExpired = reminder.date <= now;
  const bgColor = isExpired ? 'var(--ugly-pink)' : 'var(--ugly-yellow)';
  const icon = isExpired ? '⏰ SCADUTO!' : '⏳ In attesa';

  if (existingReminder) {
    existingReminder.querySelector('.reminder-text').textContent = reminder.text;
    existingReminder.querySelector('.reminder-date').textContent = 
      new Date(reminder.date).toLocaleString();
    existingReminder.style.background = bgColor;
  } else {
    const div = document.createElement('div');
    div.id = `reminder-${id}`;
    div.style.border = '2px solid black';
    div.style.padding = '10px';
    div.style.margin = '5px 0';
    div.style.background = bgColor;
    div.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span class="reminder-text" style="font-size: 1.1em;">${reminder.text}</span>
          <br>
          <small class="reminder-date">${new Date(reminder.date).toLocaleString()}</small>
        </div>
        <div>
          <span style="padding: 5px; border-radius: 5px; background: ${isExpired ? '#ff6b6b' : '#51cf66'}; color: white;">
            ${icon}
          </span>
          <button onclick="deleteReminder('${id}')" style="margin-left: 10px;">🗑️</button>
        </div>
      </div>
    `;
    remindersList.appendChild(div);
  }
}

function deleteReminder(id) {
  if (confirm('Vuoi davvero cancellare questo promemoria?')) {
    user.get('reminders').get(id).put(null);
    document.getElementById(`reminder-${id}`)?.remove();
    addAmbientSound({ type: 'delete' });
  }
}

function checkReminders() {
  const now = Date.now();
  user.get('reminders').map().once((reminder, id) => {
    if (reminder && reminder.date <= now && !reminder.notified) {
      // Notifica l'utente
      new Notification('Ugly Reminder', {
        body: reminder.text,
        icon: '/favicon.ico'
      });
      
      // Segna come notificato
      user.get('reminders').get(id).get('notified').put(true);
      
      // Aggiorna lo stile
      const element = document.getElementById(`reminder-${id}`);
      if (element) element.style.background = 'var(--ugly-yellow)';
    }
  });
}

// Richiedi permessi per le notifiche
if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}

// Inizializza il modulo
loadUglyReminders(); 