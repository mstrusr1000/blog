const postGrid = document.querySelector('#post-grid');
const tabs = document.querySelector('#genre-tabs');
const count = document.querySelector('#note-count');
const template = document.querySelector('#post-template');
const dialog = document.querySelector('#post-dialog');
let posts = [];
let activeGenre = 'All';

function openPost(post) {
  dialog.querySelector('.dialog-genre').textContent = `${post.genre.toUpperCase()} / NOTE ${post.id}`;
  dialog.querySelector('h2').textContent = post.title;
  dialog.querySelector('.dialog-date').textContent = post.date;
  const content = document.createDocumentFragment();
  post.content.forEach(paragraph => {
    const element = document.createElement('p');
    element.textContent = paragraph;
    content.append(element);
  });
  dialog.querySelector('.dialog-content').replaceChildren(content);
  dialog.showModal();
}

function renderPosts() {
  const filtered = activeGenre === 'All' ? posts : posts.filter(post => post.genre === activeGenre);
  postGrid.innerHTML = '';
  filtered.forEach((post, index) => {
    const card = template.content.cloneNode(true);
    card.querySelector('.post-genre').textContent = post.genre;
    card.querySelector('.post-index').textContent = String(index + 1).padStart(2, '0');
    card.querySelector('.post-date').textContent = post.date;
    card.querySelector('h3').textContent = post.title;
    card.querySelector('.post-excerpt').textContent = post.excerpt;
    card.querySelector('.read-post').addEventListener('click', () => openPost(post));
    postGrid.append(card);
  });
  count.textContent = `${filtered.length} ${filtered.length === 1 ? 'note' : 'notes'} shown`;
}

function renderTabs() {
  const genres = ['All', ...new Set(posts.map(post => post.genre))];
  tabs.innerHTML = '';
  genres.forEach(genre => {
    const button = document.createElement('button');
    button.className = `genre-tab ${genre === activeGenre ? 'active' : ''}`;
    button.textContent = genre;
    button.addEventListener('click', () => { activeGenre = genre; renderTabs(); renderPosts(); });
    tabs.append(button);
  });
}

fetch('blogs.json')
  .then(response => { if (!response.ok) throw new Error('Could not load notes'); return response.json(); })
  .then(data => {
    posts = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderTabs();
    renderPosts();
  })
  .catch(() => { count.textContent = 'Unable to load notes. Run with a local server.'; });

dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

const player = document.querySelector('.music-player');
const audio = document.querySelector('.audio-track');
const playButton = document.querySelector('.play-button');
const progress = document.querySelector('.progress-bar');
const currentTime = document.querySelector('.current-time');
const duration = document.querySelector('.duration');
const trackTitle = document.querySelector('.track-title');
const albumCover = document.querySelector('.album-cover');
const audioSource = 'recover.m4a';
const metadataSource = 'recover.m4a';
const fallbackCover = 'Profile picture.svg';
audio.src = audioSource;
albumCover.src = fallbackCover;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function setPlayingState(isPlaying) {
  player.classList.toggle('is-playing', isPlaying);
  playButton.textContent = isPlaying ? 'Ⅱ' : '▶';
  playButton.setAttribute('aria-label', isPlaying ? 'Pause track' : 'Play track');
  playButton.setAttribute('aria-pressed', String(isPlaying));
}

playButton.addEventListener('click', () => {
  if (audio.paused) audio.play().catch(() => setPlayingState(false));
  else audio.pause();
});

audio.addEventListener('play', () => setPlayingState(true));
audio.addEventListener('pause', () => setPlayingState(false));
audio.addEventListener('loadedmetadata', () => { duration.textContent = formatTime(audio.duration); });
audio.addEventListener('timeupdate', () => {
  progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  currentTime.textContent = formatTime(audio.currentTime);
});
audio.addEventListener('ended', () => { progress.value = 0; currentTime.textContent = '0:00'; });
progress.addEventListener('input', () => { if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration; });

async function loadEmbeddedMetadata() {
  try {
    const [module, response] = await Promise.all([
      import('https://cdn.jsdelivr.net/npm/music-metadata-browser@2.5.9/+esm'),
      fetch(metadataSource)
    ]);
    const metadata = await module.parseBlob(await response.blob(), { duration: true });
    const cover = metadata.common.picture?.[0];

    if (metadata.common.title) trackTitle.textContent = metadata.common.title;
    if (metadata.format.duration) duration.textContent = formatTime(metadata.format.duration);
    if (cover) {
      const coverUrl = URL.createObjectURL(new Blob([cover.data], { type: cover.format }));
      albumCover.src = coverUrl;
      albumCover.alt = `Cover art for ${metadata.common.title || 'the current track'}`;
    }
  } catch {
    // The HTML title and extracted image stay available as fallbacks.
  }
}

loadEmbeddedMetadata();
