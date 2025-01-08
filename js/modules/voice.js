// Aggiungi il contenuto HTML
document.getElementById("voice-tab").innerHTML = `
  <section>
    <h2>Ugly Voice (demo)</h2>
    <div style="margin: 10px 0;">
      <button id="startVoiceBtn" style="margin-right: 10px;">🎤 Avvia registrazione</button>
      <button id="stopVoiceBtn" disabled>⏹ Ferma registrazione</button>
    </div>
    <div id="voiceStatus" style="padding: 10px; margin: 10px 0; border: 2px solid black;"></div>
    <div id="voiceNotes" style="margin-top: 20px;"></div>
  </section>
`;

// Riferimenti ai bottoni e status
const startBtn = document.getElementById("startVoiceBtn");
const stopBtn = document.getElementById("stopVoiceBtn");
const statusDiv = document.getElementById("voiceStatus");
const notesDiv = document.getElementById("voiceNotes");

// Funzione per mostrare la tab voice
function showVoiceTab() {
  const voiceTab = document.getElementById('voice-tab');
  if (voiceTab) {
    // Nascondi tutte le tab
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.style.display = 'none';
    });
    // Mostra la tab voice
    voiceTab.style.display = 'block';
    // Carica le registrazioni
    if (user.is) {
      loadUglyVoice();
    }
  }
}

// Gestione click sulla tab
document.querySelector('[data-tab="voice"]').addEventListener('click', () => {
  showVoiceTab();
  // Aggiorna l'URL
  window.location.hash = 'voice';
});

// Carica le registrazioni all'avvio se siamo nella tab voice
if (window.location.hash === '#voice') {
  showVoiceTab();
}

// Carica le registrazioni se l'utente è loggato
if (user.is) {
  loadUglyVoice();
}

// Variabili per la registrazione
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Funzione per avviare la registrazione
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    });

    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstart = () => {
      console.log('Registrazione avviata');
      isRecording = true;
      statusDiv.textContent = "🎤 Registrazione in corso...";
      statusDiv.style.backgroundColor = "var(--ugly-green)";
      startBtn.disabled = true;
      stopBtn.disabled = false;
      addAmbientSound({ type: 'start' });
    };

    mediaRecorder.onstop = async () => {
      try {
        isRecording = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;

        // Crea il blob audio
        const audioBlob = new Blob(audioChunks, { 
          type: 'audio/webm;codecs=opus' 
        });

        // Converti in base64
        const audioData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });

        // Salva la nota vocale
        await saveVoiceNote(audioData);

        // Pulisci le risorse
        audioChunks = [];
        stream.getTracks().forEach(track => track.stop());

        statusDiv.textContent = "✅ Registrazione completata";
        statusDiv.style.backgroundColor = "var(--ugly-green)";
        addAmbientSound({ type: 'success' });

        setTimeout(() => {
          statusDiv.textContent = "⏹ Registrazione fermata";
          statusDiv.style.backgroundColor = "white";
        }, 2000);

      } catch (error) {
        console.error('Errore durante il salvataggio dell\'audio:', error);
        statusDiv.textContent = "❌ Errore nel salvataggio dell'audio";
        statusDiv.style.backgroundColor = "var(--ugly-pink)";
      }
    };

    // Inizia la registrazione
    mediaRecorder.start(1000);

  } catch (error) {
    console.error('Errore accesso microfono:', error);
    statusDiv.textContent = "❌ Errore nell'accesso al microfono";
    statusDiv.style.backgroundColor = "var(--ugly-pink)";
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

// Funzione per fermare la registrazione
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    try {
      mediaRecorder.stop();
      addAmbientSound({ type: 'stop' });
    } catch (error) {
      console.error('Errore durante lo stop della registrazione:', error);
      statusDiv.textContent = "❌ Errore durante lo stop della registrazione";
      statusDiv.style.backgroundColor = "var(--ugly-pink)";
    }
  }
}

// Funzione per salvare la nota vocale
async function saveVoiceNote(audioData) {
  if (!user.is || !audioData) return;

  try {
    const noteId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Salva in Gun.js
    await new Promise((resolve, reject) => {
      user.get('voiceNotes').get(noteId).put({
        id: noteId,
        userId: user.is.pub,
        timestamp: Date.now(),
        audio: audioData
      }, ack => {
        if (ack.err) {
          reject(ack.err);
          console.error('Errore salvataggio Gun:', ack.err);
        } else {
          resolve();
        }
      });
    });

    // Aggiorna UI
    const noteDiv = document.createElement('div');
    noteDiv.style.margin = '10px 0';
    noteDiv.style.padding = '15px';
    noteDiv.style.border = '2px solid black';
    noteDiv.style.backgroundColor = 'white';
    noteDiv.style.borderRadius = '8px';
    noteDiv.innerHTML = `
      <div style="margin-bottom: 10px; color: #666;">
        <small>📅 ${new Date(Date.now()).toLocaleString()}</small>
      </div>
      <audio controls src="${audioData}" style="width: 100%; margin: 5px 0;"></audio>
      <button onclick="deleteVoiceNote('${noteId}')" class="delete-btn" 
        style="margin-top: 10px; background: var(--ugly-pink); padding: 5px 10px; border: 1px solid black; cursor: pointer;">
        🗑️ Elimina registrazione
      </button>
    `;
    notesDiv.insertBefore(noteDiv, notesDiv.firstChild);

  } catch (error) {
    console.error('Errore salvataggio nota vocale:', error);
    throw error;
  }
}

// Funzione per caricare le note vocali salvate
async function loadUglyVoice() {
  if (!user.is) return;

  notesDiv.innerHTML = '<div style="padding: 10px; text-align: center;">Caricamento registrazioni...</div>';
  
  try {
    // Carica le note da Gun.js
    const notes = [];
    await new Promise(resolve => {
      user.get('voiceNotes').map().once((note, id) => {
        if (note && note.userId === user.is.pub && note.audio) {
          notes.push({
            id: note.id,
            userId: note.userId,
            audio: note.audio,
            timestamp: note.timestamp
          });
        }
      });
      
      // Attendi un po' per assicurarsi che tutte le note siano caricate
      setTimeout(resolve, 1000);
    });

    // Ordina le note per timestamp
    notes.sort((a, b) => b.timestamp - a.timestamp);

    if (notes.length === 0) {
      notesDiv.innerHTML = `
        <div style="padding: 20px; text-align: center; background-color: var(--ugly-yellow); border: 2px dashed black; margin-top: 20px;">
          📝 Nessuna registrazione salvata. Premi il pulsante "🎤 Avvia registrazione" per iniziare!
        </div>
      `;
      return;
    }

    notesDiv.innerHTML = `
      <div style="margin: 20px 0 10px 0; padding: 10px; background-color: var(--ugly-green); border: 2px solid black;">
        🎵 Le tue registrazioni (${notes.length})
      </div>
    `;

    // Aggiorna UI
    for (const note of notes) {
      const noteDiv = document.createElement('div');
      noteDiv.style.margin = '10px 0';
      noteDiv.style.padding = '15px';
      noteDiv.style.border = '2px solid black';
      noteDiv.style.backgroundColor = 'white';
      noteDiv.style.borderRadius = '8px';
      noteDiv.innerHTML = `
        <div style="margin-bottom: 10px; color: #666;">
          <small>📅 ${new Date(note.timestamp).toLocaleString()}</small>
        </div>
        <audio controls src="${note.audio}" style="width: 100%; margin: 5px 0;"></audio>
        <button onclick="deleteVoiceNote('${note.id}')" class="delete-btn" 
          style="margin-top: 10px; background: var(--ugly-pink); padding: 5px 10px; border: 1px solid black; cursor: pointer;">
          🗑️ Elimina registrazione
        </button>
      `;
      notesDiv.appendChild(noteDiv);
    }

  } catch (error) {
    console.error('Errore caricamento note vocali:', error);
    notesDiv.innerHTML = `
      <div style="padding: 20px; text-align: center; background-color: var(--ugly-pink); border: 2px solid black; margin-top: 20px;">
        ❌ Errore nel caricamento delle registrazioni
      </div>
    `;
  }
}

// Funzione per eliminare una nota vocale
async function deleteVoiceNote(noteId) {
  if (!user.is) return;

  try {
    // Elimina da Gun.js
    await new Promise((resolve, reject) => {
      user.get('voiceNotes').get(noteId).put(null, ack => {
        if (ack.err) reject(ack.err);
        else resolve();
      });
    });

    // Ricarica la lista e riproduci suono
    loadUglyVoice();
    addAmbientSound({ type: 'delete' });

  } catch (error) {
    console.error('Errore eliminazione nota vocale:', error);
  }
}

// Event listeners
startBtn.addEventListener("click", startRecording);
stopBtn.addEventListener("click", stopRecording);

// Rendi le funzioni disponibili globalmente
window.loadUglyVoice = loadUglyVoice;
window.deleteVoiceNote = deleteVoiceNote; 