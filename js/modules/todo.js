// Aggiungi il contenuto HTML
document.getElementById("todo-tab").innerHTML = `
  <section>
    <h2>Ugly ToDo</h2>
    <input type="text" id="uglyTodoInput" placeholder="Cosa devi fare?" />
    <button id="uglyTodoButton">Aggiungi Task</button>
    <div id="uglyToDoList"></div>
  </section>
`;

// Riferimenti DOM
const todoInput = document.getElementById("uglyTodoInput");
const todoButton = document.getElementById("uglyTodoButton");
const todoListDiv = document.getElementById("uglyToDoList");

function createOrUpdateTodo(data, id) {
  let existing = document.getElementById("todo-" + id);
  if (!existing) {
    existing = document.createElement("div");
    existing.id = "todo-" + id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !!data.done;
    checkbox.addEventListener("change", function () {
      user.get("uglyTodo").get(id).put({
        text: data.text,
        done: checkbox.checked,
        timestamp: data.timestamp
      });
    });

    const span = document.createElement("span");
    span.textContent = data.text;
    span.style.marginLeft = "10px";

    const deleteBtn = createDeleteButton();
    deleteBtn.addEventListener("click", function () {
      if (confirm("Sei sicuro di voler eliminare questo task?")) {
        user.get("uglyTodo").get(id).put(null);
      }
    });

    existing.appendChild(checkbox);
    existing.appendChild(span);
    existing.appendChild(deleteBtn);
    todoListDiv.appendChild(existing);
  }

  const checkbox = existing.querySelector('input[type="checkbox"]');
  const span = existing.querySelector("span");
  checkbox.checked = !!data.done;
  span.textContent = data.text;

  if (data.done) {
    span.classList.add("todo-completed");
  } else {
    span.classList.remove("todo-completed");
  }
}

todoButton.addEventListener("click", function () {
  const task = todoInput.value.trim();
  if (!task) return;
  
  user.get("uglyTodo").set({
    text: task,
    done: false,
    timestamp: Date.now()
  });
  todoInput.value = "";
  addAmbientSound({ type: "todo", text: task });
});

// Caricamento dati
user.get("uglyTodo").map().once(function (data, id) {
  if (!data) return;
  createOrUpdateTodo(data, id);
});

user.get("uglyTodo").map().on(function (data, id) {
  if (!data) {
    const existing = document.getElementById("todo-" + id);
    if (existing) existing.remove();
    return;
  }
  createOrUpdateTodo(data, id);
}); 