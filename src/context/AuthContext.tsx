import React, { useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Define QueryRecord type (customize fields as needed)
export type QueryRecord = {
    query: string;
    timestamp: Date;
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

// Create the AuthContext
export const AuthContext = React.createContext<EPLQAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<EPLQUserProfiles | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user profile from Firestore
    const loadUserProfile = React.useCallback(async (uid: string): Promise<void> => {
        try {
            const userDocRef = doc(db, 'userProfiles', uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserProfile({
                    ...data,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                    queryHistory: data.queryHistory?.map((record: QueryRecord) => ({
                        ...record,
                        timestamp: (record.timestamp instanceof Date
                            ? record.timestamp
                            : (record.timestamp && typeof (record.timestamp as { toDate?: () => Date }).toDate === 'function')
                                ? (record.timestamp as { toDate: () => Date }).toDate()
                                : new Date())
                    })) || []
                } as EPLQUserProfiles);
            } else {
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
                
                await setDoc(userDocRef, {
                    ...defaultProfile,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                setUserProfile(defaultProfile);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Set a fallback profile on error
            setUserProfile({
                uid,
                email: user?.email ?? '',
                displayName: user?.displayName ?? '',
                role: 'user',
                privacyLevel: 'medium',
                locationDataPermission: [],
                queryHistory: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
    }, [user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if(user){
                // Load user profile from database here
                await loadUserProfile(user.uid);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [loadUserProfile]);

    // Authentication functions
    const login = async (email: string, password: string): Promise<void> => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (email: string, password: string, profileData: EPLQUserProfiles): Promise<void> => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            const newProfile: EPLQUserProfiles = {
                ...profileData,
                uid: user.uid,
                email: user.email || email,
                queryHistory: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const userDocRef = doc(db, 'userProfiles', user.uid);
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
            setUserProfile(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const updateUserProfile = async (settings: PrivacySettings): Promise<void> => {
        if (!user || !userProfile) {
            throw new Error('No user logged in');
        }

        try {
            const updatedProfile: EPLQUserProfiles = {
                ...userProfile,
                privacyLevel: settings.privacyLevel,
                locationDataPermission: settings.locationDataPermission,
                updatedAt: new Date()
            };

            const userDocRef = doc(db, 'userProfiles', user.uid);
            await updateDoc(userDocRef, {
                privacyLevel: settings.privacyLevel,
                locationDataPermission: settings.locationDataPermission,
                updatedAt: new Date()
            });
            
            setUserProfile(updatedProfile);
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    };

    const requestLocationAccess = async (permissions: string[]): Promise<boolean> => {
        try {
            // Check if geolocation is available
            if (!('geolocation' in navigator)) {
                console.warn('Geolocation is not supported by this browser');
                return false;
            }

            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        console.log('Location access granted:', position.coords);
                        
                        // Update user profile with new permissions
                        if (userProfile) {
                            try {
                                await updateUserProfile({
                                    privacyLevel: userProfile.privacyLevel,
                                    locationDataPermission: permissions
                                });
                                resolve(true);
                            } catch (error) {
                                console.error('Error updating location permissions:', error);
                                resolve(false);
                            }
                        } else {
                            resolve(true);
                        }
                    },
                    (error) => {
                        console.error('Location access denied:', error);
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
            console.error('Error requesting location access:', error);
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