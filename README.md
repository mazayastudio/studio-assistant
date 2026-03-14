# Studio Assistant

Studio Assistant adalah aplikasi obrolan (chat) berbasis Artificial Intelligence (AI) yang dibangun menggunakan **Next.js 14** dan antarmuka (UI) gaya *Dark Mode* modern yang terinspirasi dari ChatGPT. Aplikasi ini mengintegrasikan **OpenAI API** untuk memberikan asisten percakapan yang cerdas, cepat, dan interaktif.

## ✨ Fitur Utama

- **Antarmuka (UI) ala ChatGPT**: Desain minimalis nan elegan menggunakan Tailwind CSS (palet Zinc), lengkap dengan *sidebar* sempit, pemisah antar obrolan yang mulus, dan adaptasi untuk *mobile*.
- **Streaming Responses**: Menggunakan **Web Streams API** untuk mencetak setiap respons AI secara *real-time* (efek mengetik), tanpa perlu menunggu seluruh teks selesai di-generate oleh server.
- **Model Settings (Parameter yang Dapat Diatur)**: 
  - Tersedia menu **Settings** (ikon roda gigi) untuk menyesuaikan parameter AI kapan saja.
  - **Temperature**: Mengatur tingkat kreativitas dan keacakan respons (0.0 - 2.0).
  - **Max Tokens**: Mengatur batasan panjang token respons yang dihasilkan (100 - 4096).
- **Multiple Conversation Threads**: Kemampuan untuk membuat banyak percakapan baru atau kembali ke percakapan lama kapan saja melalui *sidebar*.
- **Local State Persistence**: Riwayat obrolan (chat history), percakapan aktif, beserta pengaturan parameter AI disimpan sementara secara lokal *(sessionStorage)* sehingga tidak hilang saat pengguna melakukan *refresh* halaman di sesi yang sama.
- **Markdown Rendering**: Kemampuan AI untuk menguraikan format teks *Markdown*, memastikan elemen seperti blok kode (*code blocks*), cetak tebal (*bold*), tabel, dan daftar (*lists*) diraster dengan rapi.
- **Export to Markdown**: Fitur untuk mengekspor percakapan aktif ke dalam *file* berformat `.md`, sangat berguna untuk menyimpan dokumentasi, kode, atau informasi penting lain secara luring (*offline*).
- **Custom Slash Commands 🚀**: Router khusus untuk perintah (*prompts*) rahasia:
  - `/write-dialogue [karakter] [skenario]`: AI akan otomatis mengambil peran sebagai penulis narasi *game* (menyediakan dialog berkualitas).
  - `/asset-description [tipe] [style]`: AI akan berfokus pada detail deskripsi visual untuk diberikan ke tim Art/Desain.

---

## 🛠️ Stack Teknologi

- **Framework**: [Next.js 14](https://nextjs.org/) (App Directory / React Server Components)
- **Komponen & State**: React (`useState`, `useEffect`, `useCallback`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Integration**: [OpenAI Node SDK](https://github.com/openai/openai-node)
- **Markdown**: `react-markdown` dan `remark-gfm`

---

## 🚀 Prasyarat & Cara Instalasi

Pastikan Anda telah menginstal **Node.js** (versi 18+) dan paket manajer seperti `npm`, `yarn`, `pnpm`, atau `bun`.

### 1. Kloning Repositori
```bash
git clone <url-repo-anda>
cd 3-STUDIO-ASSISTANT
```

### 2. Instal Dependensi
```bash
npm install
# atau
yarn install
# atau
pnpm install
```

### 3. Konfigurasi Environment Variables
Buat *file* bernama `.env.local` di *root* direktori (sejajar dengan `package.json`). Tambahkan kunci API OpenAI Anda:
```env
OPENAI_API_KEY="sk-kunci-rahasia-openai-anda"
```

### 4. Jalankan Aplikasi (Mode Development)
```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```
Buka peramban (browser) dan buka alamat **[http://localhost:3000](http://localhost:3000)**. (Port bisa saja menjadi `:3001` jika port `3000` sedang digunakan, lihat pada terminal).

---

## 📂 Struktur Proyek

- `src/app/page.tsx`: Halaman utama (*client component*) yang menyertakan tata letak UI, *sidebar*, area input obrolan, *settings modal*, serta manajemen status peramban (*browser state*).
- `src/app/api/chat/route.ts`: Rute API sisi server yang melayani semua permintaan ke model bahasa. Menghasilkan stream mentah (`ReadableStream`) berbasis teks untuk frontend.
- `src/lib/llm.ts`: Penghubung logika ke *SDK* OpenAI, di mana *streaming* diinisialisasi dan pesan direstrukturisasi.
- `src/lib/commands.ts`: Modul yang mem-parsing respons untuk mengenali `/write-dialogue` atau `/asset-description` dan menyuntikkan *System Prompts* kustom.
- `src/components/`: Komponen antarmuka yang dapat digunakan kembali, seperti `ChatMessage`, `ChatInput`, dan `ChatSidebar`.

---

## 🎨 Menyesuaikan Tema (Theme)

Tema yang digunakan dalam proyek ini berpusat pada palet `zinc` bawaan Tailwind CSS untuk melahirkan tampilan gelap netral seperti ChatGPT. Apabila Anda ingin menyesuaikan nuansa gelap, Anda dapat mengganti semua referensi warna `zinc` dengan `slate` atau `gray`.

*Dirancang dengan antarmuka dan pengalaman pengguna (UI/UX) sebagai prioritas, Studio Assistant siap membantu memfasilitasi setiap kreativitas Anda!*
