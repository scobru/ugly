// Aggiungi il contenuto HTML
document.getElementById("todo-tab").innerHTML = `
  <section>
    <h2>Ugly Todo</h2>
    <div style="margin: 10px 0;">
      <input type="text" id="todoInput" placeholder="Cosa devi fare?">
      <button onclick="addTodo()">➕ Aggiungi</button>
    </div>
    <div id="todoList" style="margin-top: 20px;"></div>
  </section>
`;

// Funzione per caricare i todo
function loadUglyTodo() {
  if (!user.is) return;
  
  const todoList = document.getElementById("todoList");
  todoList.innerHTML = '';

  // Usa un nodo specifico per i todo dell'utente
  const todoNode = `${user.is.pub}/todos`;
  gun.get(todoNode).map().once((todo, id) => {
    if (todo) {
      addTodoToUI(todo, id);
    }
  });
}

// Funzione per aggiungere un todo
async function addTodo() {
  if (!user.is) {
    alert('Devi essere autenticato per aggiungere todo');
    return;
  }

  const todoInput = document.getElementById('todoInput');
  const text = todoInput.value.trim();

  if (!text) {
    alert('Inserisci il testo del todo');
    return;
  }

  const todo = {
    text: text,
    done: false,
    ts: Date.now() // Abbreviato timestamp
  };

  // Usa un nodo specifico per i todo dell'utente
  const todoNode = `${user.is.pub}/todos`;
  gun.get(todoNode).set(todo, (ack) => {
    if (ack.err) {
      console.error('Errore salvataggio todo:', ack.err);
      alert('Errore nel salvataggio del todo');
    } else {
      todoInput.value = '';
      addAmbientSound({ type: 'success' });
    }
  });
}

// Funzione per completare/decompletare un todo
function toggleTodo(id) {
  const todoNode = `${user.is.pub}/todos`;
  gun.get(todoNode).get(id).once((todo) => {
    if (todo) {
      todo.done = !todo.done;
      gun.get(todoNode).get(id).put(todo);
      addAmbientSound({ type: 'click' });
    }
  });
}

// Funzione per eliminare un todo
function deleteTodo(id) {
  if (confirm('Vuoi davvero eliminare questo todo?')) {
    const todoNode = `${user.is.pub}/todos`;
    gun.get(todoNode).get(id).put(null);
    document.getElementById(`todo-${id}`)?.remove();
    addAmbientSound({ type: 'delete' });
  }
}

// Funzione per aggiungere un todo alla UI
function addTodoToUI(todo, id) {
  const todoList = document.getElementById("todoList");
  
  const todoDiv = document.createElement('div');
  todoDiv.id = `todo-${id}`;
  todoDiv.style.border = '2px solid black';
  todoDiv.style.padding = '10px';
  todoDiv.style.margin = '5px 0';
  todoDiv.style.backgroundColor = todo.done ? 'var(--ugly-green)' : 'white';
  todoDiv.style.display = 'flex';
  todoDiv.style.justifyContent = 'space-between';
  todoDiv.style.alignItems = 'center';

  todoDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <input type="checkbox" ${todo.done ? 'checked' : ''} 
             onclick="toggleTodo('${id}')" 
             style="transform: scale(1.5);">
      <span style="${todo.done ? 'text-decoration: line-through;' : ''}">
        ${todo.text}
      </span>
    </div>
    <div>
      <small>${new Date(todo.ts).toLocaleString()}</small>
      <button onclick="deleteTodo('${id}')" 
              style="background: var(--ugly-pink); margin-left: 10px;">
        🗑️
      </button>
    </div>
  `;

  todoList.appendChild(todoDiv);
}

// Rendi le funzioni disponibili globalmente
window.addTodo = addTodo;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.loadUglyTodo = loadUglyTodo;

// Inizializza il modulo
loadUglyTodo(); 