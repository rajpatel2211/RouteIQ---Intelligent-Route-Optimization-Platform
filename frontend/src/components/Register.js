import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    email: '', username: '', password: '', full_name: '', role: 'technician'
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      nav('/dashboard');
    } catch (err) {
      setError((err.response && err.response.data && err.response.data.detail) || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          <input placeholder="Full Name" value={form.full_name}
            onChange={(e) => setForm({...form, full_name: e.target.value})} />
          <input placeholder="Username" value={form.username}
            onChange={(e) => setForm({...form, username: e.target.value})} required />
          <input type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})} required />
          <input type="password" placeholder="Password (min 6 chars)" value={form.password}
            onChange={(e) => setForm({...form, password: e.target.value})} required minLength={6} />
          <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})}>
            <option value="technician">Technician</option>
            <option value="manager">Manager</option>
          </select>
          <button type="submit">Register</button>
        </form>
        <p>Have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
