import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../config/api';
import './Videos.css';

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/videos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file || !title) {
      toast.error('Selecione um vídeo e defina um título');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      await axios.post(`${API_URL}/videos/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Vídeo enviado com sucesso!');
      setFile(null);
      setTitle('');
      setDescription('');
      fetchVideos();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao enviar vídeo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Tem certeza que deseja deletar este vídeo?')) return;

    try {
      await axios.delete(`${API_URL}/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Vídeo deletado!');
      fetchVideos();
    } catch (error) {
      toast.error('Erro ao deletar vídeo');
    }
  };

  return (
    <div className="videos-page">
      <h1>Gerenciamento de Vídeos</h1>

      <div className="upload-section">
        <h2>Fazer Upload de Vídeo</h2>
        <form onSubmit={handleUpload} className="upload-form">
          <input
            type="text"
            placeholder="Título do vídeo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
          <button type="submit" disabled={uploading}>
            {uploading ? 'Enviando...' : 'Enviar Vídeo'}
          </button>
        </form>
      </div>

      <div className="videos-list">
        <h2>Vídeos Disponíveis</h2>
        {loading ? (
          <p>Carregando vídeos...</p>
        ) : videos.length === 0 ? (
          <p>Nenhum vídeo encontrado</p>
        ) : (
          <table className="videos-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Duração</th>
                <th>Tamanho</th>
                <th>Criado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(video => (
                <tr key={video.id}>
                  <td>{video.title}</td>
                  <td>{video.duration_seconds}s</td>
                  <td>{(video.file_size / 1024 / 1024).toFixed(2)} MB</td>
                  <td>{new Date(video.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(video.id)}
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Videos;
