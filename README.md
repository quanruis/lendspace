# LendSpace – SMAK 7 BPK Penabur Jakarta

Website peminjaman barang dan ruang Sarpras. Siswa mengajukan, guru menyetujui, siswa mendapat notifikasi.

## Menjalankan sekarang (mode demo)

Situs ini memakai ES module, jadi harus dibuka lewat server lokal, bukan klik dua kali pada index.html:


cd lendspace
python3 -m http.server 8080
# buka http://localhost:8080


Selama firebase-config.js belum diisi, aplikasi berjalan dalam mode demo login memakai email
@bpkpenabur.sch.id apa saja (tanpa kata sandi), dan data tersimpan di browser. Cocok untuk mencoba alur siswa
dan guru. Buka dua jendela (satu siswa, satu guru, browser berbeda atau mode penyamaran tidak berbagi data;
pada browser yang sama keduanya berbagi data dan ikut sinkron).

## Memasang Firebase

1. Buat proyek di [console.firebase.google.com](https://console.firebase.google.com).
2. Authentication → Sign-in method: aktifkan Google.
3. Authentication → Settings → Authorized domains: tambahkan domain situs Anda.
4. Firestore Database: buat database, lalu tempel isi firestore.rules di tab Rules dan publikasikan.
5. Project settings → Your apps → Web: salin konfigurasi ke firebase-config.js.
6. Daftarkan guru: di Firestore buat koleksi config, dokumen teachers, field emails bertipe array
   berisi email guru (huruf kecil), misalnya ["nama.guru@bpkpenabur.sch.id"].
7. Login pertama sebagai guru, buka Kelola Barang & Ruang, lalu tekan Pulihkan daftar bawaan untuk mengisi
   katalog awal. Hapus barang yang tidak dimiliki sekolah.

Pembatasan domain dijaga di tiga tempat: parameter hd pada Google Sign-In, pemeriksaan di app setelah login, dan
firestore.rules (yang tidak bisa dilewati dari browser).

## Hosting

Semua berkas statis. Bisa dipasang di Firebase Hosting (firebase deploy), GitHub Pages, atau Netlify.

## Isi

| Berkas | Fungsi |
| --- | --- |
| index.html, styles.css | Halaman dan tampilan (biru, krem, putih; aksen cokelat dan marun) |
| app.js | Login, halaman siswa dan guru |
| data.js | Daftar barang dan ruang bawaan, denah Lantai 2 dan 3, aturan stok, backend demo dan Firebase |
| firebase-config.js | Konfigurasi Firebase dan domain sekolah |
| firestore.rules | Aturan keamanan |
| assets | Logo SMAK 7 Penabur dan BPK Penabur |

## Catatan

- Denah Lantai 1 dan 4 ditandai "segera hadir"; tambahkan di FLOOR_MAPS pada data.js bila sudah ada.
- Kapasitas ruang pada DEFAULT_ROOMS adalah perkiraan; guru dapat mengubahnya lewat Kelola.
- Notifikasi tampil di dalam aplikasi (lonceng pada menu dan toast). Notifikasi push saat situs tertutup memerlukan
  Firebase Cloud Messaging dan belum disertakan.
