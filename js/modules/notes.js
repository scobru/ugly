// Aggiungi il contenuto HTML al tab notes
document.getElementById("notes-tab").innerHTML += `
  <section>
    <h2>Ugly Notes</h2>
    <input type="text" id="uglyNotesInput" placeholder="Inserisci una nota veloce..." />
    <button id="uglyNotesButton">Aggiungi Nota</button>
    <ul id="uglyNotesList"></ul>
  </section>
`;

// Riferimenti DOM
const notesInput = document.getElementById("uglyNotesInput");
const notesButton = document.getElementById("uglyNotesButton");
const notesList = document.getElementById("uglyNotesList");

function loadUglyNotes() {
  notesList.innerHTML = "";
  user.get("uglyNotes").map().on(function (data, id) {
    if (!data) {
      const existing = document.getElementById("note-" + id);
      if (existing) existing.remove();
      return;
    }
    
    let existing = document.getElementById("note-" + id);
    if (!existing) {
      existing = document.createElement("li");
      existing.id = "note-" + id;

      const span = document.createElement("span");
      span.textContent = data.text || "";

      const deleteBtn = createDeleteButton();
      deleteBtn.addEventListener("click", function () {
        user.get("uglyNotes").get(id).put(null);
        existing.remove();
        uglySounds.play("delete");
      });

      existing.appendChild(span);
      existing.appendChild(deleteBtn);
      notesList.appendChild(existing);
    } else {
      existing.querySelector("span").textContent = data.text || "";
    }
  });
}

notesButton.addEventListener("click", function () {
  const nota = notesInput.value.trim();
  if (!nota) return;
  user.get("uglyNotes").set({ text: nota });
  notesInput.value = "";
  addAmbientSound({ type: "note", text: nota });
}); 