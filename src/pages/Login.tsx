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
            logger.error('Login failed:', error as Error);

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
            <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8 border border-blue-100">
                    <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">Sign in to your account</h2>
                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm border border-red-200">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full inline-flex justify-center items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-white font-medium shadow-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don’t have an account?{' '}
                        <a href="/register" className="font-medium text-blue-600 hover:text-blue-700">Register</a>
                    </p>
                </div>
            </div>
        </Layout>
    )
}