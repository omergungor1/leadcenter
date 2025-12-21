'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail } from '@/lib/supabase/auth';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { user, session, error: signInError } = await signInWithEmail(email, password);

            if (signInError) {
                setError(signInError.message || 'Invalid email or password');
                setLoading(false);
                return;
            }

            if (user && session) {
                // Redirect to dashboard
                router.push('/');
                router.refresh();
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <img
                            src="/logo.png"
                            alt="Lead Gun"
                            className="h-12 w-auto"
                        />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
                        Hoş Geldiniz
                    </h1>
                    <p className="text-sm text-slate-500 text-center mb-8">
                        Hesabınıza giriş yapınız
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email Adresi
                            </label>
                            <div className="relative">
                                <Mail
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="email@example.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Şifrenizi giriniz"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Giriş yapılıyor...</span>
                                </>
                            ) : (
                                <span>Giriş Yap</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-slate-500 mt-6">
                    Hesabınız yok mu? Yöneticinizle iletişime geçiniz.
                </p>
            </div>
        </div>
    );
}

