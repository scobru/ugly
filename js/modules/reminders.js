// Aggiungi il contenuto HTML
document.getElementById("reminders-tab").innerHTML = `
  <section>
    <h2>Ugly Reminders</h2>
    <div style="margin: 10px 0;">
      <input type="text" id="reminderText" placeholder="Promemoria">
      <input type="datetime-local" id="reminderDate">
      <select id="reminderPriority">
        <option value="low">🟢 Bassa</option>
        <option value="medium">🟡 Media</option>
        <option value="high">🔴 Alta</option>
      </select>
      <button onclick="addReminder()">➕ Aggiungi</button>
    </div>
    <div id="remindersList" style="margin-top: 20px;"></div>
  </section>
`;

// Funzione per caricare i promemoria
function loadUglyReminders() {
  if (!user.is) return;
  
  const remindersList = document.getElementById("remindersList");
  remindersList.innerHTML = '';

  // Usa un nodo specifico per i promemoria dell'utente
  const remindersNode = `${user.is.pub}/reminders`;
  gun.get(remindersNode).map().once((reminder, id) => {
    if (reminder) {
      addReminderToUI(reminder, id);
    }
  });
}

// Funzione per aggiungere un promemoria
async function addReminder() {
  if (!user.is) {
    alert('Devi essere autenticato per aggiungere promemoria');
    return;
  }

  const textInput = document.getElementById('reminderText');
  const dateInput = document.getElementById('reminderDate');
  const priorityInput = document.getElementById('reminderPriority');
  
  const text = textInput.value.trim();
  const date = dateInput.value;
  const priority = priorityInput.value;

  if (!text || !date) {
    alert('Inserisci sia il testo che la data del promemoria');
    return;
  }

  const reminder = {
    text: text,
    date: date,
    priority: priority,
    done: false,
    ts: Date.now()
  };

  // Usa un nodo specifico per i promemoria dell'utente
  const remindersNode = `${user.is.pub}/reminders`;
  gun.get(remindersNode).set(reminder, (ack) => {
    if (ack.err) {
      console.error('Errore salvataggio promemoria:', ack.err);
      alert('Errore nel salvataggio del promemoria');
    } else {
      textInput.value = '';
      dateInput.value = '';
      priorityInput.value = 'low';
      addAmbientSound({ type: 'success' });
    }
  });
}

// Funzione per completare/decompletare un promemoria
function toggleReminder(id) {
  const remindersNode = `${user.is.pub}/reminders`;
  gun.get(remindersNode).get(id).once((reminder) => {
    if (reminder) {
      reminder.done = !reminder.done;
      gun.get(remindersNode).get(id).put(reminder);
      addAmbientSound({ type: 'click' });
    }
  });
}

// Funzione per eliminare un promemoria
function deleteReminder(id) {
  if (confirm('Vuoi davvero eliminare questo promemoria?')) {
    const remindersNode = `${user.is.pub}/reminders`;
    gun.get(remindersNode).get(id).put(null);
    document.getElementById(`reminder-${id}`)?.remove();
    addAmbientSound({ type: 'delete' });
  }
}

// Funzione per aggiungere un promemoria alla UI
function addReminderToUI(reminder, id) {
  const remindersList = document.getElementById("remindersList");
  
  const reminderDiv = document.createElement('div');
  reminderDiv.id = `reminder-${id}`;
  reminderDiv.style.border = '2px solid black';
  reminderDiv.style.padding = '10px';
  reminderDiv.style.margin = '5px 0';
  reminderDiv.style.backgroundColor = reminder.done ? 'var(--ugly-green)' : 'white';
  reminderDiv.style.display = 'flex';
  reminderDiv.style.justifyContent = 'space-between';
  reminderDiv.style.alignItems = 'center';

  // Calcola se il promemoria è scaduto
  const reminderDate = new Date(reminder.date);
  const isExpired = reminderDate < new Date();
  
  // Ottieni l'emoji della priorità
  const priorityEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🔴'
  }[reminder.priority];

  // Formatta la data in modo leggibile
  const formattedDate = reminderDate.toLocaleString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  reminderDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <input type="checkbox" ${reminder.done ? 'checked' : ''} 
             onclick="toggleReminder('${id}')" 
             style="transform: scale(1.5);">
      <div>
        <strong style="${reminder.done ? 'text-decoration: line-through;' : ''}">${reminder.text}</strong>
        <br>
        <span style="color: ${isExpired ? 'red' : 'black'}">
          ${priorityEmoji} ${formattedDate}
          ${isExpired ? ' (Scaduto)' : ''}
        </span>
      </div>
    </div>
    <button onclick="deleteReminder('${id}')" 
            style="background: var(--ugly-pink);">
      🗑️
    </button>
  `;

  // Ordina i promemoria per data
  let inserted = false;
  for (const child of remindersList.children) {
    const childDate = new Date(child.querySelector('span').textContent.split(' ').slice(1).join(' '));
    if (reminderDate < childDate) {
      remindersList.insertBefore(reminderDiv, child);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    remindersList.appendChild(reminderDiv);
  }
}

// Rendi le funzioni disponibili globalmente
window.addReminder = addReminder;
window.toggleReminder = toggleReminder;
window.deleteReminder = deleteReminder;
window.loadUglyReminders = loadUglyReminders;

// Inizializza il modulo
loadUglyReminders(); 