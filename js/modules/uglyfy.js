class Uglyfy {
  constructor() {
    this.audio = new Audio();
    this.container = document.getElementById('uglyfy-container');
    this.publicTracks = gun.get('public').get('tracks');
    this.currentTrack = null;
    this.isPlaying = false;
    this.playlist = [];
    
    window.uglyfy = {
      filter: this.filter.bind(this),
      playTrack: this.playTrack.bind(this),
      deleteTrack: this.deleteTrack.bind(this),
      nextTrack: this.nextTrack.bind(this),
      prevTrack: this.prevTrack.bind(this)
    };
    
    this.setupStyles();
    this.render();
    this.loadTracks();
  }

  setupStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .upload-zone {
        border: 3px dashed #000;
        background: var(--ugly-yellow);
        padding: 20px;
        text-align: center;
        margin: 10px 0;
        color: black;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .dark-mode .upload-zone {
        border-color: #fff;
        background: var(--dark-section);
        color: var(--dark-text);
      }

      .upload-zone .license-info {
        margin-top: 10px;
        font-size: 0.9em;
        padding: 10px;
        background: rgba(255,255,255,0.7);
        border-radius: 5px;
      }

      .dark-mode .upload-zone .license-info {
        background: rgba(0,0,0,0.3);
      }

      .filters button {
        background: var(--ugly-yellow);
        border: 2px solid black;
        padding: 8px 15px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .dark-mode .filters button {
        background: var(--dark-button);
        border-color: var(--dark-border);
        color: var(--dark-text);
      }

      .player {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--ugly-purple);
        padding: 15px;
        border-top: 3px solid black;
        z-index: 1000;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .dark-mode .player {
        background: var(--dark-section);
        border-color: var(--dark-border);
      }

      .track-item {
        background: var(--ugly-yellow);
        padding: 15px;
        margin: 8px 0;
        border: 2px solid black;
        border-radius: 5px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: black;
        transition: all 0.3s ease;
      }

      .dark-mode .track-item {
        background: var(--dark-section);
        border-color: var(--dark-border);
        color: var(--dark-text);
      }

      .track-item.playing {
        background: var(--ugly-green);
      }

      .dark-mode .track-item.playing {
        background: var(--dark-accent);
      }

      .track-item button {
        background: none;
        border: none;
        font-size: 1.2em;
        cursor: pointer;
        color: inherit;
      }
    `;
    document.head.appendChild(style);
  }

  render() {
    this.container.innerHTML = `
      <div class="upload-zone">
        <div style="font-size: 2em; margin-bottom: 10px;">🎵</div>
        <strong>Trascina qui la tua musica brutta</strong>
        <br>o clicca per selezionare
        <input type="file" id="fileInput" hidden accept="audio/*">
        <div class="license-info">
          ⚠️ Importante: Carica solo musica sotto licenza Creative Commons o di cui possiedi i diritti.
          <br>
          <a href="https://creativecommons.org/licenses/" target="_blank" style="color: blue; text-decoration: underline;">
            Scopri di più sulle licenze CC
          </a>
        </div>
      </div>

      <div class="filters" style="margin: 20px 0; display: flex; gap: 10px; justify-content: center;">
        <button onclick="window.uglyfy.filter('popular')">🔥 Popolari</button>
        <button onclick="window.uglyfy.filter('new')">🆕 Nuove</button>
        <button onclick="window.uglyfy.filter('random')">🎲 Random</button>
      </div>

      <div id="trackList" style="margin-top: 20px; margin-bottom: 100px;">
        <!-- Lista tracce qui -->
      </div>

      <div class="player">
        <div style="display: flex; align-items: center; gap: 10px;">
          <button id="prevBtn">⏮️</button>
          <button id="playBtn">▶️</button>
          <button id="nextBtn">⏭️</button>
        </div>
        <div style="flex-grow: 1; margin: 0 20px;">
          <div id="nowPlaying" style="margin-bottom: 5px; font-weight: bold;">Nessuna traccia</div>
          <input type="range" id="progress" style="width: 100%; margin: 5px 0;" value="0">
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span id="volume-icon" style="cursor: pointer;">🔊</span>
          <input type="range" id="volume" min="0" max="1" step="0.1" value="0.5" style="width: 100px;">
        </div>
      </div>
    `;

    this.setupUpload();
    this.setupPlayer();
  }

  setupUpload() {
    const uploadZone = this.container.querySelector('.upload-zone');
    const fileInput = uploadZone.querySelector('#fileInput');

    uploadZone.ondragover = (e) => {
      e.preventDefault();
      uploadZone.style.background = document.body.classList.contains('dark-mode') ? 
        'var(--dark-accent)' : 'var(--ugly-green)';
      uploadZone.style.transform = 'scale(1.02)';
    };

    uploadZone.ondragleave = () => {
      uploadZone.style.background = document.body.classList.contains('dark-mode') ?
        'var(--dark-section)' : 'var(--ugly-yellow)';
      uploadZone.style.transform = 'scale(1)';
    };

    uploadZone.ondrop = (e) => {
      e.preventDefault();
      uploadZone.style.background = document.body.classList.contains('dark-mode') ?
        'var(--dark-section)' : 'var(--ugly-yellow)';
      uploadZone.style.transform = 'scale(1)';
      this.handleFiles(e.dataTransfer.files);
    };

    uploadZone.onclick = () => fileInput.click();
    fileInput.onchange = () => this.handleFiles(fileInput.files);
  }

  handleFiles(files) {
    if (!user.is) {
      alert('Devi fare login per caricare musica!');
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach(async file => {
      if (!file.type.startsWith('audio/')) {
        alert('Solo file audio sono supportati!');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`File troppo grande! Il limite è 10MB. Questo file è ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const trackId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Mostra indicatore di caricamento
          this.showLoadingIndicator();
          
          try {
            const arrayBuffer = e.target.result;
            const base64 = btoa(
              new Uint8Array(arrayBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            const audioDataUrl = `data:${file.type};base64,${base64}`;
            
            const trackData = {
              id: trackId,
              title: file.name.replace(/\.[^/.]+$/, ""),
              artist: user.is.alias || 'Anonimo',
              uploader: user.is.pub,
              timestamp: Date.now(),
              size: file.size,
              audioData: audioDataUrl,
              plays: 0
            };

            await this.publicTracks.get(trackId).put(trackData);
            addAmbientSound({ type: 'success' });
            this.hideLoadingIndicator();
          } catch (error) {
            console.error('Errore nel caricamento:', error);
            alert('Errore nel caricamento del file. Riprova.');
            this.hideLoadingIndicator();
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Errore nella lettura del file:', error);
        alert('Errore nella lettura del file. Riprova.');
      }
    });
  }

  showLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 20px;
      border-radius: 10px;
      z-index: 9999;
    `;
    loadingDiv.innerHTML = '🎵 Caricamento in corso...';
    document.body.appendChild(loadingDiv);
  }

  hideLoadingIndicator() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) loadingDiv.remove();
  }

  loadTracks() {
    this.playlist = [];
    console.log('Caricamento tracce...');
    
    this.publicTracks.map().on((track, id) => {
      if (track && track.audioData) {
        const trackId = track.id || id;
        const existingIndex = this.playlist.findIndex(t => t.id === trackId);
        
        if (existingIndex >= 0) {
          this.playlist[existingIndex] = {...track, id: trackId};
        } else {
          this.playlist.push({...track, id: trackId});
        }
        
        this.updateTrackList();
      }
    });
  }

  async playTrack(id) {
    try {
      const track = this.playlist.find(t => t.id === id);
      if (!track || !track.audioData) return;

      this.currentTrack = track;
      this.audio.src = track.audioData;
      await this.audio.play();
      this.isPlaying = true;
      
      // Aggiorna UI
      document.getElementById('playBtn').textContent = '⏸️';
      document.getElementById('nowPlaying').textContent = `${track.title} - ${track.artist}`;
      
      // Incrementa contatore riproduzioni
      track.plays = (track.plays || 0) + 1;
      this.publicTracks.get(track.id).get('plays').put(track.plays);
      
      // Aggiorna progress bar
      this.updateProgress();
    } catch (error) {
      console.error('Errore riproduzione:', error);
      alert('Errore nella riproduzione. Riprova.');
    }
  }

  updateProgress() {
    const progress = document.getElementById('progress');
    this.audio.ontimeupdate = () => {
      progress.value = (this.audio.currentTime / this.audio.duration) * 100;
    };
  }

  nextTrack() {
    if (!this.currentTrack) return;
    const currentIndex = this.playlist.findIndex(t => t.id === this.currentTrack.id);
    const nextIndex = (currentIndex + 1) % this.playlist.length;
    this.playTrack(this.playlist[nextIndex].id);
  }

  prevTrack() {
    if (!this.currentTrack) return;
    const currentIndex = this.playlist.findIndex(t => t.id === this.currentTrack.id);
    const prevIndex = (currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.playTrack(this.playlist[prevIndex].id);
  }

  updateTrackList() {
    const trackList = document.getElementById('trackList');
    if (!trackList) return;

    trackList.innerHTML = this.playlist.map(track => {
      const canDelete = user.is && track.uploader === user.is.pub;
      const isPlaying = this.currentTrack && this.currentTrack.id === track.id;
      
      return `
        <div class="track-item" style="
          background: ${isPlaying ? 'var(--ugly-green)' : 'var(--ugly-yellow)'};
          padding: 15px;
          margin: 8px 0;
          border: 2px solid black;
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: black;
          transition: all 0.3s ease;
        ">
          <div style="display: flex; flex-direction: column;">
            <strong>${track.title}</strong>
            <small>${track.artist} • ${track.plays || 0} ascolti</small>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button onclick="window.uglyfy.playTrack('${track.id}')" 
                    style="background: none; border: none; font-size: 1.2em; cursor: pointer;">
              ${isPlaying ? '⏸️' : '▶️'}
            </button>
            ${canDelete ? `
              <button onclick="window.uglyfy.deleteTrack('${track.id}')"
                      style="background: none; border: none; font-size: 1.2em; cursor: pointer;">
                🗑️
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  async deleteTrack(id) {
    const track = this.playlist.find(t => t.id === id);
    if (!track || !user.is || track.uploader !== user.is.pub) return;

    try {
      // Aggiungi classe per animazione
      const trackElement = document.querySelector(`[onclick*="${id}"]`).closest('.track-item');
      trackElement.classList.add('deleting');
      
      // Cancella da Gun
      await this.publicTracks.get(id).put(null);
      
      // Rimuovi dalla playlist
      this.playlist = this.playlist.filter(t => t.id !== id);
      this.updateTrackList();
      
      addAmbientSound({ type: 'delete' });
    } catch (error) {
      console.error('Errore cancellazione:', error);
      alert('Errore nella cancellazione. Riprova.');
    }
  }

  setupPlayer() {
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const volume = document.getElementById('volume');
    const volumeIcon = document.getElementById('volume-icon');
    const progress = document.getElementById('progress');

    playBtn.onclick = () => {
      if (this.audio.paused) {
        this.audio.play();
        this.isPlaying = true;
        playBtn.textContent = '⏸️';
      } else {
        this.audio.pause();
        this.isPlaying = false;
        playBtn.textContent = '▶️';
      }
    };

    prevBtn.onclick = () => this.prevTrack();
    nextBtn.onclick = () => this.nextTrack();

    volume.onchange = (e) => {
      this.audio.volume = e.target.value;
      volumeIcon.textContent = e.target.value > 0 ? '🔊' : '🔇';
    };

    volumeIcon.onclick = () => {
      if (this.audio.volume > 0) {
        this.audio.volume = 0;
        volume.value = 0;
        volumeIcon.textContent = '🔇';
      } else {
        this.audio.volume = 0.5;
        volume.value = 0.5;
        volumeIcon.textContent = '🔊';
      }
    };

    progress.oninput = (e) => {
      const time = (e.target.value / 100) * this.audio.duration;
      this.audio.currentTime = time;
    };

    this.audio.volume = 0.5;
    
    // Auto-play prossima traccia
    this.audio.onended = () => this.nextTrack();
  }

  filter(type) {
    switch(type) {
      case 'popular':
        this.playlist.sort((a, b) => (b.plays || 0) - (a.plays || 0));
        break;
      case 'new':
        this.playlist.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'random':
        this.playlist.sort(() => Math.random() - 0.5);
        break;
    }
    this.updateTrackList();
  }
}

// Inizializzazione
const uglyfy = new Uglyfy();