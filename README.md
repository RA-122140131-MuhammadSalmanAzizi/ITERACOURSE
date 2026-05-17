# 📚 ITERA Course Platform

Platform e-learning premium yang dirancang khusus untuk civitas akademik ITERA. Dibangun menggunakan React, Vite, dan Supabase.

## 🚀 Panduan Setup Lokal (Untuk Kolaborator)

Jika Anda baru saja melakukan clone repositori ini, ikuti langkah berikut:

1. **Instalasi Package**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment**
   Buat file `.env.local` di root folder dan masukkan API Key Supabase (minta ke Admin jika belum punya):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`

## 🌍 Alur Deployment
Saat ini deployment dilakukan secara manual melalui Vercel CLI atau otomatis jika sudah dihubungkan ke GitHub.
- **Production**: `vercel --prod`

## 🛠️ Stack Teknologi
- **Frontend**: React.js & Vite
- **Styling**: Vanilla CSS (Premium Custom Design)
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth via Supabase
- **Icons**: Lucide React
