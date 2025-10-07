import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserDashboard } from './UserDashboard';
import { AuthContext, type EPLQAuthContextType } from '../../context/AuthContext';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  auth: {},
  db: {},
}));

// Mock user data
const mockUser = {
  uid: 'user123',
  email: 'user@eplq.com',
  displayName: 'Test User'
} as any;

const mockUserProfile = {
  uid: 'user123',
  email: 'user@eplq.com',
  displayName: 'Test User',
  role: 'user' as const,
  privacyLevel: 'medium' as const,
  locationDataPermission: ['query'],
  queryHistory: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockAuthContextValue: EPLQAuthContextType = {
    user: mockUser,
    userProfile: mockUserProfile,
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    updateUserProfile: vi.fn(),
    requestLocationAccess: vi.fn().mockResolvedValue(true),
    addQueryToHistory: vi.fn().mockResolvedValue(undefined),
    loading: false,
};

const MockAuthProvider = ({ 
  children, 
  value = mockAuthContextValue 
}: { 
  children: React.ReactNode;
  value?: EPLQAuthContextType;
}) => (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);

const renderWithRouter = (component: React.ReactElement, authValue = mockAuthContextValue) => {
  return render(
    <BrowserRouter>
      <MockAuthProvider value={authValue}>
        {component}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

describe('UserDashboard Component', () => {
  it('renders user dashboard with user information', () => {
    renderWithRouter(<UserDashboard />);

    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('displays user privacy settings', () => {
    renderWithRouter(<UserDashboard />);

    expect(screen.getByText(/privacy level/i)).toBeInTheDocument();
    expect(screen.getAllByText(/medium/i)[0]).toBeInTheDocument();
  });

  it('shows location permissions', () => {
    renderWithRouter(<UserDashboard />);

    expect(screen.getAllByText(/location/i)[0]).toBeInTheDocument();
  });

  it('displays query history when available', () => {
    renderWithRouter(<UserDashboard />);

    expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
    expect(screen.getByText('restaurants near me')).toBeInTheDocument();
  });

  it('handles user without query history', () => {
    const userWithoutHistory = {
      ...mockAuthContextValue,
      userProfile: {
        ...mockAuthContextValue.userProfile!,
        queryHistory: []
      }
    };

    renderWithRouter(<UserDashboard />, userWithoutHistory);

    // Should render Recent Activity section
    expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
    // Should show 0 queries in stats
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('displays user account information', () => {
    renderWithRouter(<UserDashboard />);

    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('shows privacy controls', () => {
    renderWithRouter(<UserDashboard />);

    // Should have privacy-related controls or information
    expect(screen.getAllByText(/privacy/i)[0]).toBeInTheDocument();
  });

  it('handles loading state when user profile is not available', () => {
    const loadingUser = {
      ...mockAuthContextValue,
      userProfile: null,
      loading: true
    };

    renderWithRouter(<UserDashboard />, loadingUser);

    // Should still render the component, even without userProfile
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('displays dashboard navigation elements', () => {
    renderWithRouter(<UserDashboard />);

    // Should render without errors and show tab navigation
    expect(screen.getAllByText(/overview/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/privacy/i)[0]).toBeInTheDocument();
  });

  it('shows user statistics', () => {
    renderWithRouter(<UserDashboard />);

    // Should display user statistics in cards
    expect(screen.getByText(/total queries/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy level/i)).toBeInTheDocument();
  });

  it('handles user profile updates', () => {
    renderWithRouter(<UserDashboard />);

    // Should show profile information that can be updated
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getAllByText(/medium/i)[0]).toBeInTheDocument();
  });

  it('displays appropriate content for different privacy levels', () => {
    const highPrivacyUser = {
      ...mockAuthContextValue,
      userProfile: {
        ...mockAuthContextValue.userProfile!,
        privacyLevel: 'high' as const
      }
    };

    renderWithRouter(<UserDashboard />, highPrivacyUser);

    expect(screen.getAllByText(/high/i)[0]).toBeInTheDocument();
  });

  it('shows location data permissions status', () => {
    renderWithRouter(<UserDashboard />);

    // Should show information about location permissions
    expect(screen.getAllByText(/location/i)[0]).toBeInTheDocument();
  });
});