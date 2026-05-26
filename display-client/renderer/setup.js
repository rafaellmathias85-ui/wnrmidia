'use strict';

const form       = document.getElementById('setup-form');
const submitBtn  = document.getElementById('submit-btn');
const btnText    = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');
const errorMsg   = document.getElementById('error-msg');

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
