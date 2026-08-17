import React, { useState } from 'react';
import { Sparkles, Check, X, ShieldCheck, Zap, Tv, Mic, Award, CreditCard, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { apiSubscribe, apiCancelSubscription, apiGetMe, apiGetUserProfile, PremiumPlan } from '../api';
import { getHighestBadgeForPoints } from './GamificationBadges';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUpgradeSuccess: (updatedUser: User) => void;
  theme: 'dark' | 'light';
}

export default function PremiumModal({
  isOpen,
  onClose,
  currentUser,
  onUpgradeSuccess,
  theme
}: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<'plans' | 'payment' | 'success'>('plans');

  if (!isOpen || !currentUser) return null;

  const refreshUserPremiumStatus = async (): Promise<User> => {
    const me = await apiGetMe();
    const profile = await apiGetUserProfile(me.id);
    return {
      ...currentUser,
      isPremium: profile.isPremium,
      points: profile.points,
      badge: getHighestBadgeForPoints(profile.points ?? 0).name,
    };
  };

  const handleNextStep = () => {
    if (step === 'plans') {
      setStep('payment');
    }
  };

  const handleActivateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const planEnum = selectedPlan === 'monthly' ? PremiumPlan.Monthly : PremiumPlan.Yearly;
      await apiSubscribe(planEnum);
      const updatedUser = await refreshUserPremiumStatus();
      onUpgradeSuccess(updatedUser);
      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Abunəlik aktivləşdirilərkən xəta baş verdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('CineVerse Premium abunəliyinizi ləğv etmək istədiyinizdən əminsiniz?')) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiCancelSubscription();
      const updatedUser = await refreshUserPremiumStatus();
      onUpgradeSuccess(updatedUser);
      alert('Abunəlik uğurla ləğv edildi.');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Abunəlik ləğv edilərkən xəta baş verdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const planPrice = selectedPlan === 'monthly' ? '4.99 AZN / ay' : '39.99 AZN / il (Ayda ~3.33 AZN)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        id="premium-modal-container"
        className={`w-full max-w-lg rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-300 my-auto max-h-[92vh] overflow-y-auto ${
          theme === 'dark' 
            ? 'bg-zinc-950 border-zinc-800 text-white shadow-black/80' 
            : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-200/50'
        }`}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Close Button */}
        {step !== 'success' && (
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-full border transition cursor-pointer z-10 ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* STEP 1: PLANS SELECTOR */}
        {step === 'plans' && (
          <div className="p-6 md:p-8 space-y-6">
            {currentUser.isPremium && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <span>Sizin aktiv CineVerse Premium abunəliyiniz mövcuddur!</span>
                </div>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl transition cursor-pointer text-[11px] font-bold shrink-0"
                >
                  {isSubmitting ? 'Ləğv Edilir...' : 'Abunəliyi Ləğv Et'}
                </button>
              </div>
            )}

            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-wider rounded-full animate-pulse">
                <Sparkles className="w-3.5 h-3.5 fill-amber-500/20" /> CINEVERSE PREMIUM
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight font-display">Kino Aləmini Sərhədsiz Kəşf Et!</h2>
              <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Premium statusu ilə kinoteatr təcrübəsini evinizə gətirin.
              </p>
            </div>

            {/* Features list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                { icon: Tv, title: 'Reklamsız & Kəsintisiz', desc: 'Sonsuz kino zövqü, sıfır reklam.' },
                { icon: Zap, title: '4K Ultra HD Keyfiyyət', desc: 'Bütün yayımları ən yüksək detalla izləyin.' },
                { icon: Mic, title: 'Səsli Rəy Yazma', desc: 'Müzakirələrdə mikrofonla rəy bildirin.' },
                { icon: Award, title: 'Profil Nişanı (Glow Badge)', desc: 'İcmada qızılı rəngli Premium nişanı.' },
                { icon: Sparkles, title: 'Premium Watch Party', desc: 'Premium otaqlar yaradın və ekskluziv yayimlara qoşulun.' }
              ].map((f, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-2xl border ${
                  theme === 'dark' ? 'bg-zinc-900/40 border-zinc-850' : 'bg-zinc-50 border-zinc-100'
                }`}>
                  <div className="p-2 bg-red-600/10 text-red-500 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
                    <f.icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold">{f.title}</h4>
                    <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Plan Toggle */}
            <div className={`p-1.5 rounded-2xl border flex gap-2 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-850' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition cursor-pointer text-center ${
                  selectedPlan === 'monthly'
                    ? 'bg-red-600 text-white shadow-lg'
                    : theme === 'dark' ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-600 hover:bg-white/50'
                }`}
              >
                Aylıq Plan
                <span className="block text-[9px] font-normal opacity-80 mt-0.5">4.99 AZN</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlan('yearly')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition cursor-pointer text-center relative ${
                  selectedPlan === 'yearly'
                    ? 'bg-red-600 text-white shadow-lg'
                    : theme === 'dark' ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-600 hover:bg-white/50'
                }`}
              >
                <span className="absolute -top-2.5 right-2 px-2 py-0.5 bg-amber-500 text-[8px] font-black uppercase text-zinc-950 rounded-full animate-bounce">
                  QƏNAƏT 33%
                </span>
                İllik Plan
                <span className="block text-[9px] font-normal opacity-80 mt-0.5">39.99 AZN</span>
              </button>
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextStep}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              Davam Et — {selectedPlan === 'monthly' ? '4.99 AZN' : '39.99 AZN'} <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: SECURE PAYMENT WITH BACKEND API */}
        {step === 'payment' && (
          <form onSubmit={handleActivateSubscription} className="p-6 md:p-8 space-y-5">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setStep('plans')}
                className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 hover:text-red-500 transition cursor-pointer"
              >
                ← Plan Seçiminə Qayıt
              </button>
              <h3 className="text-lg font-bold font-display mt-2 flex items-center gap-1.5">
                <CreditCard className="w-5 h-5 text-red-500" /> Təhlükəsiz Ödəniş Səhifəsi
              </h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Seçilmiş plan: <strong className="text-red-500">{planPrice}</strong>
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Test card prompt */}
            <div className={`p-3 rounded-xl border border-dashed text-[10px] ${
              theme === 'dark' ? 'bg-amber-950/20 border-amber-500/30 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              💡 <strong>Sınaq Rejimi:</strong> Ödəniş simulyasiyası üçün istənilən məlumatları daxil edib <strong>"Ödənişi Tamamla"</strong> düyməsinə klikləyə bilərsiniz. Kartınızdan vəsait tutulmayacaq.
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Kart Sahibi *</label>
                <input
                  type="text"
                  required
                  placeholder="Məsələn: ELNAR AGASOY"
                  value={nameOnCard}
                  onChange={(e) => setNameOnCard(e.target.value)}
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 ${
                    theme === 'dark' 
                      ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Kart Nömrəsi *</label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  placeholder="4000 1234 5678 9010"
                  value={cardNumber}
                  onChange={(e) => {
                    // format card number with spaces
                    const val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                    const matches = val.match(/\d{4,16}/g);
                    const match = matches && matches[0] || '';
                    const parts = [];
                    for (let i = 0, len = match.length; i < len; i += 4) {
                      parts.push(match.substring(i, i + 4));
                    }
                    if (parts.length > 0) {
                      setCardNumber(parts.join(' '));
                    } else {
                      setCardNumber(val);
                    }
                  }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-500 ${
                    theme === 'dark' 
                      ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Bitmə Tarixi *</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length > 2) {
                        val = val.substring(0, 2) + '/' + val.substring(2, 4);
                      }
                      setExpiry(val);
                    }}
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-red-500 ${
                      theme === 'dark' 
                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">CVV / CVC *</label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-red-500 ${
                      theme === 'dark' 
                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-zinc-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>SSL Şifrələmə ilə təhlükəsiz 256-bit ödəniş sistemi.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Tranzaksiya Yoxlanılır...
                </>
              ) : (
                <>Ödənişi Tamamla və Aktivləşdir</>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS CONGRATULATIONS */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-bounce">
              <Sparkles className="w-8 h-8 fill-amber-500/20" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                Təbriklər, {currentUser.name}! 🎉
              </h2>
              <p className="text-sm font-bold text-amber-500">Artıq CineVerse Premium Üzvüsünüz!</p>
              <p className={`text-xs px-4 leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Hesabınız uğurla yeniləndi. İndi bütün filmləri kəsintisiz, 4K UHD keyfiyyətlə reklamsız izləyə bilər və icmada öz fərqli nişanınızla seçilə bilərsiniz.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 max-w-sm mx-auto ${
              theme === 'dark' ? 'bg-zinc-900/60 border-amber-500/10' : 'bg-amber-50/50 border-amber-100'
            }`}>
              <div className="flex items-center gap-3">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500" 
                />
                <div className="text-left">
                  <p className="text-xs font-bold flex items-center gap-1">
                    {currentUser.name}
                    <span className="text-[9px] bg-amber-500 text-zinc-950 font-black px-1.5 py-0.5 rounded leading-none uppercase">PREMIUM</span>
                  </p>
                  <p className="text-[9px] font-mono text-zinc-500">ID: @{currentUser.username}</p>
                </div>
              </div>
              <Check className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/10"
            >
              İstifadəyə Başla 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
