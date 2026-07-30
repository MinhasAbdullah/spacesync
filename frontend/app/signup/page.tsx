"use client";
import type { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../auth.css'; // <-- Importing the extracted CSS here

const SignUpPage: NextPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false);
      router.push('/my-bookings');
    }, 1000);
  };

  const handleGoogleSignup = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/my-bookings');
    }, 800);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="main-layout">
        <header className="page-header">
          <div className="z-icon">Z</div>
          <h1>Login</h1> 
        </header>

        <main className="content-area">
          <div className="auth-card">

            <div className="logo-container">
              <svg className="orbit-glyph" width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <circle cx="16" cy="16" r="5" fill="currentColor" />
                <path d="M16 2 A 14 14 0 0 1 30 16 A 14 14 0 0 1 16 30" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
              <h2>OrbitHub</h2>
            </div>

            <div className="welcome-text">
              <h3>Create account</h3>
              <p>Sign up to start using OrbitHub.</p>
            </div>

            <form className="login-form" onSubmit={handleSignup}>
              <div className="input-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Orbit User"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@orbithub.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="input-group password-group">
                <label htmlFor="password">Password</label>
                <div className="input-with-icon">
                  <input
                    id="password"
                    type="password"
                    placeholder="*******************"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span className="password-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20">
                      <path d="M10 3C5.58 3 1.84 5.76 0 10C1.84 14.24 5.58 17 10 17C14.42 17 18.16 14.24 20 10C18.16 5.76 14.42 3 10 3ZM10 14.5C7.51 14.5 5.5 12.49 5.5 10C5.5 7.51 7.51 5.5 10 5.5C12.49 5.5 14.5 7.51 14.5 10C14.5 12.49 12.49 14.5 10 14.5Z" fill="currentColor" />
                      <path d="M10 13C11.66 13 13 11.66 13 10C13 8.34 11.66 7 10 7C8.34 7 7 8.34 7 10C7 11.66 8.34 13 10 13Z" fill="currentColor" />
                    </svg>
                  </span>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="primary-button">
                {isLoading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <div className="divider">or</div>

            <button type="button" disabled={isLoading} onClick={handleGoogleSignup} className="google-button">
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M19.6 10.23c0-.66-.06-1.3-.17-1.93H10v3.65h5.4c-.23 1.25-.94 2.3-1.99 3.01v2.5h3.22c1.88-1.74 2.97-4.29 2.97-7.23z" fill="#4285F4" />
                <path d="M10 20c2.7 0 4.96-.89 6.61-2.43l-3.22-2.5c-.89.6-2.03.95-3.39.95-2.6 0-4.81-1.76-5.6-4.13H1.08v2.57C2.73 17.7 6.13 20 10 20z" fill="#34A853" />
                <path d="M4.4 11.9a6.01 6.01 0 0 1 0-3.8V5.53H1.08C.39 6.87 0 8.38 0 10c0 1.62.39 3.13 1.08 4.47l3.32-2.57z" fill="#FBBC05" />
                <path d="M10 3.98c1.47 0 2.78.5 3.82 1.5l2.86-2.86C14.96.93 12.7 0 10 0 6.13 0 2.73 2.3.8 5.53l3.32 2.57C4.4 6.27 6.61 3.98 10 3.98z" fill="#EA4335" />
              </svg>
              Sign Up with Google
            </button>

            <div className="signup-link">
              Already have an account? <a href="/login">Login</a>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default SignUpPage;