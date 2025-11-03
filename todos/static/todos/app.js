// todos/static/todos/app.js
const API_BASE = '/api/';

function getCookie(name) {
  const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return v ? v.pop() : '';
}
const csrftoken = getCookie('csrftoken');

async function fetchTodos() {
  try {
    const res = await fetch(API_BASE);
    const data = await res.json();
    renderList(data);
  } catch (e) {
    console.error(e);
  }
}

function renderList(todos) {
  const ul = document.getElementById('todoList');
  const empty = document.getElementById('emptyState');
  ul.innerHTML = '';

  if (!todos || todos.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  todos.slice().reverse().forEach(t => { // newest on top
    const li = document.createElement('li');
    li.className = 'todo-item';

    const chk = document.createElement('div');
    chk.className = 'checkbox' + (t.done ? ' checked' : '');
    chk.innerHTML = t.done ? '✓' : '';
    chk.title = t.done ? 'Mark as not done' : 'Mark as done';
    chk.addEventListener('click', ()=> toggleDone(t.id, t.done));

    const title = document.createElement('div');
    title.className = 'todo-title' + (t.done ? ' done' : '');
    title.textContent = t.title;
    title.title = 'Click to edit';
    title.style.cursor = 'text';
    title.addEventListener('dblclick', ()=> editInline(title, t));

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';
    actions.style.alignItems = 'center';

    const editBtn = document.createElement('button');
    editBtn.className = 'small-btn';
    editBtn.innerHTML = '✏️';
    editBtn.title = 'Edit';
    editBtn.addEventListener('click', ()=> editInline(title, t));

    const delBtn = document.createElement('button');
    delBtn.className = 'small-btn';
    delBtn.innerHTML = '🗑️';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', ()=> {
      if (confirm('Delete this todo?')) deleteTodo(t.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(chk);
    li.appendChild(title);
    li.appendChild(actions);
    ul.appendChild(li);
  });
}

function editInline(titleEl, todo) {
  const prev = titleEl.textContent;
  const input = document.createElement('input');
  input.value = prev;
  input.className = 'input';
  input.style.margin = 0;
  input.style.padding = '6px 8px';
  input.style.borderRadius = '8px';
  input.addEventListener('keydown', async (e)=>{
    if (e.key === 'Enter') {
      await saveEdit();
    } else if (e.key === 'Escape') {
      cancel();
    }
  });
  input.addEventListener('blur', saveEdit);

  titleEl.replaceWith(input);
  input.focus();
  input.select();

  async function saveEdit() {
    const v = input.value.trim();
    if (!v) { cancel(); return; }
    if (v !== prev) {
      await fetch(`${API_BASE}${todo.id}/update/`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json', 'X-CSRFToken':csrftoken},
        body: JSON.stringify({title: v})
      });
      fetchTodos();
    } else cancel();
  }
  function cancel() {
    input.replaceWith(titleEl);
  }
}

async function addTodo() {
  const input = document.getElementById('newTodo');
  const title = input.value.trim();
  if (!title) return;
  await fetch(API_BASE + 'create/', {
    method: 'POST',
    headers: {'Content-Type':'application/json', 'X-CSRFToken': csrftoken},
    body: JSON.stringify({title})
  });
  input.value = '';
  fetchTodos();
}

async function toggleDone(id, prevDone) {
  await fetch(`${API_BASE}${id}/update/`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json', 'X-CSRFToken': csrftoken},
    body: JSON.stringify({done: !prevDone})
  });
  fetchTodos();
}

async function deleteTodo(id) {
  await fetch(`${API_BASE}${id}/delete/`, {
    method: 'DELETE',
    headers: {'X-CSRFToken': csrftoken}
  });
  fetchTodos();
}

async function exportJSON() {
  const res = await fetch(API_BASE + 'export/');
  const data = await res.json();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'todos_export.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function importJSON(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(API_BASE + 'import/', {
    method: 'POST',
    body: form,
    headers: {'X-CSRFToken': csrftoken}
  });
  if (res.ok) fetchTodos();
  else {
    const txt = await res.text();
    alert('Import failed: ' + txt);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  fetchTodos();

  document.getElementById('addBtn').addEventListener('click', addTodo);
  document.getElementById('newTodo').addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') addTodo();
  });

  document.getElementById('exportBtn').addEventListener('click', exportJSON);

  document.getElementById('importFile').addEventListener('change', (e)=>{
    const f = e.target.files[0];
    if (f) importJSON(f);
    e.target.value = null;
  });
});
