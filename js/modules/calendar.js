// Aggiungi il contenuto HTML
document.getElementById("calendar-tab").innerHTML = `
  <section>
    <h2>Ugly Calendar</h2>
    <p>Salva un evento relativo a una data.</p>
    <input type="date" id="uglyDate" />
    <input type="text" id="uglyDateEvent" placeholder="Descrizione evento..." />
    <button id="uglyDateBtn">Salva evento</button>
    <div id="uglyEvents"></div>
  </section>
`;

// Riferimenti DOM
const dateInput = document.getElementById("uglyDate");
const eventInput = document.getElementById("uglyDateEvent");
const dateBtn = document.getElementById("uglyDateBtn");
const eventsDiv = document.getElementById("uglyEvents");

function loadUglyCalendar() {
  eventsDiv.innerHTML = "";
  user.get("uglyCalendar").once(function (data) {
    if (!data) return;
    Object.keys(data).forEach(function (dt) {
      if (dt === "_") return;
      addCalendarEvent(dt, data[dt]);
    });
  });

  user.get("uglyCalendar").map().on(function (eventDesc, dt) {
    if (dt === "_") return;
    if (!eventDesc) {
      const oldP = document.getElementById("cal-" + dt);
      if (oldP) oldP.remove();
      return;
    }
    addCalendarEvent(dt, eventDesc);
  });
}

function addCalendarEvent(dt, description) {
  let oldP = document.getElementById("cal-" + dt);
  if (oldP) {
    oldP.innerHTML = "";
  } else {
    oldP = document.createElement("p");
    oldP.id = "cal-" + dt;
  }

  const textSpan = document.createElement("span");
  textSpan.textContent = dt + ": " + description;

  const deleteBtn = createDeleteButton();
  deleteBtn.addEventListener("click", function () {
    user.get("uglyCalendar").get(dt).put(null);
    oldP.remove();
    uglySounds.play("delete");
  });

  oldP.appendChild(textSpan);
  oldP.appendChild(deleteBtn);
  
  if (!document.getElementById("cal-" + dt)) {
    eventsDiv.appendChild(oldP);
  }
}

dateBtn.addEventListener("click", function () {
  const d = dateInput.value;
  const e = eventInput.value.trim();
  if (!d || !e) return;
  user.get("uglyCalendar").get(d).put(e);
  dateInput.value = "";
  eventInput.value = "";
  addAmbientSound({ type: "calendar", date: d, event: e });
}); 