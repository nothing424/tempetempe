// ===== TEMPEPLAY - WATCH JS =====
const BACKEND = 'https://hsjshsjs-tempeplay-backend.hf.space';

const params = new URLSearchParams(location.search);
const animeId = params.get('id');
const startEp = parseInt(params.get('ep')) || 1;
let currentEp = startEp;
let anikotoId = null;
let allEpisodes = [];
let currentLang = 'sub';

if (!animeId) location.href = '../index.html';

async function init() {
  const anime = await fetchAnimeDetail(animeId);
  renderAnimeInfo(anime);
  renderRelated(anime);

  const title = anime.title.english || anime.title.romaji;
  document.title = `${title} - TempePlay`;

  // Match AniList ID ke Anikoto
  await matchAndLoadEpisodes(anime);
}

async function matchAndLoadEpisodes(anime) {
  const title = anime.title.english || anime.title.romaji;
  showVideoLoading('Mencari anime...');

  try {
    const res = await fetch(`${BACKEND}/api/anikoto/match?anilist_id=${animeId}&title=${encodeURIComponent(title)}`);
    const data = await res.json();

    if (data.found && data.anikoto_id) {
      anikotoId = data.anikoto_id;
      await loadEpisodes(anikotoId, anime);
    } else {
      // Fallback: generate episode list dari AniList
      fallbackEpisodes(anime);
    }
  } catch(e) {
    fallbackEpisodes(anime);
  }
}

async function loadEpisodes(anikotoId, anime) {
  try {
    const res = await fetch(`${BACKEND}/api/anikoto/series/${anikotoId}`);
    const data = await res.json();
    allEpisodes = data.episodes || [];

    if (allEpisodes.length === 0) {
      fallbackEpisodes(anime);
      return;
    }

    renderEpisodes(allEpisodes);
    const ep = allEpisodes.find(e => e.number === startEp) || allEpisodes[0];
    loadEmbed(ep);
  } catch(e) {
    fallbackEpisodes(anime);
  }
}

function fallbackEpisodes(anime) {
  const total = anime.episodes || 12;
  allEpisodes = Array.from({length: total}, (_, i) => ({
    id: null, number: i + 1,
    title: `Episode ${i + 1}`,
    embed_sub: '', embed_dub: '', has_sub: false, has_dub: false
  }));
  renderEpisodes(allEpisodes);
  showVideoError('Anime ini belum tersedia di database kami 😢');
}

function renderEpisodes(episodes) {
  const list = document.getElementById('episode-list');
  list.innerHTML = episodes.map((ep, i) => `
    <button class="ep-btn ${ep.number === currentEp ? 'active' : ''}"
      onclick="selectEpisode(${i})">
      ${ep.number}
    </button>
  `).join('');
}

window.selectEpisode = (index) => {
  const ep = allEpisodes[index];
  currentEp = ep.number;
  document.querySelectorAll('.ep-btn').forEach((b, i) => b.classList.toggle('active', i === index));
  loadEmbed(ep);
  history.replaceState(null, '', `?id=${animeId}&ep=${currentEp}`);
};

function loadEmbed(ep) {
  if (!ep) return;
  const embedUrl = currentLang === 'dub' ? (ep.embed_dub || ep.embed_sub) : (ep.embed_sub || ep.embed_dub);

  if (!embedUrl) {
    showVideoError('Episode ini belum tersedia 😢');
    renderServerBar(ep);
    return;
  }

  const wrapper = document.getElementById('video-wrapper');
  const loading = document.getElementById('video-loading');
  const errEl = document.getElementById('video-error');
  const videoEl = document.getElementById('video-player');

  loading.style.display = 'none';
  errEl.classList.add('hidden');
  videoEl.style.display = 'none';

  // Ganti video player jadi iframe embed
  let iframe = document.getElementById('embed-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'embed-iframe';
    iframe.style.cssText = 'width:100%;height:100%;border:none;position:absolute;inset:0;';
    iframe.allowFullscreen = true;
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    wrapper.appendChild(iframe);
  }
  iframe.src = embedUrl;
  renderServerBar(ep);
}

function renderServerBar(ep) {
  const bar = document.getElementById('server-btns');
  const hasSub = ep.embed_sub;
  const hasDub = ep.embed_dub;

  bar.innerHTML = `
    ${hasSub ? `<button class="server-btn ${currentLang==='sub'?'active':''}" onclick="switchLang('sub')">SUB</button>` : ''}
    ${hasDub ? `<button class="server-btn ${currentLang==='dub'?'active':''}" onclick="switchLang('dub')">DUB</button>` : ''}
    ${!hasSub && !hasDub ? '<span style="color:var(--text2);font-size:0.8rem">Tidak tersedia</span>' : ''}
  `;
}

window.switchLang = (lang) => {
  currentLang = lang;
  const ep = allEpisodes.find(e => e.number === currentEp);
  if (ep) loadEmbed(ep);
};

function showVideoLoading(msg = 'Memuat video...') {
  const loading = document.getElementById('video-loading');
  const errEl = document.getElementById('video-error');
  const iframe = document.getElementById('embed-iframe');
  loading.style.display = 'flex';
  loading.querySelector('p').textContent = msg;
  if (errEl) errEl.classList.add('hidden');
  if (iframe) iframe.src = '';
}

function showVideoError(msg) {
  const loading = document.getElementById('video-loading');
  const errEl = document.getElementById('video-error');
  loading.style.display = 'none';
  errEl.classList.remove('hidden');
  errEl.innerHTML = `<p>${msg}</p>`;
}

function renderAnimeInfo(anime) {
  document.getElementById('info-title').textContent = anime.title.english || anime.title.romaji;
  document.getElementById('info-poster').src = anime.coverImage.large;
  document.getElementById('info-desc').textContent = anime.description?.replace(/<[^>]*>/g, '') || '';
  const genres = (anime.genres || []).slice(0, 5);
  document.getElementById('info-genres').innerHTML = genres.map(g => `<span class="genre-tag">${g}</span>`).join('');
  const score = anime.averageScore ? `⭐ ${(anime.averageScore / 10).toFixed(1)}` : '';
  const eps = anime.episodes ? `${anime.episodes} eps` : '';
  const year = anime.seasonYear || '';
  const studio = anime.studios?.nodes?.[0]?.name || '';
  document.getElementById('info-meta').innerHTML = `
    ${score ? `<span>${score}</span>` : ''}
    ${eps ? `<span>📺 ${eps}</span>` : ''}
    ${year ? `<span>📅 ${year}</span>` : ''}
    ${studio ? `<span>🎬 ${studio}</span>` : ''}
  `;
}

function renderRelated(anime) {
  const list = document.getElementById('related-list');
  const relations = anime.relations?.edges?.filter(e =>
    e.node.type === 'ANIME' && e.relationType !== 'CHARACTER'
  ).slice(0, 8) || [];
  if (!relations.length) {
    list.innerHTML = '<p style="color:var(--text2);font-size:0.85rem">Tidak ada relasi.</p>';
    return;
  }
  list.innerHTML = relations.map(edge => `
    <a class="related-card" href="watch.html?id=${edge.node.id}">
      <img src="${edge.node.coverImage?.large || ''}" alt="${edge.node.title.romaji}" />
      <div class="related-card-info">
        <div class="related-card-title">${edge.node.title.english || edge.node.title.romaji}</div>
        <div class="related-card-meta">${edge.relationType}</div>
      </div>
    </a>
  `).join('');
}

// Tambah id ke video-wrapper buat iframe
document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.video-wrapper');
  if (wrapper) wrapper.id = 'video-wrapper';
  init();
});
