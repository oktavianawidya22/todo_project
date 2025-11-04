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
// Replace your existing exportPDF() with this function
async function exportPDF() {
  try {
    const res = await fetch(API_BASE + 'export/');
    if (!res.ok) throw new Error('Failed to fetch data for PDF');
    const data = await res.json();

    // build export container (offscreen)
    const wrap = document.createElement('div');
    wrap.style.width = '900px';
    wrap.style.boxSizing = 'border-box';
    wrap.style.padding = '28px';
    wrap.style.fontFamily = 'Inter, system-ui, Arial, sans-serif';
    wrap.style.background = '#ffffff';
    wrap.style.color = '#111';
    wrap.style.lineHeight = '1.35';

    // ===== Header (logo + title + meta) =====
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.gap = '16px';
    header.style.marginBottom = '12px';

    // left: logo + title
    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';
    left.style.gap = '14px';

    // logo (optional) - use static path
    const logoUrl = '/static/todos/logo.png';
    const img = document.createElement('img');
    img.src = logoUrl;
    img.alt = 'Logo';
    img.style.width = '72px';
    img.style.height = '72px';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '10px';
    img.addEventListener('error', () => {
      // remove image if not available to avoid broken icon in PDF
      if (img && img.parentNode) img.parentNode.removeChild(img);
    });
    left.appendChild(img);

    const titleWrap = document.createElement('div');
    titleWrap.style.lineHeight = '1';
    const title = document.createElement('div');
    title.textContent = 'Laporan Todo App';
    title.style.fontSize = '22px';
    title.style.fontWeight = '800';
    title.style.color = '#101010';
    title.style.marginBottom = '4px';

    const org = document.createElement('div');
    org.textContent = 'Todo App';
    org.style.fontSize = '12px';
    org.style.color = '#666';

    titleWrap.appendChild(title);
    titleWrap.appendChild(org);
    left.appendChild(titleWrap);
    header.appendChild(left);

    // right: meta (date + summary badge)
    const right = document.createElement('div');
    right.style.textAlign = 'right';

    const date = document.createElement('div');
    // Use locale string for clarity; change locale if needed
    date.textContent = `Tanggal: ${new Date().toLocaleString()}`;
    date.style.fontSize = '12px';
    date.style.color = '#444';
    date.style.marginBottom = '8px';
    right.appendChild(date);

    // summary badges (completed / pending)
    const total = Array.isArray(data) ? data.length : 0;
    const doneCount = Array.isArray(data) ? data.filter(x => x.done).length : 0;
    const pendingCount = total - doneCount;

    const badgeWrap = document.createElement('div');
    badgeWrap.style.display = 'flex';
    badgeWrap.style.gap = '8px';
    badgeWrap.style.justifyContent = 'flex-end';
    badgeWrap.style.alignItems = 'center';

    function makeBadge(label, count, bgColor) {
      const b = document.createElement('div');
      b.style.display = 'inline-flex';
      b.style.alignItems = 'center';
      b.style.gap = '8px';
      b.style.padding = '6px 10px';
      b.style.borderRadius = '999px';
      b.style.fontSize = '12px';
      b.style.fontWeight = '700';
      b.style.background = bgColor;
      b.style.color = '#fff';
      b.textContent = `${label}: ${count}`;
      return b;
    }

    const doneBadge = makeBadge('Completed', doneCount, '#0a8a3a'); // hijau
    const pendingBadge = makeBadge('Pending', pendingCount, '#cc2f2f'); // merah
    badgeWrap.appendChild(doneBadge);
    badgeWrap.appendChild(pendingBadge);
    right.appendChild(badgeWrap);

    header.appendChild(right);
    wrap.appendChild(header);

    // Divider
    const hr = document.createElement('div');
    hr.style.height = '1px';
    hr.style.background = '#eee';
    hr.style.margin = '12px 0 16px 0';
    wrap.appendChild(hr);

    // ===== Table header =====
    const table = document.createElement('div');
    table.style.display = 'grid';
    table.style.gridTemplateColumns = '1fr 120px 90px';
    table.style.rowGap = '12px';
    table.style.columnGap = '12px';
    table.style.alignItems = 'center';
    table.style.fontSize = '13px';

    const thStyle = { fontWeight: '700', color: '#222', paddingBottom: '4px' };
    const th1 = document.createElement('div'); th1.textContent = 'Task'; Object.assign(th1.style, thStyle);
    const th2 = document.createElement('div'); th2.textContent = 'Created'; Object.assign(th2.style, thStyle); th2.style.textAlign = 'right';
    const th3 = document.createElement('div'); th3.textContent = 'Status'; Object.assign(th3.style, thStyle); th3.style.textAlign = 'right';

    table.appendChild(th1); table.appendChild(th2); table.appendChild(th3);

    // Rows
    if (!Array.isArray(data) || data.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No todos available';
      empty.style.gridColumn = '1 / -1';
      empty.style.padding = '10px 0';
      empty.style.color = '#666';
      table.appendChild(empty);
    } else {
      data.slice().reverse().forEach((t, idx) => {
        const td1 = document.createElement('div');
        td1.style.padding = '6px 0';
        td1.style.wordBreak = 'break-word';
        td1.style.fontWeight = '600';
        td1.textContent = `${idx + 1}. ${t.title || 'Untitled'}`;
        if (t.done) td1.style.opacity = '0.85'; // softer look

        const td2 = document.createElement('div');
        td2.style.padding = '6px 0';
        td2.style.textAlign = 'right';
        td2.style.fontSize = '12px';
        td2.style.color = '#555';
        // try to show created date if available, fallback to dash
        td2.textContent = t.created_at ? new Date(t.created_at).toLocaleDateString() : '-';

        const td3 = document.createElement('div');
        td3.style.padding = '6px 0';
        td3.style.textAlign = 'right';

        // status badge
        const status = document.createElement('span');
        status.style.display = 'inline-block';
        status.style.padding = '6px 10px';
        status.style.borderRadius = '999px';
        status.style.fontWeight = '700';
        status.style.fontSize = '12px';
        status.style.minWidth = '64px';
        status.style.textAlign = 'center';
        if (t.done) {
          status.textContent = 'Done';
          status.style.background = '#0a8a3a';
          status.style.color = '#fff';
        } else {
          status.textContent = 'Pending';
          status.style.background = '#cc2f2f';
          status.style.color = '#fff';
        }
        td3.appendChild(status);

        table.appendChild(td1);
        table.appendChild(td2);
        table.appendChild(td3);
      });
    }

    wrap.appendChild(table);

    // Footer summary
    const footer = document.createElement('div');
    footer.style.marginTop = '20px';
    footer.style.fontSize = '12px';
    footer.style.color = '#444';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';

    const leftFoot = document.createElement('div');
    leftFoot.textContent = `Total tasks: ${total}`;
    leftFoot.style.fontWeight = '700';

    const rightFoot = document.createElement('div');
    rightFoot.textContent = `Completed: ${doneCount}  •  Pending: ${pendingCount}`;

    footer.appendChild(leftFoot);
    footer.appendChild(rightFoot);
    wrap.appendChild(footer);

    // Append offscreen for rendering
    wrap.style.position = 'fixed';
    wrap.style.left = '-9999px';
    document.body.appendChild(wrap);

    // allow fonts/images paint
    await new Promise(r => setTimeout(r, 180));

    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
      throw new Error('Missing html2canvas or jsPDF. Make sure CDN scripts are included before app.js');
    }

    const canvas = await html2canvas(wrap, { scale: 2, useCORS: true, logging: false });
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
      // multi-page
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

    pdf.save(`todo-report-${Date.now()}.pdf`);
    document.body.removeChild(wrap);
  } catch (err) {
    console.error('Export PDF failed:', err);
    alert('Failed to export PDF. Check console for details.');
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
