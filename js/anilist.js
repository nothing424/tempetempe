// ===== TEMPEPLAY - ANILIST API =====
// GraphQL API: https://graphql.anilist.co

const ANILIST_URL = 'https://graphql.anilist.co';

const ANIME_FRAGMENT = `
  id title { romaji english native }
  coverImage { large extraLarge }
  bannerImage
  description(asHtml: false)
  genres averageScore episodes status
  season seasonYear format
  studios(isMain: true) { nodes { name } }
  trailer { id site }
  nextAiringEpisode { episode timeUntilAiring }
`;

async function anilistQuery(query, variables = {}) {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const data = await res.json();
  return data.data;
}

// Trending
window.fetchTrending = async (page = 1, perPage = 12) => {
  const q = `query($page:Int,$perPage:Int){Page(page:$page,perPage:$perPage){media(sort:TRENDING_DESC,type:ANIME,isAdult:false){${ANIME_FRAGMENT}}}}`;
  const data = await anilistQuery(q, { page, perPage });
  return data.Page.media;
};

// Seasonal
window.fetchSeasonal = async (page = 1, perPage = 12) => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const seasons = ['WINTER','WINTER','SPRING','SPRING','SPRING','SUMMER','SUMMER','SUMMER','FALL','FALL','FALL','WINTER'];
  const season = seasons[month];
  const q = `query($season:MediaSeason,$year:Int,$page:Int,$perPage:Int){Page(page:$page,perPage:$perPage){media(season:$season,seasonYear:$year,sort:POPULARITY_DESC,type:ANIME,isAdult:false){${ANIME_FRAGMENT}}}}`;
  const data = await anilistQuery(q, { season, year, page, perPage });
  return data.Page.media;
};

// All Time Popular
window.fetchPopular = async (page = 1, perPage = 12) => {
  const q = `query($page:Int,$perPage:Int){Page(page:$page,perPage:$perPage){media(sort:POPULARITY_DESC,type:ANIME,isAdult:false){${ANIME_FRAGMENT}}}}`;
  const data = await anilistQuery(q, { page, perPage });
  return data.Page.media;
};

// Search
window.searchAnime = async (search, page = 1, perPage = 20) => {
  const q = `query($search:String,$page:Int,$perPage:Int){Page(page:$page,perPage:$perPage){media(search:$search,type:ANIME,isAdult:false){${ANIME_FRAGMENT}}}}`;
  const data = await anilistQuery(q, { search, page, perPage });
  return data.Page.media;
};

// Detail by ID
window.fetchAnimeDetail = async (id) => {
  const q = `query($id:Int){Media(id:$id,type:ANIME){${ANIME_FRAGMENT} characters(sort:ROLE,perPage:8){nodes{name{full}image{medium}}} relations{edges{relationType node{id title{romaji}coverImage{large}type}}}}}`;
  const data = await anilistQuery(q, { id: parseInt(id) });
  return data.Media;
};

// Build anime card HTML
window.buildAnimeCard = (anime) => {
  const title = anime.title.english || anime.title.romaji;
  const poster = anime.coverImage.large;
  const score = anime.averageScore ? `⭐ ${(anime.averageScore/10).toFixed(1)}` : '';
  const status = anime.status === 'RELEASING' ? '🟢 Ongoing' : anime.status === 'FINISHED' ? 'Selesai' : anime.status;
  const eps = anime.episodes ? `${anime.episodes} eps` : '? eps';

  return `
    <div class="anime-card" onclick="goToWatch(${anime.id})" data-id="${anime.id}">
      <div class="anime-card-poster">
        <img src="${poster}" alt="${title}" loading="lazy" />
        ${score ? `<div class="anime-card-score">${score}</div>` : ''}
        ${anime.status === 'RELEASING' ? `<div class="anime-card-badge">Ongoing</div>` : ''}
        <div class="anime-card-overlay">
          <button class="play-btn">▶ Tonton</button>
        </div>
      </div>
      <div class="anime-card-info">
        <div class="anime-card-title">${title}</div>
        <div class="anime-card-meta">
          <span>${anime.format || 'TV'}</span>
          <span>${eps}</span>
        </div>
      </div>
    </div>
  `;
};

window.goToWatch = (id) => {
  window.location.href = `pages/watch.html?id=${id}`;
};
