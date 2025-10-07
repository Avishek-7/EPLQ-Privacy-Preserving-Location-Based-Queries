import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import POISearch from './POISearch'

// Mock EPLQ crypto
const mockExecuteRangeQuery = vi.fn()
const mockIsInitialized = vi.fn()

vi.mock('../../lib/encryption/eplq-crypto', () => ({
  eplqCrypto: {
    isInitialized: mockIsInitialized,
    executeRangeQuery: mockExecuteRangeQuery,
  },
}))

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
}))

describe('POISearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsInitialized.mockReturnValue(true)
    mockExecuteRangeQuery.mockResolvedValue([
      {
        name: 'Test Hotel',
        category: 'hotel',
        latitude: 25.6093,
        longitude: 85.1376,
        description: 'Test hotel description',
      },
      {
        name: 'Test Restaurant',
        category: 'restaurant',
        latitude: 25.6100,
        longitude: 85.1380,
        description: 'Test restaurant description',
      },
    ])

    // Mock geolocation
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn().mockImplementation((success) =>
          success({
            coords: {
              latitude: 25.6093,
              longitude: 85.1376,
            },
          })
        ),
      },
      writable: true,
    })
  })

  it('should render search interface', () => {
    render(<POISearch />)
    
    expect(screen.getByText('Privacy-Preserving POI Search')).toBeInTheDocument()
    expect(screen.getByText('🎯 Search POIs')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter latitude/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter longitude/i)).toBeInTheDocument()
  })

  it('should get current location when button clicked', async () => {
    render(<POISearch />)
    
    const locationButton = screen.getByText('📍 Use Current Location')
    fireEvent.click(locationButton)

    await waitFor(() => {
      const latInput = screen.getByPlaceholderText(/enter latitude/i) as HTMLInputElement
      const lngInput = screen.getByPlaceholderText(/enter longitude/i) as HTMLInputElement
      
      expect(latInput.value).toBe('25.6093')
      expect(lngInput.value).toBe('85.1376')
    })
  })

  it('should perform search with valid coordinates', async () => {
    const user = userEvent.setup()
    render(<POISearch />)
    
    const latInput = screen.getByPlaceholderText(/enter latitude/i)
    const lngInput = screen.getByPlaceholderText(/enter longitude/i)
    const searchButton = screen.getByText('🎯 Search POIs')
    
    await user.type(latInput, '25.6093')
    await user.type(lngInput, '85.1376')
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(mockExecuteRangeQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          centerLat: 25.6093,
          centerLng: 85.1376,
        }),
        expect.any(Array)
      )
    })
  })

  it('should display search results', async () => {
    const user = userEvent.setup()
    render(<POISearch />)
    
    const latInput = screen.getByPlaceholderText(/enter latitude/i)
    const lngInput = screen.getByPlaceholderText(/enter longitude/i)
    const searchButton = screen.getByText('🎯 Search POIs')
    
    await user.type(latInput, '25.6093')
    await user.type(lngInput, '85.1376')
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText('Test Hotel')).toBeInTheDocument()
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
      expect(screen.getByText('Found 2 POIs')).toBeInTheDocument()
    })
  })

  it('should filter by category', async () => {
    const user = userEvent.setup()
    render(<POISearch />)
    
    const categorySelect = screen.getByDisplayValue('All Categories')
    await user.selectOptions(categorySelect, 'hotel')
    
    const latInput = screen.getByPlaceholderText(/enter latitude/i)
    const lngInput = screen.getByPlaceholderText(/enter longitude/i)
    const searchButton = screen.getByText('🎯 Search POIs')
    
    await user.type(latInput, '25.6093')
    await user.type(lngInput, '85.1376')
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(mockExecuteRangeQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'hotel',
        }),
        expect.any(Array)
      )
    })
  })

  it('should adjust search radius', async () => {
    const user = userEvent.setup()
    render(<POISearch />)
    
    const radiusSlider = screen.getByLabelText(/search radius/i)
    fireEvent.change(radiusSlider, { target: { value: '20' } })
    
    const latInput = screen.getByPlaceholderText(/enter latitude/i)
    const lngInput = screen.getByPlaceholderText(/enter longitude/i)
    const searchButton = screen.getByText('🎯 Search POIs')
    
    await user.type(latInput, '25.6093')
    await user.type(lngInput, '85.1376')
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(mockExecuteRangeQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          radius: 20000, // 20km in meters
        }),
        expect.any(Array)
      )
    })
  })

  it('should validate coordinate input', async () => {
    const user = userEvent.setup()
    render(<POISearch />)
    
    const latInput = screen.getByPlaceholderText(/enter latitude/i)
    const lngInput = screen.getByPlaceholderText(/enter longitude/i)
    const searchButton = screen.getByText('🎯 Search POIs')
    
    await user.type(latInput, '91') // Invalid latitude
    await user.type(lngInput, '181') // Invalid longitude
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid latitude/i)).toBeInTheDocument()
      expect(screen.getByText(/invalid longitude/i)).toBeInTheDocument()
    })
  })

  it('should handle search errors gracefully', async () => {
    mockExecuteRangeQuery.mockRejectedValue(new Error('Search failed'))
    
    const user = userEvent.setup()
    render(<POISearch />)
    
    const latInput = screen.getByPlaceholderText(/enter latitude/i)
    const lngInput = screen.getByPlaceholderText(/enter longitude/i)
    const searchButton = screen.getByText('🎯 Search POIs')
    
    await user.type(latInput, '25.6093')
    await user.type(lngInput, '85.1376')
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument()
    })
  })

  it('should show no results message', async () => {
    mockExecuteRangeQuery.mockResolvedValue([])
    
    const user = userEvent.setup()
    render(<POISearch />)
    
    const latInput = screen.getByPlaceholderText(/enter latitude/i)
    const lngInput = screen.getByPlaceholderText(/enter longitude/i)
    const searchButton = screen.getByText('🎯 Search POIs')
    
    await user.type(latInput, '25.6093')
    await user.type(lngInput, '85.1376')
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/no POIs found/i)).toBeInTheDocument()
    })
  })

  it('should disable search when crypto not initialized', () => {
    mockIsInitialized.mockReturnValue(false)
    render(<POISearch />)
    
    const searchButton = screen.getByText('🎯 Search POIs')
    expect(searchButton).toBeDisabled()
  })

  it('should show loading state during search', async () => {
    mockExecuteRangeQuery.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    )
    
    const user = userEvent.setup()
    render(<POISearch />)
    
    const latInput = screen.getByPlaceholderText(/enter latitude/i)
    const lngInput = screen.getByPlaceholderText(/enter longitude/i)
    const searchButton = screen.getByText('🎯 Search POIs')
    
    await user.type(latInput, '25.6093')
    await user.type(lngInput, '85.1376')
    fireEvent.click(searchButton)

    expect(screen.getByText(/searching/i)).toBeInTheDocument()
    expect(searchButton).toBeDisabled()
  })
})