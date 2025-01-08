// Aggiungi il contenuto HTML
document.getElementById("chat-tab").innerHTML = `
  <section>
    <h2>Ugly Chat</h2>
    <div id="chatMessages" style="height: 300px; overflow-y: auto; margin-bottom: 10px; padding: 10px; border: 1px solid #000;"></div>
    <div style="display: flex; gap: 10px;">
      <input type="text" id="chatInput" placeholder="Scrivi un messaggio..." style="flex: 1;" />
      <button id="chatSendBtn">Invia</button>
    </div>
  </section>
`;

// Riferimenti DOM
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatMessages = document.getElementById("chatMessages");

// Caricamento messaggi
function loadUglyChat() {
  chatMessages.innerHTML = "";
  const processedMessages = new Set();

  gun.get("uglyChat").map().on(function (data, id) {
    if (!data || !data.time || !data.text) return;

    // Usa un ID univoco che include tutti i dati del messaggio
    const messageId = `${data.user}-${data.time}-${data.text}`;
    if (processedMessages.has(messageId)) return;
    processedMessages.add(messageId);

    const existingMessage = document.querySelector(`[data-message-id="${messageId}"]`);
    if (existingMessage) return;

    addChatMessage(data, messageId);
  });
}

// Funzione per aggiungere un messaggio alla chat
function addChatMessage(data, messageId) {
  const messageDiv = document.createElement("div");
  messageDiv.dataset.messageId = messageId;
  messageDiv.dataset.time = data.time;
  messageDiv.style.marginBottom = "10px";
  messageDiv.style.padding = "8px";
  messageDiv.style.borderRadius = "5px";
  messageDiv.style.background = data.user === user.is.alias ? "var(--ugly-pink)" : "var(--ugly-blue)";
  messageDiv.style.animation = "popIn 0.3s ease-out";

  const userSpan = document.createElement("strong");
  userSpan.textContent = data.user || "Anonimo";
  userSpan.style.marginRight = "10px";

  const timeSpan = document.createElement("small");
  timeSpan.textContent = new Date(data.time).toLocaleTimeString();
  timeSpan.style.marginLeft = "10px";
  timeSpan.style.opacity = "0.7";

  const messageSpan = document.createElement("span");
  messageSpan.textContent = data.text;

  messageDiv.appendChild(userSpan);
  messageDiv.appendChild(messageSpan);
  messageDiv.appendChild(timeSpan);

  // Inserisci i messaggi in ordine cronologico
  let inserted = false;
  for (let child of chatMessages.children) {
    const childTime = parseInt(child.dataset.time || 0);
    if (data.time < childTime) {
      chatMessages.insertBefore(messageDiv, child);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    chatMessages.appendChild(messageDiv);
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Suono di notifica solo per messaggi nuovi degli altri
  if (data.user !== user.is.alias && data.time > Date.now() - 1000) {
    addAmbientSound({ type: "chat", text: data.text });
  }
}

// Invio messaggio
chatSendBtn.addEventListener("click", function () {
  const text = chatInput.value.trim();
  if (!text || !user.is) return;

  const time = Date.now();
  const messageData = {
    user: user.is.alias || "Anonimo",
    text: text,
    time: time,
  };

  // Usa put invece di set per evitare duplicati
  gun.get("uglyChat").get(time).put(messageData);

  chatInput.value = "";
  addAmbientSound({ type: "chat", text: text });
});

// Invio con Enter
chatInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    chatSendBtn.click();
  }
}); 