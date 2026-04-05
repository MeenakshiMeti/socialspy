import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import jsPDF from 'jspdf';
import './App.css';

const API = 'https://socialspy.onrender.com';

const CATEGORIES = {
  Developer: ['github', 'gitlab', 'codechef', 'codeforces', 'hackerrank', 'leetcode', 'stackoverflow', 'replit', 'codeberg', 'gitea', 'coderwall', 'codewars', 'hackerearth', 'hackernews', 'hackerone', 'codesandbox', 'codecademy'],
  Gaming: ['steam', 'roblox', 'chess', 'minecraft', 'kongregate', 'nitrotype', 'pokemonshowdown', 'runescape', 'playstrategy', 'gaiaonline'],
  Social: ['linkedin', 'snapchat', 'bluesky', 'clubhouse', 'plurk', 'periscope', 'flipboard', 'disqus', 'mastodon'],
  Music: ['bandcamp', 'mixcloud', 'audiojungle', 'reverbnation', 'soundcloud', 'freesound'],
  Creative: ['deviantart', 'dribbble', 'sketchfab', 'cgtrader', 'coroflot', 'carbonmade'],
  Other: []
};

const COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#94a3b8'];

const TABS = [
  { id: 'search', label: '🔍 Search' },
  { id: 'breach', label: '🔓 Breach' },
  { id: 'compare', label: '⚖️ Compare' },
  { id: 'personality', label: '🧠 Personality' },
  { id: 'location', label: '🗺️ Location' },
  { id: 'monitor', label: '🔔 Monitor' },
  { id: 'news', label: '📰 News' },
  { id: 'password', label: '🔏 Password' },
  { id: 'avatars', label: '📸 Avatars' },
  { id: 'graph', label: '🕸️ Network' },
];

const urlParams = new URLSearchParams(window.location.search);
const urlUsername = urlParams.get('username') || '';

export default function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [username, setUsername] = useState(urlUsername);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [breachLoading, setBreachLoading] = useState(false);
  const [breachResult, setBreachResult] = useState(null);
  const [username1, setUsername1] = useState('');
  const [username2, setUsername2] = useState('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [pUsername, setPUsername] = useState('');
  const [pLoading, setPLoading] = useState(false);
  const [pResult, setPResult] = useState(null);
  const [locUsername, setLocUsername] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [locResult, setLocResult] = useState(null);
  const [monUsername, setMonUsername] = useState('');
  const [monLoading, setMonLoading] = useState(false);
  const [monResult, setMonResult] = useState(null);
  const [newsUsername, setNewsUsername] = useState('');
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsResult, setNewsResult] = useState(null);
  const [pwEmail, setPwEmail] = useState('');
  const [pwBreaches, setPwBreaches] = useState([]);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwResult, setPwResult] = useState(null);
  const [avUsername, setAvUsername] = useState('');
  const [avLoading, setAvLoading] = useState(false);
  const [avResult, setAvResult] = useState(null);
  const [graphUsername, setGraphUsername] = useState('');
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphResult, setGraphResult] = useState(null);

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

  const handleSearch = async (searchUsername) => {
    const uname = searchUsername || username;
    if (!uname.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await axios.post(`${API}/search`, { username: uname });
      setResult(res.data);
    } catch (err) { setError('Something went wrong. Is the backend running?'); }
    setLoading(false);
  };

  useEffect(() => { if (urlUsername) handleSearch(urlUsername); }, []);

  const handleBreach = async () => {
    if (!email.trim()) return;
    setBreachLoading(true); setBreachResult(null);
    try { const res = await axios.post(`${API}/breach`, { email }); setBreachResult(res.data); }
    catch (err) { setBreachResult({ error: 'Something went wrong!' }); }
    setBreachLoading(false);
  };

  const handleCompare = async () => {
    if (!username1.trim() || !username2.trim()) return;
    setCompareLoading(true); setCompareResult(null);
    try { const res = await axios.post(`${API}/compare`, { username1, username2 }); setCompareResult(res.data); }
    catch (err) { setCompareResult({ error: 'Something went wrong!' }); }
    setCompareLoading(false);
  };

  const handlePersonality = async () => {
    if (!pUsername.trim()) return;
    setPLoading(true); setPResult(null);
    try { const res = await axios.post(`${API}/personality`, { username: pUsername }); setPResult(res.data); }
    catch (err) { setPResult({ error: 'Something went wrong!' }); }
    setPLoading(false);
  };

  const handleLocation = async () => {
    if (!locUsername.trim()) return;
    setLocLoading(true); setLocResult(null);
    try { const res = await axios.post(`${API}/location`, { username: locUsername }); setLocResult(res.data); }
    catch (err) { setLocResult({ error: 'Something went wrong!' }); }
    setLocLoading(false);
  };

  const handleMonitor = async () => {
    if (!monUsername.trim()) return;
    setMonLoading(true); setMonResult(null);
    try { const res = await axios.post(`${API}/monitor`, { username: monUsername }); setMonResult(res.data); }
    catch (err) { setMonResult({ error: 'Something went wrong!' }); }
    setMonLoading(false);
  };

  const handleNews = async () => {
    if (!newsUsername.trim()) return;
    setNewsLoading(true); setNewsResult(null);
    try { const res = await axios.post(`${API}/news`, { username: newsUsername }); setNewsResult(res.data); }
    catch (err) { setNewsResult({ error: 'Something went wrong!' }); }
    setNewsLoading(false);
  };

  const handlePassword = async () => {
    if (!pwEmail.trim()) return;
    setPwLoading(true); setPwResult(null);
    try { const res = await axios.post(`${API}/password-advice`, { email: pwEmail, breaches: pwBreaches }); setPwResult(res.data); }
    catch (err) { setPwResult({ error: 'Something went wrong!' }); }
    setPwLoading(false);
  };

  const handleAvatars = async () => {
    if (!avUsername.trim()) return;
    setAvLoading(true); setAvResult(null);
    try { const res = await axios.post(`${API}/avatars`, { username: avUsername }); setAvResult(res.data); }
    catch (err) { setAvResult({ error: 'Something went wrong!' }); }
    setAvLoading(false);
  };

  const handleGraph = async () => {
    if (!graphUsername.trim()) return;
    setGraphLoading(true); setGraphResult(null);
    try { const res = await axios.post(`${API}/search`, { username: graphUsername }); setGraphResult(res.data); }
    catch (err) { setGraphResult({ error: 'Something went wrong!' }); }
    setGraphLoading(false);
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
    const analysisLines = doc.splitTextToSize(result.analysis || '', 170);
    doc.text(analysisLines, 20, 90);
    let yPos = 90 + (analysisLines.length * 5) + 10;
    doc.setFontSize(9);
    const accounts = result?.accounts || [];
    accounts.forEach(url => {
      if (yPos > 280) { doc.addPage(); yPos = 20; }
      doc.text(`• ${url}`, 20, yPos); yPos += 6;
    });
    doc.save(`socialspy-${result.username}-report.pdf`);
  };

  const accounts = result?.accounts || [];
  const categoryData = getCategoryData(accounts);

  const LoadingCard = ({ msg }) => (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="spinner"></div>
      <p style={{ color: '#a78bfa', marginTop: '16px' }}>{msg}</p>
      <p style={{ color: '#888', fontSize: '0.85rem' }}>This may take 30-60 seconds</p>
    </div>
  );

  return (
    <div className="app">
      <header className="header">
        <h1>🕵️ SocialSpy</h1>
        <p>AI-Powered Digital Footprint Analyzer</p>
      </header>

      <div className="app-body">
        <nav className="sidebar">
          <span className="sidebar-label">Core</span>
          {TABS.slice(0, 5).map(tab => (
            <button key={tab.id} className={`sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
          ))}
          <div className="sidebar-divider" />
          <span className="sidebar-label">Advanced</span>
          {TABS.slice(5).map(tab => (
            <button key={tab.id} className={`sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
          ))}
        </nav>

        <main className="main">

        {/* SEARCH */}
        {activeTab === 'search' && (
          <>
            <div className="card">
              <h2>🔍 Search Username</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Find accounts across 400+ social networks instantly</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter username (e.g. john)" value={username}
                  onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="input" />
                <button onClick={() => handleSearch()} disabled={loading} className="btn">{loading ? '⏳ Searching...' : '🔍 Search'}</button>
              </div>
            </div>
            {error && <div className="card error">❌ {error}</div>}
            {loading && <LoadingCard msg="🔍 Searching across 400+ platforms..." />}
            {result && !loading && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button onClick={exportPDF} className="btn" style={{ background: '#1e1e1e', border: '1px solid #a78bfa', color: '#a78bfa' }}>📤 Export PDF</button>
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
                          {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
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
          </>
        )}

        {/* BREACH */}
        {activeTab === 'breach' && (
          <>
            <div className="card">
              <h2>🔓 Email Breach Checker</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Check if your email was exposed in any data breach</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="email" placeholder="Enter email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBreach()} className="input" />
                <button onClick={handleBreach} disabled={breachLoading} className="btn">{breachLoading ? '⏳ Checking...' : '🔓 Check'}</button>
              </div>
            </div>
            {breachLoading && <LoadingCard msg="🔓 Checking breach databases..." />}
            {breachResult && !breachLoading && (
              <div className="card">
                {breachResult.error ? <p style={{ color: '#ff6666' }}>❌ {breachResult.error}</p>
                  : breachResult.breached ? (
                    <>
                      <div style={{ background: '#2a1a1a', border: '1px solid #ff4444', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                        <h3 style={{ color: '#ff6666' }}>⚠️ Found in {breachResult.count} breach{breachResult.count > 1 ? 'es' : ''}!</h3>
                        <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Change your passwords immediately!</p>
                      </div>
                      {breachResult.breaches.map((b, i) => (
                        <div key={i} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '10px', border: '1px solid #2a2a2a' }}>
                          <p style={{ color: '#ff6666', fontWeight: '600' }}>🔴 {b.name}</p>
                          <p style={{ color: '#888', fontSize: '0.82rem' }}>Domain: {b.domain} | Date: {b.date}</p>
                        </div>
                      ))}
                      <button onClick={() => { setPwEmail(email); setPwBreaches(breachResult.breaches); setActiveTab('password'); }}
                        className="btn" style={{ marginTop: '12px', width: '100%' }}>🔏 Get Password Security Advice</button>
                    </>
                  ) : (
                    <div style={{ background: '#1a2a1a', border: '1px solid #44ff44', borderRadius: '10px', padding: '16px' }}>
                      <h3 style={{ color: '#66ff99' }}>✅ No breaches found!</h3>
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {/* COMPARE */}
        {activeTab === 'compare' && (
          <>
            <div className="card">
              <h2>⚖️ Compare Usernames</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Compare digital footprints of two usernames</p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <input type="text" placeholder="First username" value={username1} onChange={e => setUsername1(e.target.value)} className="input" />
                <input type="text" placeholder="Second username" value={username2} onChange={e => setUsername2(e.target.value)} className="input" />
              </div>
              <button onClick={handleCompare} disabled={compareLoading} className="btn" style={{ width: '100%' }}>
                {compareLoading ? '⏳ Comparing... (2 mins)' : '⚖️ Compare'}
              </button>
            </div>
            {compareLoading && <LoadingCard msg="⚖️ Searching both usernames..." />}
            {compareResult && !compareLoading && (
              <>
                <div className="stats-grid">
                  <div className="stat-card"><p className="stat-number">{compareResult.count1}</p><p className="stat-label">{compareResult.username1}</p></div>
                  <div className="stat-card"><p className="stat-number" style={{ color: '#f472b6' }}>{compareResult.common_count}</p><p className="stat-label">Common</p></div>
                  <div className="stat-card"><p className="stat-number">{compareResult.count2}</p><p className="stat-label">{compareResult.username2}</p></div>
                </div>
                <div className="card">
                  <h2>📊 Chart</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[{ name: compareResult.username1, accounts: compareResult.count1 }, { name: compareResult.username2, accounts: compareResult.count2 }]}>
                      <XAxis dataKey="name" stroke="#888" /><YAxis stroke="#888" /><Tooltip />
                      <Bar dataKey="accounts" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card"><h2>🤖 Analysis</h2><div className="analysis">{compareResult.analysis}</div></div>
              </>
            )}
          </>
        )}

        {/* PERSONALITY */}
        {activeTab === 'personality' && (
          <>
            <div className="card">
              <h2>🧠 AI Personality Analyzer</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Discover personality insights from digital footprint</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter username" value={pUsername} onChange={e => setPUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePersonality()} className="input" />
                <button onClick={handlePersonality} disabled={pLoading} className="btn">{pLoading ? '⏳ Analyzing...' : '🧠 Analyze'}</button>
              </div>
            </div>
            {pLoading && <LoadingCard msg="🧠 Analyzing personality..." />}
            {pResult && !pLoading && (
              <div className="card">
                {pResult.error ? <p style={{ color: '#ff6666' }}>❌ {pResult.error}</p> : (
                  <><h2>🧠 Personality — {pResult.username}</h2><p style={{ color: '#888', marginBottom: '16px', fontSize: '0.85rem' }}>Based on {pResult.platform_count} platforms</p><div className="analysis">{pResult.personality}</div></>
                )}
              </div>
            )}
          </>
        )}

        {/* LOCATION */}
        {activeTab === 'location' && (
          <>
            <div className="card">
              <h2>🗺️ Location Detector</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Guess someone's country from their digital footprint</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter username" value={locUsername} onChange={e => setLocUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLocation()} className="input" />
                <button onClick={handleLocation} disabled={locLoading} className="btn">{locLoading ? '⏳ Detecting...' : '🗺️ Detect'}</button>
              </div>
            </div>
            {locLoading && <LoadingCard msg="🗺️ Analyzing location..." />}
            {locResult && !locLoading && (
              <div className="card">
                {locResult.error ? <p style={{ color: '#ff6666' }}>❌ {locResult.error}</p> : (
                  <><h2>🗺️ Location — {locResult.username}</h2><p style={{ color: '#888', marginBottom: '16px', fontSize: '0.85rem' }}>Based on {locResult.platform_count} platforms</p><div className="analysis">{locResult.location_analysis}</div></>
                )}
              </div>
            )}
          </>
        )}

        {/* MONITOR */}
        {activeTab === 'monitor' && (
          <>
            <div className="card">
              <h2>🔔 Profile Monitor</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Monitor any username and detect profile changes</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter username to monitor" value={monUsername} onChange={e => setMonUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleMonitor()} className="input" />
                <button onClick={handleMonitor} disabled={monLoading} className="btn">{monLoading ? '⏳ Checking...' : '🔔 Monitor'}</button>
              </div>
            </div>
            {monLoading && <LoadingCard msg="🔔 Checking for changes..." />}
            {monResult && !monLoading && (
              <div className="card">
                {monResult.error ? <p style={{ color: '#ff6666' }}>❌ {monResult.error}</p> : (
                  <>
                    <h2>🔔 Monitor — {monResult.username}</h2>
                    <div style={{ background: '#1a1a1a', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                      <p style={{ color: '#a78bfa' }}>📊 Current accounts: <strong>{monResult.current_count}</strong></p>
                      <p style={{ color: '#888', fontSize: '0.85rem' }}>Checked: {new Date(monResult.timestamp).toLocaleString()}</p>
                    </div>
                    {monResult.changes && monResult.changes.last_checked ? (
                      monResult.changes.detected ? (
                        <div style={{ background: '#2a1a1a', border: '1px solid #ff4444', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                          <h3 style={{ color: '#ff6666' }}>⚠️ Changes Detected!</h3>
                          {monResult.changes.added.length > 0 && <p style={{ color: '#66ff99' }}>✅ New: {monResult.changes.added.join(', ')}</p>}
                          {monResult.changes.removed.length > 0 && <p style={{ color: '#ff6666' }}>❌ Removed: {monResult.changes.removed.join(', ')}</p>}
                        </div>
                      ) : (
                        <div style={{ background: '#1a2a1a', border: '1px solid #44ff44', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                          <h3 style={{ color: '#66ff99' }}>✅ No changes detected!</h3>
                        </div>
                      )
                    ) : (
                      <div style={{ background: '#1a1a2a', border: '1px solid #a78bfa', borderRadius: '10px', padding: '16px' }}>
                        <p style={{ color: '#a78bfa' }}>📌 First snapshot saved! Click Monitor again to detect changes.</p>
                      </div>
                    )}
                    <div className="accounts-grid" style={{ marginTop: '16px' }}>
                      {monResult.accounts.slice(0, 20).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="account-card">
                          🔗 {url.replace('https://', '').split('/')[0]}
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* NEWS */}
        {activeTab === 'news' && (
          <>
            <div className="card">
              <h2>📰 News Finder</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Find news and mentions about any username or person</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter username or name" value={newsUsername} onChange={e => setNewsUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNews()} className="input" />
                <button onClick={handleNews} disabled={newsLoading} className="btn">{newsLoading ? '⏳ Finding...' : '📰 Find News'}</button>
              </div>
            </div>
            {newsLoading && <LoadingCard msg="📰 Finding news..." />}
            {newsResult && !newsLoading && (
              <div className="card">
                {newsResult.error ? <p style={{ color: '#ff6666' }}>❌ {newsResult.error}</p> : (
                  <><h2>📰 News — {newsResult.username}</h2><div className="analysis" style={{ whiteSpace: 'pre-wrap' }}>{newsResult.news}</div></>
                )}
              </div>
            )}
          </>
        )}

        {/* PASSWORD */}
        {activeTab === 'password' && (
          <>
            <div className="card">
              <h2>🔏 Password Security Advisor</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Get AI-powered password security advice</p>
              <input type="email" placeholder="Enter your email" value={pwEmail} onChange={e => setPwEmail(e.target.value)} className="input" style={{ marginBottom: '12px' }} />
              <button onClick={handlePassword} disabled={pwLoading} className="btn" style={{ width: '100%' }}>
                {pwLoading ? '⏳ Analyzing...' : '🔏 Get Security Advice'}
              </button>
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '8px' }}>💡 Check Breach tab first for best results!</p>
            </div>
            {pwLoading && <LoadingCard msg="🔏 Analyzing security..." />}
            {pwResult && !pwLoading && (
              <div className="card">
                {pwResult.error ? <p style={{ color: '#ff6666' }}>❌ {pwResult.error}</p> : (
                  <><h2>🔏 Security Advice</h2><div className="analysis">{pwResult.advice}</div></>
                )}
              </div>
            )}
          </>
        )}

        {/* AVATARS */}
        {activeTab === 'avatars' && (
          <>
            <div className="card">
              <h2>📸 Avatar Finder</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Find profile pictures from across social platforms</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter username" value={avUsername} onChange={e => setAvUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAvatars()} className="input" />
                <button onClick={handleAvatars} disabled={avLoading} className="btn">{avLoading ? '⏳ Finding...' : '📸 Find Avatars'}</button>
              </div>
            </div>
            {avLoading && <LoadingCard msg="📸 Finding avatars..." />}
            {avResult && !avLoading && (
              <div className="card">
                {avResult.error ? <p style={{ color: '#ff6666' }}>❌ {avResult.error}</p> : (
                  <>
                    <h2>📸 Avatars — {avResult.username}</h2>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <img src={avResult.default_avatar} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid #a78bfa' }} />
                      <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '8px' }}>Generated Avatar</p>
                    </div>
                    {avResult.avatars.length > 0 && (
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
                        {avResult.avatars.map((av, i) => (
                          <div key={i} style={{ textAlign: 'center' }}>
                            <img src={av.avatar} alt={av.platform} style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid #2e2e2e' }}
                              onError={e => { e.target.src = avResult.default_avatar; }} />
                            <p style={{ color: '#888', fontSize: '0.75rem', marginTop: '4px' }}>{av.platform}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '10px' }}>Found on {avResult.platform_count} platforms:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {avResult.platforms.map((p, i) => (
                        <span key={i} style={{ background: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '20px', padding: '4px 12px', color: '#a78bfa', fontSize: '0.78rem' }}>{p}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* NETWORK GRAPH */}
        {activeTab === 'graph' && (
          <>
            <div className="card">
              <h2>🕸️ Social Network Graph</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>Visualize username connections across platforms</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter username" value={graphUsername} onChange={e => setGraphUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleGraph()} className="input" />
                <button onClick={handleGraph} disabled={graphLoading} className="btn">{graphLoading ? '⏳ Building...' : '🕸️ Build Graph'}</button>
              </div>
            </div>
            {graphLoading && <LoadingCard msg="🕸️ Building network graph..." />}
            {graphResult && !graphLoading && (
              <div className="card">
                {graphResult.error ? <p style={{ color: '#ff6666' }}>❌ {graphResult.error}</p> : (
                  <>
                    <h2>🕸️ Network — {graphUsername} ({graphResult.found_count} platforms)</h2>
                    <div style={{ background: '#0a0a0a', borderRadius: '10px', padding: '20px', minHeight: '400px' }}>
                      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'inline-block', background: '#a78bfa', borderRadius: '50%', width: '70px', height: '70px', lineHeight: '70px', fontWeight: '700', color: '#fff', fontSize: '0.75rem' }}>
                          {graphUsername.slice(0, 8)}
                        </div>
                        <p style={{ color: '#a78bfa', marginTop: '8px', fontSize: '0.85rem' }}>↕️ Connected to {graphResult.found_count} platforms</p>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                        {(graphResult.accounts || []).slice(0, 30).map((url, i) => {
                          const domain = url.split('/')[2]?.replace('www.', '') || url;
                          const colors = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#f87171', '#94a3b8', '#a78bfa'];
                          const color = colors[i % colors.length];
                          return (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{
                              background: '#1a1a1a', border: `1px solid ${color}`,
                              borderRadius: '20px', padding: '6px 14px',
                              color: color, fontSize: '0.78rem', textDecoration: 'none'
                            }}>
                              🔗 {domain}
                            </a>
                          );
                        })}
                      </div>
                      <p style={{ color: '#555', textAlign: 'center', marginTop: '20px', fontSize: '0.8rem' }}>
                        Showing {Math.min(30, graphResult.found_count)} of {graphResult.found_count} platforms
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

      </main>
      </div>
    </div>
  );
}