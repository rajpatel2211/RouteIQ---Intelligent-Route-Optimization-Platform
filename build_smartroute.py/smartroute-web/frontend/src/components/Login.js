import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      nav('/dashboard');
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.detail) || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>SmartRoute</h1>
        <p className="subtitle">Route Optimization Platform</p>
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          <input placeholder="Username" value={username}
            onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Sign In</button>
        </form>
        <p>No account? <Link to="/register">Register here</Link></p>
      </div>
    </div>
  );
}
