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
            logger.error('Registration', 'Registration failed', error as Error);

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
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center py-8 sm:py-12 sm:px-6 lg:px-8">
                {/* Background decorative elements */}
                <div className="absolute top-20 right-20 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-60 h-60 bg-emerald-200/30 rounded-full blur-3xl"></div>
                <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
                
                <div className="max-w-lg w-full relative">
                    {/* Logo/brand Section */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="mx-auto h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black">
                           <span className="text-black text-3xl font-black tracking-wider">E</span> 
                        </div>
                        <h2 className="text-4xl font-black text-black mb-2 tracking-tight">CREATE VAULT</h2>
                        <p className="text-gray-700 text-lg font-medium">Join EPLQ for secure location queries</p>
                    </div>
                    
                    {/* Register Form Card */}
                    <div className="bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-6 sm:p-8">
                        {/* Registration Form */}
                        <form onSubmit={handleRegister} className="space-y-6">
                            {error && (
                                <div className="mb-6 rounded-xl bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 text-sm font-medium shadow-[3px_3px_0px_0px_rgba(220,38,38,1)]">
                                    <div className="flex items-center space-x-2">
                                        <span>⚠️</span>
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Full Name */}
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-black text-black mb-3 uppercase tracking-wide">
                                    Full Name *
                                </label>
                                <input 
                                    id="displayName"
                                    name="displayName"
                                    type="text"
                                    required
                                    className="w-full px-4 py-3.5 text-base border-2 border-black rounded-lg shadow-[2.5px_3px_0px_0px_rgba(0,0,0,1)] outline-none transition-all duration-200 ease-in-out focus:shadow-[5.5px_7px_0px_0px_rgba(0,0,0,1)] focus:border-black bg-white text-black placeholder-gray-500 font-medium"
                                    placeholder="Enter your full name"
                                    value={form.displayName}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-black text-black mb-3 uppercase tracking-wide">
                                    Email Address *
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full px-4 py-3.5 text-base border-2 border-black rounded-lg shadow-[2.5px_3px_0px_0px_rgba(0,0,0,1)] outline-none transition-all duration-200 ease-in-out focus:shadow-[5.5px_7px_0px_0px_rgba(0,0,0,1)] focus:border-black bg-white text-black placeholder-gray-500 font-medium"
                                    placeholder="Enter your email address"
                                    value={form.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            
                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-black text-black mb-3 uppercase tracking-wide">
                                    Password *
                                </label>
                                <input 
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="w-full px-4 py-3.5 text-base border-2 border-black rounded-lg shadow-[2.5px_3px_0px_0px_rgba(0,0,0,1)] outline-none transition-all duration-200 ease-in-out focus:shadow-[5.5px_7px_0px_0px_rgba(0,0,0,1)] focus:border-black bg-white text-black placeholder-gray-500 font-medium"
                                    placeholder="Create a password (min 8 characters)"
                                    value={form.password}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-black text-black mb-3 uppercase tracking-wide">
                                    Confirm Password *
                                </label>
                                <input 
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="w-full px-4 py-3.5 text-base border-2 border-black rounded-lg shadow-[2.5px_3px_0px_0px_rgba(0,0,0,1)] outline-none transition-all duration-200 ease-in-out focus:shadow-[5.5px_7px_0px_0px_rgba(0,0,0,1)] focus:border-black bg-white text-black placeholder-gray-500 font-medium"
                                    placeholder="Re-enter your password"
                                    value={form.confirmPassword}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Privacy Level */}
                            <div className="border-t-2 border-black pt-6">
                                <h3 className="text-lg font-black text-black mb-4 uppercase tracking-wide flex items-center space-x-2">
                                    <span>🔒</span>
                                    <span>Privacy Settings</span>
                                </h3>
                                <div>
                                    <label htmlFor="privacyLevel" className="block text-sm font-black text-black mb-3 uppercase tracking-wide">
                                        Privacy Level
                                    </label>
                                    <select
                                        id="privacyLevel"
                                        name="privacyLevel"
                                        className="w-full px-4 py-3.5 text-base border-2 border-black rounded-lg shadow-[2.5px_3px_0px_0px_rgba(0,0,0,1)] outline-none transition-all duration-200 ease-in-out focus:shadow-[5.5px_7px_0px_0px_rgba(0,0,0,1)] focus:border-black bg-white text-black font-medium"
                                        value={form.privacyLevel}
                                        onChange={handleInputChange}
                                    >
                                        <option value="low">🟡 Low - Basic privacy protection</option>
                                        <option value="medium">🟠 Medium - Balanced privacy and performance</option>
                                        <option value="high">🔴 High - Maximum privacy protection</option>
                                    </select>
                                </div>
                            </div>

                            {/* Submit Button */}
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
                                        <span>CREATING VAULT...</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center space-x-2">
                                        <span>🛡️</span>
                                        <span>CREATE ACCOUNT</span>
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Login Link */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-gray-700 font-medium">
                                Already have an account?{' '}
                                <a 
                                    href="/login" 
                                    className="font-black text-black hover:text-emerald-600 transition-colors border-b-2 border-black hover:border-emerald-600 pb-1"
                                >
                                    ACCESS VAULT
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}