// Aggiungi il contenuto HTML
document.getElementById("contacts-tab").innerHTML = `
  <section>
    <h2>Ugly Contacts (Rubrica)</h2>
    <input type="text" id="contactName" placeholder="Nome" />
    <input type="text" id="contactPhone" placeholder="Telefono" />
    <input type="text" id="contactEmail" placeholder="Email" />
    <button id="contactBtn">Salva Contatto</button>
    <ul id="contactList"></ul>
  </section>
`;

// Riferimenti DOM
const contactName = document.getElementById("contactName");
const contactPhone = document.getElementById("contactPhone");
const contactEmail = document.getElementById("contactEmail");
const contactBtn = document.getElementById("contactBtn");
const contactList = document.getElementById("contactList");

function loadUglyContacts() {
  contactList.innerHTML = "";
  user.get("uglyContacts").map().on(function (data, id) {
    if (!data) {
      const existing = document.getElementById("contact-" + id);
      if (existing) existing.remove();
      return;
    }
    createOrUpdateContact(data, id);
  });
}

function createOrUpdateContact(data, id) {
  let existing = document.getElementById("contact-" + id);
  if (!existing) {
    existing = document.createElement("li");
    existing.id = "contact-" + id;
    existing.style.display = "flex";
    existing.style.alignItems = "center";
    
    const infoDiv = document.createElement("div");
    infoDiv.style.flex = "1";
    
    const nameSpan = document.createElement("strong");
    const contactInfo = document.createElement("div");
    contactInfo.className = "contact-info";
    
    const deleteBtn = createDeleteButton();
    deleteBtn.addEventListener("click", function () {
      user.get("uglyContacts").get(id).put(null);
      existing.remove();
      uglySounds.play("delete");
    });

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(contactInfo);
    existing.appendChild(infoDiv);
    existing.appendChild(deleteBtn);
    contactList.appendChild(existing);
  }

  const nameSpan = existing.querySelector("strong");
  const contactInfo = existing.querySelector(".contact-info");
  
  nameSpan.textContent = data.name;
  contactInfo.innerHTML = `
    ${data.phone ? "📞 " + data.phone + "<br>" : ""}
    ${data.email ? "📧 " + data.email : ""}
  `;
}

contactBtn.addEventListener("click", function () {
  const n = contactName.value.trim();
  const p = contactPhone.value.trim();
  const e = contactEmail.value.trim();
  
  if (!n) return alert("Nome obbligatorio");
  
  user.get("uglyContacts").set({
    name: n,
    phone: p,
    email: e
  });
  
  contactName.value = "";
  contactPhone.value = "";
  contactEmail.value = "";
  addAmbientSound({ type: "contact", name: n, phone: p, email: e });
}); 