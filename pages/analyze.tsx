import { useAuth, UserButton, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Analyze() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser(); 
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [usage, setUsage] = useState<any>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Get tier from usage API (most reliable source)
  const currentTier = usage?.tier || 'free';
  const currentUsage = usage?.analyses_used || 0;
  const usageLimit = usage?.limit || 1;

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/');
    } else {
      fetchUsage();
    }
  }, [isSignedIn]);

  const fetchUsage = async () => {
    try {
      setRefreshing(true);
      const token = await getToken();
      
      console.log('=== FETCHING USAGE ===');
      console.log('User metadata from Clerk:', user?.publicMetadata);
      
      const response = await fetch('/api/usage', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Usage API Response:', data);
        setUsage(data);
      } else {
        console.error('Failed to fetch usage:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshUsage = async () => {
    setError('');
    await fetchUsage();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult('');
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    // Check if user is on Free Plan and has reached the 1-scan limit
    if (currentTier === 'free' && currentUsage >= 1) {
      setError('⚠️ Free tier limit reached (1/1 analyses used). Please upgrade to Premium for unlimited analyses.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('file', file);

      console.log('=== ANALYZING IMAGE ===');
      console.log('Current tier before analyze:', currentTier);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      // --- PROPER ERROR FLAG LOGIC START ---
      if (!response.ok) {
        // Handle 400 Invalid File Type
        if (response.status === 400) {
          throw new Error("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
        }
        // Handle 413 File Too Large
        if (response.status === 413) {
          throw new Error("File too large! Maximum size allowed is 5MB.");
        }
        // Handle 429 Usage Limit Reached
        if (response.status === 429) {
          throw new Error("Usage limit reached! Please upgrade to Premium.");
        }

        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || `Error: ${response.status}`);
        } catch (e) {
          throw new Error(`Server Error: ${response.status}. Please try a smaller image.`);
        }
      }
      // --- PROPER ERROR FLAG LOGIC END ---

      const data = await response.json();
      console.log('Analyze API Response:', data);

      setResult(data.description);
      // Refresh usage after successful analysis
      await fetchUsage();
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="analyze-container">
      <Head>
        <title>Analyze | AI Vision Analyzer</title>
      </Head>

      {/* Header with Back Button */}
      <header className="analyze-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#667eea', fontWeight: 'bold' }}>
            ⬅ Home
          </Link>
          <h1 className="analyze-title">🔍 AI Vision Analyzer</h1>
        </div>
        <UserButton />
      </header>

      <div className="analyze-content">
        {/* Usage Display Card */}
        {usage && (
          <div className={`usage-card ${currentTier === 'premium' ? 'usage-card-premium' : 'usage-card-free'}`}>
            <div className="usage-header">
              <div>
                <p className="usage-plan">
                  {currentTier === 'premium' ? '✨ Premium Plan (Unlimited)' : '🆓 Free Plan'}
                </p>
                <p className="usage-stats">
                  Usage: {currentUsage}/{currentTier === 'premium' ? '∞' : usageLimit} analyses
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {/* UPGRADE BUTTON ADDED HERE */}
                {currentTier === 'free' && currentUsage >= 1 && (
                  <button 
                    onClick={() => window.alert('Upgrade to Premium to get unlimited analyses!')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#fff',
                      color: '#667eea',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    🚀 Upgrade Now
                  </button>
                )}
                
                {currentTier === 'free' && currentUsage >= 1 && (
                  <div className="usage-warning">
                    ⚠️ Limit Reached
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Info (only shown if tier is free but metadata says premium) */}
        {user?.publicMetadata?.tier === 'premium' && currentTier === 'free' && (
          <div style={{
            padding: '1rem',
            background: '#fff3cd',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: '#856404'
          }}>
            <strong>⚠️ IMPORTANT:</strong> Your Clerk metadata shows Premium, but your session is still Free. 
            <br />
            <strong>Solution:</strong> Click the user button (top right) → Sign Out → Sign back in to refresh your tier.
          </div>
        )}

        <div className="main-grid">
          <div className="upload-section">
            <h2 className="section-heading">📤 Upload Image</h2>
            
            <label className="file-upload-label">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="file-upload-input"
              />
              <div className="upload-icon">📁</div>
              <div className="upload-text">Click to select image</div>
              <div className="upload-hint">JPG, PNG, or WEBP (Max 5MB)</div>
            </label>

            {preview && (
              <div className="image-preview">
                <img src={preview} alt="Preview" className="preview-image" />
                <p className="file-name">{file?.name}</p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file || loading || (currentTier === 'free' && currentUsage >= 1)}
              className={`btn-analyze ${(!file || loading || (currentTier === 'free' && currentUsage >= 1)) ? 'btn-analyze-disabled' : 'btn-analyze-active'}`}
            >
              {loading ? '🔄 Analyzing...' : '✨ Analyze Image'}
            </button>

            {error && (
              <div className="error-message">{error}</div>
            )}
          </div>

          {/* Results Section */}
          <div className="results-section">
            <h2 className="section-heading">📝 Analysis Result</h2>
            
            {result ? (
              <div className="result-box">
                <div className="result-text">
                  {result.split('###').map((section, i) => {
                    if (!section.trim()) return null;
                    
                    const [header, ...bodyLines] = section.trim().split('\n');
                    const body = bodyLines.join('\n');

                    return (
                      <div key={i} style={{ marginBottom: '1.5rem' }}>
                        <strong style={{ display: 'block', color: '#667eea', fontSize: '1.2rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                          {header.trim()}
                        </strong>
                        {body.split('\n').map((line, li) => (
                          line.trim().startsWith('-') && (
                            <p key={li} style={{ marginBottom: '0.4rem', display: 'flex', gap: '8px', paddingLeft: '10px' }}>
                              <span style={{ color: '#667eea' }}>•</span>
                              {line.replace('-', '').trim()}
                            </p>
                          )
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🤖</div>
                <p className="empty-text">
                  Upload an image and click "Analyze" to see the AI description here
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="info-box">
          <strong>💡 Tip:</strong> For best results, upload clear, well-lit images.
          {currentTier === 'free' && (
            <div style={{ marginTop: '0.5rem' }}>
              <strong>📢 Upgrade to Premium:</strong> Free tier allows 1 analysis per session. 
            </div>
          )}
        </div>
      </div>
    </div>
  );
}