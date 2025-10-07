import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DataUpload from './DataUpload'

// Mock EPLQ crypto
const mockEncryptPOI = vi.fn()
const mockInitialize = vi.fn()
const mockIsInitialized = vi.fn()
const mockClearPersistedKeys = vi.fn()

vi.mock('../../lib/encryption/eplq-crypto', () => ({
  eplqCrypto: {
    initialize: mockInitialize,
    isInitialized: mockIsInitialized,
    encryptPOI: mockEncryptPOI,
    clearPersistedKeys: mockClearPersistedKeys,
  },
}))

// Mock Firebase
const mockDoc = vi.fn()
const mockCollection = vi.fn()
const mockWriteBatch = vi.fn()
const mockBatchSet = vi.fn()
const mockBatchCommit = vi.fn()
const mockGetDocs = vi.fn()

vi.mock('../../lib/firebase', () => ({
  db: {},
}))

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  writeBatch: mockWriteBatch,
  getDocs: mockGetDocs,
}))

describe('DataUpload Component', () => {
  const mockOnUploadSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockIsInitialized.mockReturnValue(true)
    mockInitialize.mockResolvedValue(undefined)
    mockEncryptPOI.mockResolvedValue({
      encryptedCoords: 'encrypted',
      spatialIndex: 'index',
      predicateHash: 'hash',
      iv: 'iv',
      timestamp: Date.now(),
    })
    
    const mockBatch = {
      set: mockBatchSet,
      commit: mockBatchCommit.mockResolvedValue(undefined),
    }
    mockWriteBatch.mockReturnValue(mockBatch)
    mockDoc.mockReturnValue({ id: 'mock-doc-id' })
    mockCollection.mockReturnValue({ id: 'mock-collection' })
  })

  it('should render upload interface', () => {
    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    expect(screen.getByText('POI Data Upload')).toBeInTheDocument()
    expect(screen.getByText('Upload Instructions')).toBeInTheDocument()
    expect(screen.getByText('📥 Download Sample CSV')).toBeInTheDocument()
    expect(screen.getByText('🚀 Upload Sample Data Now')).toBeInTheDocument()
    expect(screen.getByText('Select CSV File')).toBeInTheDocument()
  })

  it('should initialize crypto system on mount', async () => {
    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    await waitFor(() => {
      expect(mockInitialize).toHaveBeenCalled()
    })
  })

  it('should show crypto initialization status', async () => {
    mockIsInitialized.mockReturnValue(true)
    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    await waitFor(() => {
      expect(screen.getByText('EPLQ Crypto System: Ready')).toBeInTheDocument()
    })
  })

  it('should upload sample data successfully', async () => {
    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    const uploadButton = screen.getByText('🚀 Upload Sample Data Now')
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(mockEncryptPOI).toHaveBeenCalled()
      expect(mockBatchCommit).toHaveBeenCalled()
    })
  })

  it('should handle CSV file upload', async () => {
    const user = userEvent.setup()
    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    const csvContent = `name,category,latitude,longitude,description
Test Hotel,hotel,25.6093,85.1376,Test hotel description
Test Restaurant,restaurant,25.6100,85.1380,Test restaurant description`
    
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText('Select CSV File') as HTMLInputElement
    
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(mockEncryptPOI).toHaveBeenCalledTimes(2) // Two POIs in test CSV
    })
  })

  it('should validate CSV headers', async () => {
    const user = userEvent.setup()
    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    const invalidCsvContent = `invalid,headers,here
data1,data2,data3`
    
    const file = new File([invalidCsvContent], 'invalid.csv', { type: 'text/csv' })
    const fileInput = screen.getByLabelText('Select CSV File') as HTMLInputElement
    
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/CSV must contain required headers/i)).toBeInTheDocument()
    })
  })

  it('should clear all POI data', async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,
      size: 5,
      docs: Array(5).fill(null).map((_, i) => ({ 
        id: `doc-${i}`, 
        ref: { id: `doc-${i}` } 
      })),
    })

    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    const clearButton = screen.getByText('🗑️ Clear All POI Data')
    fireEvent.click(clearButton)

    await waitFor(() => {
      expect(mockGetDocs).toHaveBeenCalled()
    })
  })

  it('should reset encryption keys', async () => {
    mockClearPersistedKeys.mockResolvedValue(undefined)
    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    const resetButton = screen.getByText('🔄 Reset Encryption Keys')
    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(mockClearPersistedKeys).toHaveBeenCalled()
      expect(mockInitialize).toHaveBeenCalled() // Should re-initialize after reset
    })
  })

  it('should disable buttons when crypto not initialized', () => {
    mockIsInitialized.mockReturnValue(false)
    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    const uploadButton = screen.getByText('🚀 Upload Sample Data Now')
    const clearButton = screen.getByText('🗑️ Clear All POI Data')
    
    expect(uploadButton).toBeDisabled()
    expect(clearButton).toBeDisabled()
  })

  it('should show progress during upload', async () => {
    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    const uploadButton = screen.getByText('🚀 Upload Sample Data Now')
    fireEvent.click(uploadButton)

    // Should show progress bar during upload
    await waitFor(() => {
      expect(screen.getByText(/Encrypting and uploading POIs/)).toBeInTheDocument()
    })
  })

  it('should download sample CSV file', () => {
    const createObjectURL = vi.fn(() => 'blob:url')
    const revokeObjectURL = vi.fn()
    const mockClick = vi.fn()

    // Mock URL methods
    global.URL.createObjectURL = createObjectURL
    global.URL.revokeObjectURL = revokeObjectURL

    // Mock createElement to return element with click method
    const mockAnchor = { 
      href: '', 
      download: '', 
      click: mockClick 
    }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)

    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    const downloadButton = screen.getByText('📥 Download Sample CSV')
    fireEvent.click(downloadButton)

    expect(createObjectURL).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalled()
  })

  it('should handle encryption errors gracefully', async () => {
    mockEncryptPOI.mockRejectedValue(new Error('Encryption failed'))
    render(<DataUpload onUploadSuccess={mockOnUploadSuccess} />)
    
    const uploadButton = screen.getByText('🚀 Upload Sample Data Now')
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(screen.getByText(/Upload failed/)).toBeInTheDocument()
    })
  })
})