// todos/static/todos/app.js
const API_BASE = '/api/';

function getCookie(name) {
  const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return v ? v.pop() : '';
}
const csrftoken = getCookie('csrftoken');

// Fetch todos from API
async function fetchTodos() {
  try {
    const res = await fetch(API_BASE);
    const data = await res.json();
    renderList(data);
  } catch (e) {
    console.error(e);
  }
}

// Render list to UI
function renderList(todos) {
  const ul = document.getElementById('todoList');
  const empty = document.getElementById('emptyState');
  ul.innerHTML = '';

  if (!todos || todos.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  todos.slice().reverse().forEach(t => {
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
    title.title = 'Double-click to edit';
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

// Inline edit
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

// Add new todo
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

// Toggle done
async function toggleDone(id, prevDone) {
  await fetch(`${API_BASE}${id}/update/`, {
    method: 'PUT',
    headers: {'Content-Type':'application/json', 'X-CSRFToken': csrftoken},
    body: JSON.stringify({done: !prevDone})
  });
  fetchTodos();
}

// Delete todo
async function deleteTodo(id) {
  await fetch(`${API_BASE}${id}/delete/`, {
    method: 'DELETE',
    headers: {'X-CSRFToken': csrftoken}
  });
  fetchTodos();
}

// Export to PDF (jsPDF + html2canvas)
async function exportPDF() {
  try {
    const res = await fetch(API_BASE + 'export/');
    if (!res.ok) throw new Error('Failed to fetch data for PDF');
    const data = await res.json();

    const wrap = document.createElement('div');
    wrap.style.width = '800px';
    wrap.style.boxSizing = 'border-box';
    wrap.style.padding = '20px';
    wrap.style.fontFamily = 'Inter, system-ui, Arial';
    wrap.style.background = '#fff';
    wrap.style.color = '#111';

    const header = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = 'Todo List Report';
    const meta = document.createElement('div');
    meta.textContent = `Generated at: ${new Date().toLocaleString()}`;
    meta.style.fontSize = '12px';
    meta.style.color = '#555';
    header.appendChild(h2);
    header.appendChild(meta);
    wrap.appendChild(header);

    const table = document.createElement('div');
    table.style.display = 'grid';
    table.style.gridTemplateColumns = '1fr 100px';
    table.style.rowGap = '8px';
    table.style.columnGap = '12px';
    table.style.marginTop = '12px';
    table.style.borderTop = '1px solid #eee';
    table.style.paddingTop = '8px';

    const th1 = document.createElement('div'); th1.textContent = 'Task'; th1.style.fontWeight = '600';
    const th2 = document.createElement('div'); th2.textContent = 'Status'; th2.style.fontWeight = '600'; th2.style.textAlign = 'right';
    table.appendChild(th1); table.appendChild(th2);

    if (!Array.isArray(data) || data.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No todos available';
      empty.style.gridColumn = '1 / -1';
      table.appendChild(empty);
    } else {
      data.slice().reverse().forEach(t => {
        const td1 = document.createElement('div');
        td1.textContent = t.title || 'Untitled';
        if (t.done) td1.style.textDecoration = 'line-through';

        const td2 = document.createElement('div');
        td2.textContent = t.done ? 'Done' : 'Pending';
        td2.style.textAlign = 'right';
        td2.style.color = t.done ? '#0a0' : '#c00';

        table.appendChild(td1);
        table.appendChild(td2);
      });
    }

    wrap.appendChild(table);
    wrap.style.position = 'fixed';
    wrap.style.left = '-9999px';
    document.body.appendChild(wrap);

    await new Promise(r => setTimeout(r, 100));

    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      throw new Error('Missing html2canvas or jsPDF');
    }

    const canvas = await html2canvas(wrap, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
      const pxFullHeight = canvas.height;
      const pxPage = Math.floor(canvas.width * (pageHeight / pageWidth));
      let renderedHeight = 0;

      while (renderedHeight < pxFullHeight) {
        const canvasPage = document.createElement('canvas');
        canvasPage.width = canvas.width;
        canvasPage.height = Math.min(pxPage, pxFullHeight - renderedHeight);

        const ctx = canvasPage.getContext('2d');
        ctx.drawImage(
          canvas,
          0, renderedHeight, canvas.width, canvasPage.height,
          0, 0, canvasPage.width, canvasPage.height
        );

        const pageData = canvasPage.toDataURL('image/png');
        const pageHeightMm = (canvasPage.height * pageWidth) / canvasPage.width;

        if (renderedHeight === 0) {
          pdf.addImage(pageData, 'PNG', 0, 0, pageWidth, pageHeightMm);
        } else {
          pdf.addPage();
          pdf.addImage(pageData, 'PNG', 0, 0, pageWidth, pageHeightMm);
        }
        renderedHeight += canvasPage.height;
      }
    }

    pdf.save(`todos-${Date.now()}.pdf`);
    document.body.removeChild(wrap);
  } catch (err) {
    console.error('Export PDF failed:', err);
    alert('Failed to export PDF. Check console.');
  }
}

// Init
document.addEventListener('DOMContentLoaded', ()=>{
  fetchTodos();

  document.getElementById('addBtn').addEventListener('click', addTodo);
  document.getElementById('newTodo').addEventListener('keydown', (e)=>{
    if (e.key === 'Enter') addTodo();
  });

  // bind export button(s) — supports both ids just in case
  ['exportBtn', 'exportPdfBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', exportPDF);
  });
});
