// STATE
let categories = [];
let currentCategory = '';
let todos = {}; // Struktur: kategoriNavn - skriv tekst - trykk ok

// Lagrer til localStorage
function saveState() {
  localStorage.setItem('categories', JSON.stringify(categories));
  localStorage.setItem('todos', JSON.stringify(todos));
  localStorage.setItem('currentCategory', currentCategory);
}

// Leser lagret state eller setter startverdier
function loadState() {
  categories = JSON.parse(localStorage.getItem('categories')) || ['Standard'];
  currentCategory = localStorage.getItem('currentCategory') || categories;
  todos = JSON.parse(localStorage.getItem('todos')) || {};
  if (!todos[currentCategory]) todos[currentCategory] = [];
}

// Setter/lagrer dark mode
function setDarkMode(on) {
  document.body.classList.toggle('dark', on);
  localStorage.setItem('darkMode', on ? '1' : '0');
}
function loadDarkMode() {
  const saved = localStorage.getItem('darkMode');
  setDarkMode(saved === '1');
}

// Fontvalg Toggle
function setFontClear(on) {
  document.body.classList.toggle('font-clear', on);
  localStorage.setItem('fontClear', on ? '1' : '0');
}
function loadFontClear() {
  const saved = localStorage.getItem('fontClear');
  setFontClear(saved === '1');
}

// UI (brukergrensesnitt) oppsett og rendering
document.addEventListener('DOMContentLoaded', function () {
  loadState();
  loadDarkMode();
  loadFontClear();
  renderCategories();
  renderTodos();
  setupForm();
  setupModeButton();
  setupFontToggle();
  setupCategoryHandlers();
  setupDragAndDrop();
});

// Lager kategorifaner i toppen
function renderCategories() {
  const catUl = document.getElementById('category-tabs');
  catUl.innerHTML = '';
  categories.forEach((cat) => {
    const li = document.createElement('li');
    li.textContent = cat;
    if (cat === currentCategory) li.classList.add('active');
    li.onclick = () => {
      currentCategory = cat;
      if (!todos[currentCategory]) todos[currentCategory] = [];
      saveState();
      renderCategories();
      renderTodos();
    };
    if (categories.length > 1) {
      const del = document.createElement('button');
      del.className = 'tab-delete';
      del.innerHTML = '×';
      del.title = 'Slett kategori';
      del.onclick = (ev) => {
        ev.stopPropagation();
        if (confirm(`Slette kategori "${cat}"? Alle gjøremål slettes også.`)) {
          categories = categories.filter((c) => c !== cat);
          delete todos[cat];
          if (currentCategory === cat) currentCategory = categories;
          saveState();
          renderCategories();
          renderTodos();
        }
      };
      li.appendChild(del);
    }
    catUl.appendChild(li);
  });
}

document.getElementById('add-category').onclick = function () {
  let name = prompt('Navn på ny kategori:');
  if (!name) return;
  name = name.trim();
  if (name.length < 1 || categories.includes(name))
    return alert('Ugyldig/kategorinavn finnes allerede!');
  categories.push(name);
  todos[name] = [];
  currentCategory = name;
  saveState();
  renderCategories();
  renderTodos();
};

// Lager gjøremålene for aktiv kategori
function renderTodos() {
  const arr = todos[currentCategory] || [];
  const ul = document.getElementById('todo-list');
  ul.innerHTML = '';
  arr.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.setAttribute('draggable', 'true');
    li.setAttribute('data-idx', idx);

    const group = document.createElement('div');
    group.className = 'todo-group';

    // Checkmark boksen
    const checkBtn = document.createElement('button');
    checkBtn.className = 'checkmark-btn' + (todo.done ? ' checked' : '');
    checkBtn.setAttribute('type', 'button');
    checkBtn.innerHTML = `<span class="checkmark">${
      todo.done ? '&#10003;' : ''
    }</span>`;
    checkBtn.onclick = function () {
      todo.done = !todo.done;
      saveState();
      renderTodos();
    };
    const span = document.createElement('span');
    span.className = 'todo-text' + (todo.done ? ' done' : '');
    span.textContent = todo.text;
    group.appendChild(checkBtn);
    group.appendChild(span);

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.innerHTML = '🗑️';
    delBtn.setAttribute('type', 'button');
    delBtn.disabled = !todo.done;
    delBtn.onclick = function () {
      if (!delBtn.disabled) {
        arr.splice(idx, 1);
        saveState();
        renderTodos();
      }
    };

    li.appendChild(group);
    li.appendChild(delBtn);
    ul.appendChild(li);
  });
}

function setupForm() {
  const form = document.getElementById('todo-form');
  form.onsubmit = function (e) {
    e.preventDefault();
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    if (!text) return;
    todos[currentCategory] = todos[currentCategory] || [];
    todos[currentCategory].push({ text, done: false });
    saveState();
    renderTodos();
    input.value = '';
  };
}

function setupModeButton() {
  const modeBtn = document.getElementById('toggle-mode');
  function updateIcon() {
    modeBtn.textContent = document.body.classList.contains('dark')
      ? '☀️'
      : '🌙';
  }
  modeBtn.onclick = function () {
    const dark = !document.body.classList.contains('dark');
    setDarkMode(dark);
    updateIcon();
  };
  updateIcon();
}

function setupFontToggle() {
  const fontBtn = document.getElementById('toggle-font');
  function updateIcon() {
    fontBtn.textContent = document.body.classList.contains('font-clear')
      ? 'A🖋️'
      : 'A🅰️';
  }
  fontBtn.onclick = function () {
    const clear = !document.body.classList.contains('font-clear');
    setFontClear(clear);
    updateIcon();
  };
  updateIcon();
}

function setupCategoryHandlers() {
  // Alt håndteres i renderCategories
}

function setupDragAndDrop() {
  let draggingEl = null;
  let draggingIdx = null;
  const ul = document.getElementById('todo-list');
  ul.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('todo-item')) {
      draggingEl = e.target;
      draggingEl.classList.add('dragging');
      draggingIdx = +draggingEl.getAttribute('data-idx');
    }
  });
  ul.addEventListener('dragend', () => {
    if (draggingEl) draggingEl.classList.remove('dragging');
    draggingEl = null;
    draggingIdx = null;
    Array.from(ul.children).forEach((li) => li.classList.remove('drag-over'));
  });
  ul.addEventListener('dragover', (e) => {
    e.preventDefault();
    const after = getDragAfterElement(ul, e.clientY);
    Array.from(ul.children).forEach((li) => li.classList.remove('drag-over'));
    if (after) after.classList.add('drag-over');
  });
  ul.addEventListener('drop', (e) => {
    e.preventDefault();
    const after = getDragAfterElement(ul, e.clientY);
    let newIdx;
    const todosArr = todos[currentCategory];
    if (!after) {
      newIdx = todosArr.length - 1;
    } else {
      newIdx = +after.getAttribute('data-idx');
    }
    if (draggingIdx !== null && newIdx !== draggingIdx) {
      const [removed] = todosArr.splice(draggingIdx, 1);
      todosArr.splice(newIdx, 0, removed);
      saveState();
      renderTodos();
    }
  });
}
function getDragAfterElement(ul, y) {
  const els = [...ul.querySelectorAll('.todo-item:not(.dragging)')];
  return els.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: -Infinity }
  ).element;
}