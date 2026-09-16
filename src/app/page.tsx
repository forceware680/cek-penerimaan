'use client';

import { useAuth } from '@/context/AuthContext';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f6f1e4',
      }}>
        <div style={{
          color: '#141414',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}>
          Memuat...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main>
        <Login />
      </main>
    );
  }

  return (
    <main>
      <Dashboard />
    </main>
  );
}
