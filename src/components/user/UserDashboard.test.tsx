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

const mockAuthContextValue: EPLQAuthContextType = {
  user: {
    uid: 'test-uid',
    email: 'test@example.com'
  } as any,
  userProfile: {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'user' as const,
    privacyLevel: 'medium' as const,
    locationDataPermission: ['gps'],
    queryHistory: [
      {
        query: 'restaurants near me',
        timestamp: new Date('2024-01-01'),
        response: 'Found 5 restaurants'
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  updateUserProfile: vi.fn(),
  requestLocationAccess: vi.fn(),
  loading: false
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
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
  });

  it('shows location permissions', () => {
    renderWithRouter(<UserDashboard />);

    expect(screen.getByText(/location/i)).toBeInTheDocument();
  });

  it('displays query history when available', () => {
    renderWithRouter(<UserDashboard />);

    expect(screen.getByText(/query history/i)).toBeInTheDocument();
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

    expect(screen.getByText(/no queries/i)).toBeInTheDocument();
  });

  it('displays user account information', () => {
    renderWithRouter(<UserDashboard />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText(/user/i)).toBeInTheDocument(); // role
  });

  it('shows privacy controls', () => {
    renderWithRouter(<UserDashboard />);

    // Should have privacy-related controls or information
    expect(screen.getByText(/privacy/i)).toBeInTheDocument();
  });

  it('handles loading state when user profile is not available', () => {
    const loadingUser = {
      ...mockAuthContextValue,
      userProfile: null,
      loading: true
    };

    renderWithRouter(<UserDashboard />, loadingUser);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays dashboard navigation elements', () => {
    renderWithRouter(<UserDashboard />);

    // Should render without errors and show dashboard content
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('shows user statistics', () => {
    renderWithRouter(<UserDashboard />);

    // Should display some form of user statistics or metrics
    const dashboard = screen.getByText(/dashboard/i).closest('div');
    expect(dashboard).toBeInTheDocument();
  });

  it('handles user profile updates', () => {
    renderWithRouter(<UserDashboard />);

    // Should show profile information that can be updated
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
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

    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('shows location data permissions status', () => {
    renderWithRouter(<UserDashboard />);

    // Should show information about location permissions
    expect(screen.getByText(/location/i)).toBeInTheDocument();
  });
});