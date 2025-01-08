// Aggiungi il contenuto HTML
document.getElementById("voice-tab").innerHTML = `
  <section>
    <h2>Ugly Voice (demo)</h2>
    <button id="startVoice">🎤 Avvia registrazione</button>
    <button id="stopVoice" disabled>⏹️ Ferma registrazione</button>
    <div id="voiceOutput"></div>
  </section>
`;

// Riferimenti DOM
const startBtn = document.getElementById("startVoice");
const stopBtn = document.getElementById("stopVoice");
const voiceOutput = document.getElementById("voiceOutput");
let recognition = null;
let isRecording = false;
let retryTimeout = null;

function loadUglyVoice() {
  if (!("webkitSpeechRecognition" in window)) {
    startBtn.disabled = true;
    stopBtn.disabled = true;
    voiceOutput.textContent = "La Web Speech API non è supportata in questo browser.";
    return;
  }

  recognition = new webkitSpeechRecognition();
  const statusDiv = document.createElement("div");
  statusDiv.style.padding = "10px";
  statusDiv.style.margin = "10px 0";
  statusDiv.style.borderRadius = "5px";
  statusDiv.style.textAlign = "center";
  statusDiv.style.fontWeight = "bold";
  statusDiv.style.border = "2px solid #000";
  voiceOutput.parentNode.insertBefore(statusDiv, voiceOutput);

  setupVoiceRecognition(recognition, statusDiv);
  setupVoiceButtons(recognition, statusDiv);
  updateVoiceUI(statusDiv, "stopped");
}

function setupVoiceRecognition(recognition, statusDiv) {
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'it-IT';
  
  recognition.onstart = function() {
    console.log('Recognition started');
    isRecording = true;
    updateVoiceUI(statusDiv, "recording");
    startBtn.disabled = true;
    stopBtn.disabled = false;
  };

  recognition.onend = function() {
    console.log('Recognition ended');
    if (isRecording) {
      clearTimeout(retryTimeout);
      retryTimeout = setTimeout(() => {
        if (isRecording) {
          console.log('Attempting to restart recognition...');
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            handleRecognitionError(statusDiv, 'restart_failed');
          }
        }
      }, 1000);
    } else {
      updateVoiceUI(statusDiv, "stopped");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  };

  recognition.onerror = function(event) {
    console.error('Recognition error:', event.error);
    handleRecognitionError(statusDiv, event.error);
  };

  recognition.onresult = function(event) {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
        saveVoiceText(finalTranscript);
      } else {
        interimTranscript += transcript;
      }
    }

    voiceOutput.innerHTML = `
      <div style="color: #666;">${interimTranscript}</div>
      <div style="color: #000; margin-top: 10px; font-weight: bold;">${finalTranscript}</div>
    `;
  };
}

function handleRecognitionError(statusDiv, error) {
  let errorMessage = 'Errore nel riconoscimento vocale';
  let shouldRestart = false;
  
  switch(error) {
    case 'not-allowed':
      errorMessage = 'Per favore concedi i permessi per il microfono';
      isRecording = false;
      break;
    case 'network':
      errorMessage = 'Errore di rete. Riprovo tra 5 secondi...';
      shouldRestart = true;
      break;
    case 'no-speech':
      errorMessage = 'Nessun audio rilevato. Riprovo...';
      shouldRestart = true;
      break;
    case 'restart_failed':
      errorMessage = 'Errore nel riavvio. Prova a ricominciare.';
      isRecording = false;
      break;
    default:
      isRecording = false;
  }
  
  updateVoiceUI(statusDiv, "error", errorMessage);
  
  if (!isRecording) {
    startBtn.disabled = false;
    stopBtn.disabled = true;
  } else if (shouldRestart) {
    clearTimeout(retryTimeout);
    retryTimeout = setTimeout(() => {
      if (isRecording) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart after error:', e);
          handleRecognitionError(statusDiv, 'restart_failed');
        }
      }
    }, 5000);
  }
}

function setupVoiceButtons(recognition, statusDiv) {
  startBtn.onclick = function() {
    try {
      isRecording = true;
      recognition.start();
      addAmbientSound({ type: "success" });
    } catch (e) {
      console.error('Error starting recognition:', e);
      handleRecognitionError(statusDiv, 'restart_failed');
    }
  };

  stopBtn.onclick = function() {
    isRecording = false;
    clearTimeout(retryTimeout);
    recognition.stop();
    addAmbientSound({ type: "success" });
    updateVoiceUI(statusDiv, "stopped");
    startBtn.disabled = false;
    stopBtn.disabled = true;
  };
}

function updateVoiceUI(statusDiv, state, message = '') {
  switch(state) {
    case "recording":
      statusDiv.style.background = "#ff6b6b";
      statusDiv.textContent = "🎤 Registrazione in corso...";
      break;
    case "stopped":
      statusDiv.style.background = "#51cf66";
      statusDiv.textContent = "⏹️ Registrazione fermata";
      break;
    case "error":
      statusDiv.style.background = "#ffd43b";
      statusDiv.textContent = `⚠️ ${message}`;
      break;
  }
}

function saveVoiceText(text) {
  if (!text.trim() || !user.is) return;
  
  user.get("uglyVoice").set({
    text: text,
    timestamp: Date.now()
  });
}

// Inizializza il modulo
loadUglyVoice(); 