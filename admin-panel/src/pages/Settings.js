import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config/api';
import './Settings.css';

const ROLE_OPTIONS = [
  { value: 'admin',  label: 'Administrador' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Cliente' },
];

const roleLabel = (role) => ROLE_OPTIONS.find(o => o.value === role)?.label || role;

function getToken() { return localStorage.getItem('token'); }
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [toast, setToast]         = useState('');

  const currentUser = getCurrentUser();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar usuários');
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab, fetchUsers]);

  const handleRoleChange = async (userId, role) => {
    try {
      const res  = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar permissão');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      showToast('Permissão atualizada com sucesso');
    } catch (e) {
      showToast(`Erro: ${e.message}`);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Excluir o usuário "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir usuário');
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
      showToast('Usuário excluído');
    } catch (e) {
      showToast(`Erro: ${e.message}`);
    }
  };

  return (
    <div className="settings-page">
      <h1>Configurações</h1>

      {toast && <div className="settings-toast">{toast}</div>}

      <div className="settings-tabs">
        <button
          className={`tab-btn${activeTab === 'users' ? ' active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Usuários
        </button>
        <button
          className={`tab-btn${activeTab === 'system' ? ' active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          Sistema
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="settings-section">
          <div className="section-header">
            <h2>Gerenciar Usuários</h2>
            <button className="btn-refresh" onClick={fetchUsers} title="Atualizar lista">
              ↺ Atualizar
            </button>
          </div>

          {loading && <p className="state-text">Carregando...</p>}
          {error   && <p className="state-text error">{error}</p>}

          {!loading && !error && (
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Permissão</th>
                    <th>Criado em</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  )}
                  {users.map(u => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className={isSelf ? 'row-self' : ''}>
                        <td>
                          <span className="user-name">{u.name}</span>
                          {isSelf && <span className="you-badge">você</span>}
                        </td>
                        <td className="cell-email">{u.email}</td>
                        <td>
                          {isSelf ? (
                            <span className={`role-badge role-${u.role}`}>{roleLabel(u.role)}</span>
                          ) : (
                            <select
                              className="role-select"
                              value={u.role}
                              onChange={e => handleRoleChange(u.id, e.target.value)}
                            >
                              {ROLE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="cell-date">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          {!isSelf && (
                            <button
                              className="btn-delete"
                              onClick={() => handleDelete(u.id, u.name)}
                            >
                              Excluir
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'system' && (
        <>
          <div className="settings-section">
            <h2>Informações do Sistema</h2>
            <p>Versão: 1.0.0</p>
            <p>Build: 2025</p>
          </div>
          <div className="settings-section">
            <h2>Configuração de API</h2>
            <p>URL Base: {API_URL}</p>
          </div>
          <div className="settings-section">
            <h2>Suporte</h2>
            <p>Email: suporte@wnrmidia.com</p>
          </div>
        </>
      )}
    </div>
  );
};

export default Settings;
