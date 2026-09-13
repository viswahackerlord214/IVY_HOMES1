import { useState } from 'react';
import { useAuth } from '../context/AuthContext';


export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch { /* error handled by context */ }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: '1.5rem', margin: '0 auto 16px', borderRadius: 16 }}>🏠</div>
          <h1 className="login-title">Welcome to Ivy Homes</h1>
          <p className="login-subtitle">Sign in to explore Bangalore's finest properties</p>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="demo1@ivy.homes"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
          </button>
        </form>


      </div>
    </div>
  );
}
