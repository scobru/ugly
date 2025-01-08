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
  if (!user.is) return;
  
  const remindersNode = `${user.is.pub}/reminders`;
  gun.get(remindersNode).get(id).once((reminder) => {
    if (reminder) {
      const newDone = !reminder.done;
      
      // Aggiorna il database
      gun.get(remindersNode).get(id).put({
        ...reminder,
        done: newDone
      });
      
      // Aggiorna l'UI
      const reminderDiv = document.getElementById(`reminder-${id}`);
      if (reminderDiv) {
        reminderDiv.style.backgroundColor = newDone ? 'var(--ugly-green)' : 'var(--card-bg)';
        const strong = reminderDiv.querySelector('strong');
        if (strong) {
          strong.style.textDecoration = newDone ? 'line-through' : 'none';
        }
      }
      
      addAmbientSound({ type: 'click' });
    }
  });
}

// Funzione per ottenere i promemoria
function getReminders() {
  try {
    const remindersString = localStorage.getItem('reminders');
    return remindersString ? JSON.parse(remindersString) : [];
  } catch (error) {
    console.error('Errore lettura promemoria:', error);
    return [];
  }
}

// Funzione per eliminare un promemoria
function deleteReminder(id) {
  try {
    const reminderDiv = document.getElementById(`reminder-${id}`);
    if (reminderDiv) {
      reminderDiv.classList.add('deleting');
      reminderDiv.addEventListener('animationend', () => {
        const remindersNode = `${user.is.pub}/reminders`;
        gun.get(remindersNode).get(id).put(null);
        reminderDiv.remove();
        addAmbientSound({ type: 'delete' });
      });
    }
  } catch (error) {
    console.error('Errore eliminazione promemoria:', error);
  }
}

// Funzione per renderizzare tutti i promemoria
function renderReminders() {
  const remindersList = document.getElementById("remindersList");
  if (!remindersList) return;
  
  remindersList.innerHTML = '';
  const reminders = getReminders();
  reminders.forEach(reminder => {
    addReminderToUI(reminder, reminder.id);
  });
}

// Funzione per aggiungere un promemoria alla UI
function addReminderToUI(reminder, id) {
  const remindersList = document.getElementById("remindersList");
  
  const reminderDiv = document.createElement('div');
  reminderDiv.id = `reminder-${id}`;
  reminderDiv.className = 'adding';
  reminderDiv.style.border = '2px solid black';
  reminderDiv.style.padding = '10px';
  reminderDiv.style.margin = '5px 0';
  reminderDiv.style.backgroundColor = reminder.done ? 'var(--ugly-green)' : 'var(--card-bg)';
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

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = reminder.done;
  checkbox.style.transform = 'scale(1.5)';
  checkbox.style.width = '20px';
  checkbox.style.height = '20px';
  checkbox.style.cursor = 'pointer';
  checkbox.style.accentColor = 'var(--ugly-green)';
  checkbox.style.border = '2px solid black';
  checkbox.style.borderRadius = '3px';
  checkbox.style.marginRight = '5px';
  checkbox.style.appearance = 'auto';

  const textDiv = document.createElement('div');
  textDiv.innerHTML = `
    <strong style="${reminder.done ? 'text-decoration: line-through;' : ''}">${reminder.text}</strong>
    <br>
    <span style="color: ${isExpired ? 'red' : 'black'}">
      ${priorityEmoji} ${formattedDate}
      ${isExpired ? ' (Scaduto)' : ''}
    </span>
  `;

  const leftDiv = document.createElement('div');
  leftDiv.style.display = 'flex';
  leftDiv.style.alignItems = 'center';
  leftDiv.style.gap = '10px';
  leftDiv.appendChild(checkbox);
  leftDiv.appendChild(textDiv);

  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = '🗑️';
  deleteButton.onclick = () => deleteReminder(id);
  deleteButton.style.background = 'var(--ugly-pink)';

  reminderDiv.appendChild(leftDiv);
  reminderDiv.appendChild(deleteButton);

  // Aggiungi l'event listener per il checkbox
  checkbox.addEventListener('change', () => {
    toggleReminder(id);
  });

  if (reminder.done) {
    textDiv.querySelector('strong').classList.add('todo-completed');
  }

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
window.renderReminders = renderReminders;

// Inizializza il modulo
loadUglyReminders(); 