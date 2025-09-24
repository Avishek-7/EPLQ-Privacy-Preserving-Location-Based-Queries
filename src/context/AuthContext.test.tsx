import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import React, { useContext, useState } from 'react';
import { AuthProvider, AuthContext, type EPLQUserProfiles } from '../context/AuthContext';

// Mock Firebase
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('../lib/firebase', () => ({
  auth: {},
  db: {},
}));

const TestComponent = () => {
  const auth = useContext(AuthContext);
  
  if (!auth) {
    return <div>No auth context</div>;
  }

  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.email : 'No user'}</div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="user-profile">
        {auth.userProfile ? auth.userProfile.displayName : 'No profile'}
      </div>
      <button onClick={() => auth.login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides auth context to children', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn(); // unsubscribe function
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    expect(screen.getByTestId('user-profile')).toHaveTextContent('No profile');
  });

  it('handles user authentication state changes', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    const { onAuthStateChanged } = await import('firebase/auth');
    const { getDoc } = await import('firebase/firestore');
    
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      setTimeout(() => callback(mockUser as any), 0);
      return vi.fn();
    });

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        privacyLevel: 'medium',
        locationDataPermission: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } as any);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });
  });

  it('handles login functionality', async () => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const { getDoc } = await import('firebase/firestore');
    
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com'
    };

    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: mockUser
    } as any);

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        privacyLevel: 'medium',
        locationDataPermission: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    } as any);

    const { onAuthStateChanged } = await import('firebase/auth');
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    
    await act(async () => {
      loginButton.click();
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      'test@example.com',
      'password'
    );
  });

  it('handles logout functionality', async () => {
    const { signOut } = await import('firebase/auth');
    
    vi.mocked(signOut).mockResolvedValue();

    const { onAuthStateChanged } = await import('firebase/auth');
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const logoutButton = screen.getByText('Logout');
    
    await act(async () => {
      logoutButton.click();
    });

    expect(signOut).toHaveBeenCalledWith({});
  });

  it('handles registration functionality', async () => {
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
    const { setDoc } = await import('firebase/firestore');
    
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com'
    };

    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
      user: mockUser
    } as any);

    vi.mocked(updateProfile).mockResolvedValue();
    vi.mocked(setDoc).mockResolvedValue();

    const { onAuthStateChanged } = await import('firebase/auth');
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    const TestRegisterComponent = () => {
      const auth = useContext(AuthContext);
      
      const handleRegister = async () => {
        const profileData: EPLQUserProfiles = {
          uid: 'test-uid',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'user',
          privacyLevel: 'medium',
          locationDataPermission: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await auth?.register('test@example.com', 'password', profileData);
      };
      
      return (
        <button onClick={handleRegister}>Register</button>
      );
    };

    render(
      <AuthProvider>
        <TestRegisterComponent />
      </AuthProvider>
    );

    const registerButton = screen.getByText('Register');
    
    await act(async () => {
      registerButton.click();
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      'test@example.com',
      'password'
    );
  });

  it('handles loading state correctly', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    
    let authCallback: any;
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      authCallback = callback;
      return vi.fn();
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially should be loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    // After auth state change, should not be loading
    await act(async () => {
      authCallback(null);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });
  });

  it('handles profile update functionality', async () => {
    const { updateDoc } = await import('firebase/firestore');
    
    vi.mocked(updateDoc).mockResolvedValue();

    const { onAuthStateChanged } = await import('firebase/auth');
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      callback({
        uid: 'test-uid',
        email: 'test@example.com'
      } as any);
      return vi.fn();
    });

    const TestUpdateComponent = () => {
      const auth = useContext(AuthContext);
      
      const handleUpdate = async () => {
        await auth?.updateUserProfile({
          privacyLevel: 'high',
          locationDataPermission: ['gps', 'network']
        });
      };
      
      return (
        <button onClick={handleUpdate}>Update Profile</button>
      );
    };

    render(
      <AuthProvider>
        <TestUpdateComponent />
      </AuthProvider>
    );

    const updateButton = screen.getByText('Update Profile');
    
    await act(async () => {
      updateButton.click();
    });

    expect(updateDoc).toHaveBeenCalled();
  });

  it('handles location access request', async () => {
    const { onAuthStateChanged } = await import('firebase/auth');
    vi.mocked(onAuthStateChanged).mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });

    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 25.6093,
            longitude: 85.1376
          }
        });
      })
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true
    });

    const TestLocationComponent = () => {
      const auth = useContext(AuthContext);
      const [hasAccess, setHasAccess] = React.useState(false);
      
      const handleLocationRequest = async () => {
        const access = await auth?.requestLocationAccess(['gps']);
        setHasAccess(access || false);
      };
      
      return (
        <div>
          <button onClick={handleLocationRequest}>Request Location</button>
          <div data-testid="location-access">{hasAccess ? 'Has access' : 'No access'}</div>
        </div>
      );
    };

    render(
      <AuthProvider>
        <TestLocationComponent />
      </AuthProvider>
    );

    const requestButton = screen.getByText('Request Location');
    
    await act(async () => {
      requestButton.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-access')).toHaveTextContent('Has access');
    });
  });
});