// Sistema di suoni ambientali
class UglySoundSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.oscillators = [];
    this.lastNoteTime = 0;
    this.init();
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.5; // Volume generale
    } catch (e) {
      console.error("Web Audio API non supportata:", e);
    }
  }

  // Genera suono basato sui dati
  addSound(data) {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    if (now - this.lastNoteTime < 0.1) return; // Evita troppi suoni ravvicinati
    this.lastNoteTime = now;

    // Pulisci vecchi oscillatori
    this.oscillators = this.oscillators.filter(osc => {
      if (osc.stopTime < now) {
        osc.disconnect();
        return false;
      }
      return true;
    });

    // Crea suono basato sul tipo di dato
    let freq = 440; // La4 come base
    let duration = 0.1;
    let type = 'sine';

    switch(data.type) {
      case 'text':
        // Suono per digitazione testo
        freq = 440 + (data.length % 12) * 50;
        duration = 0.05;
        type = 'sine';
        break;
      case 'note':
        // Suono per note
        const noteHash = this.hashString(data.text);
        freq = 220 + (noteHash % 880);
        duration = 0.2;
        type = ['sine', 'triangle', 'square'][noteHash % 3];
        break;
      case 'delete':
        // Suono per cancellazione
        freq = 220;
        duration = 0.15;
        type = 'sawtooth';
        break;
      case 'click':
        // Suono per click
        freq = 660;
        duration = 0.05;
        type = 'sine';
        this.createEmojiParticles(data.x, data.y);
        break;
      case 'success':
        // Suono per azioni completate
        freq = 440;
        duration = 0.1;
        this.playChord([0, 4, 7], duration);
        return;
      case 'error':
        // Suono per errori
        freq = 220;
        duration = 0.2;
        this.playChord([0, -2, -4], duration);
        return;
      case 'mail':
        // Suono per mail
        this.playSequence([0, 4, 7, 12], 0.1);
        return;
      case 'chat':
        // Suono per chat
        this.playSequence([0, 4, 7], 0.1);
        return;
    }

    // Crea e configura oscillatore
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

  // Suona una sequenza di note
  playSequence(notes, duration) {
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

  // Suona un accordo
  playChord(notes, duration) {
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

  // Funzione di hash per generare frequenze
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // Crea particelle emoji al click
  createEmojiParticles(x, y) {
    const emojis = ["🌟", "💫", "✨", "🎈", "🎉", "🌈", "🦄", "🍕", "🎨"];
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement("span");
      particle.className = "emoji-particle";
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      
      const angle = (Math.PI * 2 * i) / 8;
      const velocity = 100 + Math.random() * 100;
      particle.style.setProperty("--dx", `${Math.cos(angle) * velocity}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle) * velocity}px`);
      
      particle.style.left = x + "px";
      particle.style.top = y + "px";
      
      document.body.appendChild(particle);
      particle.addEventListener("animationend", () => particle.remove());
    }
  }

  play(type) {
    this.addSound({ type });
  }
}

// Inizializzazione globale
window.uglySounds = new UglySoundSystem();
window.addAmbientSound = (data) => window.uglySounds.addSound(data);

// Aggiungi suoni al click
document.addEventListener('click', function(e) {
  addAmbientSound({
    type: 'click',
    x: e.clientX,
    y: e.clientY
  });
}); 