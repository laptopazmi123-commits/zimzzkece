// api/send.js
export const config = {
  api: { bodyParser: true }, 
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.FONNTE_TOKEN;
  if (!token) return res.status(500).json({ error: 'FONNTE_TOKEN belum diset di Vercel' });

  const { target, message, jumlah = 1, delay = 2, linkGrup } = req.body || {};

  // Validasi Target (Nomor atau Grup)
  const isGroup = target.includes('@g.us');
  const isPhone = /^\d{8,15}$/.test(target);

  if (!isPhone && !isGroup) {
    return res.status(400).json({ error: 'Target tidak valid. Masukkan nomor 62xxx atau ID grup (@g.us)' });
  }
  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
  }

  const n = parseInt(jumlah);
  if (isNaN(n) || n < 1 || n > 50) {
    return res.status(400).json({ error: 'Jumlah harus 1–50' });
  }

  const delaySec = Math.max(1, Math.min(60, parseInt(delay) || 2));
  let autoJoinStatus = null;

  // ==========================================
  // PROSES AUTO JOIN GRUP (Jika link diisi)
  // ==========================================
  if (linkGrup && linkGrup.trim() !== '') {
    try {
      // Ambil kode undangan (misal: chat.whatsapp.com/AbCdEf -> AbCdEf)
      let kodeUndangan = linkGrup.trim();
      if (kodeUndangan.includes('chat.whatsapp.com/')) {
        kodeUndangan = kodeUndangan.split('chat.whatsapp.com/')[1].split('?')[0];
      }

      const joinRes = await fetch('https://api.fonnte.com/join-group', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: kodeUndangan }),
      });
      
      const joinData = await joinRes.json();
      autoJoinStatus = joinData.status ? 'Berhasil Join' : 'Gagal Join (Cek Fonnte)';
    } catch (e) {
      autoJoinStatus = 'Error Join: ' + e.message;
    }
  }

  // ==========================================
  // PROSES KIRIM PESAN
  // ==========================================
  let terkirim = 0;
  let gagal = 0;
  const errors = [];

  for (let i = 1; i <= n; i++) {
    try {
      const r = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: target,
          message: message,
          delay: delaySec,
        }),
      });

      const data = await r.json();

      if (data.status === true) {
        terkirim++;
      } else {
        gagal++;
        errors.push(data.reason || data.detail || 'Gagal');
      }
    } catch (e) {
      gagal++;
      errors.push(e.message);
    }

    if (i < n) await sleep(delaySec * 1000);
  }

  return res.status(200).json({
    ok: terkirim > 0,
    total: n,
    terkirim,
    gagal,
    target,
    autoJoin: autoJoinStatus,
    errors: errors.slice(0, 5),
  });
}
