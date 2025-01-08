// Aggiungi il contenuto HTML
document.getElementById("voice-tab").innerHTML = `
  <section>
    <h2>Ugly Voice (demo)</h2>
    <div style="margin: 10px 0;">
      <button id="startVoiceBtn" style="margin-right: 10px;">🎤 Avvia registrazione</button>
      <button id="stopVoiceBtn" disabled>⏹ Ferma registrazione</button>
    </div>
    <div id="voiceStatus" style="padding: 10px; margin: 10px 0; border: 2px solid black;"></div>
  </section>
`;

// Riferimenti ai bottoni e status
const startBtn = document.getElementById("startVoiceBtn");
const stopBtn = document.getElementById("stopVoiceBtn");
const statusDiv = document.getElementById("voiceStatus");

// Variabili per il riconoscimento vocale
let recognition = null;
let isRecording = false;
let retryTimeout = null;
const maxRetries = 3;
let retryCount = 0;

// Funzione per inizializzare il riconoscimento vocale
function initRecognition() {
  try {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      console.log('Recognition started');
      statusDiv.textContent = "🎤 Registrazione in corso...";
      statusDiv.style.backgroundColor = "var(--ugly-green)";
      startBtn.disabled = true;
      stopBtn.disabled = false;
      isRecording = true;
      retryCount = 0;
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      console.log('Transcript:', transcript);
      if (transcript.trim()) {
        saveVoiceNote(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      statusDiv.textContent = `⚠️ Errore di rete. Riprovo tra 5 secondi...`;
      statusDiv.style.backgroundColor = "var(--ugly-yellow)";
      
      if (isRecording && retryCount < maxRetries) {
        retryCount++;
        clearTimeout(retryTimeout);
        retryTimeout = setTimeout(() => {
          console.log('Attempting to restart recognition...');
          stopRecognition();
          startRecognition();
        }, 5000);
      } else {
        stopRecognition();
        statusDiv.textContent = "❌ Troppi errori. Riprova più tardi.";
        statusDiv.style.backgroundColor = "var(--ugly-pink)";
      }
    };

    recognition.onend = () => {
      console.log('Recognition ended');
      if (isRecording && retryCount < maxRetries) {
        console.log('Restarting recognition...');
        startRecognition();
      }
    };

  } catch (e) {
    console.error('Speech recognition not supported:', e);
    statusDiv.textContent = "❌ Riconoscimento vocale non supportato";
    statusDiv.style.backgroundColor = "var(--ugly-pink)";
    startBtn.disabled = true;
  }
}

// Funzione per avviare la registrazione
function startRecognition() {
  try {
    if (!recognition) {
      initRecognition();
    }
    recognition.start();
    addAmbientSound({ type: 'start' });
  } catch (e) {
    console.error('Error starting recognition:', e);
    stopRecognition();
  }
}

// Funzione per fermare la registrazione
function stopRecognition() {
  try {
    if (recognition) {
      recognition.stop();
    }
    clearTimeout(retryTimeout);
    isRecording = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusDiv.textContent = "⏹ Registrazione fermata";
    statusDiv.style.backgroundColor = "white";
    addAmbientSound({ type: 'stop' });
  } catch (e) {
    console.error('Error stopping recognition:', e);
  }
}

// Funzione per salvare la nota vocale
async function saveVoiceNote(text) {
  if (!user.is || !text.trim()) return;

  const note = {
    text: text,
    timestamp: Date.now(),
    type: 'voice'
  };

  user.get('uglyVoiceNotes').set(note, (ack) => {
    if (ack.err) {
      console.error('Error saving voice note:', ack.err);
    } else {
      addAmbientSound({ type: 'success' });
    }
  });
}

// Aggiungi la funzione loadUglyVoice per compatibilità
function loadUglyVoice() {
  // Questa funzione viene chiamata al login, quindi è un buon posto per inizializzare
  if (recognition) {
    stopRecognition();
  }
  initRecognition();
  
  // Carica le note vocali salvate
  if (user.is) {
    user.get('uglyVoiceNotes').map().once((note) => {
      if (note && note.text) {
        const voiceDiv = document.createElement('div');
        voiceDiv.style.margin = '10px 0';
        voiceDiv.style.padding = '10px';
        voiceDiv.style.border = '2px solid black';
        voiceDiv.style.backgroundColor = 'white';
        
        voiceDiv.innerHTML = `
          <div style="margin-bottom: 5px;">
            <small>${new Date(note.timestamp).toLocaleString()}</small>
          </div>
          <div style="white-space: pre-wrap;">${note.text}</div>
        `;
        
        statusDiv.parentNode.appendChild(voiceDiv);
      }
    });
  }
}

// Rendi la funzione disponibile globalmente
window.loadUglyVoice = loadUglyVoice;

// Event listeners
startBtn.addEventListener("click", startRecognition);
stopBtn.addEventListener("click", stopRecognition);

// Inizializza il riconoscimento
initRecognition(); 