// Aggiungi il contenuto HTML
document.getElementById("files-tab").innerHTML = `
  <section>
    <h2>Ugly Files</h2>
    <div style="border: 2px dashed #000; padding: 20px; text-align: center; margin: 10px 0;">
      📁 Trascina qui i tuoi file brutti
      <br>o clicca per selezionare
      <input type="file" id="fileInput" hidden multiple>
    </div>
    <div id="filesList"></div>
  </section>
`;

// Funzione di caricamento principale
function loadUglyFiles() {
  const fileInput = document.getElementById("fileInput");
  const filesList = document.getElementById("filesList");
  const dropZone = fileInput.parentElement;

  // Setup drag and drop
  dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.style.background = 'var(--ugly-green)';
  };

  dropZone.ondragleave = () => {
    dropZone.style.background = 'transparent';
  };

  dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.style.background = 'transparent';
    handleFiles(e.dataTransfer.files);
  };

  dropZone.onclick = () => fileInput.click();
  fileInput.onchange = () => handleFiles(fileInput.files);

  // Carica file esistenti
  user.get('uglyFiles').map().on((file, id) => {
    if (file) updateFilesList(file, id);
  });
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        data: e.target.result,
        timestamp: Date.now()
      };

      user.get('uglyFiles').set(fileData);
      addAmbientSound({ type: 'success' });
    };
    reader.readAsDataURL(file);
  });
}

function updateFilesList(file, id) {
  const filesList = document.getElementById("filesList");
  const existingFile = document.getElementById(`file-${id}`);

  if (existingFile) {
    existingFile.querySelector('.file-name').textContent = file.name;
  } else {
    const fileDiv = document.createElement('div');
    fileDiv.id = `file-${id}`;
    fileDiv.style.border = '2px solid black';
    fileDiv.style.padding = '10px';
    fileDiv.style.margin = '5px 0';
    fileDiv.style.background = 'white';
    fileDiv.innerHTML = `
      <span class="file-name">${file.name}</span>
      <button onclick="downloadFile('${id}')">⬇️</button>
      <button onclick="deleteFile('${id}')">🗑️</button>
    `;
    filesList.appendChild(fileDiv);
  }
}

function downloadFile(id) {
  user.get('uglyFiles').get(id).once((file) => {
    if (!file) return;
    
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
  });
}

function deleteFile(id) {
  if (confirm('Vuoi davvero cancellare questo file?')) {
    user.get('uglyFiles').get(id).put(null);
    document.getElementById(`file-${id}`)?.remove();
    addAmbientSound({ type: 'delete' });
  }
}

// Inizializza il modulo
loadUglyFiles(); 