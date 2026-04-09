import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogle = async () => {
    setLoading(true); setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
    } catch (e) {
      setError(e.message.replace('Firebase: ', ''));
    }
    setLoading(false);
  };

  const handleEmailAuth = async () => {
    setError(''); setSuccess('');
    if (!email || !password) { setError('Please fill in all fields!'); return; }
    if (mode === 'signup' && password !== confirmPassword) { setError('Passwords do not match!'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters!'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await signInWithEmailAndPassword(auth, email, password);
        onLogin(result.user);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        onLogin(result.user);
      }
    } catch (e) {
      const msg = e.code === 'auth/user-not-found' ? 'No account found with this email!'
        : e.code === 'auth/wrong-password' ? 'Wrong password!'
        : e.code === 'auth/email-already-in-use' ? 'Email already registered!'
        : e.code === 'auth/invalid-email' ? 'Invalid email address!'
        : e.code === 'auth/invalid-credential' ? 'Invalid email or password!'
        : e.message.replace('Firebase: ', '');
      setError(msg);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!email) { setError('Enter your email first!'); return; }
    setLoading(true); setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (e) { setError(e.message.replace('Firebase: ', '')); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #12081e 50%, #0a0a0f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif", padding: '20px' }}>
      <div style={{ position: 'fixed', top: '20%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '20px', padding: '40px', backdropFilter: 'blur(10px)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🕵️</div>
          <h1 style={{ color: '#a78bfa', fontSize: '1.8rem', fontWeight: '800', margin: '0 0 4px' }}>SocialSpy</h1>
          <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>AI-Powered Digital Footprint Analyzer</p>
          <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', borderRadius: '2px', margin: '16px auto 0' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#0d0d0d', borderRadius: '10px', padding: '4px' }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: mode === m ? 'linear-gradient(135deg, #a78bfa, #7c3aed)' : 'transparent', color: mode === m ? '#fff' : '#666', fontWeight: mode === m ? '600' : '400', fontSize: '0.85rem', transition: 'all 0.2s' }}>
              {m === 'login' ? '🔑 Login' : '✨ Sign Up'}
            </button>
          ))}
        </div>
        <button onClick={handleGoogle} disabled={loading}
          style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #2e2e2e', background: '#1a1a1a', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: '500', marginBottom: '20px' }}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Continue with Google
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1, height: '1px', background: '#2e2e2e' }} />
          <span style={{ color: '#555', fontSize: '0.8rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#2e2e2e' }} />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #2e2e2e', background: '#0d0d0d', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {mode !== 'reset' && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #2e2e2e', background: '#0d0d0d', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        )}
        {mode === 'signup' && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#888', fontSize: '0.8rem', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
            <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #2e2e2e', background: '#0d0d0d', color: '#fff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        )}
        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <button onClick={() => { setMode('reset'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.8rem' }}>Forgot password?</button>
          </div>
        )}
        {error && <div style={{ background: '#2a0a0a', border: '1px solid #ff4444', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}><p style={{ color: '#ff6666', fontSize: '0.83rem', margin: 0 }}>❌ {error}</p></div>}
        {success && <div style={{ background: '#0a2a0a', border: '1px solid #44ff44', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}><p style={{ color: '#66ff99', fontSize: '0.83rem', margin: 0 }}>✅ {success}</p></div>}
        {mode === 'reset' ? (
          <>
            <button onClick={handleReset} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', marginBottom: '12px' }}>
              {loading ? '⏳ Sending...' : '📧 Send Reset Email'}
            </button>
            <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #2e2e2e', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '0.85rem' }}>← Back to Login</button>
          </>
        ) : (
          <button onClick={handleEmailAuth} disabled={loading} style={{ width: '100%', padding: '13px', borderRadius: '10px', border: 'none', background: loading ? '#333' : 'linear-gradient(135deg, #a78bfa, #7c3aed)', color: '#fff', fontWeight: '700', fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '⏳ Please wait...' : mode === 'login' ? '🔑 Login' : '✨ Create Account'}
          </button>
        )}
        <p style={{ color: '#444', fontSize: '0.75rem', textAlign: 'center', marginTop: '20px', marginBottom: 0 }}>By continuing, you agree to our Terms of Service</p>
      </div>
    </div>
  );
}