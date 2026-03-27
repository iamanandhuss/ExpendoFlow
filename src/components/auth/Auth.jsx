import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      }
      onAuthSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const FINANCE_KEYWORDS = [
    { text: 'SAVINGS', size: '6rem', top: '10%', left: '5%', duration: 25, delay: 0 },
    { text: 'INVESTMENT', size: '8rem', top: '20%', left: '60%', duration: 30, delay: 2 },
    { text: 'WEALTH', size: '7rem', top: '65%', left: '15%', duration: 28, delay: 5 },
    { text: 'STOCKS', size: '5rem', top: '75%', left: '70%', duration: 22, delay: 1 },
    { text: 'GROWTH', size: '9rem', top: '40%', left: '25%', duration: 35, delay: 3 },
    { text: 'ASSETS', size: '4rem', top: '85%', left: '40%', duration: 20, delay: 4 },
    { text: 'PROFIT', size: '6rem', top: '5%', left: '80%', duration: 27, delay: 6 },
    { text: 'BUDGET', size: '5rem', top: '50%', left: '5%', duration: 24, delay: 2 },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg-dark)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Background Text */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 0, 
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        {FINANCE_KEYWORDS.map((kw, i) => (
          <motion.div
            key={i}
            initial={{ x: -100, opacity: 0 }}
            animate={{ 
              x: ['-10%', '110%'],
              opacity: [0, 0.25, 0.25, 0]
            }}
            transition={{ 
              duration: kw.duration,
              repeat: Infinity,
              delay: kw.delay,
              ease: "linear"
            }}
            style={{ 
              position: 'absolute',
              top: kw.top,
              left: kw.left,
              fontSize: kw.size,
              fontWeight: 900,
              color: '#1d4ed8', // Deeper blue
              whiteSpace: 'nowrap',
              letterSpacing: '-0.05em'
            }}
          >
            {kw.text}
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ zIndex: 10, width: '100%', maxWidth: '420px' }}
      >
        <div 
          className="glass-card" 
          style={{ width: '100%', padding: '3rem', background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 25px 50px -12px rgba(0, 45, 242, 0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.5)' }}
        >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {isLogin ? 'Enter your details to access your dashboard' : 'Join FinTrack to manage your finances'}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input 
                type="text" 
                placeholder="Full Name" 
                style={{ paddingLeft: '3rem' }} 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required 
              />
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="email" 
              placeholder="Email Address" 
              style={{ paddingLeft: '3rem' }} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input 
              type="password" 
              placeholder="Password" 
              style={{ paddingLeft: '3rem' }} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {error && (
            <p style={{ color: 'var(--expense)', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
          )}

          <button className="btn btn-primary" style={{ height: '3rem', width: '100%' }} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? 'Sign In' : 'Sign Up'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--primary)', 
                fontWeight: 600, 
                marginLeft: '0.5rem',
                cursor: 'pointer'
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
    </div>
  );
};

export default Auth;
