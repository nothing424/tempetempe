// ===== TEMPEPLAY - HOME JS =====

async function loadSection(fetchFn, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  try {
    const animes = await fetchFn();
    grid.innerHTML = animes.map(buildAnimeCard).join('');
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--text2);padding:16px">Gagal memuat 😢</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSection(() => fetchTrending(1, 12), 'trending-grid');
  loadSection(() => fetchSeasonal(1, 12), 'seasonal-grid');
  loadSection(() => fetchPopular(1, 12), 'popular-grid');

  // Search
  let searchTimeout;
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const searchModal = document.getElementById('search-modal');
  const searchResults = document.getElementById('search-results');
  const searchClose = document.getElementById('search-close');

  function doSearch() {
    const q = searchInput.value.trim();
    if (!q) return;
    searchModal.classList.remove('hidden');
    searchResults.innerHTML = Array(8).fill('<div class="skeleton-card"></div>').join('');
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      const results = await searchAnime(q);
      searchResults.innerHTML = results.length
        ? results.map(buildAnimeCard).join('')
        : '<p style="color:var(--text2);padding:20px">Tidak ditemukan 😢</p>';
    }, 400);
  }

  searchBtn?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  searchClose?.addEventListener('click', () => searchModal.classList.add('hidden'));
  searchModal?.addEventListener('click', (e) => { if (e.target === searchModal) searchModal.classList.add('hidden'); });

  // Hero explore button
  document.getElementById('btn-hero-explore')?.addEventListener('click', () => {
    document.getElementById('section-trending')?.scrollIntoView({ behavior: 'smooth' });
  });
});
