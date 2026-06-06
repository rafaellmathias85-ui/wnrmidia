'use strict';

const SHOW_HUD = false;
const DEFAULT_IMAGE_DURATION_MS = 10_000;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const waitingScreen = document.getElementById('waiting-screen');
const waitingTitle  = document.getElementById('waiting-title');
const waitingMsg    = document.getElementById('waiting-msg');
const hud           = document.getElementById('hud');
const hudName       = document.getElementById('hud-display-name');
const hudTitle      = document.getElementById('hud-title');
const hudStatus     = document.getElementById('hud-status');

const layers = [
  {
    el:    document.getElementById('layer-a'),
    video: document.querySelector('#layer-a .media-video'),
    image: document.querySelector('#layer-a .media-image'),
  },
  {
    el:    document.getElementById('layer-b'),
    video: document.querySelector('#layer-b .media-video'),
    image: document.querySelector('#layer-b .media-image'),
  },
];

// ── State ─────────────────────────────────────────────────────────────────────
let config       = null;
let playlist     = [];
let playlistHash = '';
let index        = 0;
let activeLayer  = 0;
let imageTimer   = null;
let errorCount   = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────
function setVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function setStatus(label, cls) {
  hudStatus.textContent = label;
  hudStatus.className   = `hud-status ${cls}`;
}

function showWaiting(title, msg) {
  waitingTitle.textContent = title;
  waitingMsg.innerHTML     = msg;
  waitingScreen.classList.remove('hidden');
  hud.classList.add('hidden');
}

function hideWaiting() {
  waitingScreen.classList.add('hidden');
  hud.classList.toggle('hidden', !SHOW_HUD);
}

// Detecta tipo pelo campo `type` ou pela extensão do arquivo.
function getItemType(item) {
  if (item.type) return item.type;
  const ext = (item.file_path || '').split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext) ? 'image' : 'video';
}

function buildMediaUrl(item) {
  return `${config.serverUrl}/${item.file_path}`;
}

// ── Layout / rotação ──────────────────────────────────────────────────────────

// Alguns ambientes reportam rotação como índice (1=90°, 2=180°, 3=270°) em vez de graus.
function normalizeRotation(r) {
  if (r === 1) return 90;
  if (r === 2) return 180;
  if (r === 3) return 270;
  return [0, 90, 180, 270].includes(r) ? r : 0;
}

async function applyLayout() {
  setVar('--video-fit', config?.videoFit || 'contain');

  let rotation = 0;
  try {
    const info = await window.electronAPI.getScreenInfo();
    rotation = normalizeRotation(Number(info?.rotation) || 0);
  } catch (_) {}

  if (rotation === 90 || rotation === 270) {
    // Tela em retrato: troca eixos para o stage preencher o painel girado corretamente.
    setVar('--stage-w', '100vh');
    setVar('--stage-h', '100vw');
    setVar('--stage-rot', rotation + 'deg');
  } else if (rotation === 180) {
    setVar('--stage-w', '100vw');
    setVar('--stage-h', '100vh');
    setVar('--stage-rot', '180deg');
  } else {
    setVar('--stage-w', '100vw');
    setVar('--stage-h', '100vh');
    setVar('--stage-rot', '0deg');
  }
}

// ── Engine de playback (double-buffer) ────────────────────────────────────────

function hideMedia(layer) {
  layer.video.style.display = 'none';
  layer.image.style.display = 'none';
  try { layer.video.pause(); } catch (_) {}
}

// Pré-carrega item na camada indicada sem exibir ainda.
function preload(layerIdx, item) {
  const layer = layers[layerIdx];
  hideMedia(layer);
  if (!item) return;
  if (getItemType(item) === 'image') {
    layer.image.src = buildMediaUrl(item);
  } else {
    layer.video.src = buildMediaUrl(item);
    layer.video.load();
  }
}

function showLayer(layerIdx, item) {
  const layer = layers[layerIdx];
  const other = layers[1 - layerIdx];

  if (getItemType(item) === 'image') {
    layer.image.style.display = 'block';
  } else {
    layer.video.style.display = 'block';
    layer.video.currentTime   = 0;
    layer.video.play().catch(() => {});
  }

  layer.el.classList.add('active');
  other.el.classList.remove('active');
  hideWaiting();

  hudTitle.textContent = item.title || '';
  reportPlay(item.id);
}

function scheduleNext(item) {
  clearTimeout(imageTimer);
  const layer = layers[activeLayer];

  if (getItemType(item) === 'video') {
    layer.video.onended = () => advance();
  } else {
    const dur = (item.duration_sec || item.durationSec || config?.defaultImageDurationSec || 10) * 1000;
    imageTimer = setTimeout(advance, dur);
  }
}

function advance() {
  if (!playlist.length) return;
  index = (index + 1) % playlist.length;
  const nextItem  = playlist[index];
  const nextLayer = 1 - activeLayer;

  preload(nextLayer, nextItem);

  const doSwap = () => {
    activeLayer = nextLayer;
    showLayer(activeLayer, nextItem);
    scheduleNext(nextItem);
    // Pré-carrega o item seguinte na camada que acabou de sair
    const afterIdx = (index + 1) % playlist.length;
    preload(1 - activeLayer, playlist[afterIdx]);
  };

  if (getItemType(nextItem) === 'video') {
    const v = layers[nextLayer].video;
    if (v.readyState >= 2) {
      doSwap();
    } else {
      v.oncanplay = () => { v.oncanplay = null; doSwap(); };
      setTimeout(() => { if (activeLayer !== nextLayer) doSwap(); }, 4000);
    }
  } else {
    const img = layers[nextLayer].image;
    if (img.complete && img.naturalWidth) {
      doSwap();
    } else {
      img.onload = () => { img.onload = null; doSwap(); };
      setTimeout(() => { if (activeLayer !== nextLayer) doSwap(); }, 2000);
    }
  }
}

function startPlayback() {
  if (!playlist.length) {
    showWaiting(
      'Aguardando conteúdo',
      'Nenhuma playlist atribuída a este display.<br>Acesse o painel de administração para configurar.',
    );
    return;
  }

  clearTimeout(imageTimer);
  layers.forEach(l => { hideMedia(l); l.el.classList.remove('active'); });

  index = 0; activeLayer = 0;
  preload(0, playlist[0]);
  const first = playlist[0];

  const startNow = () => {
    showLayer(0, first);
    scheduleNext(first);
    if (playlist.length > 1) preload(1, playlist[1]);
  };

  if (getItemType(first) === 'video') {
    const v = layers[0].video;
    if (v.readyState >= 2) startNow();
    else v.oncanplay = () => { v.oncanplay = null; startNow(); };
    setTimeout(() => { if (!layers[0].el.classList.contains('active')) startNow(); }, 4000);
  } else {
    const img = layers[0].image;
    if (img.complete && img.naturalWidth) {
      startNow();
    } else {
      img.onload = () => { img.onload = null; startNow(); };
      setTimeout(() => { if (!layers[0].el.classList.contains('active')) startNow(); }, 2000);
    }
  }
}

// Erro na camada ativa → pula para o próximo item após breve pausa.
layers.forEach((layer, idx) => {
  layer.video.addEventListener('error', () => {
    if (idx === activeLayer) setTimeout(advance, 2000);
  });
});

// ── API calls ─────────────────────────────────────────────────────────────────

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
    const res = await fetch(`${serverUrl}/displays/${displayId}/playlist`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    errorCount = 0;
    setStatus('● online', 'status-ok');

    const items   = Array.isArray(data.videos) ? data.videos : [];
    const newHash = items.map(v => v.id).join(',');

    if (newHash !== playlistHash) {
      playlistHash = newHash;
      playlist     = items;
      startPlayback();
    }
  } catch {
    errorCount++;
    if (errorCount >= 3) setStatus('● sem conexão', 'status-error');
    else setStatus('● reconectando…', 'status-warn');
  }
}

async function sendHeartbeat() {
  const { displayId, serverUrl } = config;
  try {
    await fetch(`${serverUrl}/displays/${displayId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'online', lastSync: new Date().toISOString() }),
    });
  } catch { /* silent — fetchPlaylist já rastreia erros */ }
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

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  config = await window.electronAPI.getConfig();

  if (!config?.displayId) {
    showWaiting(
      'Configuração necessária',
      'Abra o ícone na bandeja do sistema para configurar o display.',
    );
    return;
  }

  hudName.textContent = config.displayName || 'Display';

  await applyLayout();
  window.addEventListener('resize', applyLayout);

  await registerDisplay();
  await fetchPlaylist();

  setInterval(sendHeartbeat, 60_000);
  setInterval(fetchPlaylist,  30_000);
}

init();
