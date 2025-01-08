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
      deleteTrack: this.deleteTrack.bind(this)
    };
    
    this.render();
    this.loadTracks();
  }

  render() {
    this.container.innerHTML = `
      <div class="upload-zone" style="border: 3px dashed #000; background: var(--ugly-yellow); padding: 20px; text-align: center; margin: 10px 0; color: black;">
        🎵 Trascina qui la tua musica brutta
        <br>o clicca per selezionare
        <input type="file" id="fileInput" hidden accept="audio/*">
        <div style="margin-top: 10px; font-size: 0.9em; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 5px;">
          ⚠️ Importante: Carica solo musica sotto licenza Creative Commons o di cui possiedi i diritti.
          <br>
          <a href="https://creativecommons.org/licenses/" target="_blank" style="color: blue; text-decoration: underline;">
            Scopri di più sulle licenze CC
          </a>
        </div>
      </div>

      <div class="filters" style="margin: 10px 0;">
        <button onclick="window.uglyfy.filter('popular')" style="color: black;">🔥 Popolari</button>
        <button onclick="window.uglyfy.filter('new')" style="color: black;">🆕 Nuove</button>
        <button onclick="window.uglyfy.filter('random')" style="color: black;">🎲 Random</button>
      </div>

      <div id="trackList" style="margin-top: 10px; margin-bottom: 80px;">
        <!-- Lista tracce qui -->
      </div>

      <div class="player" style="position: fixed; bottom: 0; left: 0; right: 0; background: var(--ugly-purple); padding: 10px; border-top: 2px solid black; z-index: 1000; color: white;">
        <button id="prevBtn" style="color: black;">⏮️</button>
        <button id="playBtn" style="color: black;">▶️</button>
        <button id="nextBtn" style="color: black;">⏭️</button>
        <input type="range" id="volume" min="0" max="1" step="0.1" value="0.5">
        <span id="nowPlaying" style="color: white;">Nessuna traccia</span>
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
      uploadZone.style.background = 'var(--ugly-green)';
    };

    uploadZone.ondragleave = () => {
      uploadZone.style.background = 'var(--ugly-yellow)';
    };

    uploadZone.ondrop = (e) => {
      e.preventDefault();
      uploadZone.style.background = 'var(--ugly-yellow)';
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

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('audio/')) {
        alert('Solo file audio!');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`File troppo grande! Il limite è 10MB. Questo file è ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
        return;
      }

      if (!confirm('Confermo che questa musica è sotto licenza Creative Commons o che ne possiedo i diritti di distribuzione.')) {
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const trackId = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Converti il file in ArrayBuffer
          const arrayBuffer = e.target.result;
          // Converti ArrayBuffer in Base64
          const base64 = btoa(
            new Uint8Array(arrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          // Crea il data URL per l'audio
          const audioDataUrl = `data:${file.type};base64,${base64}`;
          
          const trackData = {
            id: trackId,
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: user.is.alias,
            uploader: user.is.pub,
            timestamp: Date.now(),
            size: file.size,
            audioData: audioDataUrl
          };

          // Salva in Gun
          this.publicTracks.get(trackId).put(trackData);
          addAmbientSound({ type: 'success' });
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error(error);
        alert('Errore caricamento!');
      }
    });
  }

  loadTracks() {
    this.playlist = [];
    console.log('Caricamento tracce...');
    
    this.publicTracks.map().on((track, id) => {
      if (track && track.audioData) { // Verifica che ci sia l'audio
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
      this.audio.src = track.audioData; // Usa direttamente il data URL
      await this.audio.play();
      
      document.getElementById('playBtn').textContent = '⏸️';
      document.getElementById('nowPlaying').textContent = 
        `${track.title} - ${track.artist}`;
    } catch (error) {
      console.error('Errore playTrack:', error);
      alert('Errore nella riproduzione. Riprova.');
    }
  }

  updateTrackList() {
    const trackList = document.getElementById('trackList');
    if (!trackList) return;

    console.log('Aggiornamento lista tracce:', this.playlist.length, 'tracce');

    trackList.innerHTML = this.playlist.map(track => {
      const canDelete = user.is && track.uploader === user.is.pub;
      return `
        <div class="track-item" style="background: var(--ugly-yellow); padding: 10px; margin: 5px 0; border: 2px solid black; display: flex; justify-content: space-between; align-items: center; color: black;">
          <span>${track.title} - ${track.artist}</span>
          <div>
            <button onclick="window.uglyfy.playTrack('${track.id}')" style="color: black;">▶️</button>
            ${canDelete ? `<button onclick="window.uglyfy.deleteTrack('${track.id}')" style="color: black;">🗑️</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  async deleteTrack(id) {
    const track = this.playlist.find(t => t.id === id);
    if (!track || !user.is || track.uploader !== user.is.pub) return;

    if (confirm('Vuoi davvero cancellare questa traccia?')) {
      try {
        // Cancella il file da Firebase Storage
        const storageRef = storage.ref(`tracks/${id}`);
        await storageRef.delete();

        // Cancella i metadati da Gun
        this.publicTracks.get(id).put(null);
        
        addAmbientSound({ type: 'delete' });
      } catch (error) {
        console.error('Errore cancellazione:', error);
        alert('Errore nella cancellazione. Riprova.');
      }
    }
  }

  setupPlayer() {
    const playBtn = document.getElementById('playBtn');
    const volume = document.getElementById('volume');

    playBtn.onclick = () => {
      if (this.audio.paused) {
        this.audio.play();
        playBtn.textContent = '⏸️';
      } else {
        this.audio.pause();
        playBtn.textContent = '▶️';
      }
    };

    volume.onchange = (e) => {
      this.audio.volume = e.target.value;
    };

    this.audio.volume = 0.5;
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