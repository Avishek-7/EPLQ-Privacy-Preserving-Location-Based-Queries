import React, { useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Define QueryRecord type (customize fields as needed)
export type QueryRecord = {
    query: string;
    timestamp: Date;
    response?: string;
};

export interface EPLQUserProfiles{
    uid: string,
    email: string;
    displayName: string;
    role: 'user' | 'admin';
    privacyLevel: 'low' | 'medium' | 'high';
    locationDataPermission: string[];
    queryHistory?: QueryRecord[];
    createdAt: Date;
    updatedAt: Date;
}

// Define PrivacySettings type (customize fields as needed)
export type PrivacySettings = {
    privacyLevel: 'low' | 'medium' | 'high';
    locationDataPermission: string[];
};

export interface EPLQAuthContextType {
    user: User | null;
    userProfile: EPLQUserProfiles | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, profileData: EPLQUserProfiles) => Promise<void>;
    logout: () => Promise<void>;
    updateUserProfile: (settings: PrivacySettings) => Promise<void>;
    requestLocationAccess: (permissions: string[]) => Promise<boolean>;
}

// Enhanced logging function
const log = {
    info: (message: string, ...args: unknown[]) => {
        console.log(`ℹ️ [AuthContext] ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
        console.warn(`⚠️ [AuthContext] ${message}`, ...args);
    },
    error: (message: string, error?: unknown, ...args: unknown[]) => {
        console.error(`❌ [AuthContext] ${message}`, error, ...args);
    },
    success: (message: string, ...args: unknown[]) => {
        console.log(`✅ [AuthContext] ${message}`, ...args);
    }
};

// Geolocation error handler
const handleGeolocationError = (error: GeolocationPositionError): string => {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return "User denied the request for Geolocation.";
        case error.POSITION_UNAVAILABLE:
            return "Location information is unavailable.";
        case error.TIMEOUT:
            return "The request to get user location timed out.";
        default:
            return "An unknown error occurred while requesting location.";
    }
};

// Create the AuthContext
export const AuthContext = React.createContext<EPLQAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<EPLQUserProfiles | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user profile from Firestore
    const loadUserProfile = React.useCallback(async (uid: string): Promise<void> => {
        log.info(`Loading user profile for UID: ${uid}`);
        
        try {
            const userDocRef = doc(db, 'userProfiles', uid);
            log.info(`Attempting to fetch user document from Firestore...`);
            
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                log.success(`User profile found in Firestore`);
                const data = userDoc.data();
                
                const profile: EPLQUserProfiles = {
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    queryHistory: data.queryHistory?.map((record: unknown) => {
                        const recordData = record as {
                            query: string;
                            timestamp: unknown;
                            response?: string;
                        };
                        return {
                            ...recordData,
                            timestamp: (recordData.timestamp instanceof Date
                                ? recordData.timestamp
                                : (recordData.timestamp && typeof (recordData.timestamp as { toDate?: () => Date }).toDate === 'function')
                                    ? (recordData.timestamp as { toDate: () => Date }).toDate()
                                    : new Date())
                        };
                    }) || []
                } as EPLQUserProfiles;
                
                setUserProfile(profile);
                log.success(`User profile loaded successfully`, profile);
            } else {
                log.warn(`No user profile found, creating default profile`);
                
                // Create a default profile if none exists
                const defaultProfile: EPLQUserProfiles = {
                    uid,
                    email: user?.email ?? '',
                    displayName: user?.displayName ?? '',
                    role: 'user',
                    privacyLevel: 'medium',
                    locationDataPermission: [],
                    queryHistory: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                
                log.info(`Creating default user profile in Firestore...`);
                await setDoc(userDocRef, {
                    ...defaultProfile,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                setUserProfile(defaultProfile);
                log.success(`Default user profile created successfully`);
            }
        } catch (error) {
            log.error('Error loading user profile:', error);
            
            // Set a fallback profile on error
            const fallbackProfile: EPLQUserProfiles = {
                uid,
                email: user?.email ?? '',
                displayName: user?.displayName ?? '',
                role: 'user',
                privacyLevel: 'medium',
                locationDataPermission: [],
                queryHistory: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            
            setUserProfile(fallbackProfile);
            log.warn('Using fallback profile due to Firestore error');
        }
    }, [user]);

    useEffect(() => {
        log.info('Setting up authentication state listener...');
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            log.info('Auth state changed:', user ? `User logged in: ${user.email}` : 'User logged out');
            
            setUser(user);
            
            if(user){
                log.info('User authenticated, loading profile...');
                await loadUserProfile(user.uid);
            } else {
                log.info('No user, clearing profile');
                setUserProfile(null);
            }
            
            setLoading(false);
            log.success('Auth state update complete');
        });
        
        return () => {
            log.info('Cleaning up auth state listener');
            unsubscribe();
        };
    }, [loadUserProfile]);

    // Authentication functions
    const login = async (email: string, password: string): Promise<void> => {
        log.info(`Attempting login for email: ${email}`);
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            log.success(`Login successful for user: ${userCredential.user.email}`);
        } catch (error: unknown) {
            log.error('Login failed:', error);
            
            // Enhanced error messages
            let errorMessage = 'Login failed';
            const firebaseError = error as { code?: string; message?: string };
            
            if (firebaseError.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address';
            } else if (firebaseError.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (firebaseError.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (firebaseError.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled';
            } else if (firebaseError.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later';
            }
            
            const enhancedError = new Error(errorMessage);
            (enhancedError as { code?: string }).code = firebaseError.code;
            throw enhancedError;
        }
    };

    const register = async (email: string, password: string, profileData: EPLQUserProfiles): Promise<void> => {
        log.info(`Attempting registration for email: ${email}`);
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            log.success(`Registration successful for user: ${user.email}`);

            // Create user profile in Firestore
            const newProfile: EPLQUserProfiles = {
                ...profileData,
                uid: user.uid,
                email: user.email || email,
                queryHistory: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            log.info('Creating user profile in Firestore...');
            const userDocRef = doc(db, 'userProfiles', user.uid);
            await setDoc(userDocRef, newProfile);
            
            setUserProfile(newProfile);
            log.success('User profile created successfully');
        } catch (error: unknown) {
            log.error('Registration failed:', error);
            
            // Enhanced error messages
            let errorMessage = 'Registration failed';
            const firebaseError = error as { code?: string; message?: string };
            
            if (firebaseError.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists';
            } else if (firebaseError.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (firebaseError.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters';
            }
            
            const enhancedError = new Error(errorMessage);
            (enhancedError as { code?: string }).code = firebaseError.code;
            throw enhancedError;
        }
    };

    const logout = async (): Promise<void> => {
        log.info('Attempting logout...');
        
        try {
            await signOut(auth);
            setUserProfile(null);
            log.success('Logout successful');
        } catch (error) {
            log.error('Logout failed:', error);
            throw error;
        }
    };

    const updateUserProfile = async (settings: PrivacySettings): Promise<void> => {
        if (!user || !userProfile) {
            const error = new Error('No user logged in');
            log.error('Update profile failed: No user logged in');
            throw error;
        }

        log.info('Updating user profile...', settings);

        try {
            const updatedProfile: EPLQUserProfiles = {
                ...userProfile,
                privacyLevel: settings.privacyLevel,
                locationDataPermission: settings.locationDataPermission,
                updatedAt: new Date()
            };

            const userDocRef = doc(db, 'userProfiles', user.uid);
            
            log.info('Saving profile updates to Firestore...');
            await updateDoc(userDocRef, {
                privacyLevel: settings.privacyLevel,
                locationDataPermission: settings.locationDataPermission,
                updatedAt: new Date()
            });
            
            setUserProfile(updatedProfile);
            log.success('User profile updated successfully');
        } catch (error) {
            log.error('Error updating user profile:', error);
            throw error;
        }
    };

    const requestLocationAccess = async (permissions: string[]): Promise<boolean> => {
        log.info('Requesting location access...', permissions);
        
        try {
            // Check if geolocation is available
            if (!('geolocation' in navigator)) {
                log.warn('Geolocation is not supported by this browser');
                return false;
            }

            log.info('Geolocation API available, requesting permission...');

            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        log.success('Location access granted:', {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy
                        });
                        
                        // Update user profile with new permissions
                        if (userProfile) {
                            try {
                                log.info('Updating user profile with location permissions...');
                                await updateUserProfile({
                                    privacyLevel: userProfile.privacyLevel,
                                    locationDataPermission: permissions
                                });
                                resolve(true);
                            } catch (error) {
                                log.error('Error updating location permissions:', error);
                                resolve(false);
                            }
                        } else {
                            log.warn('No user profile found, but location access granted');
                            resolve(true);
                        }
                    },
                    (error) => {
                        const errorMessage = handleGeolocationError(error);
                        log.error('Location access denied:', errorMessage, error);
                        resolve(false);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 60000
                    }
                );
            });
        } catch (error) {
            log.error('Error requesting location access:', error);
            return false;
        }
    };

    // Provide context value
    const contextValue: EPLQAuthContextType = {
        user,
        userProfile,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        requestLocationAccess,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}