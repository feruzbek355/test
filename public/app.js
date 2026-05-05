// Global helper
async function api(path, options = {}) {
  const res = await fetch(path, Object.assign({ credentials: 'include', headers: { 'Content-Type': 'application/json' } }, options));
  const data = await res.json().catch(() => null);
  if (!res.ok) throw data || { error: 'network_error' };
  return data;
}

async function loadAuthState() {
  try {
    const { user } = await api('/api/auth/me');
    const userBox = document.getElementById('userBox');
    const logoutBtn = document.getElementById('logoutBtn');
    if (user) {
      userBox.textContent = 'Salom, ' + user.fullName;
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
      userBox.textContent = 'Mehmon';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
    return user;
  } catch (err) {
    console.error(err);
  }
}

function setupLoginForm() {
  const form = document.getElementById('loginForm');
  const msg = document.getElementById('loginMsg');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const formData = new FormData(form);
    const payload = { email: formData.get('email'), password: formData.get('password') };
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
      msg.textContent = 'Muvaffaqiyatli login. Yo\'naltirilmoqda...';
      window.location.href = 'contact.html';
    } catch (err) {
      msg.textContent = err.error || 'Login xatosi';
    }
  });
}

function setupSignupForm() {
  const form = document.getElementById('signupForm');
  const msg = document.getElementById('signupMsg');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    const fd = new FormData(form);
    const payload = { fullName: fd.get('fullName'), email: fd.get('email'), password: fd.get('password') };
    try {
      await api('/api/auth/signup', { method: 'POST', body: JSON.stringify(payload) });
      msg.textContent = 'Ro\'yxatdan o\'tildi. Yo\'naltirilmoqda...';
      window.location.href = 'contact.html';
    } catch (err) {
      msg.textContent = err.error || 'Signup xatosi';
    }
  });
}

async function loadNews() {
  try {
    const data = await api('/api/news');
    const list = document.getElementById('newsList');
    if (!list) return;
    list.innerHTML = '';
    data.news.forEach(n => {
      const div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML = `<div class="news-title">${n.title}</div><div class="muted">${new Date(n.created_at).toLocaleString()}</div><p>${n.content}</p>`;
      list.appendChild(div);
    });
  } catch (err) {
    console.error('loadNews', err);
  }
}

async function setupContact() {
  const user = await loadAuthState();
  const form = document.getElementById('contactForm');
  const contactMsg = document.getElementById('contactMsg');
  const messageList = document.getElementById('messageList');
  if (!form) return;
  if (!user) {
    form.style.display = 'none';
    if (contactMsg) contactMsg.textContent = 'Xabar qoldirish uchun iltimos login qiling.';
    return;
  }
  form.style.display = 'block';

  async function loadMessages() {
    try {
      const data = await api('/api/messages');
      if (!messageList) return;
      messageList.innerHTML = '';
      data.messages.forEach(m => {
        const d = document.createElement('div');
        d.className = 'message-item';
        d.innerHTML = `<strong>${m.full_name}</strong> <span class="muted">${new Date(m.created_at).toLocaleString()}</span><p>${m.message_text}</p>`;
        messageList.appendChild(d);
      });
    } catch (err) {
      console.error(err);
    }
  }

  await loadMessages();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const message = fd.get('message');
    try {
      await api('/api/messages', { method: 'POST', body: JSON.stringify({ message }) });
      form.reset();
      await loadMessages();
    } catch (err) {
      contactMsg.textContent = err.error || 'Xabar yuborilmadi';
    }
  });
}

function setupYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', () => {
  loadAuthState();
  setupLoginForm();
  setupSignupForm();
  loadNews();
  setupContact();
  setupYear();
});
