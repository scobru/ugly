// Web radio con API Radio.co
class UglyRadio {
  constructor() {
    this.audio = new Audio();
    this.container = document.getElementById('radio-container');
    // Usiamo una web radio pubblica che non richiede autenticazione
    this.streams = [
      {
        name: "Ugly Ambient Radio", 
        description: "Musica ambient 24/7",
        url: "https://ice1.somafm.com/dronezone-128-mp3",
        genre: "Ambient"
      },
      {
        name: "Ugly Space Radio",
        description: "Suoni spaziali e atmosfere cosmiche", 
        url: "https://ice1.somafm.com/deepspaceone-128-mp3",
        genre: "Space"
      },
      {
        name: "Ugly Groove Radio",
        description: "Groove e beats strani",
        url: "https://ice1.somafm.com/groovesalad-128-mp3", 
        genre: "Electronic"
      }
    ];
    this.currentStream = 0;
    
    this.setupStyles();
    this.render();
  }

  setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .radio-container {
        background: var(--ugly-pink);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        color: var(--text-color);
        transition: background-color 0.3s;
      }

      .radio-info {
        background: var(--ugly-yellow);
        padding: 15px;
        border-radius: 8px;
        margin: 20px 0;
        color: black;
        transition: background-color 0.3s, color 0.3s;
      }

      .radio-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 15px;
        margin-top: 15px;
      }

      .stream-selector {
        background: var(--ugly-green);
        padding: 10px;
        margin: 10px 0;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s;
        border: 2px solid black;
        color: black;
      }

      .stream-selector:hover {
        transform: scale(1.02);
        background: var(--ugly-yellow);
      }

      .stream-selector.active {
        background: var(--ugly-purple);
        color: white;
        border-color: white;
      }

      .radio-title {
        color: var(--text-color);
        text-align: center;
        margin-bottom: 10px;
        font-size: 1.5em;
        transition: color 0.3s;
      }

      .radio-controls button {
        background: var(--ugly-yellow);
        border: 2px solid black;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        color: black;
        transition: background-color 0.3s, color 0.3s;
      }

      .radio-controls button:hover {
        background: var(--ugly-green);
      }

      .radio-controls input[type="range"] {
        width: 100px;
        transition: background-color 0.3s;
      }

      /* Dark mode */
      .dark-mode .radio-container {
        background: var(--dark-section);
        color: var(--dark-text);
      }

      .dark-mode .radio-info {
        background: var(--dark-section);
        color: var(--dark-text);
      }

      .dark-mode .radio-controls button {
        background: var(--dark-button);
        color: var(--dark-text);
        border-color: var(--dark-border);
      }

      .dark-mode .radio-controls button:hover {
        background: var(--dark-button-hover);
      }

      .dark-mode .radio-controls input[type="range"] {
        background: var(--dark-input);
      }

      .dark-mode .radio-controls span {
        color: var(--dark-text);
      }

      .dark-mode .radio-title {
        color: var(--dark-text);
      }

      .dark-mode .stream-selector {
        background: var(--dark-section);
        color: var(--dark-text);
        border-color: var(--dark-border);
      }

      .dark-mode .stream-selector:hover {
        background: var(--dark-button-hover);
      }

      .dark-mode .stream-selector.active {
        background: var(--dark-accent);
        color: var(--dark-text);
        border-color: var(--dark-accent);
      }
    `;
    document.head.appendChild(style);
  }

  changeStream(index) {
    this.currentStream = index;
    const wasPlaying = !this.audio.paused;
    
    // Ferma la riproduzione corrente
    this.audio.pause();
    
    // Cambia stream
    this.audio.src = this.streams[index].url;
    
    // Se stava suonando, riprendi la riproduzione
    if (wasPlaying) {
      this.audio.play().catch(err => {
        console.error('Errore riproduzione:', err);
        document.getElementById('radioToggle').textContent = '▶️ Play Radio';
      });
    }
    
    this.updateStreamInfo();
    this.updateStreamSelectors();
  }

  updateStreamInfo() {
    const stream = this.streams[this.currentStream];
    const info = document.querySelector('.radio-info');
    if (info) {
      info.innerHTML = `
        <h3>${stream.name}</h3>
        <p>${stream.description}</p>
        <small>Genre: ${stream.genre}</small>
      `;
    }
  }

  updateStreamSelectors() {
    const selectors = document.querySelectorAll('.stream-selector');
    selectors.forEach((selector, i) => {
      selector.classList.toggle('active', i === this.currentStream);
    });
  }

  render() {
    this.container.innerHTML = `
      <div class="radio-container">
        <h2 class="radio-title">UGLY Radio Live 📻</h2>
        
        <div class="streams">
          ${this.streams.map((stream, i) => `
            <div class="stream-selector ${i === this.currentStream ? 'active' : ''}" 
                 onclick="uglyRadio.changeStream(${i})">
              ${stream.name}
            </div>
          `).join('')}
        </div>

        <div class="radio-info">
          <h3>${this.streams[this.currentStream].name}</h3>
          <p>${this.streams[this.currentStream].description}</p>
          <small>Genre: ${this.streams[this.currentStream].genre}</small>
        </div>

        <div class="radio-controls">
          <button id="radioToggle">▶️ Play Radio</button>
          <span>🔈</span>
          <input type="range" id="radioVolume" min="0" max="1" step="0.1" value="0.5">
          <span>🔊</span>
        </div>

        <div class="volume-controls-container">
          <span class="volume-control-icon" onclick="decreaseVolume()">🔉</span>
          <input type="range" id="volumeSlider" min="0" max="100" value="50" class="volume-slider">
          <span class="volume-control-icon" onclick="increaseVolume()">🔊</span>
        </div>
      </div>
    `;

    // Event listeners
    const radioToggle = document.getElementById('radioToggle');
    const radioVolume = document.getElementById('radioVolume');

    radioToggle.addEventListener('click', () => {
      if (this.audio.paused) {
        if (!this.audio.src) {
          this.audio.src = this.streams[this.currentStream].url;
        }
        this.audio.play()
          .then(() => {
            radioToggle.textContent = '⏸️ Pause';
            addAmbientSound({ type: 'success' });
          })
          .catch(err => {
            console.error('Errore riproduzione:', err);
            alert('Errore nella riproduzione. Riprova.');
          });
      } else {
        this.audio.pause();
        radioToggle.textContent = '▶️ Play Radio';
      }
    });

    radioVolume.addEventListener('input', (e) => {
      this.audio.volume = e.target.value;
    });

    // Imposta volume iniziale
    this.audio.volume = 0.5;
  }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  window.uglyRadio = new UglyRadio();
});