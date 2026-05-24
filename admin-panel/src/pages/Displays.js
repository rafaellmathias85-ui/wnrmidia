import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import './Displays.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
              <button className="btn-delete" onClick={() => handleDelete(display.id)}>
                Deletar
              </button>
            </div>
          ))
        )}
      </div>

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
    </div>
  );
};

export default Displays;
