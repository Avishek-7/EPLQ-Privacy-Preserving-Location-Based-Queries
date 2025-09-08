import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { logger } from '../utils/logger';

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
    }
}