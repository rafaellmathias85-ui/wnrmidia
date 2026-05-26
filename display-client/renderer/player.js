'use strict';

// ─── DOM refs ──────────────────────────────────────────────────────────────────
const videoEl       = document.getElementById('video');
const waitingScreen = document.getElementById('waiting-screen');
const waitingTitle  = document.getElementById('waiting-title');
const waitingMsg    = document.getElementById('waiting-msg');
const hud           = document.getElementById('hud');
const hudName       = document.getElementById('hud-display-name');
const hudTitle      = document.getElementById('hud-title');
const hudStatus     = document.getElementById('hud-status');

// ─── State ────────────────────────────────────────────────────────────────────
let config        = null;
let playlist      = [];
let currentIndex  = 0;
let playlistHash  = '';
let errorCount    = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setStatus(label, cls) {
  hudStatus.textContent = label;
  hudStatus.className   = `hud-status ${cls}`;
}

function showWaiting(title, msg) {
  videoEl.style.display       = 'none';
  hud.classList.add('hidden');
  waitingScreen.classList.remove('hidden');
  waitingTitle.textContent = title;
  waitingMsg.innerHTML     = msg;
}

function showPlayer() {
  waitingScreen.classList.add('hidden');
  videoEl.style.display = '';
  hud.classList.remove('hidden');
}

function buildVideoUrl(filePath) {
  // file_path in DB: 'uploads/videos/filename.mp4'
  // API has app.use('/api/uploads', static(...)) so:
  // ${serverUrl}/uploads/videos/filename.mp4 → Express serves it
  return `${config.serverUrl}/${filePath}`;
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function registerDisplay() {
  const { displayId, serverUrl, displayName, displayType, location } = config;
  try {
    const res = await fetch(`${serverUrl}/displays/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayId, displayName, displayType, location }),
    });
    if (res.ok) { errorCount = 0; setStatus('● online', 'status-ok'); }
  } catch {
    setStatus('● sem conexão', 'status-error');
  }
}

async function fetchPlaylist() {
  const { displayId, serverUrl } = config;
  try {
    const res  = await fetch(`${serverUrl}/displays/${displayId}/playlist`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    errorCount = 0;
    setStatus('● online', 'status-ok');

    const videos  = Array.isArray(data.videos) ? data.videos : [];
    const newHash = videos.map(v => v.id).join(',');

    if (newHash !== playlistHash) {
      playlistHash = newHash;
      playlist     = videos;

      if (playlist.length === 0) {
        showWaiting(
          'Aguardando conteúdo',
          'Nenhuma playlist atribuída a este display.<br>Acesse o painel de administração para configurar.',
        );
      } else {
        // If we were waiting, start from beginning; otherwise keep current index
        if (waitingScreen.style.display !== 'none' || !videoEl.src) {
          currentIndex = 0;
          playVideo(currentIndex);
        }
      }
    }
  } catch {
    errorCount++;
    if (errorCount >= 3) {
      setStatus('● sem conexão', 'status-error');
    } else {
      setStatus('● reconectando…', 'status-warn');
    }
  }
}

async function sendHeartbeat() {
  const { displayId, serverUrl } = config;
  try {
    await fetch(`${serverUrl}/displays/${displayId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status:   'online',
        lastSync: new Date().toISOString(),
      }),
    });
  } catch { /* silent — fetchPlaylist already tracks errors */ }
}

async function reportPlay(videoId) {
  const { displayId, serverUrl } = config;
  try {
    await fetch(`${serverUrl}/analytics/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayId, videoId }),
    });
  } catch { /* non-critical */ }
}

// ─── Playback ─────────────────────────────────────────────────────────────────

function playVideo(index) {
  if (!playlist.length) return;

  const video = playlist[index];
  showPlayer();
  hudTitle.textContent = video.title || '';

  // Fade out → swap source → fade in
  videoEl.classList.add('fading');

  setTimeout(() => {
    videoEl.src = buildVideoUrl(video.file_path);
    videoEl.load();
    videoEl.classList.remove('fading');
    videoEl.play().catch(() => {
      // Autoplay blocked — try muted (already muted) or skip
      videoEl.muted = true;
      videoEl.play().catch(() => advanceVideo());
    });
    reportPlay(video.id);
  }, 500);
}

function advanceVideo() {
  currentIndex = (currentIndex + 1) % playlist.length;
  playVideo(currentIndex);
}

videoEl.addEventListener('ended', advanceVideo);

videoEl.addEventListener('error', () => {
  console.warn('Video load error, skipping:', videoEl.src);
  setTimeout(advanceVideo, 2000);
});

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  config = await window.electronAPI.getConfig();

  if (!config || !config.displayId) {
    showWaiting('Configuração necessária', 'Abra o ícone na bandeja do sistema para configurar o display.');
    return;
  }

  hudName.textContent = config.displayName || 'Display';

  await registerDisplay();
  await fetchPlaylist();

  // Heartbeat every 60 s
  setInterval(sendHeartbeat, 60_000);

  // Playlist poll every 30 s
  setInterval(fetchPlaylist, 30_000);
}

init();
