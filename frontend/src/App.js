import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import jsPDF from 'jspdf';
import './App.css';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import LoginPage from './LoginPage';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';

const API = 'https://socialspy-production.up.railway.app';
const axiosInstance = axios.create({ timeout: 120000 });

const CATEGORIES = {
  Developer: ['github', 'gitlab', 'codechef', 'codeforces', 'hackerrank', 'leetcode', 'stackoverflow', 'replit', 'codeberg', 'gitea', 'coderwall', 'codewars', 'hackerearth', 'hackernews', 'hackerone', 'codesandbox', 'codecademy'],
  Gaming: ['steam', 'roblox', 'chess', 'minecraft', 'kongregate', 'nitrotype', 'pokemonshowdown', 'runescape', 'playstrategy', 'gaiaonline'],
  Social: ['linkedin', 'snapchat', 'bluesky', 'clubhouse', 'plurk', 'periscope', 'flipboard', 'disqus', 'mastodon'],
  Music: ['bandcamp', 'mixcloud', 'audiojungle', 'reverbnation', 'soundcloud', 'freesound'],
  Creative: ['deviantart', 'dribbble', 'sketchfab', 'cgtrader', 'coroflot', 'carbonmade'],
  Other: []
};
const COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#94a3b8'];

// ── FIRESTORE HELPER ──────────────────────────────────────────────

const saveToHistory = async (userId, type, query, summary) => {
  try {
    await addDoc(collection(db, 'history'), {
      userId,
      type,
      query,
      summary,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save history:', err);
  }
};

// ── SHARED COMPONENTS ──────────────────────────────────────────────

const LoadingCard = ({ msg }) => (
  <div className="card" style={{ textAlign: 'center' }}>
    <div className="spinner"></div>
    <p style={{ color: '#a78bfa', marginTop: '16px' }}>{msg}</p>
    <p style={{ color: '#fbbf24', fontSize: '0.85rem' }}>⏳ Backend may be waking up — please wait up to 2 minutes...</p>
    <p style={{ color: '#888', fontSize: '0.8rem' }}>This is normal for the first search!</p>
  </div>
);

const getCategoryData = (accounts = []) => {
  const counts = { Developer: 0, Gaming: 0, Social: 0, Music: 0, Creative: 0, Other: 0 };
  accounts.forEach(url => {
    const domain = url.toLowerCase();
    let matched = false;
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
      if (category === 'Other') continue;
      if (keywords.some(k => domain.includes(k))) { counts[category]++; matched = true; break; }
    }
    if (!matched) counts.Other++;
  });
  return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
};

// ── PAGES ──────────────────────────────────────────────

function SearchPage({ userId }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!username.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/search`, { username });
      setResult(res.data);
      await saveToHistory(userId, 'search', username, `Found ${res.data.found_count} accounts`);
    } catch { setError('Something went wrong. Is the backend running?'); }
    setLoading(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(107, 70, 193); doc.text('SocialSpy Report', 20, 20);
    doc.setFontSize(12); doc.setTextColor(0, 0, 0);
    doc.text(`Username: ${result.username}`, 20, 35);
    doc.text(`Accounts Found: ${result.found_count}`, 20, 45);
    doc.text(`Privacy Risk: ${result.found_count > 20 ? 'High' : result.found_count > 10 ? 'Medium' : 'Low'}`, 20, 55);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 65);
    doc.setFontSize(14); doc.setTextColor(107, 70, 193); doc.text('AI Analysis:', 20, 80);
    doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(result.analysis || '', 170);
    doc.text(lines, 20, 90);
    let y = 90 + lines.length * 5 + 10;
    (result.accounts || []).forEach(url => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(`• ${url}`, 20, y); y += 6;
    });
    doc.save(`socialspy-${result.username}-report.pdf`);
  };

  const accounts = result?.accounts || [];
  const categoryData = getCategoryData(accounts);

  return (
    <div className="page">
      <div className="page-header"><h2>🔍 Search Username</h2><p>Find accounts across 400+ social networks instantly</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Enter username (e.g. john)" value={username}
            onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="input" />
          <button onClick={handleSearch} disabled={loading} className="btn">{loading ? '⏳ Searching...' : '🔍 Search'}</button>
        </div>
      </div>
      {error && <div className="card error">❌ {error}</div>}
      {loading && <LoadingCard msg="🔍 Searching across 400+ platforms..." />}
      {result && !loading && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={exportPDF} className="btn" style={{ background: '#1e1e1e', border: '1px solid #a78bfa', color: '#a78bfa', width: 'auto' }}>📤 Export PDF</button>
          </div>
          <div className="stats-grid">
            <div className="stat-card"><p className="stat-number">{result.found_count}</p><p className="stat-label">Accounts Found</p></div>
            <div className="stat-card">
              <p className="stat-number" style={{ color: result.found_count > 20 ? '#ff6666' : result.found_count > 10 ? '#ffaa00' : '#66ff99' }}>
                {result.found_count > 20 ? 'High' : result.found_count > 10 ? 'Medium' : 'Low'}
              </p>
              <p className="stat-label">Privacy Risk</p>
            </div>
            <div className="stat-card"><p className="stat-number">400+</p><p className="stat-label">Platforms Searched</p></div>
          </div>
          {categoryData.length > 0 && (
            <div className="card">
              <h2>📊 Platform Categories</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="card"><h2>🤖 AI Analysis</h2><div className="analysis">{result.analysis}</div></div>
          <div className="card">
            <h2>✅ Found Accounts ({result.found_count})</h2>
            <div className="accounts-grid">
              {accounts.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="account-card">
                  🔗 {url.replace('https://', '').split('/')[0]}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function BreachPage({ userId }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handle = async () => {
    if (!email.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/breach`, { email });
      setResult(res.data);
      await saveToHistory(userId, 'breach', email, res.data.breached ? `Found in ${res.data.count} breach(es)` : 'No breaches found');
    } catch { setResult({ error: 'Something went wrong!' }); }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header"><h2>🔓 Email Breach Checker</h2><p>Check if your email was exposed in any data breach</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} className="input" />
          <button onClick={handle} disabled={loading} className="btn">{loading ? '⏳ Checking...' : '🔓 Check'}</button>
        </div>
      </div>
      {loading && <LoadingCard msg="🔓 Checking breach databases..." />}
      {result && !loading && (
        <div className="card">
          {result.error ? <p style={{ color: '#ff6666' }}>❌ {result.error}</p>
            : result.breached ? (
              <>
                <div style={{ background: '#2a1a1a', border: '1px solid #ff4444', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                  <h3 style={{ color: '#ff6666' }}>⚠️ Found in {result.count} breach{result.count > 1 ? 'es' : ''}!</h3>
                  <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Change your passwords immediately!</p>
                </div>
                {result.breaches.map((b, i) => (
                  <div key={i} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '10px', border: '1px solid #2a2a2a' }}>
                    <p style={{ color: '#ff6666', fontWeight: '600' }}>🔴 {b.name}</p>
                    <p style={{ color: '#888', fontSize: '0.82rem' }}>Domain: {b.domain} | Date: {b.date}</p>
                  </div>
                ))}
                <button onClick={() => navigate('/password')} className="btn" style={{ marginTop: '12px', width: '100%' }}>🔏 Get Password Security Advice</button>
              </>
            ) : (
              <div style={{ background: '#1a2a1a', border: '1px solid #44ff44', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ color: '#66ff99' }}>✅ No breaches found!</h3>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

function ComparePage({ userId }) {
  const [u1, setU1] = useState(''); const [u2, setU2] = useState('');
  const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!u1.trim() || !u2.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/compare`, { username1: u1, username2: u2 });
      setResult(res.data);
      await saveToHistory(userId, 'compare', `${u1} vs ${u2}`, `${res.data.count1} vs ${res.data.count2} accounts`);
    } catch { setResult({ error: 'Something went wrong!' }); }
    setLoading(false);
  };
  return (
    <div className="page">
      <div className="page-header"><h2>⚖️ Compare Usernames</h2><p>Compare digital footprints of two usernames</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <input type="text" placeholder="First username" value={u1} onChange={e => setU1(e.target.value)} className="input" />
          <input type="text" placeholder="Second username" value={u2} onChange={e => setU2(e.target.value)} className="input" />
        </div>
        <button onClick={handle} disabled={loading} className="btn" style={{ width: '100%' }}>{loading ? '⏳ Comparing...' : '⚖️ Compare'}</button>
      </div>
      {loading && <LoadingCard msg="⚖️ Searching both usernames..." />}
      {result && !loading && (
        result.error ? <div className="card"><p style={{ color: '#ff6666' }}>❌ {result.error}</p></div> : <>
          <div className="stats-grid">
            <div className="stat-card"><p className="stat-number">{result.count1}</p><p className="stat-label">{result.username1}</p></div>
            <div className="stat-card"><p className="stat-number" style={{ color: '#f472b6' }}>{result.common_count}</p><p className="stat-label">Common</p></div>
            <div className="stat-card"><p className="stat-number">{result.count2}</p><p className="stat-label">{result.username2}</p></div>
          </div>
          <div className="card">
            <h2>📊 Chart</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[{ name: result.username1, accounts: result.count1 }, { name: result.username2, accounts: result.count2 }]}>
                <XAxis dataKey="name" stroke="#888" /><YAxis stroke="#888" /><Tooltip />
                <Bar dataKey="accounts" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card"><h2>🤖 Analysis</h2><div className="analysis">{result.analysis}</div></div>
        </>
      )}
    </div>
  );
}

function PersonalityPage({ userId }) {
  const [username, setUsername] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!username.trim()) return; setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/personality`, { username });
      setResult(res.data);
      await saveToHistory(userId, 'personality', username, `Analyzed across ${res.data.platform_count} platforms`);
    } catch { setResult({ error: 'Something went wrong!' }); } setLoading(false);
  };
  return (
    <div className="page">
      <div className="page-header"><h2>🧠 AI Personality Analyzer</h2><p>Discover personality insights from digital footprint</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} className="input" />
          <button onClick={handle} disabled={loading} className="btn">{loading ? '⏳ Analyzing...' : '🧠 Analyze'}</button>
        </div>
      </div>
      {loading && <LoadingCard msg="🧠 Analyzing personality..." />}
      {result && !loading && <div className="card">{result.error ? <p style={{ color: '#ff6666' }}>❌ {result.error}</p> : <><h2>🧠 Personality — {result.username}</h2><p style={{ color: '#888', marginBottom: '16px', fontSize: '0.85rem' }}>Based on {result.platform_count} platforms</p><div className="analysis">{result.personality}</div></>}</div>}
    </div>
  );
}

function LocationPage({ userId }) {
  const [username, setUsername] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!username.trim()) return; setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/location`, { username });
      setResult(res.data);
      await saveToHistory(userId, 'location', username, `Location analyzed across ${res.data.platform_count} platforms`);
    } catch { setResult({ error: 'Something went wrong!' }); } setLoading(false);
  };
  return (
    <div className="page">
      <div className="page-header"><h2>🗺️ Location Detector</h2><p>Guess someone's country from their digital footprint</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} className="input" />
          <button onClick={handle} disabled={loading} className="btn">{loading ? '⏳ Detecting...' : '🗺️ Detect'}</button>
        </div>
      </div>
      {loading && <LoadingCard msg="🗺️ Analyzing location..." />}
      {result && !loading && <div className="card">{result.error ? <p style={{ color: '#ff6666' }}>❌ {result.error}</p> : <><h2>🗺️ Location — {result.username}</h2><p style={{ color: '#888', marginBottom: '16px', fontSize: '0.85rem' }}>Based on {result.platform_count} platforms</p><div className="analysis">{result.location_analysis}</div></>}</div>}
    </div>
  );
}

function MonitorPage({ userId }) {
  const [username, setUsername] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!username.trim()) return; setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/monitor`, { username });
      setResult(res.data);
      await saveToHistory(userId, 'monitor', username, `${res.data.current_count} accounts monitored`);
    } catch { setResult({ error: 'Something went wrong!' }); } setLoading(false);
  };
  return (
    <div className="page">
      <div className="page-header"><h2>🔔 Profile Monitor</h2><p>Monitor any username and detect profile changes</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Enter username to monitor" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} className="input" />
          <button onClick={handle} disabled={loading} className="btn">{loading ? '⏳ Checking...' : '🔔 Monitor'}</button>
        </div>
      </div>
      {loading && <LoadingCard msg="🔔 Checking for changes..." />}
      {result && !loading && (
        <div className="card">
          {result.error ? <p style={{ color: '#ff6666' }}>❌ {result.error}</p> : <>
            <h2>🔔 Monitor — {result.username}</h2>
            <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ color: '#a78bfa' }}>📊 Current accounts: <strong>{result.current_count}</strong></p>
              <p style={{ color: '#888', fontSize: '0.85rem' }}>Checked: {new Date(result.timestamp).toLocaleString()}</p>
            </div>
            {result.changes?.last_checked ? (
              result.changes.detected
                ? <div style={{ background: '#2a1a1a', border: '1px solid #ff4444', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                    <h3 style={{ color: '#ff6666' }}>⚠️ Changes Detected!</h3>
                    {result.changes.added.length > 0 && <p style={{ color: '#66ff99' }}>✅ New: {result.changes.added.join(', ')}</p>}
                    {result.changes.removed.length > 0 && <p style={{ color: '#ff6666' }}>❌ Removed: {result.changes.removed.join(', ')}</p>}
                  </div>
                : <div style={{ background: '#1a2a1a', border: '1px solid #44ff44', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                    <h3 style={{ color: '#66ff99' }}>✅ No changes detected!</h3>
                  </div>
            ) : (
              <div style={{ background: '#1a1a2a', border: '1px solid #a78bfa', borderRadius: '10px', padding: '16px' }}>
                <p style={{ color: '#a78bfa' }}>📌 First snapshot saved! Click Monitor again to detect changes.</p>
              </div>
            )}
            <div className="accounts-grid" style={{ marginTop: '16px' }}>
              {result.accounts.slice(0, 20).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="account-card">🔗 {url.replace('https://', '').split('/')[0]}</a>
              ))}
            </div>
          </>}
        </div>
      )}
    </div>
  );
}

function NewsPage({ userId }) {
  const [username, setUsername] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!username.trim()) return; setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/news`, { username });
      setResult(res.data);
      await saveToHistory(userId, 'news', username, 'News search completed');
    } catch { setResult({ error: 'Something went wrong!' }); } setLoading(false);
  };
  return (
    <div className="page">
      <div className="page-header"><h2>📰 News Finder</h2><p>Find news and mentions about any username or person</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Enter username or name" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} className="input" />
          <button onClick={handle} disabled={loading} className="btn">{loading ? '⏳ Finding...' : '📰 Find News'}</button>
        </div>
      </div>
      {loading && <LoadingCard msg="📰 Finding news..." />}
      {result && !loading && <div className="card">{result.error ? <p style={{ color: '#ff6666' }}>❌ {result.error}</p> : <><h2>📰 News — {result.username}</h2><div className="analysis">{result.news}</div></>}</div>}
    </div>
  );
}

function PasswordPage({ userId }) {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!email.trim()) return; setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/password-advice`, { email, breaches: [] });
      setResult(res.data);
      await saveToHistory(userId, 'password', email, 'Password security advice generated');
    } catch { setResult({ error: 'Something went wrong!' }); } setLoading(false);
  };
  return (
    <div className="page">
      <div className="page-header"><h2>🔏 Password Security Advisor</h2><p>Get AI-powered password security advice</p></div>
      <div className="card">
        <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="input" style={{ marginBottom: '12px' }} />
        <button onClick={handle} disabled={loading} className="btn" style={{ width: '100%' }}>{loading ? '⏳ Analyzing...' : '🔏 Get Security Advice'}</button>
        <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '8px' }}>💡 Check Breach page first for best results!</p>
      </div>
      {loading && <LoadingCard msg="🔏 Analyzing security..." />}
      {result && !loading && <div className="card">{result.error ? <p style={{ color: '#ff6666' }}>❌ {result.error}</p> : <><h2>🔏 Security Advice</h2><div className="analysis">{result.advice}</div></>}</div>}
    </div>
  );
}

function AvatarsPage({ userId }) {
  const [username, setUsername] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!username.trim()) return; setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/avatars`, { username });
      setResult(res.data);
      await saveToHistory(userId, 'avatars', username, `Found on ${res.data.platform_count} platforms`);
    } catch { setResult({ error: 'Something went wrong!' }); } setLoading(false);
  };
  return (
    <div className="page">
      <div className="page-header"><h2>📸 Avatar Finder</h2><p>Find profile pictures from across social platforms</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} className="input" />
          <button onClick={handle} disabled={loading} className="btn">{loading ? '⏳ Finding...' : '📸 Find Avatars'}</button>
        </div>
      </div>
      {loading && <LoadingCard msg="📸 Finding avatars..." />}
      {result && !loading && (
        <div className="card">
          {result.error ? <p style={{ color: '#ff6666' }}>❌ {result.error}</p> : <>
            <h2>📸 Avatars — {result.username}</h2>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src={result.default_avatar} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid #a78bfa' }} />
              <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '8px' }}>Generated Avatar</p>
            </div>
            {result.avatars.length > 0 && (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
                {result.avatars.map((av, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <img src={av.avatar} alt={av.platform} style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #2e2e2e' }} onError={e => { e.target.src = result.default_avatar; }} />
                    <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '4px' }}>{av.platform}</p>
                  </div>
                ))}
              </div>
            )}
            <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '10px' }}>Found on {result.platform_count} platforms:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {result.platforms.map((p, i) => (
                <span key={i} style={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '20px', padding: '4px 12px', color: '#a78bfa', fontSize: '0.78rem' }}>{p}</span>
              ))}
            </div>
          </>}
        </div>
      )}
    </div>
  );
}

function NetworkPage({ userId }) {
  const [username, setUsername] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!username.trim()) return; setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/search`, { username });
      setResult(res.data);
      await saveToHistory(userId, 'network', username, `Network graph with ${res.data.found_count} nodes`);
    } catch { setResult({ error: 'Something went wrong!' }); } setLoading(false);
  };
  return (
    <div className="page">
      <div className="page-header"><h2>🕸️ Social Network Graph</h2><p>Visualize username connections across platforms</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} className="input" />
          <button onClick={handle} disabled={loading} className="btn">{loading ? '⏳ Building...' : '🕸️ Build Graph'}</button>
        </div>
      </div>
      {loading && <LoadingCard msg="🕸️ Building network graph..." />}
      {result && !loading && (
        <div className="card">
          {result.error ? <p style={{ color: '#ff6666' }}>❌ {result.error}</p> : <>
            <h2>🕸️ Network — {username} ({result.found_count} platforms)</h2>
            <div style={{ background: '#0a0a0a', borderRadius: '10px', padding: '20px', minHeight: '300px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'inline-block', background: '#a78bfa', borderRadius: '50%', width: '70px', height: '70px', lineHeight: '70px', fontWeight: '700', color: '#fff', fontSize: '0.75rem' }}>
                  {username.slice(0, 8)}
                </div>
                <p style={{ color: '#a78bfa', marginTop: '8px', fontSize: '0.85rem' }}>↕️ Connected to {result.found_count} platforms</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                {(result.accounts || []).slice(0, 30).map((url, i) => {
                  const domain = url.split('/')[2]?.replace('www.', '') || url;
                  const colors = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#f87171', '#94a3b8', '#a78bfa'];
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ background: '#1a1a1a', border: `1px solid ${colors[i % colors.length]}`, borderRadius: '20px', padding: '6px 14px', color: colors[i % colors.length], fontSize: '0.78rem', textDecoration: 'none' }}>
                      🔗 {domain}
                    </a>
                  );
                })}
              </div>
              <p style={{ color: '#555', textAlign: 'center', marginTop: '20px', fontSize: '0.8rem' }}>Showing {Math.min(30, result.found_count)} of {result.found_count} platforms</p>
            </div>
          </>}
        </div>
      )}
    </div>
  );
}

// ── NEW PAGES ──────────────────────────────────────────────

function TimelinePage({ userId }) {
  const [username, setUsername] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!username.trim()) return; setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/timeline`, { username });
      setResult(res.data);
      await saveToHistory(userId, 'timeline', username, `Timeline built for ${res.data.platform_count} platforms`);
    } catch { setResult({ error: 'Something went wrong!' }); } setLoading(false);
  };

  const timelineByYear = result?.timeline ? result.timeline.reduce((acc, item) => {
    const y = item.year;
    if (!acc[y]) acc[y] = [];
    acc[y].push(item);
    return acc;
  }, {}) : {};

  const catColors = { Developer: '#60a5fa', Gaming: '#34d399', Social: '#f472b6', Music: '#fbbf24', Creative: '#f87171', Other: '#94a3b8' };

  return (
    <div className="page">
      <div className="page-header"><h2>📅 Account Timeline</h2><p>See when accounts were likely created over the years</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} className="input" />
          <button onClick={handle} disabled={loading} className="btn">{loading ? '⏳ Building...' : '📅 Build Timeline'}</button>
        </div>
      </div>
      {loading && <LoadingCard msg="📅 Building account timeline..." />}
      {result && !loading && (
        result.error ? <div className="card"><p style={{ color: '#ff6666' }}>❌ {result.error}</p></div> :
        <div className="card">
          <h2>📅 Timeline — {username} ({result.platform_count} platforms)</h2>
          <div style={{ position: 'relative', padding: '20px 0' }}>
            {Object.keys(timelineByYear).sort().map(year => (
              <div key={year} style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-start' }}>
                <div style={{ minWidth: '50px', textAlign: 'right' }}>
                  <span style={{ color: '#a78bfa', fontWeight: '700', fontSize: '0.9rem' }}>{year}</span>
                </div>
                <div style={{ width: '2px', background: '#a78bfa', minHeight: '100%', position: 'relative', marginTop: '4px' }}>
                  <div style={{ width: '10px', height: '10px', background: '#a78bfa', borderRadius: '50%', position: 'absolute', top: '0', left: '-4px' }}></div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
                  {timelineByYear[year].map((item, i) => (
                    <span key={i} style={{
                      background: '#1a1a1a',
                      border: `1px solid ${catColors[item.category] || '#555'}`,
                      borderRadius: '20px', padding: '4px 12px',
                      color: catColors[item.category] || '#aaa',
                      fontSize: '0.78rem'
                    }}>
                      {item.platform}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DarkWebPage({ userId }) {
  const [username, setUsername] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!username.trim()) return; setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/darkweb`, { username });
      setResult(res.data);
      await saveToHistory(userId, 'darkweb', username, 'Dark web scan completed');
    } catch { setResult({ error: 'Something went wrong!' }); } setLoading(false);
  };
  return (
    <div className="page">
      <div className="page-header"><h2>🌑 Dark Web Scanner</h2><p>Check if username appears on dark web forums and paste sites</p></div>
      <div className="card" style={{ border: '1px solid #ff4444' }}>
        <p style={{ color: '#ff6666', fontSize: '0.82rem', marginBottom: '12px' }}>⚠️ This feature uses AI simulation for educational purposes only.</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Enter username to scan" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} className="input" />
          <button onClick={handle} disabled={loading} className="btn" style={{ background: '#2a0a0a', border: '1px solid #ff4444', color: '#ff6666' }}>
            {loading ? '⏳ Scanning...' : '🌑 Scan'}
          </button>
        </div>
      </div>
      {loading && <LoadingCard msg="🌑 Scanning dark web sources..." />}
      {result && !loading && (
        result.error ? <div className="card"><p style={{ color: '#ff6666' }}>❌ {result.error}</p></div> :
        <div className="card" style={{ border: '1px solid #ff4444' }}>
          <h2 style={{ color: '#ff6666' }}>🌑 Dark Web Report — {result.username}</h2>
          <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '16px' }}>Based on {result.platform_count} platforms found</p>
          <div style={{ background: '#0a0505', borderRadius: '10px', padding: '16px', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.8', color: '#ff9999', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {result.report}
          </div>
        </div>
      )}
    </div>
  );
}

function ScorePage({ userId }) {
  const [username, setUsername] = useState(''); const [loading, setLoading] = useState(false); const [result, setResult] = useState(null);
  const handle = async () => {
    if (!username.trim()) return; setLoading(true); setResult(null);
    try {
      const res = await axiosInstance.post(`${API}/score`, { username });
      setResult(res.data);
      await saveToHistory(userId, 'score', username, `Score: ${res.data.scores?.total_score}/100 (${res.data.scores?.grade})`);
    } catch { setResult({ error: 'Something went wrong!' }); } setLoading(false);
  };

  const gradeColor = (g) => ({ A: '#34d399', B: '#60a5fa', C: '#fbbf24', D: '#f97316', F: '#ff4444' }[g] || '#aaa');

  const radarData = result?.scores ? [
    { subject: 'Reach', value: result.scores.reach_score, fullMark: 25 },
    { subject: 'Diversity', value: result.scores.diversity_score, fullMark: 25 },
    { subject: 'Influence', value: result.scores.influence_score, fullMark: 25 },
    { subject: 'Consistency', value: result.scores.consistency_score, fullMark: 25 },
  ] : [];

  return (
    <div className="page">
      <div className="page-header"><h2>⭐ Social Score</h2><p>Rate your online presence out of 100</p></div>
      <div className="card">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} className="input" />
          <button onClick={handle} disabled={loading} className="btn">{loading ? '⏳ Scoring...' : '⭐ Get Score'}</button>
        </div>
      </div>
      {loading && <LoadingCard msg="⭐ Calculating social score..." />}
      {result && !loading && (
        result.error ? <div className="card"><p style={{ color: '#ff6666' }}>❌ {result.error}</p></div> :
        <>
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>⭐ Social Score — {result.username}</h2>
            <div style={{ margin: '20px 0' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '140px', height: '140px', borderRadius: '50%',
                border: `6px solid ${gradeColor(result.scores?.grade)}`,
                flexDirection: 'column'
              }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: gradeColor(result.scores?.grade) }}>
                  {result.scores?.total_score}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>out of 100</span>
              </div>
              <div style={{ marginTop: '12px' }}>
                <span style={{
                  background: gradeColor(result.scores?.grade),
                  color: '#000', fontWeight: '700', fontSize: '1.2rem',
                  padding: '4px 20px', borderRadius: '20px'
                }}>Grade: {result.scores?.grade}</span>
              </div>
            </div>
            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>{result.scores?.summary}</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card"><p className="stat-number" style={{ color: '#60a5fa' }}>{result.scores?.reach_score}/25</p><p className="stat-label">Reach</p></div>
            <div className="stat-card"><p className="stat-number" style={{ color: '#34d399' }}>{result.scores?.diversity_score}/25</p><p className="stat-label">Diversity</p></div>
            <div className="stat-card"><p className="stat-number" style={{ color: '#f472b6' }}>{result.scores?.influence_score}/25</p><p className="stat-label">Influence</p></div>
            <div className="stat-card"><p className="stat-number" style={{ color: '#fbbf24' }}>{result.scores?.consistency_score}/25</p><p className="stat-label">Consistency</p></div>
          </div>
          {radarData.length > 0 && (
            <div className="card">
              <h2>📊 Score Breakdown</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#2e2e2e" />
                  <PolarAngleAxis dataKey="subject" stroke="#888" />
                  <Radar name="Score" dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── HISTORY PAGE ──────────────────────────────────────────────

const TYPE_ICONS = {
  search: '🔍', breach: '🔓', compare: '⚖️', personality: '🧠',
  location: '🗺️', monitor: '🔔', news: '📰', password: '🔏',
  avatars: '📸', network: '🕸️', timeline: '📅', darkweb: '🌑', score: '⭐'
};

function HistoryPage({ userId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'history'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [userId]);

  const filtered = filter === 'all' ? history : history.filter(h => h.type === filter);
  const types = ['all', ...Object.keys(TYPE_ICONS)];

  return (
    <div className="page">
      <div className="page-header">
        <h2>📜 Search History</h2>
        <p>All your past searches saved per account</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{
              background: filter === t ? '#a78bfa' : '#1a1a1a',
              border: `1px solid ${filter === t ? '#a78bfa' : '#2e2e2e'}`,
              color: filter === t ? '#000' : '#aaa',
              borderRadius: '20px', padding: '4px 14px',
              fontSize: '0.78rem', cursor: 'pointer', fontWeight: filter === t ? '700' : '400'
            }}>
            {t === 'all' ? '🗂️ All' : `${TYPE_ICONS[t]} ${t}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ color: '#a78bfa', marginTop: '16px' }}>Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '12px' }}>🗂️</p>
          <p style={{ color: '#888' }}>No history yet. Start searching!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((item) => (
            <div key={item.id} style={{
              background: '#111', border: '1px solid #2a2a2a',
              borderRadius: '12px', padding: '14px 18px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>{TYPE_ICONS[item.type] || '🔎'}</span>
                <div>
                  <p style={{ color: '#e0e0e0', fontWeight: '600', fontSize: '0.9rem' }}>{item.query}</p>
                  <p style={{ color: '#888', fontSize: '0.78rem' }}>{item.summary}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  background: '#1e1e1e', border: '1px solid #3e3e3e',
                  borderRadius: '12px', padding: '2px 10px',
                  color: '#a78bfa', fontSize: '0.72rem'
                }}>{item.type}</span>
                <p style={{ color: '#555', fontSize: '0.72rem', marginTop: '4px' }}>
                  {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Just now'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── NAV LINKS ──────────────────────────────────────────────

const NAV_LINKS = [
  { to: '/', label: '🔍 Search', group: 'Core' },
  { to: '/breach', label: '🔓 Breach', group: 'Core' },
  { to: '/compare', label: '⚖️ Compare', group: 'Core' },
  { to: '/personality', label: '🧠 Personality', group: 'Core' },
  { to: '/location', label: '🗺️ Location', group: 'Core' },
  { to: '/monitor', label: '🔔 Monitor', group: 'Advanced' },
  { to: '/news', label: '📰 News', group: 'Advanced' },
  { to: '/password', label: '🔏 Password', group: 'Advanced' },
  { to: '/avatars', label: '📸 Avatars', group: 'Advanced' },
  { to: '/network', label: '🕸️ Network', group: 'Advanced' },
  { to: '/timeline', label: '📅 Timeline', group: 'New' },
  { to: '/darkweb', label: '🌑 Dark Web', group: 'New' },
  { to: '/score', label: '⭐ Social Score', group: 'New' },
  { to: '/history', label: '📜 History', group: 'New' },
];

// ── APP ──────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  if (authLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0a0a' }}>
      <p style={{ color: '#a78bfa', fontSize: '1.2rem' }}>⏳ Loading...</p>
    </div>
  );

  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <BrowserRouter>
      <div className="app">
        <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <div>
            <h1>🕵️ SocialSpy</h1>
            <p>AI-Powered Digital Footprint Analyzer</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '6px' }}>👤 {user.email}</p>
            <button onClick={() => signOut(auth)} className="btn"
              style={{ background: '#1a1a1a', border: '1px solid #ff4444', color: '#ff6666', fontSize: '0.8rem', padding: '6px 14px', width: 'auto' }}>
              🚪 Logout
            </button>
          </div>
        </header>

        <div className="app-body">
          {sidebarOpen && (
            <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />
          )}

          <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <span className="sidebar-label">Core</span>
            {NAV_LINKS.filter(l => l.group === 'Core').map(link => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
            <div className="sidebar-divider" />
            <span className="sidebar-label">Advanced</span>
            {NAV_LINKS.filter(l => l.group === 'Advanced').map(link => (
              <NavLink key={link.to} to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
            <div className="sidebar-divider" />
            <span className="sidebar-label" style={{ color: '#34d399' }}>✨ New</span>
            {NAV_LINKS.filter(l => l.group === 'New').map(link => (
              <NavLink key={link.to} to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `sidebar-btn ${isActive ? 'active' : ''}`}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <main className="main">
            <Routes>
              <Route path="/" element={<SearchPage userId={user.uid} />} />
              <Route path="/breach" element={<BreachPage userId={user.uid} />} />
              <Route path="/compare" element={<ComparePage userId={user.uid} />} />
              <Route path="/personality" element={<PersonalityPage userId={user.uid} />} />
              <Route path="/location" element={<LocationPage userId={user.uid} />} />
              <Route path="/monitor" element={<MonitorPage userId={user.uid} />} />
              <Route path="/news" element={<NewsPage userId={user.uid} />} />
              <Route path="/password" element={<PasswordPage userId={user.uid} />} />
              <Route path="/avatars" element={<AvatarsPage userId={user.uid} />} />
              <Route path="/network" element={<NetworkPage userId={user.uid} />} />
              <Route path="/timeline" element={<TimelinePage userId={user.uid} />} />
              <Route path="/darkweb" element={<DarkWebPage userId={user.uid} />} />
              <Route path="/score" element={<ScorePage userId={user.uid} />} />
              <Route path="/history" element={<HistoryPage userId={user.uid} />} />
            </Routes>
          </main>

          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </BrowserRouter>
  );
}