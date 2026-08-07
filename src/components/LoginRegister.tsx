import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Film, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { MOCK_USERS } from '../data';

interface LoginRegisterProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Zəhmət olmasa bütün xanaları doldurun.');
      return;
    }

    const isEmailAdmin = email.toLowerCase().startsWith('admin@');

    // Check mock users
    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (user) {
      onLoginSuccess({
        ...user,
        role: isEmailAdmin ? 'admin' : user.role
      });
    } else {
      // Create a temporary user if not found but is user-typed
      const newMockUser: User = {
        id: 'u_new_' + Date.now(),
        username: email.split('@')[0],
        name: email.split('@')[0].toUpperCase(),
        email: email,
        avatar: isEmailAdmin
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        bio: isEmailAdmin ? 'CineVerse Administratoru.' : 'Yeni CineVerse istifadəçisi.',
        followersCount: isEmailAdmin ? 100 : 0,
        followingCount: isEmailAdmin ? 50 : 0,
        role: isEmailAdmin ? 'admin' : 'user',
        favorites: [],
        watchlist: [],
        savedCollections: [],
        followers: [],
        following: []
      };
      onLoginSuccess(newMockUser);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !username || !fullName) {
      setError('Zəhmət olmasa bütün xanaları doldurun.');
      return;
    }

    const isEmailAdmin = email.toLowerCase().startsWith('admin@');

    const newUser: User = {
      id: 'u_' + Date.now(),
      username: username,
      name: fullName,
      email: email,
      avatar: isEmailAdmin
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: isEmailAdmin ? 'CineVerse Administratoru.' : 'Yeni CineVerse istifadəçisi.',
      followersCount: 0,
      followingCount: 0,
      role: isEmailAdmin ? 'admin' : 'user',
      favorites: [],
      watchlist: [],
      savedCollections: [],
      followers: [],
      following: []
    };

    onLoginSuccess(newUser);
  };

  const handleGoogleLogin = () => {
    const googleUser: User = {
      id: 'u_google_' + Date.now(),
      username: 'elnar_google',
      name: 'Elnar Ağasoy (Google)',
      email: 'elnar.google@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: 'Google ilə daxil olmuş CineVerse istifadəçisi.',
      followersCount: 15,
      followingCount: 20,
      role: 'user',
      favorites: [],
      watchlist: [],
      savedCollections: [],
      followers: [],
      following: []
    };
    onLoginSuccess(googleUser);
  };

  const handleAppleLogin = () => {
    const appleUser: User = {
      id: 'u_apple_' + Date.now(),
      username: 'elnar_apple',
      name: 'Elnar Ağasoy (Apple)',
      email: 'elnar.apple@icloud.com',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
      bio: 'Apple ilə daxil olmuş CineVerse istifadəçisi.',
      followersCount: 8,
      followingCount: 12,
      role: 'user',
      favorites: [],
      watchlist: [],
      savedCollections: [],
      followers: [],
      following: []
    };
    onLoginSuccess(appleUser);
  };

  const handleFacebookLogin = () => {
    const facebookUser: User = {
      id: 'u_facebook_' + Date.now(),
      username: 'elnar_facebook',
      name: 'Elnar Ağasoy (Facebook)',
      email: 'elnar.facebook@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Facebook ilə daxil olmuş CineVerse istifadəçisi.',
      followersCount: 12,
      followingCount: 18,
      role: 'user',
      favorites: [],
      watchlist: [],
      savedCollections: [],
      followers: [],
      following: []
    };
    onLoginSuccess(facebookUser);
  };

  const renderSocialLogins = () => (
    <>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/5"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
          <span className="bg-[#0b0b0e] px-3.5 text-zinc-500">və ya</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-semibold text-white transition duration-300 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.258-3.133C18.332 1.154 15.447 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.83 11.57-11.79 0-.79-.085-1.4-.189-1.925H12.24z"
            />
          </svg>
          <span className="font-mono">Google</span>
        </button>

        <button
          type="button"
          onClick={handleAppleLogin}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-semibold text-white transition duration-300 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.12-.03.57.11 1.05.11.89 0 2.11-.63 2.77-1.44z" />
          </svg>
          <span className="font-mono">Apple</span>
        </button>

        <button
          type="button"
          onClick={handleFacebookLogin}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-semibold text-white transition duration-300 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span className="font-mono">FB</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080a] p-4 relative overflow-hidden">
      {/* Background Cinematic Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md" id="auth-card">
        {/* Logo and Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl font-black tracking-tighter text-red-600 font-display">
              CINE<span className="text-white">VERSE</span>
            </span>
          </div>
          <p className="text-zinc-500 text-xs font-sans mt-1 tracking-wide">
            Sosial Film Yayımı və Kino Həvəskarları İcması
          </p>
        </div>



        {/* Main Card */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="flex justify-center gap-8 mb-6 border-b border-white/5 pb-4">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`text-sm font-bold pb-2 transition duration-300 cursor-pointer ${
                isLogin ? 'text-white border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Giriş Et
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`text-sm font-bold pb-2 transition duration-300 cursor-pointer ${
                !isLogin ? 'text-white border-b-2 border-red-500' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Qeydiyyat
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs mb-4 font-semibold">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-400 mb-1.5">E-poçt Ünvanı</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@cineverse.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-600 transition duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Şifrə</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-600 transition duration-300"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <a href="#" className="text-[10px] text-zinc-500 hover:text-red-500 transition">Şifrənizi unutmusunuz?</a>
                </div>

                <button
                  type="submit"
                  id="btn-login"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-300 tracking-wider uppercase cursor-pointer"
                >
                  Giriş et
                </button>

                {renderSocialLogins()}
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Tam Adınız</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Məs. Elnar Ağasoy"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-600 transition duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-400 mb-1.5">İstifadəçi Adı</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="məs. elnar_agasoy"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-600 transition duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-400 mb-1.5">E-poçt Ünvanı</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@cineverse.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-600 transition duration-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-400 mb-1.5">Şifrə</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-red-600 transition duration-300"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-register"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-300 tracking-wider uppercase cursor-pointer"
                >
                  Qeydiyyatdan Keç
                </button>

                {renderSocialLogins()}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
