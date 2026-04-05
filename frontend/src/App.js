import React, { useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import jsPDF from 'jspdf';
import './App.css';

const API ='https://socialspy.onrender.com';

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
  { id: 'breach', label: '🔓 Breach Check' },
  { id: 'compare', label: '⚖️ Compare' },
  { id: 'personality', label: '🧠 Personality' },
  { id: 'location', label: '🗺️ Location' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('search');

  // Search state
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Breach state
  const [email, setEmail] = useState('');
  const [breachLoading, setBreachLoading] = useState(false);
  const [breachResult, setBreachResult] = useState(null);

  // Compare state
  const [username1, setUsername1] = useState('');
  const [username2, setUsername2] = useState('');
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResult, setCompareResult] = useState(null);

  // Personality state
  const [pUsername, setPUsername] = useState('');
  const [pLoading, setPLoading] = useState(false);
  const [pResult, setPResult] = useState(null);

  // Location state
  const [locUsername, setLocUsername] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [locResult, setLocResult] = useState(null);

  const getCategoryData = (accounts = []) => {
    const counts = { Developer: 0, Gaming: 0, Social: 0, Music: 0, Creative: 0, Other: 0 };
    accounts.forEach(url => {
      const domain = url.toLowerCase();
      let matched = false;
      for (const [category, keywords] of Object.entries(CATEGORIES)) {
        if (category === 'Other') continue;
        if (keywords.some(k => domain.includes(k))) {
          counts[category]++;
          matched = true;
          break;
        }
      }
      if (!matched) counts.Other++;
    });
    return Object.entries(counts)
      .filter(([_, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  };

  const handleSearch = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axios.post(`${API}/search`, { username });
      setResult(res.data);
    } catch (err) {
      setError('Something went wrong. Is the backend running?');
    }
    setLoading(false);
  };

  const handleBreach = async () => {
    if (!email.trim()) return;
    setBreachLoading(true);
    setBreachResult(null);
    try {
      const res = await axios.post(`${API}/breach`, { email });
      setBreachResult(res.data);
    } catch (err) {
      setBreachResult({ error: 'Something went wrong!' });
    }
    setBreachLoading(false);
  };

  const handleCompare = async () => {
    if (!username1.trim() || !username2.trim()) return;
    setCompareLoading(true);
    setCompareResult(null);
    try {
      const res = await axios.post(`${API}/compare`, { username1, username2 });
      setCompareResult(res.data);
    } catch (err) {
      setCompareResult({ error: 'Something went wrong!' });
    }
    setCompareLoading(false);
  };

  const handlePersonality = async () => {
    if (!pUsername.trim()) return;
    setPLoading(true);
    setPResult(null);
    try {
      const res = await axios.post(`${API}/personality`, { username: pUsername });
      setPResult(res.data);
    } catch (err) {
      setPResult({ error: 'Something went wrong!' });
    }
    setPLoading(false);
  };

  const handleLocation = async () => {
    if (!locUsername.trim()) return;
    setLocLoading(true);
    setLocResult(null);
    try {
      const res = await axios.post(`${API}/location`, { username: locUsername });
      setLocResult(res.data);
    } catch (err) {
      setLocResult({ error: 'Something went wrong!' });
    }
    setLocLoading(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(107, 70, 193);
    doc.text('SocialSpy Report', 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Username: ${result.username}`, 20, 35);
    doc.text(`Accounts Found: ${result.found_count}`, 20, 45);
    doc.text(`Privacy Risk: ${result.found_count > 20 ? 'High' : result.found_count > 10 ? 'Medium' : 'Low'}`, 20, 55);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 65);
    doc.setFontSize(14);
    doc.setTextColor(107, 70, 193);
    doc.text('AI Analysis:', 20, 80);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const analysisLines = doc.splitTextToSize(result.analysis || '', 170);
    doc.text(analysisLines, 20, 90);
    let yPos = 90 + (analysisLines.length * 5) + 10;
    doc.setFontSize(14);
    doc.setTextColor(107, 70, 193);
    doc.text('Found Accounts:', 20, yPos);
    yPos += 10;
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const accounts = result?.accounts || [];
    accounts.forEach(url => {
      if (yPos > 280) { doc.addPage(); yPos = 20; }
      doc.text(`• ${url}`, 20, yPos);
      yPos += 6;
    });
    doc.save(`socialspy-${result.username}-report.pdf`);
  };

  const accounts = result?.accounts || [];
  const categoryData = getCategoryData(accounts);

  return (
    <div className="app">
      <header className="header">
        <h1>🕵️ SocialSpy</h1>
        <p>AI-Powered Digital Footprint Analyzer</p>
      </header>

      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="main">

        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <>
            <div className="card">
              <h2>🔍 Search Username</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>
                Find accounts across 400+ social networks instantly
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter username (e.g. john)" value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="input" />
                <button onClick={handleSearch} disabled={loading} className="btn">
                  {loading ? '⏳ Searching...' : '🔍 Search'}
                </button>
              </div>
            </div>

            {error && <div className="card error">❌ {error}</div>}

            {loading && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div className="spinner"></div>
                <p style={{ color: '#a78bfa', marginTop: '16px' }}>🔍 Searching across 400+ platforms...</p>
                <p style={{ color: '#888', fontSize: '0.85rem' }}>This may take 30-60 seconds</p>
              </div>
            )}

            {result && !loading && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button onClick={exportPDF} className="btn" style={{ background: '#1e1e1e', border: '1px solid #a78bfa', color: '#a78bfa' }}>
                    📤 Export PDF
                  </button>
                </div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <p className="stat-number">{result.found_count}</p>
                    <p className="stat-label">Accounts Found</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-number" style={{ color: result.found_count > 20 ? '#ff6666' : result.found_count > 10 ? '#ffaa00' : '#66ff99' }}>
                      {result.found_count > 20 ? 'High' : result.found_count > 10 ? 'Medium' : 'Low'}
                    </p>
                    <p className="stat-label">Privacy Risk</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-number">400+</p>
                    <p className="stat-label">Platforms Searched</p>
                  </div>
                </div>

                {categoryData.length > 0 && (
                  <div className="card">
                    <h2>📊 Platform Categories</h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}>
                          {categoryData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="card">
                  <h2>🤖 AI Analysis</h2>
                  <div className="analysis">{result.analysis}</div>
                </div>

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

        {/* BREACH CHECK TAB */}
        {activeTab === 'breach' && (
          <>
            <div className="card">
              <h2>🔓 Email Breach Checker</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>
                Check if your email was exposed in any data breach
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="email" placeholder="Enter email (e.g. john@gmail.com)" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBreach()}
                  className="input" />
                <button onClick={handleBreach} disabled={breachLoading} className="btn">
                  {breachLoading ? '⏳ Checking...' : '🔓 Check'}
                </button>
              </div>
            </div>

            {breachLoading && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div className="spinner"></div>
                <p style={{ color: '#a78bfa', marginTop: '16px' }}>Checking breach databases...</p>
              </div>
            )}

            {breachResult && !breachLoading && (
              <div className="card">
                {breachResult.error ? (
                  <p style={{ color: '#ff6666' }}>❌ {breachResult.error}</p>
                ) : breachResult.breached ? (
                  <>
                    <div style={{ background: '#2a1a1a', border: '1px solid #ff4444', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                      <h3 style={{ color: '#ff6666' }}>⚠️ Found in {breachResult.count} breach{breachResult.count > 1 ? 'es' : ''}!</h3>
                      <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Your email was exposed. Change your passwords immediately!</p>
                    </div>
                    {breachResult.breaches.map((b, i) => (
                      <div key={i} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '10px', border: '1px solid #2a2a2a' }}>
                        <p style={{ color: '#ff6666', fontWeight: '600' }}>🔴 {b.name}</p>
                        <p style={{ color: '#888', fontSize: '0.82rem' }}>Domain: {b.domain} | Date: {b.date}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ background: '#1a2a1a', border: '1px solid #44ff44', borderRadius: '10px', padding: '16px' }}>
                    <h3 style={{ color: '#66ff99' }}>✅ Good news! No breaches found!</h3>
                    <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Your email was not found in any known data breaches.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* COMPARE TAB */}
        {activeTab === 'compare' && (
          <>
            <div className="card">
              <h2>⚖️ Compare Usernames</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>
                Compare digital footprints of two usernames
              </p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <input type="text" placeholder="First username" value={username1}
                  onChange={e => setUsername1(e.target.value)} className="input" />
                <input type="text" placeholder="Second username" value={username2}
                  onChange={e => setUsername2(e.target.value)} className="input" />
              </div>
              <button onClick={handleCompare} disabled={compareLoading} className="btn" style={{ width: '100%' }}>
                {compareLoading ? '⏳ Comparing... (takes 2 mins)' : '⚖️ Compare'}
              </button>
            </div>

            {compareLoading && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div className="spinner"></div>
                <p style={{ color: '#a78bfa', marginTop: '16px' }}>⚖️ Searching both usernames...</p>
                <p style={{ color: '#888', fontSize: '0.85rem' }}>This takes 2-3 minutes</p>
              </div>
            )}

            {compareResult && !compareLoading && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <p className="stat-number">{compareResult.count1}</p>
                    <p className="stat-label">{compareResult.username1} accounts</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-number" style={{ color: '#f472b6' }}>{compareResult.common_count}</p>
                    <p className="stat-label">Common Platforms</p>
                  </div>
                  <div className="stat-card">
                    <p className="stat-number">{compareResult.count2}</p>
                    <p className="stat-label">{compareResult.username2} accounts</p>
                  </div>
                </div>

                <div className="card">
                  <h2>📊 Comparison Chart</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { name: compareResult.username1, accounts: compareResult.count1 },
                      { name: compareResult.username2, accounts: compareResult.count2 },
                    ]}>
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip />
                      <Bar dataKey="accounts" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h2>🤖 AI Comparison Analysis</h2>
                  <div className="analysis">{compareResult.analysis}</div>
                </div>
              </>
            )}
          </>
        )}

        {/* PERSONALITY TAB */}
        {activeTab === 'personality' && (
          <>
            <div className="card">
              <h2>🧠 AI Personality Analyzer</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>
                Discover personality insights from someone's digital footprint
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter username (e.g. john)" value={pUsername}
                  onChange={e => setPUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePersonality()}
                  className="input" />
                <button onClick={handlePersonality} disabled={pLoading} className="btn">
                  {pLoading ? '⏳ Analyzing...' : '🧠 Analyze'}
                </button>
              </div>
            </div>

            {pLoading && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div className="spinner"></div>
                <p style={{ color: '#a78bfa', marginTop: '16px' }}>🧠 Analyzing personality...</p>
                <p style={{ color: '#888', fontSize: '0.85rem' }}>This may take 30-60 seconds</p>
              </div>
            )}

            {pResult && !pLoading && (
              <div className="card">
                {pResult.error ? (
                  <p style={{ color: '#ff6666' }}>❌ {pResult.error}</p>
                ) : (
                  <>
                    <h2>🧠 Personality Profile — {pResult.username}</h2>
                    <p style={{ color: '#888', marginBottom: '16px', fontSize: '0.85rem' }}>
                      Based on {pResult.platform_count} platforms found
                    </p>
                    <div className="analysis">{pResult.personality}</div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* LOCATION TAB */}
        {activeTab === 'location' && (
          <>
            <div className="card">
              <h2>🗺️ Location Detector</h2>
              <p style={{ color: '#888', marginBottom: '20px', fontSize: '0.9rem' }}>
                Guess someone's country from their digital footprint
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input type="text" placeholder="Enter username (e.g. john)" value={locUsername}
                  onChange={e => setLocUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLocation()}
                  className="input" />
                <button onClick={handleLocation} disabled={locLoading} className="btn">
                  {locLoading ? '⏳ Detecting...' : '🗺️ Detect'}
                </button>
              </div>
            </div>

            {locLoading && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div className="spinner"></div>
                <p style={{ color: '#a78bfa', marginTop: '16px' }}>🗺️ Analyzing location...</p>
                <p style={{ color: '#888', fontSize: '0.85rem' }}>This may take 30-60 seconds</p>
              </div>
            )}

            {locResult && !locLoading && (
              <div className="card">
                {locResult.error ? (
                  <p style={{ color: '#ff6666' }}>❌ {locResult.error}</p>
                ) : (
                  <>
                    <h2>🗺️ Location Analysis — {locResult.username}</h2>
                    <p style={{ color: '#888', marginBottom: '16px', fontSize: '0.85rem' }}>
                      Based on {locResult.platform_count} platforms found
                    </p>
                    <div className="analysis">{locResult.location_analysis}</div>
                  </>
                )}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}