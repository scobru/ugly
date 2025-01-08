// Funzione debounce per limitare la frequenza degli eventi
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Funzione per creare un pulsante di eliminazione
function createDeleteButton() {
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "❌";
  deleteBtn.className = "delete-btn";
  deleteBtn.style.marginLeft = "10px";
  deleteBtn.addEventListener("click", function () {
    uglySounds.play("delete");
  });
  return deleteBtn;
}

// Funzione per creare particelle emoji
function createEmojiParticle(x, y) {
  const emojis = ["🌟", "💫", "✨", "🎈", "🎉", "🌈", "🦄", "🍕", "🎨", "🎸", "🎆", "🎇", "⭐", "🌠"];

  for (let i = 0; i < 12; i++) {
    const particle = document.createElement("span");
    particle.className = "emoji-particle";
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
    const velocity = 100 + Math.random() * 150;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity;

    particle.style.left = x + "px";
    particle.style.top = y + "px";
    particle.style.setProperty("--dx", `${dx}px`);
    particle.style.setProperty("--dy", `${dy}px`);
    particle.style.transform = `rotate(${Math.random() * 360}deg)`;

    document.body.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove());
  }
}

// Gestione dark mode
document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById("darkModeToggle");
  let isDarkMode = localStorage.getItem('darkMode') === 'true';

  // Imposta lo stato iniziale
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = "☀️";
  }

  darkModeToggle.addEventListener("click", () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle("dark-mode");
    darkModeToggle.innerHTML = isDarkMode ? "☀️" : "🌙";
    localStorage.setItem('darkMode', isDarkMode);
    
    // Aggiungi effetti sonori e particelle
    if (typeof uglySounds !== 'undefined') {
      uglySounds.addSound({ type: 'success' });
    }
    
    const rect = darkModeToggle.getBoundingClientRect();
    createEmojiParticle(rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  // Applica dark mode al caricamento se necessario
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    darkModeToggle.innerHTML = "☀️";
  }
});

// Gestione dei tab
document.addEventListener("DOMContentLoaded", function () {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab");
      
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));
      
      button.classList.add("active");
      document.getElementById(`${tabId}-tab`).classList.add("active");
      
      uglySounds.play("pop");
    });
  });
}); 