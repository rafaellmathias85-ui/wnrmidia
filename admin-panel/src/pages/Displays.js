import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL, DOWNLOADS_BASE_URL } from '../config/api';
import './Displays.css';

const CLIENT_ZIP_URL = `${DOWNLOADS_BASE_URL}/downloads/WNRMidiaDisplay-Setup.zip`;

const Displays = () => {
  const [displays, setDisplays] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('telao');
  const [location, setLocation] = useState('');
  const [orientation, setOrientation] = useState('landscape');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [clientModal, setClientModal] = useState(null);   // display selected for client download

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchDisplays();
    fetchPlaylists();
  }, []);

  const fetchDisplays = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/displays`, { headers });
      setDisplays(res.data);
    } catch {
      toast.error('Erro ao carregar displays');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const res = await axios.get(`${API_URL}/playlists`, { headers });
      setPlaylists(res.data);
    } catch {
      toast.error('Erro ao carregar playlists');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/displays`,
        { name, type, location, width: 1920, height: 1080, orientation },
        { headers }
      );
      toast.success('Display criado!');
      setName(''); setType('telao'); setLocation(''); setOrientation('landscape');
      setShowForm(false);
      fetchDisplays();
    } catch {
      toast.error('Erro ao criar display');
    }
  };

  const handleDelete = async (displayId) => {
    if (!window.confirm('Tem certeza?')) return;
    try {
      await axios.delete(`${API_URL}/displays/${displayId}`, { headers });
      toast.success('Display deletado!');
      fetchDisplays();
    } catch {
      toast.error('Erro ao deletar display');
    }
  };

  const handleToggleOrientation = async (display) => {
    const currentOrientation = display.orientation || 'landscape';
    const newOrientation = currentOrientation === 'portrait' ? 'landscape' : 'portrait';
    try {
      await axios.put(`${API_URL}/displays/${display.id}`, {
        name: display.name,
        type: display.type,
        location: display.location,
        width: display.width || 1920,
        height: display.height || 1080,
        orientation: newOrientation,
      }, { headers });
      toast.success(`Orientação alterada para ${newOrientation === 'portrait' ? 'Retrato' : 'Paisagem'}`);
      fetchDisplays();
    } catch {
      toast.error('Erro ao alterar orientação');
    }
  };

  const handleAssignPlaylist = async () => {
    if (!selectedPlaylist) {
      toast.error('Selecione uma playlist');
      return;
    }
    try {
      await axios.post(
        `${API_URL}/displays/${assignModal.id}/playlist`,
        { playlistId: parseInt(selectedPlaylist) },
        { headers }
      );
      toast.success('Playlist atribuída com sucesso!');
      setAssignModal(null);
      setSelectedPlaylist('');
      fetchDisplays();
    } catch {
      toast.error('Erro ao atribuir playlist');
    }
  };

  // Generate and download the per-display config JSON
  const downloadConfig = (display) => {
    const config = {
      displayId:   display.display_id,
      serverUrl:   API_URL,
      displayName: display.name,
      displayType: display.type,
      location:    display.location || '',
      orientation: display.orientation || 'landscape',
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `wnrmidia-display-${display.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Configuração baixada!');
  };

  return (
    <div className="displays-page">
      <h1>Gerenciamento de Displays</h1>

      <div className="create-display">
        {!showForm ? (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Adicionar Display
          </button>
        ) : (
          <form onSubmit={handleCreate}>
            <input
              type="text" placeholder="Nome do display"
              value={name} onChange={(e) => setName(e.target.value)} required
            />
            <select value={type} onChange={(e) => { setType(e.target.value); setOrientation('landscape'); }}>
              <option value="telao">Telão</option>
              <option value="outdoor">Outdoor</option>
              <option value="elevator">Elevador</option>
              <option value="totem">Totem</option>
            </select>
            {(type === 'totem' || type === 'elevator') && (
              <select value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                <option value="landscape">Paisagem (horizontal)</option>
                <option value="portrait">Retrato (vertical)</option>
              </select>
            )}
            <input
              type="text" placeholder="Localização"
              value={location} onChange={(e) => setLocation(e.target.value)}
            />
            <div className="form-buttons">
              <button type="submit" className="btn-primary">Criar</button>
              <button type="button" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </div>

      <div className="displays-grid">
        {loading ? (
          <p>Carregando...</p>
        ) : displays.length === 0 ? (
          <p>Nenhum display cadastrado</p>
        ) : (
          displays.map(display => (
            <div key={display.id} className={`display-card status-${display.status}`}>
              <div className="status-indicator"></div>
              <h3>{display.name}</h3>
              <p className="type">{display.type}</p>
              <p className="location">{display.location || 'Sem localização'}</p>
              <p className={`status status-${display.status}`}>
                {display.status === 'online' ? '🟢 Online' : '🔴 Offline'}
              </p>
              <p className="current-playlist">
                {display.current_playlist_name
                  ? `🎬 ${display.current_playlist_name}`
                  : 'Sem playlist atribuída'}
              </p>
              {display.last_sync && (
                <p className="last-sync">
                  Última sync: {new Date(display.last_sync).toLocaleString('pt-BR')}
                </p>
              )}
              {(display.type === 'totem' || display.type === 'elevator') && (
                <p className="display-orientation">
                  {display.orientation === 'portrait' ? '📱 Retrato (vertical)' : '🖥️ Paisagem (horizontal)'}
                </p>
              )}
              <button
                className="btn-assign"
                onClick={() => { setAssignModal(display); setSelectedPlaylist(display.current_playlist_id ? String(display.current_playlist_id) : ''); }}
              >
                🎬 Atribuir Playlist
              </button>
              {(display.type === 'totem' || display.type === 'elevator') && (
                <button className="btn-orientation" onClick={() => handleToggleOrientation(display)}>
                  🔄 Alternar Orientação
                </button>
              )}
              <button className="btn-download-client" onClick={() => setClientModal(display)}>
                ⬇ Baixar Cliente
              </button>
              <button className="btn-delete" onClick={() => handleDelete(display.id)}>
                Deletar
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Assign Playlist Modal ────────────────────────────── */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Atribuir Playlist</h2>
            <p className="modal-display-name">Display: <strong>{assignModal.name}</strong></p>

            {playlists.length === 0 ? (
              <p className="modal-empty">Nenhuma playlist disponível. Crie uma playlist primeiro.</p>
            ) : (
              <select
                className="modal-select"
                value={selectedPlaylist}
                onChange={(e) => setSelectedPlaylist(e.target.value)}
              >
                <option value="">Selecione uma playlist...</option>
                {playlists.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}

            <div className="modal-buttons">
              <button className="btn-primary" onClick={handleAssignPlaylist}>
                Confirmar
              </button>
              <button onClick={() => setAssignModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Download Modal ────────────────────────────── */}
      {clientModal && (
        <div className="modal-overlay" onClick={() => setClientModal(null)}>
          <div className="modal client-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setClientModal(null)}>✕</button>
            <h2>Instalar Cliente de Display</h2>
            <p className="modal-display-name">
              Display: <strong>{clientModal.name}</strong>
              <span className="modal-display-id">{clientModal.display_id}</span>
            </p>

            <div className="client-steps">
              <div className="client-step">
                <span className="step-num">1</span>
                <div className="step-body">
                  <strong>Baixar o cliente</strong>
                  <p>Extraia o arquivo .zip na máquina hospedeira e execute o <code>WNR Midia Display.exe</code> dentro da pasta extraída.</p>
                  <a
                    href={CLIENT_ZIP_URL}
                    className="btn-dl-exe"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ⬇ Baixar Cliente Windows (.zip)
                  </a>
                </div>
              </div>

              <div className="client-step">
                <span className="step-num">2</span>
                <div className="step-body">
                  <strong>Baixar a configuração deste display</strong>
                  <p>Cada display tem um arquivo único que cria o vínculo com o servidor.</p>
                  <button className="btn-dl-config" onClick={() => downloadConfig(clientModal)}>
                    ⬇ Baixar Configuração ({clientModal.name})
                  </button>
                </div>
              </div>

              <div className="client-step">
                <span className="step-num">3</span>
                <div className="step-body">
                  <strong>Importar a configuração</strong>
                  <p>
                    Com o app aberto, clique em{' '}
                    <em>"Importar Arquivo de Configuração"</em>.
                    Selecione o arquivo <code>.json</code> baixado no passo 2.
                    O player iniciará automaticamente vinculado a este display.
                  </p>
                </div>
              </div>
            </div>

            <div className="client-info-box">
              <span>✓</span>
              O arquivo .zip é gerado e publicado automaticamente via GitHub Actions
              toda vez que o código do cliente é atualizado. Nenhuma ação manual é necessária.
            </div>

            <button className="btn-modal-close" onClick={() => setClientModal(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Displays;
