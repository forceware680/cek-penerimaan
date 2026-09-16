'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md';

export default function Login() {
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  const currentYear = new Date().getFullYear();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fiscalYear, setFiscalYear] = useState(String(currentYear));

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = 'Username wajib diisi';
    if (!password) errors.password = 'Password wajib diisi';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setServerError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      // Keep the selected fiscal year for the session
      localStorage.setItem('fiscalYear', fiscalYear);
      setUser(data.user);
    } catch (e: unknown) {
      setServerError(e instanceof Error ? e.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo-saweria.png" alt="Logo" className="login-logo" fetchPriority="high" decoding="async" width={600} height={357} />
          <h1 className="login-title">SI GEPENG</h1>
          <p className="login-subtitle">Sistem Informasi Cek Penerimaan</p>
        </div>

        {serverError && (
          <div className="login-error" role="alert">
            {serverError}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <div className="login-field">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Masukkan username"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={fieldErrors.username ? true : undefined}
              aria-describedby={fieldErrors.username ? 'username-error' : undefined}
            />
            {fieldErrors.username && (
              <span id="username-error" role="alert" className="login-field-error">
                {fieldErrors.username}
              </span>
            )}
          </div>

          <div className="login-field">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="login-field-control">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Masukkan password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={fieldErrors.password ? true : undefined}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="login-pass-toggle"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <MdOutlineVisibilityOff size={20} /> : <MdOutlineVisibility size={20} />}
              </button>
            </div>
            {fieldErrors.password && (
              <span id="password-error" role="alert" className="login-field-error">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <div className="login-field">
            <label className="form-label" htmlFor="fiscalYear">
              Tahun Anggaran
            </label>
            <select
              id="fiscalYear"
              name="fiscalYear"
              className="login-select"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
            >
              <option value={String(currentYear)}>{currentYear} - Tahun Berjalan</option>
              <option value={String(currentYear - 1)}>{currentYear - 1} - Tahun Sebelumnya</option>
            </select>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Sedang masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="login-footer">
          <span className="footer-text">© 2024 SI GEPENG</span>
        </div>
      </div>
    </div>
  );
}
