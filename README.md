# 📖 MyQuranPlan

**MyQuranPlan** adalah platform manajemen halaqoh dan pemantauan progres hafalan Al-Qur'an modern yang dirancang untuk menjembatani komunikasi antara pengajar (Ustadz/ah) dan orang tua santri secara *real-time*.

## 🌟 Fitur Unggulan

### 👨‍🏫 Panel Pengajar (Admin)
*   **Manajemen Halaqoh & Santri**: Kelola daftar santri berdasarkan kelompok halaqoh dan jenjang kelas dengan mudah.
*   **Input Progres Cepat**: Fitur *Input Massal* dan *Copy Data Pekan Lalu* untuk efisiensi administrasi harian.
*   **Lesson Plan & Jurnal**: Pantau Target (Lesson Plan) dan Capaian (Jurnal Harian) yang meliputi Tahsin, Tahfidz, dan Murojaah.
*   **Sistem Persetujuan Akun**: Keamanan ekstra dengan verifikasi pendaftaran guru oleh Super Admin.

### 👨‍👩‍👧‍👦 Portal Wali Murid (Publik)
*   **Pencarian Mandiri**: Orang tua dapat mencari data Ananda menggunakan filter Nama, Kelas, atau Pengajar tanpa perlu login.
*   **Kartu Laporan Digital**: Tampilan progres mingguan yang bersih dan informatif.
*   **Akses Arsip**: Memungkinkan orang tua melihat riwayat rekaman dari pekan-pekan sebelumnya.
*   **QR Code Link**: Setiap laporan dilengkapi QR Code unik untuk memudahkan akses versi digital dari hasil cetak.

### 🛠 Fitur Teknis
*   **Dark Mode**: Dukungan penuh mode gelap untuk kenyamanan mata.
*   **Export Laporan**: Unduh laporan progres dalam format Gambar (PNG) atau PDF/Cetak.
*   **Real-time Database**: Sinkronisasi data instan menggunakan Firebase Firestore.
*   **Mobile Friendly**: Antarmuka responsif yang nyaman digunakan di smartphone maupun komputer.

## 🚀 Teknologi yang Digunakan

*   **Frontend**: React.js + Vite
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Backend/Database**: Firebase Firestore
*   **Deployment**: Kompatibel dengan Vercel, Netlify, atau Firebase Hosting.

## 📦 Cara Instalasi

1.  **Clone Repository**
    ```bash
    git clone https://github.com/username/myquranplan.git
    cd myquranplan
    ```

2.  **Instal Dependensi**
    ```bash
    npm install
    ```

3.  **Konfigurasi Firebase**
    Buka file `src/config/firebase.js` dan sesuaikan `firebaseConfig` dengan kredensial proyek Firebase Anda.

4.  **Jalankan Aplikasi**
    ```bash
    npm run dev
    ```

## 📂 Struktur Folder

*   `src/components/` - Komponen UI utama dan Logic halaman.
*   `src/components/modals/` - Modal untuk input data dan pengaturan.
*   `src/components/views/` - Tampilan spesifik untuk Beranda, Siswa, dan Laporan.
*   `src/utils/` - Fungsi pembantu (*helpers*) dan logika bisnis.
*   `src/data/` - Konstanta data (Daftar Surah, Kategori Tahsin, dll).

## 🔐 Keamanan & Privasi

Aplikasi ini menggunakan ID unik Firestore yang dienkripsi dalam URL parameter untuk fitur *share* publik, memastikan data santri tetap aman namun mudah diakses oleh pihak yang berwenang (orang tua).

---

**MyQuranPlan** dikembangkan untuk mendukung visi mencetak generasi Qur'ani yang terukur dan terencana.

&copy; 2026 **Juman Jayyidin**. All Rights Reserved.
