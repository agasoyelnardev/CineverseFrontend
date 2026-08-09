# CineverseFrontend - API Integration Guide

## 📋 Übersicht

Dieses React + TypeScript Front-end ist vollständig integriert mit dem **WebApiBackend** (ASP.NET Core).

**Stack:**
- React 19.0.1
- TypeScript 5.8.2
- Vite 6.2.3
- TanStack React Query 5.101.4
- Tailwind CSS 4.1.14
- Bun (Package Manager)

---

## 🔧 Installation & Setup

### 1. Abhängigkeiten installieren
```bash
bun install
```

### 2. Environment-Variablen konfigurieren

Erstellen Sie eine `.env` Datei im Root-Verzeichnis (`.env.example` als Vorlage):

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:5000/api

# Google Gemini AI (optional)
GEMINI_API_KEY=your_gemini_key_here

# App URL (für Redirects und externe Links)
APP_URL=http://localhost:3000
```

### 3. Development Server starten
```bash
bun run dev
```

Server läuft unter: `http://localhost:3000`

---

## 🌐 API Client Setup

### Dateistruktur

```
src/
├── api.ts              # 🎯 Alle API-Funktionen (80+ Endpoints)
├── types.ts            # TypeScript Interfaces
├── App.tsx             # Main Component
├── components/         # React Components
├── hooks/              # Custom Hooks
└── data.ts             # Mock Data
```

### API Client Feature

Die `src/api.ts` bietet vollständige API-Integration:

```typescript
// JWT Token Verwaltung
export function getAuthToken(): string | null { ... }
export function setAuthToken(token: string) { ... }
export function removeAuthToken() { ... }

// Generic Request Handler mit Error Handling
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> { ... }

// Automatische Token Injection in Authorization Header
// Automatische Error Handling
// FormData Unterstützung für File Uploads
```

---

## 🔐 Authentifizierung

### Login Flow

```typescript
import { apiLogin, setAuthToken } from './api';

// 1. Login
const response = await apiLogin('user@example.com', 'password123');

// 2. Token wird automatisch gespeichert
// localStorage.cineverse_token
// localStorage.cineverse_refresh_token

// 3. Token wird automatisch in allen API-Requests injiziert
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Token Refresh

```typescript
import { apiRefreshToken } from './api';

// Automatisches Refresh bei abgelaufenem Token
try {
  await apiRefreshToken();
  // Neuer Token gespeichert - Retry Logic implementieren
} catch (err) {
  // Redirect to Login
  window.location.href = '/login';
}
```

### Logout

```typescript
import { apiLogout, removeAuthToken } from './api';

await apiLogout();
// Tokens werden automatisch gelöscht
```

---

## 📡 API Endpoints

### Auth Endpoints
```typescript
apiLogin(email, password)
apiRegister({ email, passwordHash, username, fullName })
apiExternalLogin({ provider, idToken, fullName })
apiRefreshToken()
apiGetMe()
apiLogout()
apiChangePassword({ currentPassword, newPassword })
```

### Movie Endpoints
```typescript
apiGetMovies(params?)
apiGetMovieById(id)
apiCreateMovie(payload)
apiUpdateMovie(id, payload)
apiDeleteMovie(id)
apiSearchTmdb(query)
apiImportTmdb(tmdbId)
```

### Book Endpoints
```typescript
apiGetBooks(params?)
apiGetBookById(id)
apiCreateBook(payload)
apiUpdateBook(id, payload)
apiDeleteBook(id)
apiUploadPdf(file)
apiSearchGoogleBooks(query)
apiImportGoogleBook(googleBooksId)
```

### User & Social Endpoints
```typescript
apiGetUserProfile(id)
apiUpdateProfile({ fullName, avatar, bio })
apiFollowUser(userId)
apiUnfollowUser(userId)
apiGetFollowers(userId)
apiGetFollowing(userId)
apiSendFriendRequest(userId)
```

### Admin Endpoints
```typescript
apiGetAdminStats()
apiGetAdminUsers(search?, role?, page, pageSize)
apiSetUserRole(userId, role)
apiToggleAdminUserBan(userId, banReason?)
apiDeleteAdminUser(userId)
```

**Alle Endpoints sind in `src/api.ts` dokumentiert**

---

## 🎣 Custom Hooks

### Empfohlene Hook-Struktur für React Query

Erstellen Sie `src/hooks/useMovies.ts`:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiGetMovies, apiCreateMovie, apiUpdateMovie, apiDeleteMovie } from '../api';

export function useMovies(params?: Parameters<typeof apiGetMovies>[0]) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: () => apiGetMovies(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateMovie() {
  return useMutation({
    mutationFn: (payload) => apiCreateMovie(payload),
  });
}

export function useUpdateMovie() {
  return useMutation({
    mutationFn: ({ id, payload }) => apiUpdateMovie(id, payload),
  });
}

export function useDeleteMovie() {
  return useMutation({
    mutationFn: (id) => apiDeleteMovie(id),
  });
}
```

### Verwendung in Components

```typescript
import { useMovies, useCreateMovie } from '../hooks/useMovies';

export function MovieList() {
  const { data: movies, isLoading, error } = useMovies({ pageNumber: 1, pageSize: 20 });
  const createMovie = useCreateMovie();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {movies?.map(movie => (
        <div key={movie.id}>{movie.title}</div>
      ))}
      <button onClick={() => createMovie.mutate({ title: 'New Movie', ... })}>
        Add Movie
      </button>
    </div>
  );
}
```

---

## 📁 File Upload (Bücher & PDFs)

```typescript
import { apiUploadPdf, apiCreateBook } from './api';

async function handleBookUpload(file: File, bookData: any) {
  try {
    // 1. PDF hochladen
    const { pdfUrl } = await apiUploadPdf(file);
    
    // 2. Buch mit PDF URL erstellen
    const result = await apiCreateBook({
      ...bookData,
      pdfUrl: pdfUrl
    });
    
    console.log('Book created:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

---

## 🛠️ Development Commands

```bash
# Development Server starten
bun run dev

# Production Build
bun run build

# Vorschau des Production Builds
bun run preview

# Type Checking
bun run lint

# Cleanup
bun run clean
```

---

## 📦 Project Structure

```
CineverseFrontend/
├── src/
│   ├── api.ts                 # 🎯 API Client (80+ endpoints)
│   ├── types.ts               # TypeScript Interfaces
│   ├── App.tsx                # Main App Component
│   ├── main.tsx               # Entry Point
│   ├── index.css              # Tailwind Styles
│   ├── components/            # Reusable Components
│   ├── hooks/                 # Custom React Hooks
│   ├── data.ts                # Mock/Local Data
│   └── pages/                 # Page Components (optional)
├── index.html                 # HTML Template
├── vite.config.ts             # Vite Configuration
├── tsconfig.json              # TypeScript Config
├── tailwind.config.js         # Tailwind Config (if needed)
├── .env.example               # Environment Template
├── .env                       # Environment Variables (local)
└── package.json               # Dependencies
```

---

## 🔗 Backend Connection Checklist

- [ ] Backend läuft auf `http://localhost:5000`
- [ ] CORS ist im Backend konfiguriert
- [ ] `.env` mit `VITE_API_BASE_URL` erstellt
- [ ] `bun install` ausgeführt
- [ ] `bun run dev` startet ohne Fehler
- [ ] Network Tab zeigt API Requests zu `http://localhost:5000/api/...`
- [ ] Login funktioniert und Token wird gespeichert
- [ ] Refresh Token wird bei Bedarf verwendet

---

## 🐛 Debugging

### Network Requests überprüfen

```typescript
// In Browser DevTools - Console
localStorage.getItem('cineverse_token')  // Token überprüfen
localStorage.getItem('cineverse_refresh_token')

// Network Tab
// Filter: XHR - Alle API Requests sehen
// Headers: Authorization: Bearer...
```

### Fehlerbehandlung

```typescript
try {
  const result = await apiGetMovies();
} catch (error: any) {
  console.error('API Error:', error.message);
  // Error Format: "API Xətası (status)" oder "Network Error"
}
```

### API Response Format

```typescript
// Success Response (200-299)
// - JSON: { ...data }
// - Text: string response
// - 204 No Content: {} (empty object)

// Error Response (400+)
// - { message: "...", title: "...", ... }
// - or plain text error message
```

---

## 🔒 Sicherheit Best Practices

✅ **Token Storage** - localStorage ist einfach, aber für sensible Apps HTTPOnly Cookies verwenden
✅ **HTTPS Production** - Immer HTTPS in Production verwenden
✅ **CORS** - Nur vertrauenswürdige Origins allowen
✅ **No Secrets in Code** - API Keys nur in `.env`, nie in Code
✅ **Token Expiration** - Kurz gültige Access Tokens + Refresh Token Rotation

---

## 📚 TypeScript Interfaces

Alle DTOs sind in `src/types.ts` definiert:

```typescript
interface Movie { id, title, description, poster, rating, ... }
interface User { id, username, email, avatar, bio, ... }
interface Book { id, title, author, cover, rating, ... }
interface Review { id, movieId, userId, rating, comment, ... }
// ... 20+ mehr Interfaces
```

---

## 🚀 Production Build

```bash
# Build
bun run build

# Output: dist/ folder
# Serve mit Any Static Server:
# - Nginx
# - Apache
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
```

### Production `.env`:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
APP_URL=https://yourdomain.com
```

---

## 📞 Support & Troubleshooting

| Problem | Lösung |
|---------|---------|
| **CORS Error** | Backend CORS konfigurieren, `VITE_API_BASE_URL` überprüfen |
| **404 Not Found** | API Endpoint korrekt? Backend läuft? |
| **401 Unauthorized** | Token abgelaufen? `localStorage` überprüfen |
| **500 Server Error** | Backend Logs überprüfen, Database Connection |
| **Bun install fails** | `bun install --force` oder `rm bun.lock && bun install` |

---

**Dokumentation aktualisiert:** August 2026
**Backend Integration Status:** ✅ Ready
**API Endpoints:** 80+
**TypeScript Support:** ✅ Full
