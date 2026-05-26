'use strict';

const form       = document.getElementById('setup-form');
const submitBtn  = document.getElementById('submit-btn');
const btnText    = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');
const errorMsg   = document.getElementById('error-msg');
const importBtn  = document.getElementById('import-btn');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
}
function clearError() {
  errorMsg.style.display = 'none';
}
function setLoading(v) {
  submitBtn.disabled = v;
  btnText.style.display    = v ? 'none'   : 'inline';
  btnSpinner.style.display = v ? 'inline' : 'none';
}

// ── Import config file (one-click setup from admin panel JSON) ──────────────
importBtn.addEventListener('click', async () => {
  clearError();
  importBtn.disabled = true;
  importBtn.textContent = 'Aguardando seleção...';

  const result = await window.electronAPI.importConfigFile();

  if (result.success) return; // player window will open automatically

  importBtn.disabled = false;
  importBtn.textContent = '📂 Importar Arquivo de Configuração (.json)';

  if (result.reason === 'cancelled') return;
  if (result.reason === 'invalid')
    showError('Arquivo inválido. Certifique-se de usar o arquivo gerado no painel de administração.');
  else
    showError('Não foi possível ler o arquivo. Verifique se ele é um JSON válido.');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  setLoading(true);

  const serverUrl   = document.getElementById('serverUrl').value.trim().replace(/\/$/, '');
  const displayName = document.getElementById('displayName').value.trim();
  const displayType = document.getElementById('displayType').value;
  const location    = document.getElementById('location').value.trim();

  // Generate a stable UUID for this installation
  const displayId = crypto.randomUUID();

  try {
    const res = await fetch(`${serverUrl}/displays/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayId, displayName, displayType, location }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Servidor retornou erro ${res.status}`);
    }

    const data = await res.json();

    await window.electronAPI.saveConfig({
      displayId:   data.displayId || displayId,
      serverUrl,
      displayName,
      displayType,
      location,
      orientation: data.orientation || 'landscape',
    });

    await window.electronAPI.launchPlayer();

  } catch (err) {
    showError(`Não foi possível conectar ao servidor:\n${err.message}`);
    setLoading(false);
  }
});
