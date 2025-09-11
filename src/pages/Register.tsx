import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Layout } from '../components/Layout';
import { logger } from '../utils/logger';
import type { EPLQUserProfiles } from '../context/AuthContext';

interface RegistrationForm {
    uid: string;
    email: string;
    password: string;
    confirmPassword: string;
    displayName: string;
    privacyLevel: 'low' | 'medium' | 'high';
    locationDataPermission: string[];
    role: 'user' | 'admin';
    createdAt: Date;
    updatedAt: Date;
}

export const RegisterPage: React.FC = () => {
    const [form, setForm] = useState<RegistrationForm>({
        uid: '',
        displayName: '',
        email: '',
        password: '',
        confirmPassword: '',
        privacyLevel: 'medium',
        locationDataPermission: [],
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // const role = ['admin', 'user'];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = (): boolean => {
        if (!form.email.trim() || !form.password.trim() || !form.displayName.trim()) {
            setError('All fields are required.');
            return false;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return false;
        }
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return false;
        }
        return true;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            logger.info('Attempting to register user:', form.email);
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;
            logger.info('User registration successful:', user.uid);

            // Update user profile
            await updateProfile(user, { displayName: form.displayName });

            // Create user profile in Firestore
            const userProfile: EPLQUserProfiles = {
                uid: user.uid,
                email: form.email,
                displayName: form.displayName,
                privacyLevel: form.privacyLevel,
                locationDataPermission: form.locationDataPermission,
                role: form.role,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await setDoc(doc(db, 'userProfiles', user.uid), userProfile);
            logger.info('User profile created in Firestore:', user.uid);

            // Redirect to login page on success
            window.location.href = '/login';
        } catch (error: unknown) {
            logger.error('Registration failed:', error as Error);

            let errorMessage = 'Registration failed. Please try again.';
            if (error && typeof error === 'object' && 'code' in error) {
                const firebaseError = error as { code: string };
                switch (firebaseError.code){
                    case 'auth/email-already-in-use':
                        errorMessage = 'This email is already in use.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Please enter a valid email address.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password is too weak. Please choose a stronger password.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Please check your internet connection and try again.';
                        break;
                    default:
                        errorMessage = 'Registration failed. Please try again.';
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout title="Register - EPLQ">
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center py-8 sm:py-12 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    {/* Logo/brand Section */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="mx-auto h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                           <span className="text-white text-xl sm:text-2xl font-bold">E</span> 
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                        <p className="text-gray-600 text-sm sm:text-base">Join EPLQ for secure location queries</p>
                    </div>
                    
                    {/* Register Form Card */}
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
                        {/* Registration Form */}
                        <form onSubmit={handleRegister} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 mb-4">
                                    <span>❌</span>
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}
                            
                            {/* Full Name */}
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input 
                                    id="displayName"
                                    name="displayName"
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 placeholder-gray-400 text-sm sm:text-base"
                                    placeholder="Enter your full name"
                                    value={form.displayName}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 placeholder-gray-400 text-sm sm:text-base"
                                    placeholder="Enter your email address"
                                    value={form.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            
                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <input 
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 placeholder-gray-400 text-sm sm:text-base"
                                    placeholder="Create a password (min 8 characters)"
                                    value={form.password}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password *
                                </label>
                                <input 
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 placeholder-gray-400 text-sm sm:text-base"
                                    placeholder="Re-enter your password"
                                    value={form.confirmPassword}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Privacy Level */}
                            <div>
                                <label htmlFor="privacyLevel" className="block text-sm font-medium text-gray-700 mb-2">
                                    Privacy Level
                                </label>
                                <select
                                    id="privacyLevel"
                                    name="privacyLevel"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 text-sm sm:text-base"
                                    value={form.privacyLevel}
                                    onChange={handleInputChange}
                                >
                                    <option value="low">Low - Basic privacy protection</option>
                                    <option value="medium">Medium - Balanced privacy and performance</option>
                                    <option value="high">High - Maximum privacy protection</option>
                                </select>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium text-sm sm:text-base hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center space-x-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Creating Account...</span>
                                    </span>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        {/* Login Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <a href="/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200">
                                    Sign in
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}