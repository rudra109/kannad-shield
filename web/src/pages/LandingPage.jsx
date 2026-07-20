// =============================================================
//  Landing Page — Public Marketing Site (bSafe Clone)
// =============================================================
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Activity, Map, Smartphone, Eye, Bell, Lock } from 'lucide-react';
import '../landing.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <Link to="/" className="lp-logo">
            <ShieldAlert size={28} /> Kanad S.H.I.E.L.D.
          </Link>
          <nav className="lp-nav">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#testimonials">Testimonials</a>
            <Link to="/login" className="hud-btn hud-btn-ghost" style={{ padding: '8px 20px' }}>Police Login</Link>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ─────────────────────────────────── */}
      <section className="lp-container lp-hero">
        <div>
          <span className="lp-badge">The Emergency Services Industry is Ready for Disruption!</span>
          <h1>Advanced Cyber Safety for the Modern Citizen.</h1>
          <p>Kanad S.H.I.E.L.D. integrates AI-driven risk analysis, live emergency tracking, and rapid response networks directly into the hands of local police forces.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <button className="hud-btn hud-btn-primary">Schedule a Demo</button>
            <button className="hud-btn hud-btn-ghost">Download App</button>
          </div>
        </div>
        <div className="lp-hero-visual">
          <div className="lp-blob" />
          <div className="lp-mockup">
            <div style={{ padding: 24, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <ShieldCheck size={80} color="#2563EB" style={{ margin: '0 auto 20px' }} />
              <h3 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Safe & Secure</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748B' }}>Your digital and physical safety, monitored 24/7 by advanced AI.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── As Seen On (Social Proof) ────────────────────── */}
      <section className="lp-seen-on">
        <div className="lp-container">
          <p>Trusted by Law Enforcement & Media</p>
          <div className="lp-logos">
            <span>TECHCRUNCH</span>
            <span>POLICE GAZETTE</span>
            <span>FORBES</span>
            <span>WIRED</span>
            <span>GOVTECH</span>
          </div>
        </div>
      </section>

      {/* ── Statistics (The Urgent Need) ─────────────────── */}
      <section className="lp-section lp-section-alt" id="stats">
        <div className="lp-container">
          <h2 style={{ textAlign: 'center', marginBottom: 48 }}>The Urgent Need for Better Security</h2>
          <div className="lp-stats-grid">
            <div className="lp-stat-card">
              <div className="lp-stat-number">45%</div>
              <p style={{ margin: 0, fontWeight: 500 }}>Increase in targeted cyber harassment complaints this year.</p>
            </div>
            <div className="lp-stat-card">
              <div className="lp-stat-number">3.2M</div>
              <p style={{ margin: 0, fontWeight: 500 }}>Fake social profiles identified and reported automatically.</p>
            </div>
            <div className="lp-stat-card">
              <div className="lp-stat-number">&lt; 3m</div>
              <p style={{ margin: 0, fontWeight: 500 }}>Average police response time via the SOS live location tracker.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features (Zig-Zag) ───────────────────────────── */}
      <section className="lp-section" id="how-it-works">
        <div className="lp-container">
          <div className="lp-feature-row">
            <div className="lp-feature-text">
              <h2>Real-Time SOS & Tracking</h2>
              <p>When you are in danger, every second counts. Kanad S.H.I.E.L.D. connects you directly to the nearest patrol unit with live location streaming.</p>
              <ul>
                <li><Activity className="lp-feature-icon" size={24} /> <strong>Live Dispatch:</strong> Instantly share your GPS coordinates.</li>
                <li><Map className="lp-feature-icon" size={24} /> <strong>Dynamic Routing:</strong> Police get the fastest route to you.</li>
                <li><Smartphone className="lp-feature-icon" size={24} /> <strong>Silent Mode:</strong> Trigger alerts without drawing attention.</li>
              </ul>
            </div>
            <div>
              <div className="lp-feature-image" style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Map size={80} color="#3B82F6" style={{ opacity: 0.5 }} />
              </div>
            </div>
          </div>

          <div className="lp-feature-row">
            <div>
              <div className="lp-feature-image" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={80} color="#2563EB" />
              </div>
            </div>
            <div className="lp-feature-text">
              <h2>AI-Powered Cyber Defense</h2>
              <p>Protecting citizens from digital threats before they manifest into physical harm or financial loss.</p>
              <ul>
                <li><Eye className="lp-feature-icon" size={24} /> <strong>Deepfake Detection:</strong> Verify image authenticity instantly.</li>
                <li><Lock className="lp-feature-icon" size={24} /> <strong>Phishing Alerts:</strong> Real-time malicious URL scanning.</li>
                <li><Bell className="lp-feature-icon" size={24} /> <strong>Harassment NLP:</strong> Automatically flag abusive messages.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Grid Cards (Revolutionizing) ─────────────────── */}
      <section className="lp-section lp-section-alt" id="features">
        <div className="lp-container">
          <h2 style={{ textAlign: 'center', marginBottom: 48 }}>Revolutionizing Public Safety</h2>
          <div className="lp-grid">
            <div className="lp-card">
              <div className="lp-card-icon"><ShieldCheck size={24} /></div>
              <h3>Immutable Evidence</h3>
              <p>Cryptographic hash-chains ensure digital evidence (screenshots, logs) cannot be tampered with before trial.</p>
            </div>
            <div className="lp-card">
              <div className="lp-card-icon"><Activity size={24} /></div>
              <h3>Automated FIR Drafts</h3>
              <p>LLM-assisted FIR drafting applies correct BNS/IT Act sections based on victim narratives instantly.</p>
            </div>
            <div className="lp-card">
              <div className="lp-card-icon"><Map size={24} /></div>
              <h3>Predictive Heatmaps</h3>
              <p>Police dispatchers view real-time heatmaps to allocate patrol units before crime spikes occur.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="lp-section" id="testimonials">
        <div className="lp-container">
          <h2 style={{ textAlign: 'center', marginBottom: 48 }}>What People Are Saying</h2>
          <div className="lp-testimonials">
            <div className="lp-testimonial-card">
              <p className="lp-quote">"The deepfake detection feature saved me from a massive financial scam. I reported the profile, and the police handled it immediately through the app."</p>
              <div className="lp-user">
                <div className="lp-avatar" />
                <div className="lp-user-info">
                  <strong>Priya S.</strong>
                  <span>Citizen User</span>
                </div>
              </div>
            </div>
            <div className="lp-testimonial-card">
              <p className="lp-quote">"As a dispatcher, having real-time AI risk scoring attached to incoming incidents allows me to prioritize units more effectively than ever before."</p>
              <div className="lp-user">
                <div className="lp-avatar" style={{ background: '#334155' }} />
                <div className="lp-user-info">
                  <strong>Officer Patel</strong>
                  <span>Cyber Crime Branch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <div className="lp-footer-brand"><ShieldAlert size={24} /> Kanad S.H.I.E.L.D.</div>
              <p style={{ marginTop: 16, fontSize: '0.9rem', maxWidth: 300 }}>Empowering citizens and law enforcement with cutting-edge AI and real-time response tools.</p>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li><a href="#">Citizen App</a></li>
                <li><a href="#">Police Console</a></li>
                <li><a href="#">AI Modules</a></li>
                <li><a href="#">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Safety Guides</a></li>
                <li><a href="#">API Documentation</a></li>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">System Status</a></li>
              </ul>
            </div>
            <div>
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Compliance (BNS)</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            &copy; {new Date().getFullYear()} Kanad S.H.I.E.L.D. Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
