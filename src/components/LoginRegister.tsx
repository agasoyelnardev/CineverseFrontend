import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { apiLogin, apiRegister, apiExternalLogin, apiGetMe, apiGetUserProfile } from '../api';
import { extractIdList } from '../utils/entityIds';
import { getHighestBadgeForPoints } from './GamificationBadges';

interface LoginRegisterProps {
  onLoginSuccess: (user: User) => void;
}

const GOOGLE_GSI_SCRIPT_ID = 'google-gsi-client';
const FACEBOOK_SDK_SCRIPT_ID = 'facebook-jssdk';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || '';
const facebookAppId = import.meta.env.VITE_FACEBOOK_APP_ID?.trim() || '';

const PLACEHOLDER_APP_IDS = new Set([
  'your_app_id',
  'your-app-id',
  'your_facebook_app_id',
  'your-facebook-app-id',
  'placeholder',
  'changeme',
  'xxx',
]);

function isPlaceholderAppId(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  if (PLACEHOLDER_APP_IDS.has(normalized)) return true;
  return normalized.startsWith('your_') || normalized.startsWith('your-');
}

const isGoogleConfigured = googleClientId.length > 0;
const isFacebookConfigured = facebookAppId.length > 0 && !isPlaceholderAppId(facebookAppId);

export default function LoginRegister({ onLoginSuccess }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isFacebookReady, setIsFacebookReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleCallbackRef = useRef<(response: GoogleCredentialResponse) => void>(() => {});

  // Backend-dən gələn profil məlumatını frontend User tipinə map edir.
  const mapToUser = (profile: any, fullProfile?: any): User => {
    const rawRole = profile.Role || profile.role || (Array.isArray(profile.roles) ? profile.roles[0] : '');
    const isAdmin = 
      (typeof rawRole === 'string' && rawRole.toLowerCase() === 'admin') ||
      (Array.isArray(profile.roles) && profile.roles.some((r: any) => typeof r === 'string' && r.toLowerCase() === 'admin')) ||
      profile.email?.toLowerCase() === 'admin@gmail.com';

    return {
      id: profile.id,
      username: profile.userName ?? profile.username ?? '',
      name: profile.fullName ?? profile.name ?? profile.userName ?? '',
      email: profile.email ?? '',
      avatar: fullProfile?.avatar || profile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: fullProfile?.bio ?? profile.bio ?? '',
      followersCount: fullProfile?.followersCount ?? profile.followersCount ?? 0,
      followingCount: fullProfile?.followingCount ?? profile.followingCount ?? 0,
      points: fullProfile?.points ?? 0,
      badge: getHighestBadgeForPoints(fullProfile?.points ?? 0).name,
      isPremium: fullProfile?.isPremium ?? false,
      role: isAdmin ? 'admin' : 'user',
      favorites: extractIdList(profile, 'favoriteMovieIds', 'FavoriteMovieIds'),
      watchlist: extractIdList(profile, 'watchlistMovieIds', 'WatchlistMovieIds'),
      favoriteBooks: extractIdList(profile, 'favoriteBookIds', 'FavoriteBookIds'),
      savedCollections: [],
      followers: [],
      following: []
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Zəhmət olmasa bütün xanaları doldurun.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiLogin(email, password);
      const profile = await apiGetMe();
      let fullProfile = null;
      try {
        fullProfile = await apiGetUserProfile(profile.id);
      } catch {
        // minimal profil ilə davam et
      }
      onLoginSuccess(mapToUser(profile, fullProfile));
    } catch (err: any) {
      setError(err.message || 'Giriş zamanı xəta baş verdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !username || !fullName) {
      setError('Zəhmət olmasa bütün xanaları doldurun.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRegister({ email, passwordHash: password, username, fullName });
      const profile = await apiGetMe();
      let fullProfile = null;
      try {
        fullProfile = await apiGetUserProfile(profile.id);
      } catch {
        // minimal profil ilə davam et
      }
      onLoginSuccess(mapToUser(profile, fullProfile));
    } catch (err: any) {
      setError(err.message || 'Qeydiyyat zamanı xəta baş verdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeSocialLogin = useCallback(async () => {
    const profile = await apiGetMe();
    let fullProfile = null;
    try {
      fullProfile = await apiGetUserProfile(profile.id);
    } catch {
      // minimal profil ilə davam et
    }
    onLoginSuccess(mapToUser(profile, fullProfile));
  }, [onLoginSuccess]);

  const handleGoogleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      setError('Google ID Token alına bilmədi.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await apiExternalLogin({
        provider: 'google',
        idToken: response.credential,
      });
      await completeSocialLogin();
    } catch (err: any) {
      setError(err.message || 'Google girişi zamanı xəta baş verdi.');
    } finally {
      setIsSubmitting(false);
    }
  }, [completeSocialLogin]);

  useEffect(() => {
    googleCallbackRef.current = (response) => {
      void handleGoogleCredentialResponse(response);
    };
  }, [handleGoogleCredentialResponse]);

  useEffect(() => {
    if (!isGoogleConfigured) return;

    const initializeGoogleIdentity = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => googleCallbackRef.current(response),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setIsGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initializeGoogleIdentity();
      return;
    }

    const existingScript = document.getElementById(GOOGLE_GSI_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', initializeGoogleIdentity);
      return () => existingScript.removeEventListener('load', initializeGoogleIdentity);
    }

    const script = document.createElement('script');
    script.id = GOOGLE_GSI_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleIdentity;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, []);

  useEffect(() => {
    if (!isGoogleReady || !isGoogleConfigured || !googleButtonRef.current) return;

    googleButtonRef.current.innerHTML = '';
    window.google?.accounts.id.renderButton(googleButtonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      width: Math.max(googleButtonRef.current.offsetWidth, 120),
    });
  }, [isGoogleReady]);

  const handleFacebookLoginResponse = useCallback(async (response: FacebookLoginResponse) => {
    const accessToken = response.authResponse?.accessToken;
    if (!accessToken) {
      if (response.status !== 'unknown') {
        setError('Facebook giriş ləğv edildi.');
      }
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await apiExternalLogin({
        provider: 'facebook',
        idToken: accessToken,
      });
      await completeSocialLogin();
    } catch (err: any) {
      setError(err.message || 'Facebook girişi zamanı xəta baş verdi.');
    } finally {
      setIsSubmitting(false);
    }
  }, [completeSocialLogin]);

  useEffect(() => {
    if (!isFacebookConfigured) return;

    const initializeFacebook = () => {
      if (!window.FB) return;
      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: false,
        version: 'v22.0',
      });
      setIsFacebookReady(true);
    };

    if (window.FB) {
      initializeFacebook();
      return;
    }

    const previousFbAsyncInit = window.fbAsyncInit;
    window.fbAsyncInit = () => {
      previousFbAsyncInit?.();
      initializeFacebook();
    };

    if (document.getElementById(FACEBOOK_SDK_SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = FACEBOOK_SDK_SCRIPT_ID;
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  }, []);

  const handleGoogleLogin = () => {
    if (!isGoogleConfigured) {
      setError('Google girişi konfiqurasiya edilməyib (VITE_GOOGLE_CLIENT_ID).');
      return;
    }
    if (!isGoogleReady || !window.google?.accounts?.id) {
      setError('Google giriş SDK-sı hələ yüklənir. Bir neçə saniyə sonra yenidən cəhd edin.');
      return;
    }

    setError('');
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        const hiddenButton = googleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement | null;
        hiddenButton?.click();
        if (!hiddenButton) {
          setError(`Google giriş pəncərəsi açıla bilmədi: ${notification.getNotDisplayedReason()}`);
        }
      } else if (notification.isSkippedMoment()) {
        setError('Google giriş ləğv edildi.');
      }
    });
  };

  const handleFacebookLogin = () => {
    if (!isFacebookConfigured) {
      setError('Facebook girişi konfiqurasiya edilməyib (VITE_FACEBOOK_APP_ID).');
      return;
    }
    if (!isFacebookReady || !window.FB) {
      setError('Facebook giriş SDK-sı hələ yüklənir. Bir neçə saniyə sonra yenidən cəhd edin.');
      return;
    }

    setError('');
    window.FB.login(
      (response) => {
        void handleFacebookLoginResponse(response);
      },
      { scope: 'email,public_profile' }
    );
  };

  const renderSocialLogins = () => {
    if (!isGoogleConfigured && !isFacebookConfigured) {
      return null;
    }

    const gridCols = isGoogleConfigured && isFacebookConfigured ? 'grid-cols-2' : 'grid-cols-1';

    return (
      <>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
            <span className="bg-[#0b0b0e] px-3.5 text-zinc-500">və ya</span>
          </div>
        </div>

        <div className={`grid ${gridCols} gap-2`}>
          {isGoogleConfigured && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="relative flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-semibold text-white transition duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <svg className="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.258-3.133C18.332 1.154 15.447 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.83 11.57-11.79 0-.79-.085-1.4-.189-1.925H12.24z"
                />
              </svg>
              <span className="font-mono pointer-events-none">Google</span>
              <div
                ref={googleButtonRef}
                className={`absolute inset-0 opacity-0 ${isSubmitting ? 'pointer-events-none' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}

          {isFacebookConfigured && (
            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-semibold text-white transition duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="font-mono">FB</span>
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08080a] p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md" id="auth-card">
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
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-300 tracking-wider uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Giriş edilir...' : 'Giriş et'}
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
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-300 tracking-wider uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Qeydiyyat aparılır...' : 'Qeydiyyatdan Keç'}
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