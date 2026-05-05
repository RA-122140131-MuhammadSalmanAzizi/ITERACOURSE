# 🚀 Supabase Setup Guide - ITERA Course

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **"New Project"**
3. Fill in:
   - **Organization**: Pilih organisasi Anda (contoh: `ITERA COURSE`)
   - **Name**: `itera-course`
   - **Database Password**: (simpan di tempat aman!)
   - **Region**: `Southeast Asia (Singapore)` atau `Asia-Pacific` (pilih yang terdekat)
   - **Security**:
     - ✅ **Enable Data API** (Check)
     - ❌ **Automatically expose new tables** (Uncheck demi keamanan)
     - ✅ **Enable automatic RLS** (Check agar tabel baru otomatis aman)
4. Click **"Create new project"** dan tunggu ~2 menit

## Step 2: Get API Keys

1. Buka **Settings** → **Data API** (di menu kiri bawah INTEGRATIONS)
2. Copy **Project URL** → `VITE_SUPABASE_URL`
3. Buka **Settings** → **API Keys**
4. Klik tab **"Legacy anon, service_role API keys"**
5. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`
6. Buat file `.env.local` di root project:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxx...
```

## Step 3: Run Database Migration

1. Buka **SQL Editor** di Supabase Dashboard
2. Copy seluruh isi file `supabase/migrations/001_initial_schema.sql`
3. Paste di SQL Editor dan klik **"Run"**
4. Pastikan tidak ada error

## Step 4: Setup Google OAuth

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Create atau pilih project
3. Buka **APIs & Services** → **OAuth consent screen** (atau klik tombol **Configure consent screen**)
4. Pilih **External** lalu klik **Create**. Isi nama aplikasi dan email yang wajib diisi, lalu **Save and Continue** sampai selesai.
5. Setelah itu, buka menu **Credentials** di sebelah kiri (atau jika di tampilan baru, klik **Create OAuth client**).
6. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"** (lewati langkah ini jika pakai tampilan baru).
7. Pilih Application type: **Web application**
8. Authorized redirect URIs, tambahkan:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
   (ganti `xxxxx` dengan project ID Supabase Anda)
9. Copy **Client ID** dan **Client Secret**
10. Di Supabase Dashboard:
    - Buka **Authentication** → **Providers**
    - Enable **Google**
    - Paste Client ID dan Client Secret
    - Save

## Step 5: Configure Auth Settings

1. Di Supabase Dashboard → **Authentication** → **URL Configuration** (di panel kiri)
2. **Site URL**: `http://localhost:5173` (development) atau domain produksi
3. **Redirect URLs**, tambahkan:
   ```
   http://localhost:5173
   http://localhost:5173/iteracurs/
   https://yourdomain.com
   ```
4. **Email Auth**:
   - ✅ Enable Email Signup
   - ✅ Enable Email Confirmations (anti fake account!)
5. **Rate Limiting** (bawaan Supabase, sudah aktif)

## Step 6: Set Admin Account

Setelah Anda register akun pertama kali (via Google), ubah role ke admin:

1. Buka **Table Editor** di Supabase Dashboard
2. Buka tabel `profiles`
3. Cari akun Anda (berdasarkan email)
4. Ubah kolom `role` dari `customer` menjadi `admin`
5. Save

> ⚠️ Ini hanya perlu dilakukan SEKALI untuk akun admin pertama.
> Setelahnya, admin bisa mengubah role user lain dari dashboard admin.

## Step 7: Menambah Dosen

Ada 2 cara:
1. **Dosen register sendiri** → default role `customer` → admin ubah ke `dosen` di dashboard
2. **Admin invite** → nanti bisa ditambahkan fitur invite di admin panel

## Step 8: Run Development Server

```bash
npm run dev
```

Buka `http://localhost:5173` dan coba login dengan Google! 🎉
