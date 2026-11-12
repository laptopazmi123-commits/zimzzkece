// ==========================================
// 1. SISTEM LOGIN & UI
// ==========================================
const loginScreen = document.getElementById('loginScreen');
const appScreen   = document.getElementById('appScreen');
const loginForm   = document.getElementById('loginForm');
const loginStatus = document.getElementById('loginStatus');
const ownerName   = document.getElementById('ownerName');

const OWNER_USER = 'zimzz';
const OWNER_PASS = '12345678';

function cekLogin() {
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    loginScreen.style.display = 'none';
    appScreen.style.display = 'block';
    if (ownerName) ownerName.textContent = sessionStorage.getItem('username') || 'zimzz';
  } else {
    loginScreen.style.display = 'block';
    appScreen.style.display = 'none';
  }
}

// Panggil saat halaman dimuat
cekLogin();

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();

  if (user === OWNER_USER && pass === OWNER_PASS) {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', user);
    loginStatus.className = 'status';
    cekLogin();
  } else {
    loginStatus.className = 'status visible err';
    loginStatus.textContent = '❌ Username atau Password salah!';
  }
});

window.logout = function() {
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('username');
  cekLogin();
};

// ==========================================
// 2. LOGIKA KIRIM PESAN WA
// ==========================================
const form       = document.getElementById('form');
const btn        = document.getElementById('btn');
const statusEl   = document.getElementById('status');
const msgInput   = document.getElementById('message');
const charCount  = document.getElementById('charCount');
const jumlahInp  = document.getElementById('jumlah');
const delayInp   = document.getElementById('delay');

// Hitung karakter
function updateCount() { if (charCount) charCount.textContent = msgInput.value.length; }
if (msgInput) { msgInput.addEventListener('input', updateCount); updateCount(); }

// Update label tombol
function updateBtnLabel() {
  const n = parseInt(jumlahInp.value) || 1;
  btn.innerHTML = `🚀 Kirim Sekarang <span class="count-badge">${n}x</span>`;
}
if (jumlahInp) { jumlahInp.addEventListener('input', updateBtnLabel); updateBtnLabel(); }

function setStatus(type, text) {
  statusEl.className = 'status visible ' + type;
  statusEl.textContent = text;
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const linkGrup = document.getElementById('linkGrup').value.trim();
    const target = document.getElementById('target').value.trim();
    const message = msgInput.value.trim();
    const jumlah = parseInt(jumlahInp.value) || 1;
    const delay = parseInt(delayInp.value) || 2;

    // Validasi Target
    const isGroup = target.includes('@g.us');
    const isPhone = /^\d{8,15}$/.test(target);

    if (!isPhone && !isGroup) {
      setStatus('err', '❌ Target tidak valid. Masukkan nomor 62xxx atau ID grup (@g.us).');
      return;
    }
    if (!message) {
      setStatus('err', '❌ Pesan tidak boleh kosong.');
      return;
    }
    if (jumlah < 1 || jumlah > 50) {
      setStatus('err', '❌ Jumlah harus 1–50.');
      return;
    }

    btn.disabled = true;
    btn.textContent = `⏳ Memproses...`;
    setStatus('loading', 'Memproses permintaan Anda...');

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, message, jumlah, delay, linkGrup })
      });
      
      const data = await res.json();

      if (data.ok) {
        let resultMsg = `✅ ${data.terkirim}/${data.total} pesan terkirim ke ${data.target}`;
        if (data.autoJoin) {
          resultMsg += ` | Join: ${data.autoJoin}`;
        }
        setStatus('ok', resultMsg);
      } else {
        setStatus('err', `❌ Gagal: ${data.error || 'Tidak diketahui'}`);
      }
    } catch (err) {
      setStatus('err', `❌ Error jaringan: ${err.message}`);
    } finally {
      btn.disabled = false;
      updateBtnLabel();
    }
  });
}
