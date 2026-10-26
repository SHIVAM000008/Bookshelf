const authForm = document.getElementById('auth-form');
const nameRow = document.getElementById('name-row');
const nameField = document.getElementById('name');
const emailField = document.getElementById('email');
const passwordField = document.getElementById('password');
const passwordHint = document.getElementById('password-hint');
const submitBtn = document.getElementById('submit-btn');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const message = document.getElementById('message');

let mode = 'login';

function setMode(next) {
  mode = next;
  const registering = mode === 'register';

  nameRow.classList.toggle('hidden', !registering);
  passwordHint.classList.toggle('hidden', !registering);
  nameField.required = registering;
  passwordField.autocomplete = registering ? 'new-password' : 'current-password';
  submitBtn.textContent = registering ? 'Create account' : 'Log in';

  loginTab.classList.toggle('active', !registering);
  registerTab.classList.toggle('active', registering);
  loginTab.setAttribute('aria-pressed', String(!registering));
  registerTab.setAttribute('aria-pressed', String(registering));
  message.textContent = '';
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  message.textContent = '';
  submitBtn.disabled = true;

  const payload = {
    email: emailField.value.trim(),
    password: passwordField.value
  };
  if (mode === 'register') payload.name = nameField.value.trim();

  try {
    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      message.textContent = data.message;
      return;
    }

    window.location.href = '/';
  } catch (err) {
    message.textContent = 'Could not reach the server. Check that it is running.';
  } finally {
    submitBtn.disabled = false;
  }
});

loginTab.addEventListener('click', () => setMode('login'));
registerTab.addEventListener('click', () => setMode('register'));

fetch('/api/auth/me').then((res) => {
  if (res.ok) window.location.href = '/';
});
