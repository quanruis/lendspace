// =====================================================================
//  LendSpace – konfigurasi Firebase
//  Isi nilai di bawah dengan konfigurasi aplikasi web Firebase Anda
//  (Firebase Console → Project settings → Your apps → Web app → SDK setup).
//  Selama nilai masih "ISI_...", LendSpace berjalan dalam MODE DEMO:
//  data tersimpan di browser saja dan tidak memakai Firebase.
// =====================================================================

export const firebaseConfig = {
  apiKey: "ISI_API_KEY",
  authDomain: "ISI_PROJECT_ID.firebaseapp.com",
  projectId: "ISI_PROJECT_ID",
  storageBucket: "ISI_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "ISI_SENDER_ID",
  appId: "ISI_APP_ID",
};

// Hanya akun dengan domain email ini yang boleh masuk.
export const SCHOOL_DOMAIN = "bpkpenabur.sch.id";
