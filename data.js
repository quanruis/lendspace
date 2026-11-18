// LendSpace – data bawaan, aturan peminjaman, dan dua backend (Demo & Firebase).
import { firebaseConfig, SCHOOL_DOMAIN } from './firebase-config.js';

export const DOMAIN = SCHOOL_DOMAIN;
export const firebaseReady = !!(
  firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('ISI_')
);

/* ------------------------------------------------------------------ */
/* Konstanta & utilitas                                                */
/* ------------------------------------------------------------------ */
export const STATUS = {
  menunggu: { label: 'Menunggu Persetujuan', tone: 'wait' },
  disetujui: { label: 'Disetujui', tone: 'ok' },
  ditolak: { label: 'Ditolak', tone: 'no' },
  dipinjam: { label: 'Sedang Dipinjam', tone: 'out' },
  dikembalikan: { label: 'Sudah Dikembalikan', tone: 'done' },
};
export const STATUS_ORDER = ['menunggu', 'disetujui', 'dipinjam', 'dikembalikan', 'ditolak'];
export const CATEGORIES = ['Elektronik', 'Olahraga', 'Alat Kebersihan', 'Perlengkapan Kelas', 'Lainnya'];
export const CONDITIONS = ['Baik', 'Cukup', 'Perlu perbaikan'];

const pad = (n) => String(n).padStart(2, '0');
export const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => dateStr(new Date());
export const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d); };
export const fmtDate = (s) => {
  if (!s) return '–';
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};
export const isSchoolEmail = (e) => typeof e === 'string' && e.toLowerCase().endsWith('@' + DOMAIN);
export const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : 'id' + Math.random().toString(36).slice(2) + Date.now());
export const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ------------------------------------------------------------------ */
/* Daftar barang bawaan sekolah (guru tinggal menghapus yang tidak ada) */
/* ------------------------------------------------------------------ */
const I = (key, name, category, total, icon, description) => ({
  id: 'brg-' + key, kind: 'item', name, category, total, reserved: 0, icon, description,
  condition: 'Baik', active: true, photo: '',
});

export const DEFAULT_ITEMS = [
  // Elektronik & multimedia
  I('proyektor', 'Proyektor LCD', 'Elektronik', 6, 'projector', 'Proyektor untuk presentasi, kegiatan kelas, dan acara sekolah.'),
  I('layar', 'Layar Proyektor (Tripod)', 'Elektronik', 3, 'screen', 'Layar proyeksi berkaki tripod yang mudah dipindahkan.'),
  I('speaker', 'Speaker Portabel', 'Elektronik', 4, 'speaker', 'Speaker aktif untuk kegiatan di kelas atau lapangan.'),
  I('mik-kabel', 'Mikrofon Kabel', 'Elektronik', 6, 'mic', 'Mikrofon berkabel untuk presentasi dan MC.'),
  I('mik-wireless', 'Mikrofon Wireless', 'Elektronik', 4, 'mic', 'Mikrofon nirkabel untuk acara dan kegiatan ibadah.'),
  I('mixer', 'Mixer Audio', 'Elektronik', 2, 'speaker', 'Mixer audio kecil untuk mengatur beberapa mikrofon dan musik.'),
  I('headset', 'Headset', 'Elektronik', 8, 'headset', 'Headset untuk praktik bahasa, komputer, dan rekaman.'),
  I('laptop', 'Laptop Sekolah', 'Elektronik', 10, 'laptop', 'Laptop untuk kegiatan belajar dan presentasi.'),
  I('kamera', 'Kamera Dokumentasi', 'Elektronik', 2, 'camera', 'Kamera untuk dokumentasi kegiatan sekolah.'),
  I('tripod-kamera', 'Tripod Kamera', 'Elektronik', 3, 'camera', 'Tripod penyangga kamera atau ponsel.'),
  I('pointer', 'Remote Presentasi (Pointer)', 'Elektronik', 6, 'monitor', 'Remote slide dengan penunjuk laser.'),
  I('lampu', 'Lampu Sorot', 'Elektronik', 3, 'light', 'Lampu sorot untuk panggung atau dokumentasi.'),
  I('hdmi', 'Kabel HDMI', 'Elektronik', 12, 'cable', 'Kabel HDMI untuk menyambungkan laptop ke proyektor atau TV.'),
  I('vga', 'Kabel VGA', 'Elektronik', 8, 'cable', 'Kabel VGA untuk proyektor model lama.'),
  I('usbc-hdmi', 'Adaptor USB-C ke HDMI', 'Elektronik', 5, 'cable', 'Adaptor untuk laptop yang hanya punya port USB-C.'),
  I('kabel-audio', 'Kabel Audio 3,5 mm', 'Elektronik', 8, 'cable', 'Kabel audio jack untuk speaker dan mixer.'),
  I('kabel-roll', 'Kabel Roll (Terminal Listrik)', 'Elektronik', 15, 'plug', 'Kabel roll dengan beberapa lubang colokan.'),
  I('kabel-ekstensi', 'Kabel Ekstensi 10 m', 'Elektronik', 6, 'plug', 'Kabel ekstensi panjang untuk kegiatan di luar ruangan.'),
  // Olahraga
  I('bola-basket', 'Bola Basket', 'Olahraga', 10, 'ball', 'Bola basket ukuran standar.'),
  I('bola-voli', 'Bola Voli', 'Olahraga', 10, 'ball', 'Bola voli ukuran standar.'),
  I('bola-sepak', 'Bola Sepak', 'Olahraga', 8, 'ball', 'Bola sepak ukuran 5.'),
  I('bola-futsal', 'Bola Futsal', 'Olahraga', 6, 'ball', 'Bola futsal untuk lapangan dalam ruangan.'),
  I('net-voli', 'Net Voli', 'Olahraga', 2, 'net', 'Net voli lengkap dengan tali pengikat.'),
  I('raket', 'Raket Badminton', 'Olahraga', 16, 'racket', 'Raket badminton untuk kegiatan olahraga.'),
  I('shuttlecock', 'Shuttlecock (Tabung)', 'Olahraga', 8, 'racket', 'Satu tabung berisi shuttlecock.'),
  I('tenis-meja', 'Set Bat & Bola Tenis Meja', 'Olahraga', 6, 'racket', 'Satu set bat dan bola tenis meja.'),
  I('skipping', 'Tali Skipping', 'Olahraga', 20, 'net', 'Tali lompat untuk senam dan pemanasan.'),
  I('cone', 'Cone Marker (Set 10)', 'Olahraga', 4, 'box', 'Satu set 10 cone penanda lintasan.'),
  I('peluit', 'Peluit', 'Olahraga', 6, 'whistle', 'Peluit untuk wasit dan pengatur kegiatan.'),
  I('matras', 'Matras Senam', 'Olahraga', 12, 'mat', 'Matras untuk senam lantai dan peregangan.'),
  I('rompi', 'Rompi Tim (Set 10)', 'Olahraga', 4, 'box', 'Satu set 10 rompi pembeda tim.'),
  I('pompa', 'Pompa Bola', 'Olahraga', 3, 'box', 'Pompa manual untuk bola.'),
  // Alat kebersihan
  I('sapu', 'Sapu', 'Alat Kebersihan', 10, 'broom', 'Sapu untuk membersihkan ruangan setelah kegiatan.'),
  I('pel', 'Alat Pel', 'Alat Kebersihan', 8, 'broom', 'Pel lantai lengkap dengan gagang.'),
  I('ember', 'Ember', 'Alat Kebersihan', 10, 'bucket', 'Ember untuk air pel atau mencuci.'),
  I('pengki', 'Pengki', 'Alat Kebersihan', 8, 'broom', 'Pengki pasangan sapu.'),
  I('kain-lap', 'Kain Lap', 'Alat Kebersihan', 20, 'box', 'Kain lap untuk meja dan papan tulis.'),
  I('kemoceng', 'Kemoceng', 'Alat Kebersihan', 8, 'broom', 'Kemoceng untuk membersihkan debu.'),
  I('tong-sampah', 'Tempat Sampah', 'Alat Kebersihan', 6, 'bin', 'Tempat sampah tambahan untuk acara.'),
  I('pembersih-lantai', 'Cairan Pembersih Lantai', 'Alat Kebersihan', 6, 'bucket', 'Cairan pembersih lantai kemasan botol.'),
  I('sikat-lantai', 'Sikat Lantai', 'Alat Kebersihan', 6, 'broom', 'Sikat bergagang untuk lantai dan kamar mandi.'),
  // Perlengkapan kelas
  I('kursi', 'Kursi Siswa', 'Perlengkapan Kelas', 60, 'chair', 'Kursi tambahan untuk kelas atau acara.'),
  I('kursi-lipat', 'Kursi Lipat', 'Perlengkapan Kelas', 30, 'chair', 'Kursi lipat yang mudah disimpan.'),
  I('meja', 'Meja Siswa', 'Perlengkapan Kelas', 40, 'desk', 'Meja siswa tambahan.'),
  I('meja-lipat', 'Meja Lipat', 'Perlengkapan Kelas', 10, 'desk', 'Meja lipat untuk registrasi atau bazar.'),
  I('whiteboard', 'Papan Tulis Portabel', 'Perlengkapan Kelas', 3, 'board', 'Papan tulis putih beroda.'),
  I('spidol', 'Spidol Papan Tulis (Kotak)', 'Perlengkapan Kelas', 15, 'marker', 'Satu kotak spidol papan tulis aneka warna.'),
  I('penghapus', 'Penghapus Papan Tulis', 'Perlengkapan Kelas', 10, 'marker', 'Penghapus papan tulis putih.'),
  I('podium', 'Podium', 'Perlengkapan Kelas', 2, 'podium', 'Podium untuk pembicara.'),
  I('easel', 'Easel / Flip Chart', 'Perlengkapan Kelas', 3, 'board', 'Penyangga kertas flip chart untuk diskusi kelompok.'),
  // Lainnya
  I('tenda', 'Tenda Lipat 3×3 m', 'Lainnya', 4, 'tent', 'Tenda lipat untuk kegiatan di luar ruangan.'),
  I('tangga', 'Tangga Lipat', 'Lainnya', 3, 'ladder', 'Tangga lipat untuk memasang dekorasi.'),
  I('p3k', 'Kotak P3K', 'Lainnya', 3, 'firstaid', 'Kotak pertolongan pertama untuk kegiatan.'),
  I('troli', 'Troli Barang', 'Lainnya', 2, 'box', 'Troli untuk memindahkan perlengkapan.'),
  I('banner-stand', 'Banner Stand', 'Lainnya', 2, 'board', 'Penyangga banner portabel.'),
  I('atk', 'Lakban & Gunting (Set)', 'Lainnya', 5, 'box', 'Set perlengkapan alat tulis kantor untuk kegiatan.'),
];

/* ------------------------------------------------------------------ */
/* Ruang di sekolah – mengikuti denah Lantai 2 & 3                      */
/* (kapasitas = perkiraan awal; guru dapat mengubahnya di Kelola)       */
/* ------------------------------------------------------------------ */
const R = (code, name, floor, capacity, area, facilities, description, icon = 'board') => ({
  id: 'rm-' + slug(code), kind: 'room', code, name, floor, capacity, area, facilities, description, icon,
  bookings: [], blocked: false, active: true, photo: '',
});
const CLASSROOM = ['Papan tulis', 'Meja & kursi siswa'];

export const DEFAULT_ROOMS = [
  // Lantai 2
  R('2A', 'Kelas 2A', 2, 36, 'Koridor depan, dekat tangga ke lantai 3', CLASSROOM, 'Ruang kelas reguler.'),
  R('2B', 'Kelas 2B', 2, 36, 'Koridor depan', CLASSROOM, 'Ruang kelas reguler.'),
  R('2C', 'Kelas 2C', 2, 36, 'Koridor depan', CLASSROOM, 'Ruang kelas reguler.'),
  R('2D', 'Kelas 2D', 2, 36, 'Koridor depan, dekat tangga', CLASSROOM, 'Ruang kelas reguler.'),
  R('2E', 'Kelas 2E', 2, 36, 'Sisi taman lantai 1', CLASSROOM, 'Ruang kelas reguler.'),
  R('2F', 'Kelas 2F', 2, 36, 'Sisi taman, di atas Ruang Rapat', CLASSROOM, 'Ruang kelas reguler.'),
  R('Ruang Rapat', 'Ruang Rapat Lantai 2', 2, 20, 'Di bawah Kelas 2F, dekat taman', ['Meja rapat', 'Kursi', 'Papan tulis'], 'Ruang untuk rapat dan diskusi kelompok kecil.', 'desk'),
  R('Lab B. Inggris', 'Laboratorium Bahasa Inggris', 2, 36, 'Sayap kiri, dekat tangga', ['Perangkat audio', 'Headset', 'Papan tulis'], 'Laboratorium untuk praktik bahasa Inggris.', 'headset'),
  R('Lab Komputer 1', 'Laboratorium Komputer', 2, 36, 'Sayap kanan, dekat pintu kantin', ['Komputer', 'Proyektor'], 'Laboratorium komputer untuk praktik TIK.', 'laptop'),
  R('Lab Komputer 2', 'Laboratorium Komputer 2', 2, 36, 'Sayap kanan, di atas Lab Komputer', ['Komputer', 'Proyektor'], 'Laboratorium komputer kedua.', 'laptop'),
  R('2SS', 'Selasar Lantai 2', 2, 60, 'Selasar terbuka di sisi Ruang Piala', ['Area terbuka'], 'Area selasar untuk kegiatan ringan, pameran kecil, atau latihan.', 'tent'),
  // Lantai 3
  R('3A', 'Kelas 3A', 3, 36, 'Koridor depan, dari tangga lantai 2', CLASSROOM, 'Ruang kelas reguler.'),
  R('3B', 'Kelas 3B', 3, 36, 'Koridor depan', CLASSROOM, 'Ruang kelas reguler.'),
  R('3C', 'Kelas 3C', 3, 36, 'Koridor depan', CLASSROOM, 'Ruang kelas reguler.'),
  R('3D', 'Kelas 3D', 3, 36, 'Koridor depan, dekat tangga', CLASSROOM, 'Ruang kelas reguler.'),
  R('3E', 'Kelas 3E', 3, 36, 'Sisi taman lantai 1', CLASSROOM, 'Ruang kelas reguler.'),
  R('3F', 'Kelas 3F', 3, 36, 'Sisi taman, di atas Ruang Kesiswaan', CLASSROOM, 'Ruang kelas reguler.'),
  R('3G', 'Kelas 3G', 3, 36, 'Sayap kanan, dekat Galeri Seni Rupa', CLASSROOM, 'Ruang kelas reguler.'),
  R('3H', 'Kelas 3H', 3, 36, 'Sayap kanan, dekat jalan ke Aula', CLASSROOM, 'Ruang kelas reguler.'),
  R('Perpustakaan', 'Ruang Perpustakaan', 3, 50, 'Sayap kiri bawah, dekat tangga', ['Rak buku', 'Meja baca'], 'Perpustakaan sekolah untuk kegiatan membaca dan belajar bersama.', 'box'),
  R('Galeri Seni Rupa', 'Galeri Seni Rupa', 3, 30, 'Sayap kanan, di bawah Kelas 3G', ['Area pamer'], 'Ruang pamer karya seni rupa.', 'board'),
  R('Ruang Musik', 'Ruang Musik', 3, 25, 'Sayap kanan, di bawah Galeri Seni Rupa', ['Alat musik'], 'Ruang untuk latihan musik.', 'speaker'),
  R('Ruang Tari', 'Ruang Tari', 3, 30, 'Sayap kanan, paling ujung', ['Lantai lapang'], 'Ruang untuk latihan tari.', 'mat'),
  R('Ruang OSIS', 'Ruang OSIS', 3, 15, 'Sisi taman, di bawah Ruang Kesiswaan', ['Meja rapat'], 'Ruang kegiatan OSIS.', 'desk'),
  R('3SS', 'Selasar Lantai 3', 3, 60, 'Selasar terbuka di sisi Ruang Piala', ['Area terbuka'], 'Area selasar untuk kegiatan ringan atau pameran kecil.', 'tent'),
];

export const DEFAULT_CATALOG = [...DEFAULT_ITEMS, ...DEFAULT_ROOMS];

/* Denah kasar (viewBox 100 × 92). t: 'x' ruang non-pinjam, 'g' taman, selain itu id ruang */
const c = (l, x, y, w, h, r) => ({ l, x, y, w, h, r });
export const FLOOR_MAPS = {
  2: [
    c('Tangga', 1, 2, 8, 8, 'x'), c('2A', 9, 2, 9, 8, 'rm-2a'), c('2B', 18, 2, 9, 8, 'rm-2b'),
    c('2C', 27, 2, 9, 8, 'rm-2c'), c('2D', 36, 2, 9, 8, 'rm-2d'), c('Tangga', 45, 2, 8, 8, 'x'),
    c('2SS Selasar', 57, 2, 30, 10, 'rm-2ss'), c('Piala', 90, 2, 7, 24, 'x'),
    c('Toilet', 1, 17, 15, 7, 'x'),
    c('2E', 35, 22, 14, 10, 'rm-2e'), c('2F', 35, 32, 14, 10, 'rm-2f'), c('Ruang Rapat', 35, 42, 14, 8, 'rm-ruang-rapat'),
    c('Taman & Kolam', 55, 24, 18, 26, 'g'),
    c('Ruang Rapor', 82, 26, 15, 7, 'x'), c('Tangga', 82, 33, 15, 3, 'x'), c('Ruang Guru', 82, 36, 15, 16, 'x'),
    c('Ruang Kurikulum', 82, 52, 15, 8, 'x'), c('Lab Komputer 2', 82, 60, 15, 12, 'rm-lab-komputer-2'),
    c('Lab Komputer', 82, 72, 15, 12, 'rm-lab-komputer-1'),
    c('Toilet', 22, 53, 13, 7, 'x'), c('Lab B. Inggris', 35, 60, 20, 12, 'rm-lab-b-inggris'),
    c('Ruang BK', 35, 72, 20, 8, 'x'), c('Gudang', 35, 80, 20, 5, 'x'), c('Tangga', 35, 85, 20, 4, 'x'),
  ],
  3: [
    c('Tangga', 1, 2, 7, 8, 'x'), c('3A', 8, 2, 9, 8, 'rm-3a'), c('3B', 17, 2, 9, 8, 'rm-3b'),
    c('3C', 26, 2, 9, 8, 'rm-3c'), c('3D', 35, 2, 9, 8, 'rm-3d'), c('Tangga', 44, 2, 7, 8, 'x'),
    c('3SS Selasar', 56, 2, 30, 10, 'rm-3ss'), c('Piala', 90, 2, 7, 24, 'x'),
    c('Toilet', 1, 17, 14, 7, 'x'),
    c('3E', 33, 22, 14, 10, 'rm-3e'), c('3F', 33, 32, 14, 10, 'rm-3f'),
    c('Ruang Kesiswaan', 33, 42, 14, 6, 'x'), c('Ruang OSIS', 33, 48, 14, 5, 'rm-ruang-osis'),
    c('Taman & Kolam', 55, 24, 18, 26, 'g'),
    c('Ruang Sarpras', 82, 26, 15, 8, 'x'), c('Tangga ke Aula', 82, 34, 15, 4, 'x'),
    c('3H', 82, 38, 15, 12, 'rm-3h'), c('3G', 82, 50, 15, 12, 'rm-3g'),
    c('Toilet', 21, 56, 12, 7, 'x'), c('Perpustakaan', 33, 60, 20, 24, 'rm-perpustakaan'), c('Tangga', 33, 84, 20, 4, 'x'),
    c('Galeri Seni Rupa', 82, 66, 15, 10, 'rm-galeri-seni-rupa'), c('Ruang Musik', 82, 76, 15, 8, 'rm-ruang-musik'),
    c('Ruang Tari', 82, 84, 15, 8, 'rm-ruang-tari'),
  ],
};

/* ------------------------------------------------------------------ */
/* Aturan stok, jadwal ruang, dan keputusan guru (logika murni)         */
/* ------------------------------------------------------------------ */
export const availableUnits = (it) => Math.max(0, (it.total || 0) - (it.reserved || 0));
export const rangesOverlap = (a, b) => a.from <= b.to && b.from <= a.to;
export const slotsOverlap = (a, b) => {
  if (!a.jamMulai || !a.jamSelesai || !b.jamMulai || !b.jamSelesai) return true;
  return a.jamMulai < b.jamSelesai && b.jamMulai < a.jamSelesai;
};
export const bookingConflict = (room, req) =>
  (room.bookings || []).find((b) => b.reqId !== req.id && rangesOverlap(b, req) && slotsOverlap(b, req));
export const roomStatusOn = (room, day) => {
  if (room.blocked) return 'blocked';
  return (room.bookings || []).some((b) => b.from <= day && day <= b.to) ? 'busy' : 'free';
};
export const isOverdue = (r) => r.status === 'dipinjam' && r.to < todayStr();

function release(entry, req) {
  if (!entry) return null;
  if (entry.kind === 'room') return { bookings: (entry.bookings || []).filter((b) => b.reqId !== req.id) };
  return { reserved: Math.max(0, (entry.reserved || 0) - (req.qty || 0)) };
}

/** Hitung perubahan akibat keputusan guru. Melempar Error bila tidak boleh. */
export function applyDecision(entry, req, action, note, who) {
  const now = Date.now();
  const n = (note || '').trim();
  const withNote = (t) => (n ? `${t} Catatan guru: ${n}` : t);
  const base = { decidedAt: now, decidedBy: who || '' };
  switch (action) {
    case 'setujui': {
      if (req.status !== 'menunggu') throw new Error('Pengajuan ini sudah diproses.');
      if (!entry) throw new Error('Barang atau ruang ini sudah dihapus dari daftar.');
      let entryPatch;
      if (entry.kind === 'room') {
        if (entry.blocked) throw new Error('Ruang ini sedang ditandai tidak tersedia.');
        const clash = bookingConflict(entry, req);
        if (clash) throw new Error(`Ruang sudah dipesan pada ${fmtDate(clash.from)}${clash.to !== clash.from ? ' – ' + fmtDate(clash.to) : ''}.`);
        entryPatch = { bookings: [...(entry.bookings || []), { reqId: req.id, from: req.from, to: req.to, jamMulai: req.jamMulai || '', jamSelesai: req.jamSelesai || '' }] };
      } else {
        const left = availableUnits(entry);
        if (req.qty > left) throw new Error(`Stok tidak cukup, tersisa ${left} unit.`);
        entryPatch = { reserved: (entry.reserved || 0) + req.qty };
      }
      return { entryPatch, reqPatch: { ...base, status: 'disetujui', teacherNote: n }, notif: withNote(`Pengajuan "${req.refName}" disetujui. Silakan ambil di Sarpras sesuai tanggal peminjaman.`) };
    }
    case 'tolak':
      if (req.status !== 'menunggu') throw new Error('Pengajuan ini sudah diproses.');
      return { entryPatch: null, reqPatch: { ...base, status: 'ditolak', teacherNote: n }, notif: withNote(`Pengajuan "${req.refName}" ditolak.`) };
    case 'batal':
      if (req.status !== 'disetujui') throw new Error('Hanya pengajuan yang disetujui yang bisa dibatalkan.');
      return { entryPatch: release(entry, req), reqPatch: { ...base, status: 'ditolak', teacherNote: n || 'Dibatalkan oleh guru.' }, notif: withNote(`Persetujuan "${req.refName}" dibatalkan.`) };
    case 'pinjam':
      if (req.status !== 'disetujui') throw new Error('Pengajuan belum disetujui.');
      return { entryPatch: null, reqPatch: { status: 'dipinjam', handedAt: now }, notif: `"${req.refName}" sudah diserahkan. Harap kembalikan paling lambat ${fmtDate(req.to)}.` };
    case 'kembali':
      if (req.status !== 'dipinjam') throw new Error('Barang ini belum ditandai sedang dipinjam.');
      return { entryPatch: release(entry, req), reqPatch: { status: 'dikembalikan', returnedAt: now }, notif: `Pengembalian "${req.refName}" sudah dicatat. Terima kasih!` };
    default:
      throw new Error('Aksi tidak dikenal.');
  }
}

/* ------------------------------------------------------------------ */
/* Backend DEMO (localStorage)                                          */
/* ------------------------------------------------------------------ */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* penyimpanan penuh atau diblokir */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* abaikan */ } },
};

function demoBackend() {
  const listeners = new Set();
  const authListeners = new Set();
  const emit = () => listeners.forEach((f) => f());
  if (typeof window !== 'undefined') window.addEventListener('storage', () => { emit(); authListeners.forEach((f) => f()); });

  const getCatalog = () => LS.get('ls_catalog', []);
  const setCatalog = (v) => { LS.set('ls_catalog', v); emit(); };
  const getReqs = () => LS.get('ls_requests', []);
  const setReqs = (v) => { LS.set('ls_requests', v); emit(); };
  const getNotifs = () => LS.get('ls_notifs', []);
  const setNotifs = (v) => { LS.set('ls_notifs', v); emit(); };

  function seed() {
    if (LS.get('ls_catalog', null)) return;
    const catalog = structuredClone(DEFAULT_CATALOG);
    const reqs = [];
    const mk = (nama, kelas, refId, qty, from, to, purpose, jam = ['', '']) => {
      const ref = catalog.find((x) => x.id === refId);
      return { id: uid(), type: ref.kind === 'room' ? 'ruang' : 'barang', refId, refName: ref.name, qty, uid: 'contoh', email: '', nama, kelas, from, to, jamMulai: jam[0], jamSelesai: jam[1], purpose, status: 'menunggu', createdAt: Date.now() - Math.random() * 3e6, contoh: true };
    };
    const push = (r, steps) => {
      reqs.push(r);
      for (const [action, note] of steps) {
        const entry = catalog.find((x) => x.id === r.refId);
        const out = applyDecision(entry, r, action, note, 'Guru');
        if (out.entryPatch) Object.assign(entry, out.entryPatch);
        Object.assign(r, out.reqPatch);
      }
    };
    push(mk('Aulia (contoh)', 'XI IPA 1', 'brg-proyektor', 1, addDays(0), addDays(0), 'Presentasi proyek kelompok'), [['setujui', ''], ['pinjam']]);
    push(mk('Bagas (contoh)', 'X-3', 'brg-mik-wireless', 1, addDays(-3), addDays(-1), 'Acara ibadah kelas'), [['setujui', ''], ['pinjam']]);
    push(mk('Citra (contoh)', 'XII IPS 2', 'brg-bola-basket', 3, addDays(-2), addDays(-2), 'Latihan basket'), [['setujui', ''], ['pinjam'], ['kembali']]);
    push(mk('Dimas (contoh)', 'XI IPS 1', 'rm-3c', 1, addDays(1), addDays(1), 'Rapat panitia bazar', ['13:00', '15:00']), [['setujui', 'Harap rapikan kursi setelah selesai.']]);
    push(mk('Elsa (contoh)', 'X-1', 'brg-speaker', 2, addDays(1), addDays(2), 'Lomba kelas'), []);
    push(mk('Felix (contoh)', 'XII IPA 3', 'brg-hdmi', 2, addDays(2), addDays(2), 'Presentasi tugas akhir'), []);
    push(mk('Grace (contoh)', 'XI IPA 2', 'brg-tenda', 2, addDays(3), addDays(3), 'Kegiatan di lapangan'), [['tolak', 'Tenda sedang dipakai untuk acara sekolah.']]);
    LS.set('ls_catalog', catalog); LS.set('ls_requests', reqs); LS.set('ls_notifs', []);
  }
  seed();

  const sub = (read, cb) => {
    const f = () => cb(read());
    listeners.add(f);
    queueMicrotask(f);
    return () => listeners.delete(f);
  };

  return {
    mode: 'demo',
    onAuth(cb) {
      const f = () => cb(LS.get('ls_user', null));
      authListeners.add(f);
      queueMicrotask(f);
      return () => authListeners.delete(f);
    },
    async signIn({ role, email, name }) {
      email = (email || '').trim().toLowerCase();
      if (!isSchoolEmail(email)) throw new Error(`Hanya akun @${DOMAIN} yang bisa masuk.`);
      const nm = (name || '').trim() || email.split('@')[0];
      LS.set('ls_user', { uid: 'demo-' + email, email, name: nm, photo: '', role });
      authListeners.forEach((f) => f());
    },
    async signOut() { LS.del('ls_user'); authListeners.forEach((f) => f()); },
    subCatalog: (cb) => sub(getCatalog, cb),
    subRequests: (user, cb) => sub(() => getReqs().filter((r) => user.role === 'teacher' || r.uid === user.uid), cb),
    subNotifs: (user, cb) => sub(() => getNotifs().filter((n) => n.uid === user.uid), cb),
    async saveCatalogItem(entry) {
      const list = getCatalog();
      const i = list.findIndex((x) => x.id === entry.id);
      if (i >= 0) list[i] = entry; else list.push(entry);
      setCatalog(list);
    },
    async patchCatalog(id, patch) { setCatalog(getCatalog().map((x) => (x.id === id ? { ...x, ...patch } : x))); },
    async removeCatalog(id) { setCatalog(getCatalog().filter((x) => x.id !== id)); },
    async seedCatalog(missingOnly = true) {
      const list = getCatalog();
      const have = new Set(list.map((x) => x.id));
      const add = DEFAULT_CATALOG.filter((x) => !missingOnly || !have.has(x.id)).map((x) => structuredClone(x));
      setCatalog([...list, ...add]);
      return add.length;
    },
    async createRequest(data) {
      const r = { ...data, id: uid(), status: 'menunggu', createdAt: Date.now() };
      setReqs([...getReqs(), r]);
      return r.id;
    },
    async decide(req, action, note, who) {
      const reqs = getReqs();
      const r = reqs.find((x) => x.id === req.id);
      if (!r) throw new Error('Pengajuan tidak ditemukan.');
      const catalog = getCatalog();
      const entry = catalog.find((x) => x.id === r.refId) || null;
      const out = applyDecision(entry, r, action, note, who);
      if (out.entryPatch && entry) Object.assign(entry, out.entryPatch);
      Object.assign(r, out.reqPatch);
      LS.set('ls_catalog', catalog);
      LS.set('ls_requests', reqs);
      if (out.notif && r.uid !== 'contoh') LS.set('ls_notifs', [...getNotifs(), { id: uid(), uid: r.uid, requestId: r.id, text: out.notif, read: false, createdAt: Date.now() }]);
      emit();
    },
    async readNotifs(ids) { setNotifs(getNotifs().map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))); },
    resetDemo() { ['ls_catalog', 'ls_requests', 'ls_notifs'].forEach(LS.del); seed(); emit(); },
  };
}

/* ------------------------------------------------------------------ */
/* Backend FIREBASE (Auth Google + Firestore)                           */
/* ------------------------------------------------------------------ */
async function firebaseBackend() {
  const base = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const [appM, authM, fs] = await Promise.all([
    import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js'),
  ]);
  const app = appM.initializeApp(firebaseConfig);
  const auth = authM.getAuth(app);
  const db = fs.getFirestore(app);
  const { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, runTransaction, writeBatch } = fs;
  const withId = (d) => ({ ...d.data(), id: d.id });

  async function isTeacher(email) {
    try {
      const s = await getDoc(doc(db, 'config', 'teachers'));
      return s.exists() && (s.data().emails || []).map((e) => String(e).toLowerCase()).includes(String(email).toLowerCase());
    } catch { return false; }
  }

  async function resolveUser(u) {
    if (!u) return null;
    if (!isSchoolEmail(u.email) || !u.emailVerified) {
      await authM.signOut(auth);
      throw new Error(`Hanya akun @${DOMAIN} yang bisa masuk.`);
    }
    let role = localStorage.getItem('ls_role') === 'teacher' ? 'teacher' : 'student';
    if (role === 'teacher' && !(await isTeacher(u.email))) role = 'student';
    return { uid: u.uid, email: u.email.toLowerCase(), name: u.displayName || u.email.split('@')[0], photo: u.photoURL || '', role };
  }

  return {
    mode: 'firebase',
    onAuth(cb) {
      return authM.onAuthStateChanged(auth, async (u) => {
        try { cb(await resolveUser(u), null); } catch (e) { cb(null, e); }
      });
    },
    async signIn({ role }) {
      localStorage.setItem('ls_role', role);
      const provider = new authM.GoogleAuthProvider();
      provider.setCustomParameters({ hd: DOMAIN, prompt: 'select_account' });
      const { user } = await authM.signInWithPopup(auth, provider);
      if (!isSchoolEmail(user.email)) {
        await authM.signOut(auth);
        throw new Error(`Hanya akun @${DOMAIN} yang bisa masuk.`);
      }
      if (role === 'teacher' && !(await isTeacher(user.email))) {
        localStorage.setItem('ls_role', 'student');
        await authM.signOut(auth);
        throw new Error('Akun ini belum terdaftar sebagai guru. Minta admin Sarpras menambahkan email Anda, atau masuk sebagai siswa.');
      }
    },
    async signOut() { await authM.signOut(auth); },
    subCatalog: (cb) => onSnapshot(collection(db, 'catalog'), (s) => cb(s.docs.map(withId)), (e) => console.error('catalog', e)),
    subRequests: (user, cb) => onSnapshot(
      user.role === 'teacher' ? collection(db, 'requests') : query(collection(db, 'requests'), where('uid', '==', user.uid)),
      (s) => cb(s.docs.map(withId)), (e) => console.error('requests', e)),
    subNotifs: (user, cb) => onSnapshot(query(collection(db, 'notifications'), where('uid', '==', user.uid)),
      (s) => cb(s.docs.map(withId)), (e) => console.error('notifications', e)),
    async saveCatalogItem(entry) { const { id, ...rest } = entry; await setDoc(doc(db, 'catalog', id), rest); },
    async patchCatalog(id, patch) { await updateDoc(doc(db, 'catalog', id), patch); },
    async removeCatalog(id) { await deleteDoc(doc(db, 'catalog', id)); },
    async seedCatalog(missingOnly = true) {
      const existing = new Set((await getDocs(collection(db, 'catalog'))).docs.map((d) => d.id));
      const add = DEFAULT_CATALOG.filter((x) => !missingOnly || !existing.has(x.id));
      for (let i = 0; i < add.length; i += 400) {
        const batch = writeBatch(db);
        add.slice(i, i + 400).forEach(({ id, ...rest }) => batch.set(doc(db, 'catalog', id), rest));
        await batch.commit();
      }
      return add.length;
    },
    async createRequest(data) {
      const ref = await addDoc(collection(db, 'requests'), { ...data, status: 'menunggu', createdAt: Date.now() });
      return ref.id;
    },
    async decide(req, action, note, who) {
      await runTransaction(db, async (tx) => {
        const rRef = doc(db, 'requests', req.id);
        const rs = await tx.get(rRef);
        if (!rs.exists()) throw new Error('Pengajuan tidak ditemukan.');
        const r = withId(rs);
        const cRef = doc(db, 'catalog', r.refId);
        const cs = await tx.get(cRef);
        const entry = cs.exists() ? withId(cs) : null;
        const out = applyDecision(entry, r, action, note, who);
        if (out.entryPatch && entry) tx.update(cRef, out.entryPatch);
        tx.update(rRef, out.reqPatch);
        if (out.notif) tx.set(doc(collection(db, 'notifications')), { uid: r.uid, requestId: r.id, text: out.notif, read: false, createdAt: Date.now() });
      });
    },
    async readNotifs(ids) {
      const batch = writeBatch(db);
      ids.forEach((id) => batch.update(doc(db, 'notifications', id), { read: true }));
      await batch.commit();
    },
    resetDemo() {},
  };
}

export async function createBackend() {
  if (!firebaseReady) return demoBackend();
  return firebaseBackend();
}
