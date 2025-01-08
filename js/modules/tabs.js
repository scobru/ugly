document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(tabId) {
    // Rimuovi la classe active da tutti i pulsanti e contenuti
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Attiva il tab selezionato
    const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`${tabId}-tab`);

    if (selectedButton && selectedContent) {
      selectedButton.classList.add('active');
      selectedContent.classList.add('active');
      
      // Aggiungi suono Windows 95
      if (window.uglySounds) {
        window.uglySounds.addSound({
          type: 'click',
          x: selectedButton.offsetLeft + selectedButton.offsetWidth / 2,
          y: selectedButton.offsetTop + selectedButton.offsetHeight / 2
        });
      }
    }
  }

  // Aggiungi event listener ai pulsanti
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Attiva il primo tab all'avvio
  const firstTabId = tabButtons[0].getAttribute('data-tab');
  switchTab(firstTabId);
}); 