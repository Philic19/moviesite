import { supabase } from './supabase.js';

class FavoritesManager {
  constructor() {
    this.favorites = new Set();
    this.init();
  }

  async init() {
    // Load user favorites when they sign in
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.loadUserFavorites(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.favorites.clear();
        this.updateFavoriteButtons();
      }
    });

    // Check if user is already signed in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await this.loadUserFavorites(user.id);
    }
  }

  async loadUserFavorites(userId) {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('tmdb_id')
        .eq('user_id', userId);

      if (error) throw error;

      this.favorites.clear();
      data.forEach(fav => this.favorites.add(fav.tmdb_id.toString()));
      this.updateFavoriteButtons();
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }

  async toggleFavorite(item) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Show login modal if not authenticated
      if (window.authManager) {
        window.authManager.openAuthModal();
      }
      return;
    }

    const itemId = item.id.toString();
    const isFavorite = this.favorites.has(itemId);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_id', item.id);

        if (error) throw error;
        
        this.favorites.delete(itemId);
        this.showMessage('Removed from favorites', 'info');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            tmdb_id: item.id,
            media_type: item.media_type || 'movie',
            title: item.title || item.name,
            poster_path: item.poster_path,
            overview: item.overview,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date
          });

        if (error) throw error;
        
        this.favorites.add(itemId);
        this.showMessage('Added to favorites', 'success');
      }

      this.updateFavoriteButtons();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this.showMessage('Error updating favorites', 'error');
    }
  }

  isFavorite(itemId) {
    return this.favorites.has(itemId.toString());
  }

  updateFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(btn => {
      const itemId = btn.dataset.itemId;
      if (this.isFavorite(itemId)) {
        btn.innerHTML = '❤️';
        btn.classList.add('favorited');
      } else {
        btn.innerHTML = '🤍';
        btn.classList.remove('favorited');
      }
    });
  }

  addFavoriteButton(container, item) {
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'favorite-btn';
    favoriteBtn.dataset.itemId = item.id;
    favoriteBtn.innerHTML = this.isFavorite(item.id) ? '❤️' : '🤍';
    favoriteBtn.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0, 0, 0, 0.7);
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      cursor: pointer;
      font-size: 16px;
      z-index: 10;
      transition: transform 0.2s ease;
    `;
    
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite(item);
    });

    favoriteBtn.addEventListener('mouseenter', () => {
      favoriteBtn.style.transform = 'scale(1.1)';
    });

    favoriteBtn.addEventListener('mouseleave', () => {
      favoriteBtn.style.transform = 'scale(1)';
    });

    container.style.position = 'relative';
    container.appendChild(favoriteBtn);
  }

  showMessage(message, type) {
    // Create or update message element
    let messageEl = document.getElementById('favorites-message');
    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'favorites-message';
      messageEl.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-weight: bold;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(messageEl);
    }

    messageEl.textContent = message;
    
    // Set colors based on type
    switch (type) {
      case 'success':
        messageEl.style.backgroundColor = '#28a745';
        messageEl.style.color = '#fff';
        break;
      case 'error':
        messageEl.style.backgroundColor = '#dc3545';
        messageEl.style.color = '#fff';
        break;
      case 'info':
        messageEl.style.backgroundColor = '#17a2b8';
        messageEl.style.color = '#fff';
        break;
    }

    messageEl.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
      messageEl.style.opacity = '0';
    }, 3000);
  }
}

// Initialize favorites manager
document.addEventListener('DOMContentLoaded', () => {
  window.favoritesManager = new FavoritesManager();
});