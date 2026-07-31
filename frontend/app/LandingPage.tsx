"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-root">
      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className={`landing-nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-inner">
          {/* Logo */}
          <Link href="/" className="nav-logo" id="nav-logo">
            <span className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="url(#lg1)" strokeWidth="2" />
                <path d="M14 4 C14 4 20 10 20 14 C20 18 14 24 14 24 C14 24 8 18 8 14 C8 10 14 4 14 4Z" fill="url(#lg2)" />
                <ellipse cx="14" cy="14" rx="6" ry="3" fill="none" stroke="#38bdf8" strokeWidth="1.5" transform="rotate(-30 14 14)" />
                <defs>
                  <linearGradient id="lg1" x1="0" y1="0" x2="28" y2="28">
                    <stop stopColor="#38bdf8" /><stop offset="1" stopColor="#818cf8" />
                  </linearGradient>
                  <linearGradient id="lg2" x1="14" y1="4" x2="14" y2="24">
                    <stop stopColor="#38bdf8" stopOpacity="0.8" /><stop offset="1" stopColor="#818cf8" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="logo-text">SpaceSync</span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="nav-links" id="nav-links">
            {["Features", "How", "Pricing"].map((link) => (
              <li key={link}>
                <Link href={`#${link.toLowerCase()}`} className="nav-link">{link}</Link>
              </li>
            ))}
          </ul>

          {/* CTA Buttons */}
          <div className="nav-cta" id="nav-cta">
            <Link href="/login" className="btn-ghost" id="btn-login">Login</Link>
            <Link href="/signup" className="btn-primary" id="btn-signup">Sign Up</Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="hamburger"
            id="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`ham-line ${mobileMenuOpen ? "open-1" : ""}`} />
            <span className={`ham-line ${mobileMenuOpen ? "open-2" : ""}`} />
            <span className={`ham-line ${mobileMenuOpen ? "open-3" : ""}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? "mobile-menu-open" : ""}`} id="mobile-menu">
          {["Features", "How", "Pricing"].map((link) => (
            <Link key={link} href={`#${link.toLowerCase()}`} className="mobile-link" onClick={() => setMobileMenuOpen(false)}>{link}</Link>
          ))}
          <div className="mobile-cta">
            <Link href="/login" className="btn-ghost" id="mobile-login">Login</Link>
            <Link href="/signup" className="btn-primary" id="mobile-signup">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="hero-section" id="hero">
        {/* Background Stars */}
        <div className="stars-bg" aria-hidden="true">
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="star"
              style={{
                left: `${(i * 1.7 + 3) % 100}%`,
                top: `${(i * 2.3 + 5) % 100}%`,
                animationDelay: `${(i * 0.07) % 4}s`,
                width: `${(i % 2) + 1}px`,
                height: `${(i % 2) + 1}px`,
              }}
            />
          ))}
        </div>

        {/* Gradient Orbs */}
        <div className="orb orb-blue" aria-hidden="true" />
        <div className="orb orb-purple" aria-hidden="true" />

        <div className="hero-inner">
          {/* Left Content */}
          <div className="hero-content">
            <div className="badge" id="hero-badge">
              <span className="badge-dot" />
              Smart Campus Platform
            </div>

            <h1 className="hero-heading">
              Seamless Access to
              <br />
              <span className="gradient-text">Global Frontiers.</span>
            </h1>

            <p className="hero-desc">
              SpaceSync brings smart facility management to modern campuses,
              departments and towns. Real‑time availability. No double‑bookings.
            </p>

            <div className="hero-buttons">
              <Link href="/signup" className="btn-primary btn-lg" id="hero-cta-start">
                Book Now
              </Link>
            </div>

            <div className="hero-stats">
              {[
                { value: "50K+", label: "Active Users" },
                { value: "200+", label: "Campuses" },
                { value: "99.9%", label: "Uptime" },
              ].map(({ value, label }) => (
                <div key={label} className="stat-item">
                  <span className="stat-value">{value}</span>
                  <span className="stat-label">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Hero Image */}
          <div className="hero-visual" id="hero-visual">
            <div className="pod-glow" aria-hidden="true" />
            <div className="pod-ring pod-ring-1" aria-hidden="true" />
            <div className="pod-ring pod-ring-2" aria-hidden="true" />
            <Image
              src="/hero_pod.png"
              alt="SpaceSync futuristic space pod"
              width={540}
              height={520}
              className="hero-image"
              priority
            />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator" aria-hidden="true">
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
        </div>
      </section>

      {/* ── FEATURE CARDS ───────────────────────────────── */}
      <section className="features-section" id="features">
        <div className="features-inner">
          <div className="section-label">Core Features</div>
          <h2 className="section-heading">
            Everything You Need to
            <span className="gradient-text"> Manage Smart Spaces</span>
          </h2>
          <p className="section-desc">
            From real‑time room booking to advanced analytics — SpaceSync puts
            intelligent space management in your hands.
          </p>

          <div className="features-grid">
            <div className="feat-card feat-card-1" id="feat-access">
              <div className="feat-img-wrap">
                <Image src="/feat_access.png" alt="Smart Access" width={160} height={160} className="feat-img" />
              </div>
              <h3 className="feat-title">Smart Access Control</h3>
              <p className="feat-desc">
                Manage entry permissions across every facility with a single
                intelligent dashboard — powered by AI.
              </p>
            </div>

            <div className="feat-card feat-card-2" id="feat-booking">
              <div className="feat-img-wrap">
                <Image src="/feat_booking.png" alt="Space Booking" width={160} height={160} className="feat-img" />
              </div>
              <h3 className="feat-title">Real-Time Booking</h3>
              <p className="feat-desc">
                Book rooms, labs and co‑working spaces instantly. Live
                availability updates prevent double-bookings.
              </p>
            </div>

            <div className="feat-card feat-card-3" id="feat-monitor">
              <div className="feat-img-wrap">
                <Image src="/feat_monitor.png" alt="Analytics Monitor" width={160} height={160} className="feat-img" />
              </div>
              <h3 className="feat-title">Space Analytics</h3>
              <p className="feat-desc">
                Deep insights into utilization patterns help you optimize
                every square foot of your facilities.
              </p>
            </div>

            <div className="feat-card feat-card-wide" id="feat-collab">
              <div className="feat-wide-content">
                <div className="feat-wide-icon">
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                    <circle cx="26" cy="26" r="24" stroke="url(#wlg)" strokeWidth="2" />
                    <path d="M18 26 C18 21 22 18 26 18 C30 18 34 21 34 26 C34 31 30 34 26 34" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="26" cy="26" r="4" fill="#818cf8" />
                    <path d="M26 34 L26 40 M22 37 L30 37" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="wlg" x1="0" y1="0" x2="52" y2="52">
                        <stop stopColor="#38bdf8" /><stop offset="1" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div>
                  <h3 className="feat-title">Global Collaboration Hub</h3>
                  <p className="feat-desc">
                    Connect teams across campuses worldwide. Share spaces, resources, and schedules
                    in one unified platform — with zero friction.
                  </p>
                    </div>
              </div>
              <div className="feat-wide-bg" aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="how-section" id="how">
        <div className="how-inner">
          <div className="section-label">How It Works</div>
          <h2 className="section-heading">
            Up and Running
            <span className="gradient-text"> in Minutes</span>
          </h2>

          <div className="steps-grid">
            {[
              { step: "01", title: "Create Your Campus", desc: "Set up your organization and import all your spaces, rooms and facilities in minutes." },
              { step: "02", title: "Invite Your Team", desc: "Add users, define roles and set granular access permissions across departments." },
              { step: "03", title: "Book & Manage", desc: "Team members can view, book and manage spaces in real-time from any device." },
              { step: "04", title: "Analyze & Optimize", desc: "Use AI-powered insights to eliminate waste and maximize utilization across your campus." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="step-card" id={`step-${step}`}>
                <div className="step-number">{step}</div>
                <h3 className="step-title">{title}</h3>
                <p className="step-desc">{desc}</p>
                <div className="step-connector" aria-hidden="true" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────── */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-inner">
          <div className="section-label">Pricing</div>
          <h2 className="section-heading">
            Simple,
            <span className="gradient-text"> Transparent Pricing</span>
          </h2>
          <p className="section-desc">No hidden fees. Upgrade or downgrade any time.</p>

          <div className="pricing-grid">
            {[
              { plan: "Starter", price: "Free", period: "", features: ["Up to 5 spaces", "10 team members", "Basic analytics", "Email support"], cta: "Get Started", featured: false },
              { plan: "Pro", price: "$29", period: "/mo", features: ["Unlimited spaces", "Unlimited members", "Advanced analytics", "Priority support", "Custom integrations"], cta: "Start Free Trial", featured: true },
              { plan: "Enterprise", price: "Custom", period: "", features: ["Custom deployment", "Dedicated support", "SLA guarantees", "SSO & SAML", "White-label option"], cta: "Create Account", featured: false },
            ].map(({ plan, price, period, features, cta, featured }) => (
              <div key={plan} className={`price-card ${featured ? "price-card-featured" : ""}`} id={`plan-${plan.toLowerCase()}`}>
                {featured && <div className="price-badge">Most Popular</div>}
                <div className="price-plan">{plan}</div>
                <div className="price-amount">{price}<span className="price-period">{period}</span></div>
                <ul className="price-features">
                  {features.map((f) => (
                    <li key={f} className="price-feature">
                      <span className="check-icon">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={featured ? "btn-primary price-btn" : "btn-outline price-btn"} id={`cta-${plan.toLowerCase()}`}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────── */}
      <section className="cta-section" id="cta">
        <div className="cta-orb cta-orb-1" aria-hidden="true" />
        <div className="cta-orb cta-orb-2" aria-hidden="true" />
        <div className="cta-inner">
          <h2 className="cta-heading">Ready to Sync Your Space?</h2>
          <p className="cta-desc">
            Join thousands of campuses using SpaceSync to eliminate booking chaos
            and unlock the full potential of their facilities.
          </p>
          <div className="cta-buttons">
            <Link href="/signup" className="btn-primary btn-lg" id="cta-main">Get Started for Free</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="footer" id="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link href="/" className="nav-logo" id="footer-logo">
              <span className="logo-icon">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="13" stroke="url(#flg)" strokeWidth="2" />
                  <path d="M14 4 C14 4 20 10 20 14 C20 18 14 24 14 24 C14 24 8 18 8 14 C8 10 14 4 14 4Z" fill="url(#flg2)" />
                  <ellipse cx="14" cy="14" rx="6" ry="3" fill="none" stroke="#38bdf8" strokeWidth="1.5" transform="rotate(-30 14 14)" />
                  <defs>
                    <linearGradient id="flg" x1="0" y1="0" x2="28" y2="28"><stop stopColor="#38bdf8" /><stop offset="1" stopColor="#818cf8" /></linearGradient>
                    <linearGradient id="flg2" x1="14" y1="4" x2="14" y2="24"><stop stopColor="#38bdf8" stopOpacity="0.8" /><stop offset="1" stopColor="#818cf8" stopOpacity="0.4" /></linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="logo-text">SpaceSync</span>
            </Link>
            <p className="footer-tagline">Seamless access to global frontiers.</p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4 className="footer-col-heading">Explore</h4>
              <ul className="footer-col-links">
                <li><Link href="#features" className="footer-link">Features</Link></li>
                <li><Link href="#how" className="footer-link">How it works</Link></li>
                <li><Link href="#pricing" className="footer-link">Pricing</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-heading">Account</h4>
              <ul className="footer-col-links">
                <li><Link href="/login" className="footer-link">Sign in</Link></li>
                <li><Link href="/signup" className="footer-link">Create account</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© 2026 SpaceSync. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}