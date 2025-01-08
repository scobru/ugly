// Sistema di suoni ambientali
class UglySoundSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.oscillators = [];
    this.lastNoteTime = 0;
    this.isInitialized = false;
    this.isRecording = false; // Flag per la registrazione vocale
  }

  init() {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.5; // Volume aumentato da 0.3 a 0.5
      this.isInitialized = true;
      console.log('Sistema audio inizializzato con successo');
      this.setupEventListeners();
    } catch (e) {
      console.error("Web Audio API non supportata:", e);
    }
  }

  setupEventListeners() {
    // Hover su elementi interattivi
    document.querySelectorAll('button, .tab-button, .radio-card, .station-card, .todo-item, .note-item')
      .forEach(el => {
        el.addEventListener('mouseenter', () => this.play('hover'));
        el.addEventListener('click', () => this.play('click'));
      });

    // Input e textarea
    document.querySelectorAll('input, textarea')
      .forEach(el => {
        el.addEventListener('focus', () => this.play('focus'));
        el.addEventListener('input', () => this.play('type'));
      });

    // Delete buttons
    document.querySelectorAll('.delete-btn, [data-action="delete"]')
      .forEach(el => {
        el.addEventListener('click', () => this.play('delete'));
      });

    // Checkbox e completamento
    document.querySelectorAll('input[type="checkbox"]')
      .forEach(el => {
        el.addEventListener('change', () => this.play('complete'));
      });

    // Dark mode toggle
    const darkModeToggle = document.querySelector('#darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => this.play('mode'));
    }
  }

  // Metodi per gestire la registrazione vocale
  startRecording() {
    this.isRecording = true;
    this.masterGain.gain.value = 0; // Silenzia i suoni durante la registrazione
  }

  stopRecording() {
    this.isRecording = false;
    this.masterGain.gain.value = 0.3; // Ripristina il volume
  }

  addSound(data) {
    if (!this.isInitialized || this.isRecording) return; // Non riprodurre suoni durante la registrazione
    
    if (!this.isInitialized) {
      this.init();
    }
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    if (now - this.lastNoteTime < 0.05) return; // Ridotto il delay
    this.lastNoteTime = now;

    this.oscillators = this.oscillators.filter(osc => {
      if (osc.stopTime < now) {
        osc.disconnect();
        return false;
      }
      return true;
    });

    let freq = 440;
    let duration = 0.1;
    let type = 'sine';

    switch(data.type) {
      case 'hover':
        freq = 880;
        duration = 0.03;
        type = 'sine';
        break;
      case 'click':
        freq = 660;
        duration = 0.05;
        type = 'sine';
        break;
      case 'focus':
        freq = 440;
        duration = 0.08;
        type = 'triangle';
        break;
      case 'type':
        freq = 1320;
        duration = 0.02;
        type = 'sine';
        break;
      case 'delete':
        this.playSequence([7, 4, 0], 0.05);
        return;
      case 'complete':
        this.playChord([0, 4, 7], 0.1);
        return;
      case 'mode':
        this.playSequence([0, 4, 7, 12], 0.08);
        return;
      case 'success':
        this.playChord([0, 4, 7], 0.15);
        return;
      case 'error':
        this.playChord([0, -2, -4], 0.2);
        return;
      case 'notification':
        this.playSequence([0, 4, 7], 0.1);
        return;
    }

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
    osc.stopTime = now + duration;

    this.oscillators.push(osc);
  }

  playSequence(notes, duration) {
    if (!this.isInitialized) return;
    const now = this.audioContext.currentTime;
    notes.forEach((note, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.frequency.value = 440 * Math.pow(2, note / 12);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.1, now + i * duration);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now + i * duration);
      osc.stop(now + (i + 1) * duration);
      osc.stopTime = now + (i + 1) * duration;
      
      this.oscillators.push(osc);
    });
  }

  playChord(notes, duration) {
    if (!this.isInitialized) return;
    const now = this.audioContext.currentTime;
    notes.forEach(note => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.frequency.value = 440 * Math.pow(2, note / 12);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.1 / notes.length, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now);
      osc.stop(now + duration);
      osc.stopTime = now + duration;
      
      this.oscillators.push(osc);
    });
  }

  play(type) {
    this.addSound({ type });
  }

  playLoginVictory() {
    console.log('Tentativo di riproduzione suono vittoria...');
    
    if (!this.isInitialized) {
      console.log('Inizializzazione sistema audio...');
      this.init();
    }
    
    // Aumenta temporaneamente il volume master ma più basso di prima
    const originalVolume = this.masterGain.gain.value;
    this.masterGain.gain.value = 0.4; // Ridotto da 0.8 a 0.4
    
    const now = this.audioContext.currentTime;
    // Note dell'arpeggio (Do maggiore): Do, Mi, Sol, Do, Mi (ottava superiore)
    const notes = [261.63, 329.63, 392.00, 523.25, 659.26];
    const duration = 0.6;  // Aumentata durata da 0.4 a 0.6
    const delay = 0.3;    // Aumentato delay da 0.2 a 0.3
    
    notes.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      // Usiamo una forma d'onda più dolce
      osc.type = 'sine'; // Cambiato da 'triangle' a 'sine' per un suono più delicato
      osc.frequency.value = freq;
      
      // Configuriamo l'inviluppo ADSR per un suono più morbido
      gain.gain.setValueAtTime(0, now + index * delay);
      gain.gain.linearRampToValueAtTime(0.3, now + index * delay + 0.1);  // Volume ridotto a 0.3
      gain.gain.linearRampToValueAtTime(0.2, now + index * delay + duration * 0.5);
      gain.gain.linearRampToValueAtTime(0, now + index * delay + duration);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now + index * delay);
      osc.stop(now + index * delay + duration);
      
      console.log(`Nota ${index + 1} riprodotta: ${freq}Hz`);
    });

    // Ripristina il volume master dopo la riproduzione
    setTimeout(() => {
      this.masterGain.gain.value = originalVolume;
      console.log('Volume master ripristinato');
    }, notes.length * delay * 1000 + duration * 1000);

    // Effetti visivi più delicati
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    setTimeout(() => createFirework(centerX, centerY), 200);
    setTimeout(() => createFirework(centerX - 100, centerY - 50), 500);
    setTimeout(() => createFirework(centerX + 100, centerY - 50), 800);
  }
}

// Inizializzazione globale
window.uglySounds = new UglySoundSystem();

// Inizializza il sistema audio solo dopo la prima interazione dell'utente
document.addEventListener('click', function initAudio() {
  window.uglySounds.init();
  document.removeEventListener('click', initAudio);
});

// Funzione per aggiungere suoni ambientali
window.addAmbientSound = (data) => window.uglySounds.addSound(data);

// Lista di emoji per i click particles
const clickEmojis = ['✨', '💫', '⭐', '🌟', '💥', '🎵', '🎶', '🎸', '🎹', '🎼'];

// Funzione per creare particelle di emoji
function createClickParticle(x, y) {
  const particle = document.createElement('div');
  particle.className = 'click-particle';
  
  // Scegli un emoji casuale
  const emoji = clickEmojis[Math.floor(Math.random() * clickEmojis.length)];
  particle.setAttribute('data-emoji', emoji);
  
  // Posiziona la particella
  particle.style.left = x + 'px';
  particle.style.top = y + 'px';
  
  document.body.appendChild(particle);
  
  // Rimuovi la particella dopo l'animazione
  particle.addEventListener('animationend', () => {
    particle.remove();
  });
}

// Aggiungi l'event listener per i click
document.addEventListener('click', (e) => {
  // Crea 3 particelle per ogni click
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      createClickParticle(e.clientX, e.clientY);
    }, i * 50);
  }
});

// Lista di emoji per i fuochi d'artificio
const fireworkEmojis = ['✨', '💫', '⭐', '🌟', '💥', '🎆', '🎇', '🌠', '🎉', '🎊', '🎈', '🌸', '🌺', '🌼', '🌻'];

// Funzione per creare un fuoco d'artificio
function createFirework(x, y) {
  const numParticles = 12; // Numero di particelle per ogni fuoco d'artificio
  const angleStep = (2 * Math.PI) / numParticles;
  const distance = Math.random() * 100 + 50; // Distanza random tra 50 e 150px

  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement('div');
    particle.className = 'firework-particle';
    
    // Scegli un emoji casuale
    const emoji = fireworkEmojis[Math.floor(Math.random() * fireworkEmojis.length)];
    particle.textContent = emoji;
    
    // Calcola la direzione della particella
    const angle = angleStep * i;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    
    // Imposta le variabili CSS per la direzione
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    
    // Posiziona la particella
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    
    document.body.appendChild(particle);
    
    // Rimuovi la particella dopo l'animazione
    particle.addEventListener('animationend', () => {
      particle.remove();
    });
  }
}

// Aggiungi l'event listener per i click
document.addEventListener('click', (e) => {
  // Crea un fuoco d'artificio principale
  createFirework(e.clientX, e.clientY);
  
  // Crea 2 fuochi d'artificio aggiuntivi con leggero delay e offset
  setTimeout(() => {
    createFirework(e.clientX + 30, e.clientY - 20);
  }, 100);
  
  setTimeout(() => {
    createFirework(e.clientX - 30, e.clientY - 20);
  }, 200);
});

// Rimuoviamo la vecchia funzione globale e aggiungiamo il nuovo metodo al namespace globale
window.playLoginVictory = () => window.uglySounds.playLoginVictory(); 