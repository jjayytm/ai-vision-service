import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div className="landing-container">
      <Head>
        <title>AI Vision Analyzer | Home</title>
      </Head>
      {/* Header */}
      <header className="landing-header">
        <h1 className="landing-title">🔍 AI Vision Analyzer</h1>
        <div className="header-actions">
          {isSignedIn ? (
            <>
              <Link href="/analyze" className="btn-primary">
                Go to Analyzer
              </Link>
              <UserButton />
            </>
          ) : (
            <SignInButton mode="modal">
              <button className="btn-primary">Sign In</button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <h2 className="hero-title">Analyze Images with AI</h2>
        <p className="hero-subtitle">
          Upload any image and get detailed AI-powered descriptions instantly using GPT-4 Vision
        </p>
        {!isSignedIn && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <SignInButton mode="modal">
              <button className="btn-cta">Start Free Trial</button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="btn-secondary">Try 1 Analysis Free</button>
            </SignInButton>
          </div>
        )}
        {!isSignedIn && (
          <p className="hero-note">
            ✨ No credit card required • 1 free analysis • Instant access
          </p>
        )}
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h3 className="section-title">Key Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h4 className="feature-title">AI-Powered Analysis</h4>
            <p className="feature-description">
              Advanced GPT-4o-mini Vision model analyzes your images with incredible detail and accuracy
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h4 className="feature-title">Instant Results</h4>
            <p className="feature-description">
              Get comprehensive image descriptions in seconds with detailed object, color, and mood analysis
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h4 className="feature-title">Secure & Private</h4>
            <p className="feature-description">
              Your images are processed securely and never stored permanently on our servers
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <h3 className="section-title">Simple Pricing</h3>
        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="pricing-card">
            <h4 className="pricing-tier">Free Trial</h4>
            <p className="pricing-price pricing-price-free">
              $0<span className="pricing-period">/forever</span>
            </p>
            <ul className="pricing-features">
              <li className="pricing-feature pricing-feature-free">
                ✓ 1 image analysis per session
              </li>
              <li className="pricing-feature pricing-feature-free">
                ✓ Basic AI descriptions
              </li>
              <li className="pricing-feature pricing-feature-free">
                ✓ Standard support
              </li>
              <li className="pricing-feature pricing-feature-free">
                ✓ No credit card required
              </li>
            </ul>
            {!isSignedIn && (
              <SignInButton mode="modal">
                <button className="btn-pricing">Start Free Trial</button>
              </SignInButton>
            )}
          </div>

          {/* Premium Tier */}
          <div className="pricing-card pricing-card-premium">
            <div className="pricing-badge">BEST VALUE</div>
            <h4 className="pricing-tier">Premium</h4>
            <p className="pricing-price">
              $5<span className="pricing-period pricing-period-premium">/month</span>
            </p>
            <ul className="pricing-features">
              <li className="pricing-feature">✓ Unlimited image analyses</li>
              <li className="pricing-feature">✓ Advanced detailed descriptions</li>
              <li className="pricing-feature">✓ Priority support</li>
              <li className="pricing-feature">✓ Cancel anytime</li>
            </ul>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="btn-pricing-premium">Get Started</button>
              </SignInButton>
            ) : (
              <Link href="/analyze">
                <button className="btn-pricing-premium">Go to Analyzer</button>
              </Link>
            )}
          </div>
        </div>
        
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h3 className="section-title">How It Works</h3>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h4 className="step-title">Sign Up Free</h4>
            <p className="step-description">Create your account in seconds with email or social login</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h4 className="step-title">Upload Image</h4>
            <p className="step-description">Select any JPG, PNG, or WEBP image up to 5MB</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h4 className="step-title">Get AI Analysis</h4>
            <p className="step-description">Receive detailed descriptions including objects, colors, and mood</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p className="footer-text">
          © 2026 AI Vision Analyzer | Powered by OpenAI & Clerk
        </p>
      </footer>
    </div>
  );
}