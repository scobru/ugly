// Aggiungi il contenuto HTML
document.getElementById("calendar-tab").innerHTML = `
  <section>
    <h2>Ugly Calendar</h2>
    <div style="margin: 10px 0;">
      <input type="text" id="eventTitle" placeholder="Titolo evento">
      <input type="datetime-local" id="eventDate">
      <button onclick="addEvent()">➕ Aggiungi</button>
    </div>
    <div id="eventsList" style="margin-top: 20px;"></div>
  </section>
`;

// Funzione per caricare gli eventi
function loadUglyCalendar() {
  if (!user.is) return;
  
  const eventsList = document.getElementById("eventsList");
  eventsList.innerHTML = '';

  // Usa un nodo specifico per gli eventi dell'utente
  const eventsNode = `${user.is.pub}/events`;
  gun.get(eventsNode).map().once((event, id) => {
    if (event) {
      addEventToUI(event, id);
    }
  });
}

// Funzione per aggiungere un evento
async function addEvent() {
  if (!user.is) {
    alert('Devi essere autenticato per aggiungere eventi');
    return;
  }

  const titleInput = document.getElementById('eventTitle');
  const dateInput = document.getElementById('eventDate');
  
  const title = titleInput.value.trim();
  const date = dateInput.value;

  if (!title || !date) {
    alert('Inserisci sia il titolo che la data dell\'evento');
    return;
  }

  const event = {
    title: title,
    date: date,
    ts: Date.now()
  };

  // Usa un nodo specifico per gli eventi dell'utente
  const eventsNode = `${user.is.pub}/events`;
  gun.get(eventsNode).set(event, (ack) => {
    if (ack.err) {
      console.error('Errore salvataggio evento:', ack.err);
      alert('Errore nel salvataggio dell\'evento');
    } else {
      titleInput.value = '';
      dateInput.value = '';
      addAmbientSound({ type: 'success' });
    }
  });
}

// Funzione per eliminare un evento
function deleteEvent(id) {
  if (confirm('Vuoi davvero eliminare questo evento?')) {
    const eventsNode = `${user.is.pub}/events`;
    gun.get(eventsNode).get(id).put(null);
    document.getElementById(`event-${id}`)?.remove();
    addAmbientSound({ type: 'delete' });
  }
}

// Funzione per aggiungere un evento alla UI
function addEventToUI(event, id) {
  const eventsList = document.getElementById("eventsList");
  
  const eventDiv = document.createElement('div');
  eventDiv.id = `event-${id}`;
  eventDiv.style.border = '2px solid black';
  eventDiv.style.padding = '10px';
  eventDiv.style.margin = '5px 0';
  eventDiv.style.backgroundColor = 'white';
  eventDiv.style.display = 'flex';
  eventDiv.style.justifyContent = 'space-between';
  eventDiv.style.alignItems = 'center';

  // Calcola se l'evento è passato
  const eventDate = new Date(event.date);
  const isPast = eventDate < new Date();
  
  // Formatta la data in modo leggibile
  const formattedDate = eventDate.toLocaleString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  eventDiv.innerHTML = `
    <div>
      <strong style="${isPast ? 'text-decoration: line-through;' : ''}">${event.title}</strong>
      <br>
      <span style="color: ${isPast ? 'gray' : 'black'}">📅 ${formattedDate}</span>
      <br>
      <small>Aggiunto il: ${new Date(event.ts).toLocaleString()}</small>
    </div>
    <div>
      <button onclick="deleteEvent('${id}')" 
              style="background: var(--ugly-pink);">
        🗑️
      </button>
    </div>
  `;

  // Ordina gli eventi per data
  let inserted = false;
  for (const child of eventsList.children) {
    const childDate = new Date(child.querySelector('span').textContent.slice(2));
    if (eventDate < childDate) {
      eventsList.insertBefore(eventDiv, child);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    eventsList.appendChild(eventDiv);
  }
}

// Rendi le funzioni disponibili globalmente
window.addEvent = addEvent;
window.deleteEvent = deleteEvent;
window.loadUglyCalendar = loadUglyCalendar;

// Inizializza il modulo
loadUglyCalendar(); 