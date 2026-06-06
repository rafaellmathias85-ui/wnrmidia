import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL, API_BASE_URL } from '../config/api';
import './Playlists.css';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const videoRef = useRef(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plRes, vRes] = await Promise.all([
        axios.get(`${API_URL}/playlists`, { headers }),
        axios.get(`${API_URL}/videos`, { headers })
      ]);
      const pl = Array.isArray(plRes.data) ? plRes.data : [plRes.data].filter(Boolean);
      setPlaylists(pl);
      setAllVideos(vRes.data);
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylist = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/playlists/${id}`, { headers });
      setSelectedPlaylist(res.data);
      setPreviewIndex(0);
    } catch {
      toast.error('Erro ao carregar playlist');
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/playlists`, { name, description }, { headers });
      toast.success('Playlist criada!');
      setName(''); setDescription(''); setShowCreateForm(false);
      await fetchData();
      fetchPlaylist(res.data.id);
    } catch {
      toast.error('Erro ao criar playlist');
    }
  };

  const handleAddVideo = async (videoId) => {
    if (!selectedPlaylist) return;
    try {
      await axios.post(
        `${API_URL}/playlists/${selectedPlaylist.id}/videos`,
        { videoId },
        { headers }
      );
      toast.success('Vídeo adicionado!');
      fetchPlaylist(selectedPlaylist.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao adicionar vídeo');
    }
  };

  const handleRemoveVideo = async (videoId) => {
    try {
      await axios.delete(
        `${API_URL}/playlists/${selectedPlaylist.id}/videos/${videoId}`,
        { headers }
      );
      toast.success('Vídeo removido!');
      const updated = await axios.get(`${API_URL}/playlists/${selectedPlaylist.id}`, { headers });
      setSelectedPlaylist(updated.data);
      setPreviewIndex(0);
    } catch {
      toast.error('Erro ao remover vídeo');
    }
  };

  const handleDeletePlaylist = async (pl) => {
    if (!window.confirm(`Deletar a playlist "${pl.name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/playlists/${pl.id}`, { headers });
      toast.success('Playlist deletada!');
      if (selectedPlaylist?.id === pl.id) setSelectedPlaylist(null);
      fetchData();
    } catch {
      toast.error('Erro ao deletar playlist');
    }
  };

  const playlistVideos = selectedPlaylist?.videos || [];
  const addedIds = new Set(playlistVideos.map(v => v.id));
  const availableVideos = allVideos.filter(v => !addedIds.has(v.id));

  const previewVideo = playlistVideos[previewIndex];
  const previewUrl = previewVideo
    ? (previewVideo.file_path.startsWith('http')
        ? previewVideo.file_path
        : `${API_BASE_URL}/${previewVideo.file_path}`)
    : null;

  const totalDuration = playlistVideos.reduce((s, v) => s + (v.duration_seconds || 0), 0);

  return (
    <div className="playlists-page">
      <h1>Gerenciamento de Playlists</h1>

      {/* Create form */}
      <div className="create-playlist">
        {!showCreateForm ? (
          <button className="btn-purple" onClick={() => setShowCreateForm(true)}>+ Criar Nova Playlist</button>
        ) : (
          <form onSubmit={handleCreatePlaylist}>
            <input type="text" placeholder="Nome da playlist" value={name} onChange={e => setName(e.target.value)} required />
            <textarea placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} />
            <div className="form-buttons">
              <button type="submit">Criar</button>
              <button type="button" onClick={() => setShowCreateForm(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </div>

      {/* Playlist list */}
      <div className="playlists-grid">
        {loading ? <p>Carregando...</p> : playlists.length === 0 ? <p>Nenhuma playlist criada</p> : (
          playlists.map(pl => (
            <div key={pl.id} className={`playlist-card ${selectedPlaylist?.id === pl.id ? 'selected' : ''}`}>
              <h3>{pl.name}</h3>
              <p>{pl.description || 'Sem descrição'}</p>
              <button
                onClick={() => fetchPlaylist(pl.id)}
                className={selectedPlaylist?.id === pl.id ? 'active' : ''}
              >
                {selectedPlaylist?.id === pl.id ? '✓ Selecionada' : 'Gerenciar'}
              </button>
              <button
                className="btn-delete-playlist"
                onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(pl); }}
              >Deletar</button>
            </div>
          ))
        )}
      </div>

      {/* Editor */}
      {selectedPlaylist && (
        <div className="playlist-editor">

          {/* Left — video management */}
          <div className="editor-left">
            <div className="editor-header">
              <h2>📋 {selectedPlaylist.name}</h2>
              <span className="playlist-meta">
                {playlistVideos.length} vídeo{playlistVideos.length !== 1 ? 's' : ''} · {totalDuration}s total
              </span>
            </div>

            {/* Current videos */}
            <div className="section-box">
              <h3>Vídeos na Playlist</h3>
              {playlistVideos.length === 0 ? (
                <p className="empty-msg">Nenhum vídeo adicionado ainda</p>
              ) : (
                <div className="playlist-video-list">
                  {playlistVideos.map((v, idx) => (
                    <div
                      key={v.id}
                      className={`playlist-video-item ${previewIndex === idx ? 'previewing' : ''}`}
                      onClick={() => setPreviewIndex(idx)}
                    >
                      <span className="order-badge">{idx + 1}</span>
                      <div className="video-info">
                        <span className="video-title">{v.title}</span>
                        <span className="video-dur">{v.duration_seconds}s</span>
                      </div>
                      <button
                        className="btn-remove"
                        title="Remover da playlist"
                        onClick={e => { e.stopPropagation(); handleRemoveVideo(v.id); }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available to add */}
            <div className="section-box">
              <h3>Adicionar Vídeos</h3>
              {availableVideos.length === 0 ? (
                <p className="empty-msg">Todos os vídeos já estão na playlist</p>
              ) : (
                <div className="available-list">
                  {availableVideos.map(v => (
                    <div key={v.id} className="available-item">
                      <div className="video-info">
                        <span className="video-title">{v.title}</span>
                        <span className="video-dur">{v.duration_seconds}s · {(v.file_size / 1024 / 1024).toFixed(1)}MB</span>
                      </div>
                      <button className="btn-add" onClick={() => handleAddVideo(v.id)}>+ Adicionar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — preview */}
          <div className="editor-right">
            <h2>👁 Preview</h2>
            {playlistVideos.length === 0 ? (
              <div className="preview-empty">
                <div style={{ fontSize: 48 }}>🎬</div>
                <p>Adicione vídeos para visualizar o preview</p>
              </div>
            ) : (
              <div className="preview-container">
                <video
                  ref={videoRef}
                  key={previewUrl}
                  src={previewUrl}
                  controls
                  autoPlay
                  onEnded={() => setPreviewIndex(i => (i + 1) % playlistVideos.length)}
                  style={{ width: '100%', borderRadius: 8, background: '#000', display: 'block' }}
                />
                <div className="preview-info">
                  <span className="preview-title">{previewVideo?.title}</span>
                  <span className="preview-counter">{previewIndex + 1} / {playlistVideos.length}</span>
                </div>
                <div className="preview-controls">
                  <button onClick={() => setPreviewIndex(i => (i - 1 + playlistVideos.length) % playlistVideos.length)}>
                    ◀ Anterior
                  </button>
                  <button onClick={() => setPreviewIndex(i => (i + 1) % playlistVideos.length)}>
                    Próximo ▶
                  </button>
                </div>
                <div className="preview-thumbnails">
                  {playlistVideos.map((v, idx) => (
                    <div
                      key={v.id}
                      className={`thumb ${idx === previewIndex ? 'active' : ''}`}
                      onClick={() => setPreviewIndex(idx)}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Playlists;
