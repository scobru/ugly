// Riferimenti DOM
const textArea = document.getElementById("notes-tab");

// Aggiungi il contenuto HTML necessario
textArea.innerHTML = `
  <!-- Sezione Text -->
  <section>
    <h2>Ugly Text</h2>
    <textarea id="uglyTextArea" rows="3" placeholder="Scrivi qualcosa di 'brutto'..."></textarea>
  </section>
`;

const uglyTextArea = document.getElementById("uglyTextArea");

function loadUglyText() {
  user.get("uglyText").on(function (data) {
    if (data && data.body !== undefined) {
      uglyTextArea.value = data.body;
    }
  });
}

uglyTextArea.addEventListener("input", debounce(function () {
  user.get("uglyText").put({ body: uglyTextArea.value });
  addAmbientSound({ type: "text", length: uglyTextArea.value.length });
}, 1000)); 