const API = '/api/books';

const STATUS_LABELS = {
  'to-read': 'To read',
  reading: 'Reading',
  finished: 'Finished'
};

const form = document.getElementById('book-form');
const idField = document.getElementById('book-id');
const titleField = document.getElementById('title');
const authorField = document.getElementById('author');
const genreField = document.getElementById('genre');
const yearField = document.getElementById('year');
const statusField = document.getElementById('status');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const message = document.getElementById('message');
const list = document.getElementById('book-list');
const listTitle = document.getElementById('list-title');
const bookCount = document.getElementById('book-count');
const searchField = document.getElementById('search');
const filterGroup = document.getElementById('filter');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const userRole = document.getElementById('user-role');
const logoutBtn = document.getElementById('logout-btn');
const adminPanel = document.getElementById('admin-panel');
const userList = document.getElementById('user-list');
const toast = document.getElementById('toast');

let books = [];
let currentUser = null;
let currentStatus = '';
let searchTimer;
let toastTimer;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, className, onClick) {
  const btn = el('button', className, label);
  btn.type = 'button';
  btn.addEventListener('click', onClick);
  return btn;
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 4000);
}

async function request(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.location.href = '/login.html';
  }
  return res;
}

async function readMessage(res) {
  try {
    const data = await res.json();
    return data.message;
  } catch (err) {
    return 'Something went wrong. Please try again.';
  }
}

async function loadBooks() {
  const params = new URLSearchParams();
  if (searchField.value.trim()) params.set('search', searchField.value.trim());
  if (currentStatus) params.set('status', currentStatus);

  const res = await request(`${API}?${params}`);
  if (!res.ok) return;

  books = await res.json();
  renderBooks();
}

function renderBooks() {
  bookCount.textContent = books.length === 1 ? '1 book' : `${books.length} books`;
  list.innerHTML = '';

  if (!books.length) {
    const filtering = searchField.value.trim() || currentStatus;
    list.appendChild(
      el(
        'li',
        'empty',
        filtering
          ? 'No books match your search or filter.'
          : 'No books yet. Add your first book using the form.'
      )
    );
    return;
  }

  books.forEach((book) => {
    const item = el('li', 'book');

    const top = el('div', 'book-top');
    top.append(
      el('h3', 'book-title', book.title),
      el('span', `chip status-${book.status}`, STATUS_LABELS[book.status] || book.status)
    );
    item.append(top, el('p', 'book-author', book.author));

    const meta = [book.genre, book.year].filter(Boolean).join(', ');
    if (meta) item.appendChild(el('p', 'book-meta', meta));

    if (currentUser.role === 'admin') {
      item.appendChild(
        el('p', 'book-meta', book.owner ? `Added by ${book.owner.name}` : 'No owner')
      );
    }

    if (book.summary) item.appendChild(el('p', 'book-summary', book.summary));

    const actions = el('div', 'book-actions');
    const aiBtn = button(
      book.summary ? 'Regenerate' : 'AI summary',
      'btn btn-secondary btn-sm',
      () => generateSummary(book._id, aiBtn)
    );
    actions.append(
      aiBtn,
      button('Edit', 'btn btn-secondary btn-sm', () => startEdit(book)),
      button('Delete', 'btn btn-danger btn-sm', () => removeBook(book._id))
    );

    item.appendChild(actions);
    list.appendChild(item);
  });
}

function startEdit(book) {
  idField.value = book._id;
  titleField.value = book.title;
  authorField.value = book.author;
  genreField.value = book.genre || '';
  yearField.value = book.year || '';
  statusField.value = book.status;
  formTitle.textContent = 'Edit book';
  saveBtn.textContent = 'Save changes';
  cancelBtn.classList.remove('hidden');

  if (window.matchMedia('(max-width: 899px)').matches) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  titleField.focus();
}

function resetForm() {
  form.reset();
  idField.value = '';
  formTitle.textContent = 'Add a book';
  saveBtn.textContent = 'Add book';
  cancelBtn.classList.add('hidden');
  message.textContent = '';
}

async function generateSummary(id, btn) {
  btn.disabled = true;
  btn.textContent = 'Generating...';

  const res = await request(`${API}/${id}/summary`, { method: 'POST' });
  if (!res.ok) showToast(await readMessage(res));

  loadBooks();
}

async function removeBook(id) {
  if (!confirm('Delete this book?')) return;

  const res = await request(`${API}/${id}`, { method: 'DELETE' });
  if (!res.ok) showToast(await readMessage(res));

  if (idField.value === id) resetForm();
  loadBooks();
}

async function loadUsers() {
  const res = await request('/api/users');
  if (!res.ok) return;

  const users = await res.json();
  userList.innerHTML = '';

  users.forEach((user) => {
    const item = el('li', 'user-row');

    const info = el('div', 'user-info');
    const top = el('div', 'book-top');
    top.append(
      el('strong', 'book-title', user.name),
      el('span', user.role === 'admin' ? 'chip' : 'chip chip-neutral', user.role === 'admin' ? 'Admin' : 'Member')
    );
    info.append(top, el('p', 'book-meta', user.email));
    item.appendChild(info);

    if (user._id !== currentUser.id) {
      item.appendChild(
        button('Delete', 'btn btn-danger btn-sm', () => removeUser(user._id, user.name))
      );
    }

    userList.appendChild(item);
  });
}

async function removeUser(id, name) {
  if (!confirm(`Delete ${name} and all of their books?`)) return;

  const res = await request(`/api/users/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    showToast(await readMessage(res));
    return;
  }

  loadUsers();
  loadBooks();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  message.textContent = '';

  const payload = {
    title: titleField.value.trim(),
    author: authorField.value.trim(),
    genre: genreField.value.trim() || undefined,
    year: yearField.value ? Number(yearField.value) : undefined,
    status: statusField.value
  };

  const id = idField.value;
  const res = await request(id ? `${API}/${id}` : API, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    message.textContent = await readMessage(res);
    return;
  }

  resetForm();
  loadBooks();
});

cancelBtn.addEventListener('click', resetForm);

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

searchField.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadBooks, 300);
});

filterGroup.addEventListener('click', (e) => {
  const chosen = e.target.closest('.seg');
  if (!chosen) return;

  currentStatus = chosen.dataset.status;
  filterGroup.querySelectorAll('.seg').forEach((seg) => {
    const active = seg === chosen;
    seg.classList.toggle('active', active);
    seg.setAttribute('aria-pressed', String(active));
  });
  loadBooks();
});

async function init() {
  const res = await fetch('/api/auth/me');
  if (!res.ok) {
    window.location.href = '/login.html';
    return;
  }

  currentUser = await res.json();
  userName.textContent = currentUser.name;
  userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();

  if (currentUser.role === 'admin') {
    userRole.classList.remove('hidden');
    listTitle.textContent = 'All books';
    adminPanel.classList.remove('hidden');
    loadUsers();
  }

  loadBooks();
}

init();
