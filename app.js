// LendSpace – antarmuka (login, siswa, guru).
import {
  createBackend, firebaseReady, DOMAIN, STATUS, CATEGORIES, CONDITIONS, FLOOR_MAPS,
  availableUnits, roomStatusOn, isOverdue, todayStr, addDays, fmtDate, uid, slug,
} from './data.js';

const $app = document.getElementById('app');
const state = {
  backend: null, user: null, catalog: [], requests: [], notifs: [], authError: '',
  loginRole: 'student', q: '', cat: 'Semua', floor: 2, mapDay: todayStr(), reqTab: 'menunggu',
  manageTab: 'barang', manageQ: '', confirmDel: null, seenNotifs: null, ready: false,
};
let unsubs = [];

/* ---------- util ---------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function toast(msg, tone = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + tone;
  el.textContent = msg;
  $('#toasts').append(el);
  setTimeout(() => el.remove(), 5200);
}

const ICONS = {
  projector: '<rect x="3" y="8" width="18" height="9" rx="2"/><circle cx="15" cy="12.5" r="2.5"/><path d="M6 17v2M18 17v2"/>',
  screen: '<rect x="3" y="4" width="18" height="11" rx="1"/><path d="M12 15v5M8 20h8"/>',
  speaker: '<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="14" r="3.2"/><circle cx="12" cy="7" r=".8"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>',
  headset: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 19h18"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
  camera: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/>',
  light: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  cable: '<path d="M4 8h4v4H4zM16 12h4v4h-4zM8 10h4a4 4 0 0 1 4 4v0"/>',
  plug: '<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  net: '<path d="M4 5v15M20 5v15M4 8h16M4 12h16M4 16h16M8 8v8M12 8v8M16 8v8"/>',
  racket: '<ellipse cx="9.5" cy="9.5" rx="5.5" ry="6.5" transform="rotate(-40 9.5 9.5)"/><path d="M14 14l6 6"/>',
  whistle: '<circle cx="9" cy="15" r="5"/><path d="M13 12l8-4v4l-6 2"/>',
  mat: '<rect x="3" y="9" width="18" height="6" rx="3"/><path d="M7 9v6M11 9v6"/>',
  broom: '<path d="M14 3l-4 9M7 12l-3 8h11l-2-8z"/>',
  bucket: '<path d="M5 8h14l-1.5 12h-11zM5 8a7 3 0 0 1 14 0"/>',
  bin: '<path d="M5 7h14M10 4h4M7 7l1 13h8l1-13"/>',
  chair: '<path d="M7 4h10v8H7zM6 12h12M8 12v8M16 12v8"/>',
  desk: '<rect x="3" y="8" width="18" height="3" rx="1"/><path d="M5 11v9M19 11v9"/>',
  board: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20l2-4M16 20l-2-4"/>',
  marker: '<path d="M4 20l3-1 11-11-2-2L5 17zM15 6l2 2"/>',
  podium: '<path d="M6 6h12l-1 14H7zM12 3v3"/>',
  tent: '<path d="M3 20L12 5l9 15zM12 5v15"/>',
  ladder: '<path d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10"/>',
  firstaid: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M12 10v7M8.5 13.5h7M9 7V5h6v2"/>',
  box: '<path d="M3 8l9-4 9 4v9l-9 4-9-4zM3 8l9 4 9-4M12 12v9"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.box}</svg>`;
const statusPill = (r) => {
  if (isOverdue(r)) return '<span class="st late">Terlambat</span>';
  const s = STATUS[r.status] || { label: r.status, tone: 'done' };
  return `<span class="st ${s.tone}">${esc(s.label)}</span>`;
};
const items = () => state.catalog.filter((x) => x.kind === 'item');
const rooms = () => state.catalog.filter((x) => x.kind === 'room');
const unread = () => state.notifs.filter((n) => !n.read).length;
const pendingCount = () => state.requests.filter((r) => r.status === 'menunggu').length;
const route = () => (location.hash.replace('#', '') || '');

function dateRange(r) { return r.from === r.to ? fmtDate(r.from) : `${fmtDate(r.from)} – ${fmtDate(r.to)}`; }
function timeRange(r) { return r.jamMulai ? ` · ${r.jamMulai}–${r.jamSelesai}` : ''; }

/* ---------- modal ---------- */
function openModal(html, onMount) {
  closeModal();
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeModal(); });
  document.body.append(ov);
  const first = $('input, select, textarea, button', ov);
  first?.focus();
  ov.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  onMount?.(ov);
}
function closeModal() { $$('.overlay').forEach((o) => o.remove()); }

/* ---------- boot ---------- */
async function boot() {
  $app.innerHTML = '<div class="wrap" style="padding-block:60px">Memuat LendSpace…</div>';
  try { state.backend = await createBackend(); }
  catch (e) { $app.innerHTML = `<div class="wrap" style="padding-block:60px"><p class="err">Gagal memuat Firebase: ${esc(e.message)}</p></div>`; return; }
  state.backend.onAuth((u, err) => {
    if (err) state.authError = err.message;
    const changed = (u?.uid || '') !== (state.user?.uid || '') || (u?.role || '') !== (state.user?.role || '');
    state.user = u;
    state.ready = true;
    if (changed) startData();
    if (u && ['masuk', ''].includes(route())) location.hash = defaultRoute();
    if (!u && route() !== 'masuk') location.hash = 'masuk';
    render();
  });
}
function defaultRoute() { return state.user?.role === 'teacher' ? 'pengajuan' : 'beranda'; }

function startData() {
  unsubs.forEach((f) => f?.()); unsubs = [];
  state.catalog = []; state.requests = []; state.notifs = []; state.seenNotifs = null;
  if (!state.user) return;
  const b = state.backend;
  unsubs.push(b.subCatalog((v) => { state.catalog = v.sort((a, c) => a.name.localeCompare(c.name, 'id')); softRender(); }));
  unsubs.push(b.subRequests(state.user, (v) => { state.requests = v.sort((a, c) => (c.createdAt || 0) - (a.createdAt || 0)); softRender(); }));
  unsubs.push(b.subNotifs(state.user, (v) => {
    v.sort((a, c) => (c.createdAt || 0) - (a.createdAt || 0));
    if (state.seenNotifs) v.filter((n) => !state.seenNotifs.has(n.id) && !n.read).forEach((n) => toast(n.text, /ditolak|dibatalkan/.test(n.text) ? 'bad' : 'good'));
    state.seenNotifs = new Set(v.map((n) => n.id));
    state.notifs = v; softRender();
  }));
}
let soft = 0;
function softRender() { cancelAnimationFrame(soft); soft = requestAnimationFrame(() => { if (!$('.overlay') && !isTyping()) render(); else if (!$('.overlay')) { /* sedang mengetik */ } }); }
function isTyping() { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT') && $app.contains(a); }
window.addEventListener('hashchange', render);

/* ---------- render ---------- */
function render() {
  if (!state.ready) return;
  if (!state.user) return renderLogin();
  let r = route();
  const teacher = state.user.role === 'teacher';
  const allowed = teacher ? ['pengajuan', 'kelola', 'notifikasi'] : ['beranda', 'ruang', 'pinjaman', 'notifikasi'];
  if (!allowed.includes(r)) { r = defaultRoute(); history.replaceState(null, '', '#' + r); }
  const views = { beranda: viewCatalog, ruang: viewRooms, pinjaman: viewMine, notifikasi: viewNotifs, pengajuan: viewRequests, kelola: viewManage };
  const nav = teacher
    ? [['pengajuan', 'Pengajuan', pendingCount()], ['kelola', 'Kelola Barang & Ruang', 0], ['notifikasi', 'Notifikasi', unread()]]
    : [['beranda', 'Barang', 0], ['ruang', 'Ruang & Denah', 0], ['pinjaman', 'Pinjaman Saya', state.requests.filter((x) => x.status === 'disetujui').length], ['notifikasi', 'Notifikasi', unread()]];
  const scroll = window.scrollY;
  $app.innerHTML = `
    ${!firebaseReady ? `<div class="demo-bar"><div class="wrap"><span>Mode demo: data hanya tersimpan di browser ini. Isi firebase-config.js untuk memakai Firebase.</span><button id="resetDemo" type="button">Reset data demo</button></div></div>` : ''}
    <header class="top"><div class="wrap">
      <a class="brand" href="#${defaultRoute()}" aria-label="LendSpace beranda">
        <span class="pl"><img src="assets/logo-smak7.png" alt=""><img src="assets/logo-bpk.png" alt=""></span>
        <span><b>LendSpace</b><small>SMAK 7 BPK Penabur Jakarta</small></span>
      </a>
      <div class="who"><span class="nm">${esc(state.user.name)}</span><span class="pill">${teacher ? 'Guru' : 'Siswa'}</span><button class="btn ghost sm" id="logout" type="button">Keluar</button></div>
    </div></header>
    <nav class="nav" aria-label="Menu utama"><div class="wrap">${nav.map(([h, l, n]) => `<a href="#${h}" ${h === r ? 'aria-current="page"' : ''}>${l}${n ? `<span class="badge">${n}</span>` : ''}</a>`).join('')}</div></nav>
    <main class="wrap" id="view">${views[r]()}</main>`;
  bindCommon();
  bindView(r);
  window.scrollTo(0, scroll);
}

function bindCommon() {
  $('#logout')?.addEventListener('click', () => state.backend.signOut());
  $('#resetDemo')?.addEventListener('click', () => { state.backend.resetDemo(); toast('Data demo dikembalikan ke awal.'); });
}

/* ---------- login ---------- */
function renderLogin() {
  const demo = !firebaseReady;
  $app.innerHTML = `
  <div class="login">
    <section class="login-hero">
      <div class="logos"><div class="plate"><img src="assets/logo-smak7.png" alt="Logo OSIS SMAK 7 Penabur Jakarta"><img src="assets/logo-bpk.png" alt="Logo BPK Penabur"></div></div>
      <div>
        <h1>Lend<span>Space</span></h1>
        <p>Pinjam barang dan ruang Sarpras SMAK 7 BPK Penabur Jakarta tanpa antre kertas. Ajukan, tunggu persetujuan guru, lalu ambil.</p>
      </div>
      <ul>
        <li>Lihat langsung barang dan ruang yang masih kosong</li>
        <li>Notifikasi saat guru menyetujui pengajuanmu</li>
        <li>Guru memantau yang sedang dipinjam dan yang sudah kembali</li>
      </ul>
    </section>
    <section class="login-panel">
      <form class="login-card" id="loginForm" novalidate>
        <div><h2>Masuk</h2><p class="muted" style="margin-top:6px">Gunakan akun sekolah <b>@${DOMAIN}</b>.</p></div>
        <div class="roles" role="group" aria-label="Masuk sebagai">
          <button type="button" class="role" data-role="student" aria-pressed="${state.loginRole === 'student'}"><strong>Siswa</strong><span>Meminjam barang dan ruang</span></button>
          <button type="button" class="role" data-role="teacher" aria-pressed="${state.loginRole === 'teacher'}"><strong>Guru</strong><span>Menyetujui dan mengelola</span></button>
        </div>
        ${demo ? `
          <label class="f">Nama<input class="in" id="lgName" autocomplete="name" placeholder="Nama lengkap"></label>
          <label class="f">Email sekolah<input class="in" id="lgEmail" type="email" autocomplete="email" placeholder="nama@${DOMAIN}"></label>
          <div class="notice">Mode demo aktif. Tidak ada kata sandi; data hanya tersimpan di browser ini.</div>
          <button class="btn block" type="submit">Masuk sebagai ${state.loginRole === 'teacher' ? 'Guru' : 'Siswa'}</button>`
        : `
          <button class="btn gbtn block" type="submit">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
            Masuk dengan Google
          </button>`}
        <p class="err" id="lgErr" role="alert">${esc(state.authError)}</p>
      </form>
    </section>
  </div>`;
  $$('.role').forEach((b) => b.addEventListener('click', () => { state.loginRole = b.dataset.role; state.authError = ''; renderLogin(); }));
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#lgErr'); err.textContent = '';
    const btn = $('button[type=submit]', e.target); btn.disabled = true;
    try {
      await state.backend.signIn({ role: state.loginRole, email: $('#lgEmail')?.value, name: $('#lgName')?.value });
      state.authError = '';
      location.hash = state.loginRole === 'teacher' ? 'pengajuan' : 'beranda';
    } catch (ex) { err.textContent = ex.message || 'Gagal masuk.'; btn.disabled = false; }
  });
}

/* ---------- siswa: katalog barang ---------- */
function viewCatalog() {
  const q = state.q.toLowerCase();
  const list = items().filter((x) => x.active !== false && (state.cat === 'Semua' || x.category === state.cat) && (!q || (x.name + ' ' + x.description).toLowerCase().includes(q)));
  const cats = ['Semua', ...CATEGORIES.filter((c) => items().some((x) => x.category === c))];
  return `
  <div class="page-head"><div><h2>Pinjam Barang</h2><p>Pilih barang Sarpras, lalu ajukan tanggal pemakaian. Guru akan menyetujui atau menolak.</p></div></div>
  <div class="tools"><input class="in search" id="q" type="search" placeholder="Cari barang…" value="${esc(state.q)}" aria-label="Cari barang"><div class="chips">${cats.map((c) => `<button class="chip" data-cat="${esc(c)}" aria-pressed="${state.cat === c}">${esc(c)}</button>`).join('')}</div></div>
  ${list.length ? `<div class="grid">${list.map((x) => {
    const left = availableUnits(x);
    const cls = left === 0 ? 'none' : left <= Math.max(1, Math.floor(x.total * .25)) ? 'low' : 'ok';
    return `<article class="card"><div class="ic">${icon(x.icon)}</div><div><h3>${esc(x.name)}</h3><span class="tag">${esc(x.category)}</span></div>
      <p class="d">${esc(x.description)}</p>
      <div class="meta"><span class="stock ${cls}">${left === 0 ? 'Sedang habis' : `Tersedia ${left} dari ${x.total}`}</span>
      <button class="btn sm" data-borrow="${esc(x.id)}" ${left === 0 ? 'disabled' : ''}>Pinjam</button></div></article>`;
  }).join('')}</div>` : `<div class="empty"><b>Tidak ada barang yang cocok</b>Coba kata kunci atau kategori lain.</div>`}`;
}

/* ---------- siswa: ruang & denah ---------- */
function viewRooms() {
  const f = state.floor;
  const body = (f === 1 || f === 4)
    ? `<div class="soon"><h3>Lantai ${f}: segera hadir</h3><p class="muted">Denah dan ruang di lantai ini akan ditambahkan.</p></div>`
    : (() => {
      const all = rooms().filter((r) => r.floor === f && r.active !== false);
      const status = (id) => { const rm = state.catalog.find((x) => x.id === id); return rm && rm.active !== false ? roomStatusOn(rm, state.mapDay) : null; };
      const cells = (FLOOR_MAPS[f] || []).map((c) => {
        const st = c.r !== 'x' && c.r !== 'g' ? status(c.r) : null;
        const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
        const words = c.l.split(' ');
        let lines = [c.l];
        if (words.length > 1 && c.l.length > 7) {
          let best = 1, bestMax = 1e9;
          for (let i = 1; i < words.length; i++) { const m = Math.max(words.slice(0, i).join(' ').length, words.slice(i).join(' ').length); if (m < bestMax) { bestMax = m; best = i; } }
          lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
        }
        lines = lines.map(esc);
        const fs = Math.min(2.6, (c.w - 1) / (Math.max(...lines.map((t) => t.length)) * 0.58));
        const txt = lines.map((t, i) => `<text style="font-size:${fs.toFixed(2)}px" x="${cx}" y="${cy + (i - (lines.length - 1) / 2) * (fs + .4)}">${t}</text>`).join('');
        if (st) return `<g class="rm ${st}" tabindex="0" role="button" data-room="${c.r}" aria-label="${esc(c.l)}, ${st === 'free' ? 'kosong' : st === 'busy' ? 'sudah dipesan' : 'tidak tersedia'}"><rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="1"/>${txt}</g>`;
        return `<g class="${c.r === 'g' ? 'g' : 'x'}"><rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="1"/>${txt}</g>`;
      }).join('');
      return `<div class="map-layout"><div>
        <div class="mapbox"><svg viewBox="0 0 100 92" role="img" aria-label="Denah lantai ${f}">${cells}</svg>
          <div class="legend"><span><i style="background:#4C8F6F"></i>Kosong</span><span><i style="background:var(--maroon)"></i>Sudah dipesan</span><span><i style="background:var(--slate)"></i>Tidak tersedia</span><span><i style="background:var(--done-bg)"></i>Bukan untuk dipinjam</span></div></div>
        </div>
        <div class="roomlist">${all.map((rm) => {
          const st = roomStatusOn(rm, state.mapDay);
          return `<div class="roomrow"><div><b>${esc(rm.name)}</b><span class="small muted">${rm.capacity} orang · ${esc(rm.facilities.join(', '))}</span></div>
          ${st === 'free' ? `<button class="btn sm" data-borrow="${esc(rm.id)}">Pinjam</button>` : `<span class="st ${st === 'busy' ? 'no' : 'done'}">${st === 'busy' ? 'Dipesan' : 'Tidak tersedia'}</span>`}</div>`;
        }).join('')}</div></div>`;
    })();
  return `
  <div class="page-head"><div><h2>Ruang & Denah</h2><p>Lihat ruang yang masih kosong pada tanggal tertentu, lalu klik ruang di denah untuk meminjam.</p></div>
    <label class="f" style="min-width:170px">Tanggal<input class="in" type="date" id="mapDay" value="${state.mapDay}" min="${todayStr()}"></label></div>
  <div class="floors" role="tablist" aria-label="Pilih lantai">${[1, 2, 3, 4].map((n) => `<button class="chip" role="tab" data-floor="${n}" aria-selected="${f === n}">Lantai ${n}${n === 1 || n === 4 ? '<span class="c">segera</span>' : ''}</button>`).join('')}</div>
  ${body}`;
}

/* ---------- siswa: pinjaman saya ---------- */
function reqCard(r, teacher) {
  return `<article class="req"><header><div><h3>${esc(r.refName)}</h3><span class="small muted">${r.type === 'ruang' ? 'Ruang' : `${r.qty} unit`}${teacher ? '' : ''}</span></div>${statusPill(r)}</header>
  <dl class="kv">
    ${teacher ? `<div><dt>Peminjam</dt><dd>${esc(r.nama)}${r.kelas ? ` · ${esc(r.kelas)}` : ''}</dd></div>` : ''}
    <div><dt>Tanggal</dt><dd>${dateRange(r)}${esc(timeRange(r))}</dd></div>
    <div><dt>Keperluan</dt><dd>${esc(r.purpose)}</dd></div>
  </dl>
  ${r.teacherNote ? `<div class="note"><b>Catatan guru:</b> ${esc(r.teacherNote)}</div>` : ''}
  ${isOverdue(r) ? '<div class="note" style="border-color:var(--maroon)">Melewati tanggal pengembalian. Segera kembalikan ke Sarpras.</div>' : ''}
  ${teacher ? teacherActions(r) : ''}</article>`;
}
function viewMine() {
  const list = state.requests;
  return `<div class="page-head"><div><h2>Pinjaman Saya</h2><p>Pantau status pengajuanmu. Barang bisa diambil setelah berstatus Disetujui.</p></div></div>
  ${list.length ? `<div class="list">${list.map((r) => reqCard(r, false)).join('')}</div>` : `<div class="empty"><b>Belum ada pengajuan</b>Buka menu Barang atau Ruang & Denah untuk mulai meminjam.</div>`}`;
}

/* ---------- notifikasi ---------- */
function viewNotifs() {
  const list = state.notifs;
  const t = (ms) => new Date(ms).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return `<div class="page-head"><div><h2>Notifikasi</h2><p>${state.user.role === 'teacher' ? 'Pemberitahuan untuk akunmu.' : 'Kamu akan diberi tahu di sini saat guru menyetujui pengajuan.'}</p></div>
  ${unread() ? '<button class="btn ghost sm" id="markRead">Tandai semua dibaca</button>' : ''}</div>
  ${list.length ? `<div class="list">${list.map((n) => `<div class="notif ${n.read ? 'old' : 'new'}"><span class="dot"></span><div><p>${esc(n.text)}</p><p class="small muted">${t(n.createdAt)}</p></div></div>`).join('')}</div>` : `<div class="empty"><b>Belum ada notifikasi</b>Pemberitahuan muncul setelah guru memproses pengajuanmu.</div>`}`;
}

/* ---------- guru: pengajuan ---------- */
function teacherActions(r) {
  const b = (a, l, cls = '') => `<button class="btn sm ${cls}" data-act="${a}" data-id="${esc(r.id)}">${l}</button>`;
  if (r.status === 'menunggu') return `<div class="actions"><input class="in" style="flex:1 1 200px;min-height:34px" data-note="${esc(r.id)}" placeholder="Catatan untuk siswa (opsional)" aria-label="Catatan">${b('setujui', 'Setujui')}${b('tolak', 'Tolak', 'danger')}</div>`;
  if (r.status === 'disetujui') return `<div class="actions">${b('pinjam', 'Tandai sudah diambil')}${b('batal', 'Batalkan persetujuan', 'ghost')}</div>`;
  if (r.status === 'dipinjam') return `<div class="actions">${b('kembali', 'Tandai sudah dikembalikan')}</div>`;
  return '';
}
const TABS = [
  ['menunggu', 'Menunggu', (r) => r.status === 'menunggu'],
  ['dipinjam', 'Dipinjam', (r) => r.status === 'disetujui' || r.status === 'dipinjam'],
  ['dikembalikan', 'Dikembalikan', (r) => r.status === 'dikembalikan'],
  ['ditolak', 'Ditolak', (r) => r.status === 'ditolak'],
];
function viewRequests() {
  const cur = TABS.find((t) => t[0] === state.reqTab) || TABS[0];
  const list = state.requests.filter(cur[2]);
  if (cur[0] === 'dipinjam') list.sort((a, b) => (isOverdue(b) - isOverdue(a)) || a.to.localeCompare(b.to));
  const late = state.requests.filter(isOverdue).length;
  return `<div class="page-head"><div><h2>Pengajuan Peminjaman</h2><p>Setujui atau tolak pengajuan, lalu catat saat barang diambil dan dikembalikan.${late ? ` <b style="color:var(--danger)">${late} terlambat.</b>` : ''}</p></div></div>
  <div class="chips" style="margin-bottom:14px" role="tablist">${TABS.map(([k, l, fn]) => `<button class="chip" role="tab" data-rtab="${k}" aria-selected="${cur[0] === k}">${l}<span class="c">${state.requests.filter(fn).length}</span></button>`).join('')}</div>
  ${list.length ? `<div class="list">${list.map((r) => reqCard(r, true)).join('')}</div>` : `<div class="empty"><b>Tidak ada data di kategori ini</b>Pengajuan baru dari siswa akan muncul otomatis.</div>`}`;
}

/* ---------- guru: kelola ---------- */
function viewManage() {
  const isItem = state.manageTab === 'barang';
  const q = state.manageQ.toLowerCase();
  const src = (isItem ? items() : rooms()).filter((x) => !q || x.name.toLowerCase().includes(q));
  const rows = src.map((x) => {
    const sub = isItem ? `${esc(x.category)} · total ${x.total}, dipinjam ${x.reserved || 0}` : `Lantai ${x.floor} · ${x.capacity} orang${x.blocked ? ' · <b>ditandai tidak tersedia</b>' : ''}`;
    const confirm = state.confirmDel === x.id;
    return `<div class="manage-row"><div><b>${esc(x.name)}</b><div class="small muted">${sub}</div></div>
      <div class="tbl-actions">
        ${isItem ? `<button class="btn ghost sm" data-edit="${esc(x.id)}">Ubah</button>` : `<button class="btn ghost sm" data-block="${esc(x.id)}">${x.blocked ? 'Buka kembali' : 'Tutup sementara'}</button><button class="btn ghost sm" data-edit="${esc(x.id)}">Ubah</button>`}
        ${confirm ? `<button class="btn danger sm" data-del="${esc(x.id)}">Ya, hapus</button><button class="btn ghost sm" data-delno>Batal</button>` : `<button class="btn ghost sm" data-delask="${esc(x.id)}">Hapus</button>`}
      </div></div>`;
  }).join('');
  return `<div class="page-head"><div><h2>Kelola Barang & Ruang</h2><p>Daftar sudah terisi barang bawaan sekolah. Hapus yang tidak ada di sekolah ini, atau tambahkan yang baru.</p></div>
    <div class="actions"><button class="btn" id="addNew">${isItem ? 'Tambah barang' : 'Tambah ruang'}</button><button class="btn ghost" id="reseed" title="Menambahkan kembali barang dan ruang bawaan yang pernah dihapus">Pulihkan daftar bawaan</button></div></div>
  <div class="tools"><div class="chips" role="tablist"><button class="chip" role="tab" data-mtab="barang" aria-selected="${isItem}">Barang<span class="c">${items().length}</span></button><button class="chip" role="tab" data-mtab="ruang" aria-selected="${!isItem}">Ruang<span class="c">${rooms().length}</span></button></div>
    <input class="in search" id="mq" type="search" placeholder="Cari…" value="${esc(state.manageQ)}" aria-label="Cari"></div>
  ${rows ? `<div class="list" style="gap:8px">${rows}</div>` : `<div class="empty"><b>Daftar kosong</b>Tambahkan sendiri atau pilih Pulihkan daftar bawaan.</div>`}`;
}

/* ---------- event view ---------- */
function bindView(r) {
  const on = (sel, ev, fn) => $$(sel).forEach((el) => el.addEventListener(ev, () => fn(el)));
  const rerenderKeepFocus = (id, pos) => { render(); const el = document.getElementById(id); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch { /* tipe tanpa seleksi */ } } };
  if (r === 'beranda') {
    $('#q')?.addEventListener('input', (e) => { state.q = e.target.value; rerenderKeepFocus('q', e.target.selectionStart); });
    on('[data-cat]', 'click', (b) => { state.cat = b.dataset.cat; render(); });
  }
  if (r === 'ruang') {
    on('[data-floor]', 'click', (b) => { state.floor = Number(b.dataset.floor); render(); });
    $('#mapDay')?.addEventListener('change', (e) => { if (e.target.value) { state.mapDay = e.target.value < todayStr() ? todayStr() : e.target.value; render(); } });
    $$('.rm').forEach((g) => {
      const go = () => { const rm = state.catalog.find((x) => x.id === g.dataset.room); if (rm && roomStatusOn(rm, state.mapDay) === 'free') openBorrow(rm); else toast(`${rm?.name || 'Ruang'} tidak bisa dipinjam pada ${fmtDate(state.mapDay)}.`, 'bad'); };
      g.addEventListener('click', go);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }
  on('[data-borrow]', 'click', (b) => { const e = state.catalog.find((x) => x.id === b.dataset.borrow); if (e) openBorrow(e); });
  if (r === 'notifikasi') {
    $('#markRead')?.addEventListener('click', () => state.backend.readNotifs(state.notifs.filter((n) => !n.read).map((n) => n.id)));
    if (unread()) setTimeout(() => { if (route() === 'notifikasi') state.backend.readNotifs(state.notifs.filter((n) => !n.read).map((n) => n.id)); }, 4000);
  }
  if (r === 'pengajuan') {
    on('[data-rtab]', 'click', (b) => { state.reqTab = b.dataset.rtab; render(); });
    on('[data-act]', 'click', async (b) => {
      const req = state.requests.find((x) => x.id === b.dataset.id);
      const note = $(`[data-note="${CSS.escape(b.dataset.id)}"]`)?.value || '';
      b.disabled = true;
      try {
        await state.backend.decide(req, b.dataset.act, note, state.user.name);
        const msg = { setujui: 'Disetujui. Siswa mendapat notifikasi.', tolak: 'Pengajuan ditolak.', batal: 'Persetujuan dibatalkan.', pinjam: 'Dicatat sudah diambil.', kembali: 'Dicatat sudah dikembalikan.' }[b.dataset.act];
        toast(msg, 'good');
        if (b.dataset.act === 'setujui') state.reqTab = 'dipinjam';
        if (b.dataset.act === 'kembali') state.reqTab = 'dikembalikan';
        if (b.dataset.act === 'tolak') state.reqTab = 'ditolak';
        render();
      } catch (e) { toast(e.message, 'bad'); b.disabled = false; }
    });
  }
  if (r === 'kelola') {
    on('[data-mtab]', 'click', (b) => { state.manageTab = b.dataset.mtab; state.manageQ = ''; state.confirmDel = null; render(); });
    $('#mq')?.addEventListener('input', (e) => { state.manageQ = e.target.value; rerenderKeepFocus('mq', e.target.selectionStart); });
    on('[data-delask]', 'click', (b) => { state.confirmDel = b.dataset.delask; render(); });
    on('[data-delno]', 'click', () => { state.confirmDel = null; render(); });
    on('[data-del]', 'click', async (b) => {
      const id = b.dataset.del;
      const open = state.requests.some((x) => x.refId === id && ['menunggu', 'disetujui', 'dipinjam'].includes(x.status));
      state.confirmDel = null;
      if (open) { toast('Masih ada pengajuan aktif untuk ini. Selesaikan dulu atau gunakan Tutup sementara.', 'bad'); return render(); }
      try { await state.backend.removeCatalog(id); toast('Dihapus dari daftar.', 'good'); } catch (e) { toast(e.message, 'bad'); }
    });
    on('[data-block]', 'click', async (b) => { const e = state.catalog.find((x) => x.id === b.dataset.block); await state.backend.patchCatalog(e.id, { blocked: !e.blocked }); toast(e.blocked ? 'Ruang dibuka kembali.' : 'Ruang ditutup sementara.', 'good'); });
    on('[data-edit]', 'click', (b) => openEntryForm(state.catalog.find((x) => x.id === b.dataset.edit)));
    $('#addNew')?.addEventListener('click', () => openEntryForm(null));
    $('#reseed')?.addEventListener('click', async () => { const n = await state.backend.seedCatalog(true); toast(n ? `${n} barang/ruang bawaan ditambahkan kembali.` : 'Semua barang dan ruang bawaan sudah ada.', 'good'); });
  }
}

/* ---------- form pinjam ---------- */
function openBorrow(entry) {
  const room = entry.kind === 'room';
  const left = room ? 1 : availableUnits(entry);
  openModal(`
    <h3>Pinjam ${esc(entry.name)}</h3>
    <p class="muted small">${room ? `Lantai ${entry.floor} · ${entry.capacity} orang · ${esc(entry.facilities.join(', '))}` : `Tersedia ${left} dari ${entry.total} unit`}</p>
    <form class="stack" id="bf" novalidate>
      <div class="row"><label class="f">Nama<input class="in" id="bNama" value="${esc(state.user.name)}" required></label>
      <label class="f">Kelas<input class="in" id="bKelas" placeholder="mis. XI IPA 2"></label></div>
      <div class="row"><label class="f">Mulai<input class="in" type="date" id="bFrom" value="${room ? state.mapDay : todayStr()}" min="${todayStr()}" required></label>
      <label class="f">Sampai<input class="in" type="date" id="bTo" value="${room ? state.mapDay : todayStr()}" min="${todayStr()}" required></label></div>
      ${room ? `<div class="row"><label class="f">Jam mulai<input class="in" type="time" id="bJm" value="07:00" required></label><label class="f">Jam selesai<input class="in" type="time" id="bJs" value="09:00" required></label></div>`
        : `<label class="f">Jumlah<input class="in" type="number" id="bQty" min="1" max="${left}" value="1" required></label>`}
      <label class="f">Keperluan<textarea class="in" id="bPurpose" placeholder="Untuk apa dipakai?" required></textarea></label>
      <p class="err" id="bErr" role="alert"></p>
      <div class="foot"><button type="button" class="btn ghost" id="bCancel">Batal</button><button class="btn" type="submit">Kirim pengajuan</button></div>
    </form>`, (ov) => {
    $('#bCancel', ov).addEventListener('click', closeModal);
    $('#bFrom', ov).addEventListener('change', (e) => { if ($('#bTo', ov).value < e.target.value) $('#bTo', ov).value = e.target.value; $('#bTo', ov).min = e.target.value; });
    $('#bf', ov).addEventListener('submit', async (e) => {
      e.preventDefault();
      const v = (id) => ($('#' + id, ov)?.value || '').trim();
      const err = (m) => { $('#bErr', ov).textContent = m; };
      const data = { type: room ? 'ruang' : 'barang', refId: entry.id, refName: entry.name, qty: room ? 1 : Number(v('bQty')), uid: state.user.uid, email: state.user.email, nama: v('bNama'), kelas: v('bKelas'), from: v('bFrom'), to: v('bTo'), jamMulai: room ? v('bJm') : '', jamSelesai: room ? v('bJs') : '', purpose: v('bPurpose') };
      if (!data.nama) return err('Isi nama peminjam.');
      if (!data.from || !data.to) return err('Isi tanggal peminjaman.');
      if (data.from < todayStr()) return err('Tanggal mulai tidak boleh sebelum hari ini.');
      if (data.to < data.from) return err('Tanggal selesai tidak boleh sebelum tanggal mulai.');
      if (room && (!data.jamMulai || !data.jamSelesai || data.jamSelesai <= data.jamMulai)) return err('Jam selesai harus setelah jam mulai.');
      if (!room && (!Number.isInteger(data.qty) || data.qty < 1)) return err('Jumlah minimal 1.');
      if (!room && data.qty > left) return err(`Stok hanya tersisa ${left}.`);
      if (!data.purpose) return err('Tulis keperluan peminjaman.');
      const btn = $('button[type=submit]', ov); btn.disabled = true;
      try { await state.backend.createRequest(data); closeModal(); toast('Pengajuan terkirim. Tunggu persetujuan guru.', 'good'); location.hash = 'pinjaman'; }
      catch (ex) { err(ex.message || 'Gagal mengirim.'); btn.disabled = false; }
    });
  });
}

/* ---------- form tambah / ubah (guru) ---------- */
function openEntryForm(entry) {
  const isNew = !entry;
  const room = isNew ? state.manageTab === 'ruang' : entry.kind === 'room';
  const e = entry || {};
  openModal(`
    <h3>${isNew ? (room ? 'Tambah ruang' : 'Tambah barang') : 'Ubah ' + esc(e.name)}</h3>
    <form class="stack" id="ef" novalidate>
      <label class="f">Nama<input class="in" id="eName" value="${esc(e.name || '')}" required></label>
      ${room ? `<div class="row"><label class="f">Lantai<select class="in" id="eFloor">${[1, 2, 3, 4].map((n) => `<option value="${n}" ${(e.floor || state.floor) === n ? 'selected' : ''}>Lantai ${n}</option>`).join('')}</select></label>
        <label class="f">Kapasitas (orang)<input class="in" type="number" id="eCap" min="1" value="${e.capacity || 30}"></label></div>
        <label class="f">Fasilitas (pisahkan dengan koma)<input class="in" id="eFac" value="${esc((e.facilities || []).join(', '))}"></label>`
      : `<div class="row"><label class="f">Kategori<select class="in" id="eCat">${CATEGORIES.map((c) => `<option ${(e.category || 'Lainnya') === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="f">Jumlah total<input class="in" type="number" id="eTotal" min="${e.reserved || 0}" value="${e.total || 1}"></label></div>
        <label class="f">Kondisi<select class="in" id="eCond">${CONDITIONS.map((c) => `<option ${(e.condition || 'Baik') === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>`}
      <label class="f">Deskripsi<textarea class="in" id="eDesc">${esc(e.description || '')}</textarea></label>
      <p class="err" id="eErr" role="alert"></p>
      <div class="foot"><button type="button" class="btn ghost" id="eCancel">Batal</button><button class="btn" type="submit">Simpan</button></div>
    </form>`, (ov) => {
    $('#eCancel', ov).addEventListener('click', closeModal);
    $('#ef', ov).addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const v = (id) => ($('#' + id, ov)?.value || '').trim();
      const name = v('eName');
      if (!name) return ($('#eErr', ov).textContent = 'Isi nama.');
      let out;
      if (room) {
        const floor = Number(v('eFloor'));
        out = { ...(isNew ? { id: 'rm-' + slug(name) + '-' + uid().slice(0, 4), kind: 'room', bookings: [], blocked: false, active: true, photo: '', code: name, area: '', icon: 'board' } : e), name, floor, capacity: Math.max(1, Number(v('eCap')) || 1), facilities: v('eFac').split(',').map((s) => s.trim()).filter(Boolean), description: v('eDesc') };
      } else {
        const total = Number(v('eTotal'));
        if (!Number.isInteger(total) || total < (e.reserved || 0)) return ($('#eErr', ov).textContent = `Jumlah total tidak boleh kurang dari yang sedang dipinjam (${e.reserved || 0}).`);
        out = { ...(isNew ? { id: 'brg-' + slug(name) + '-' + uid().slice(0, 4), kind: 'item', reserved: 0, active: true, photo: '', icon: 'box' } : e), name, category: v('eCat'), total, condition: v('eCond'), description: v('eDesc') };
      }
      try { await state.backend.saveCatalogItem(out); closeModal(); toast('Tersimpan.', 'good'); } catch (x) { $('#eErr', ov).textContent = x.message; }
    });
  });
}

boot();
