# Xeyiu Movie Collection Website

A modern movie, TV show, and anime discovery platform with user authentication and favorites system.

## 🚀 Quick Start

### Features You Can Test

✅ **Authentication System:**
- User registration and login
- Profile management
- Session persistence
- Form validation and error handling

✅ **Movie Browsing:**
- Browse trending movies, TV shows, and anime
- Search functionality
- Genre and year filtering
- Detailed movie information with trailers

✅ **Favorites System:**
- Add/remove favorites (simulated in test mode)
- Heart buttons on movie posters
- User-specific collections

## 🔧 Production Setup (With Real Supabase)

When you're ready to deploy with real user data:

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Copy environment variables:**
   ```bash
   cp my-website/.env.example my-website/.env
   ```

3. **Fill in your Supabase credentials** in `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

4. **Run the database migration** in your Supabase dashboard:
   - Go to SQL Editor
   - Run the migration in `supabase/migrations/create_user_favorites.sql`

5. **Deploy your site** - The authentication will automatically switch to real Supabase

## 📁 Project Structure

```
my-website/
├── index.html              # Home page
├── latest.html            # Movies page
├── tvshows.html           # TV Shows page
├── anime.html             # Anime page
├── css/
│   ├── home.css           # Main styles
│   └── auth.css           # Authentication styles
├── js/
│   ├── home.js            # Home page logic
│   ├── auth.js            # Authentication system
│   ├── favorites.js       # Favorites management
│   ├── supabase.js        # Database client
│   └── test-auth.js       # Testing utilities
└── supabase/
    └── migrations/        # Database schema
```

## 🧪 Test Mode Features

- **Mock Authentication:** Full login/logout simulation
- **Test Accounts:** Pre-configured test users
- **Visual Indicator:** Clear test mode notification
- **No External Dependencies:** Works completely offline
- **Real UI Testing:** All authentication flows work exactly like production

## 🎬 API Integration

- **TMDB API:** Real movie, TV show, and anime data
- **Multiple Streaming Sources:** Various video players
- **Search & Filtering:** Advanced content discovery
- **Responsive Design:** Works on all devices

## 📱 Mobile Support

- Fully responsive design
- Touch-friendly navigation
- Optimized for mobile viewing
- Progressive Web App ready

---
