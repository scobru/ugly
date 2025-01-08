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
  if (!user.is) return;
  
  const todoNode = `${user.is.pub}/todos`;
  gun.get(todoNode).get(id).once((todo) => {
    if (todo) {
      const newDone = !todo.done;
      
      // Aggiorna il database
      gun.get(todoNode).get(id).put({
        ...todo,
        done: newDone
      });
      
      // Aggiorna l'UI
      const todoDiv = document.getElementById(`todo-${id}`);
      if (todoDiv) {
        todoDiv.style.backgroundColor = newDone ? 'var(--ugly-green)' : 'var(--card-bg)';
        const span = todoDiv.querySelector('span');
        if (span) {
          span.style.textDecoration = newDone ? 'line-through' : 'none';
        }
      }
      
      addAmbientSound({ type: 'click' });
    }
  });
}

// Funzione per ottenere i todos
function getTodos() {
  try {
    const todosString = localStorage.getItem('todos');
    return todosString ? JSON.parse(todosString) : [];
  } catch (error) {
    console.error('Errore lettura todos:', error);
    return [];
  }
}

// Funzione per eliminare un todo
function deleteTodo(id) {
  try {
    const todoDiv = document.getElementById(`todo-${id}`);
    if (todoDiv) {
      todoDiv.classList.add('deleting');
      todoDiv.addEventListener('animationend', () => {
        const todoNode = `${user.is.pub}/todos`;
        gun.get(todoNode).get(id).put(null);
        todoDiv.remove();
        addAmbientSound({ type: 'delete' });
      });
    }
  } catch (error) {
    console.error('Errore eliminazione todo:', error);
  }
}

// Funzione per renderizzare tutti i todos
function renderTodos() {
  const todoList = document.getElementById("todoList");
  if (!todoList) return;
  
  todoList.innerHTML = '';
  const todos = getTodos();
  todos.forEach(todo => {
    addTodoToUI(todo, todo.id);
  });
}

// Funzione per aggiungere un todo alla UI
function addTodoToUI(todo, id) {
  const todoList = document.getElementById("todoList");
  
  const todoDiv = document.createElement('div');
  todoDiv.id = `todo-${id}`;
  todoDiv.className = 'adding'; // Aggiungi classe per animazione
  todoDiv.style.border = '2px solid black';
  todoDiv.style.padding = '10px';
  todoDiv.style.margin = '5px 0';
  todoDiv.style.backgroundColor = todo.done ? 'var(--ugly-green)' : 'var(--card-bg)';
  todoDiv.style.display = 'flex';
  todoDiv.style.justifyContent = 'space-between';
  todoDiv.style.alignItems = 'center';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.done;
  checkbox.style.transform = 'scale(1.5)';
  checkbox.style.width = '20px';
  checkbox.style.height = '20px';
  checkbox.style.cursor = 'pointer';
  checkbox.style.accentColor = 'var(--ugly-green)';
  checkbox.style.border = '2px solid black';
  checkbox.style.borderRadius = '3px';
  checkbox.style.marginRight = '5px';
  checkbox.style.appearance = 'auto'; // Usa lo stile nativo del checkbox

  const span = document.createElement('span');
  span.textContent = todo.text;
  span.style.textDecoration = todo.done ? 'line-through' : 'none';

  const leftDiv = document.createElement('div');
  leftDiv.style.display = 'flex';
  leftDiv.style.alignItems = 'center';
  leftDiv.style.gap = '10px';
  leftDiv.appendChild(checkbox);
  leftDiv.appendChild(span);

  const rightDiv = document.createElement('div');
  rightDiv.innerHTML = `
    <small>${new Date(todo.ts).toLocaleString()}</small>
    <button onclick="deleteTodo('${id}')" 
            style="background: var(--ugly-pink); margin-left: 10px;">
      🗑️
    </button>
  `;

  todoDiv.appendChild(leftDiv);
  todoDiv.appendChild(rightDiv);

  // Aggiungi l'event listener per il checkbox
  checkbox.addEventListener('change', () => {
    toggleTodo(id);
  });

  todoList.appendChild(todoDiv);

  if (todo.done) {
    span.classList.add('todo-completed');
  }
}

// Rendi le funzioni disponibili globalmente
window.addTodo = addTodo;
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;
window.loadUglyTodo = loadUglyTodo;
window.renderTodos = renderTodos;

// Inizializza il modulo
loadUglyTodo(); 