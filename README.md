# 🍿 TempePlay - Setup Guide

## Struktur Project
```
tempeplay/
├── index.html              # Halaman utama
├── css/
│   ├── main.css            # Style utama
│   ├── watch.css           # Style halaman nonton
│   └── watchparty.css      # Style watch party
├── js/
│   ├── firebase-config.js  # ⚠️ WAJIB DIISI config Firebase
│   ├── auth.js             # Login Google/Email
│   ├── anilist.js          # AniList API wrapper
│   ├── home.js             # Homepage logic
│   ├── watch.js            # Watch page logic
│   └── watchparty.js       # Watch party realtime
├── pages/
│   ├── watch.html          # Halaman nonton
│   ├── watchparty.html     # Watch party
│   ├── browse.html         # Browse anime
│   └── profile.html        # Profil user
├── react/
│   ├── AnimeCard.jsx       # Komponen card anime
│   ├── VideoPlayer.jsx     # Komponen video player HLS
│   └── WatchParty.jsx      # Komponen watch party lengkap
└── backend/
    ├── main.py             # FastAPI entry point
    ├── routes/
    │   ├── anime.py        # Episode & streaming proxy
    │   └── rooms.py        # Room management API
    ├── requirements.txt
    └── render.yaml         # Deploy config Render
```

---

## ⚡ Setup Cepat (2 Langkah)

### 1. Firebase Setup
1. Buka https://console.firebase.google.com
2. Buat project baru → nama: `tempeplay`
3. Authentication → Enable Google + Email/Password
4. Firestore → Create database (production mode)
5. Project Settings → Web App → Copy config
6. **Buka `js/firebase-config.js` → ganti semua `GANTI_*` dengan config lo**

**Firestore Rules** (paste di Firebase Console → Firestore → Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
      match /chat/{msgId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

---

### 2. Backend (Streaming) Setup

#### Option A: Lokal (dev)
```bash
cd backend
pip install -r requirements.txt
python main.py
# Backend jalan di http://localhost:8000
```

#### Option B: Deploy ke Render (production/gratis)
1. Push folder `backend/` ke GitHub repo baru
2. Buka https://render.com → New Web Service
3. Connect repo → Render auto-detect `render.yaml`
4. Deploy! URL format: `https://tempeplay-backend.onrender.com`
5. **Buka `js/watch.js` & `js/watchparty.js` → ganti `BACKEND` dengan URL Render**

#### Setup Consumet (WAJIB untuk streaming)
1. Fork https://github.com/consumet/api.consumet.org
2. Deploy ke Render (sama caranya, gratis)
3. Setelah dapat URL → buka `backend/routes/anime.py`
4. Ganti `CONSUMET_BASE = "https://your-consumet.onrender.com"` dengan URL lo

---

## 🎮 Fitur
- ✅ Browse anime (AniList API - data resmi)
- ✅ Search anime real-time
- ✅ Login Google + Email/Password
- ✅ Edit profil (nama, foto)
- ✅ Watch Party - buat room + kode 6 digit
- ✅ Chat real-time di watch party
- ✅ Sync video real-time (host kontrol)
- ✅ HLS streaming player
- ✅ Multi-server fallback
- ✅ Dark teal theme (ngikutin logo)
- ✅ Responsive mobile

## 📁 File yang Perlu Diisi
| File | Yang Perlu Diubah |
|------|-------------------|
| `js/firebase-config.js` | Semua config Firebase |
| `js/watch.js` | `BACKEND` URL |
| `js/watchparty.js` | `BACKEND` URL |
| `backend/routes/anime.py` | `CONSUMET_BASE` URL |

## 🚀 Cara Jalankan Lokal
```bash
# Cukup buka index.html di browser
# atau pakai live server VS Code
# Backend terpisah:
cd backend && python main.py
```

## React Components
File `.jsx` di folder `react/` bisa dipakai kalau mau migrasi ke React app (Vite/CRA).
Import dan pakai seperti biasa setelah setup React project.
