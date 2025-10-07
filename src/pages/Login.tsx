import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { logger } from '../utils/logger';
import { Layout } from '../components/Layout';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Firebase authentication
            logger.info('Attempting to login for user:', email);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            logger.info('Login successful:', userCredential.user.uid);

            // Redirect to dashboard on success
            window.location.href = '/dashboard';
        } catch (error: unknown) {
            logger.error('Login', 'Login failed', error as Error);

            // Handle specific Firebase auth errors
            let errorMessage = 'Invalid email or password. Please try again.';
            if (error && typeof error === 'object' && 'code' in error) {
                const firebaseError = error as { code: string };
                switch (firebaseError.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'No user found with this email address.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Incorrect password. Please try again.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Too many failed login attempts. Please try again later.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage = 'This user account has been disabled.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Please enter a valid email address.';
                        break;
                    default:
                        errorMessage = 'Login failed. Please try again.';
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout title="Login - EPLQ">
            <div className="flex-1 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 px-4 py-12 relative overflow-hidden flex items-center justify-center">
                {/* Background decorative elements */}
                <div className="absolute top-20 left-20 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-60 h-60 bg-blue-200/30 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
                
                <div className="w-full max-w-md relative">
                    {/* Logo Section */}
                    <div className="text-center mb-8">
                        <div className="mx-auto h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black relative">
                            <span className="text-black text-3xl font-black tracking-wider">E</span>
                        </div>
                        <h1 className="text-4xl font-black text-black mb-2 tracking-tight">
                            WELCOME BACK
                        </h1>
                        <p className="text-gray-700 text-lg font-medium">Access your secure vault</p>
                    </div>

                    {/* Login Form Card */}
                    <div className="bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8 relative">
                        
                        {error && (
                            <div className="mb-6 rounded-xl bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 text-sm font-medium shadow-[3px_3px_0px_0px_rgba(220,38,38,1)]">
                                <div className="flex items-center space-x-2">
                                    <span>⚠️</span>
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}
                        
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-black text-black mb-3 uppercase tracking-wide">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 text-base border-2 border-black rounded-lg shadow-[2.5px_3px_0px_0px_rgba(0,0,0,1)] outline-none transition-all duration-200 ease-in-out focus:shadow-[5.5px_7px_0px_0px_rgba(0,0,0,1)] focus:border-black bg-white text-black placeholder-gray-500 font-medium"
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-black text-black mb-3 uppercase tracking-wide">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 text-base border-2 border-black rounded-lg shadow-[2.5px_3px_0px_0px_rgba(0,0,0,1)] outline-none transition-all duration-200 ease-in-out focus:shadow-[5.5px_7px_0px_0px_rgba(0,0,0,1)] focus:border-black bg-white text-black placeholder-gray-500 font-medium"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-emerald-400 hover:bg-emerald-300 text-black font-black py-4 px-6 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:translate-x-[-2px] hover:translate-y-[-2px] text-lg uppercase tracking-wide"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center space-x-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>ACCESSING...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center space-x-2">
                                        <span>�</span>
                                        <span>SECURE LOGIN</span>
                                    </span>
                                )}
                            </button>
                        </form>
                        
                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-700 font-medium">
                                Need an account?{' '}
                                <a 
                                    href="/register" 
                                    className="font-black text-black hover:text-emerald-600 transition-colors border-b-2 border-black hover:border-emerald-600 pb-1"
                                >
                                    CREATE VAULT
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}