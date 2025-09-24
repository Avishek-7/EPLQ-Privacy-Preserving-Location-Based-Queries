import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '../utils/logger'

describe('Logger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should log info messages with proper formatting', () => {
    logger.info('TestModule', 'Test message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      expect.stringContaining('TestModule'),
      'Test message'
    )
  })

  it('should log success messages with proper formatting', () => {
    logger.success('TestModule', 'Success message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SUCCESS]'),
      expect.stringContaining('TestModule'),
      'Success message'
    )
  })

  it('should log warning messages with proper formatting', () => {
    logger.warn('TestModule', 'Warning message')
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[WARN]'),
      expect.stringContaining('TestModule'),
      'Warning message'
    )
  })

  it('should log error messages with proper formatting', () => {
    const error = new Error('Test error')
    logger.error('TestModule', 'Error message', error)
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      expect.stringContaining('TestModule'),
      'Error message',
      error
    )
  })

  it('should handle messages without context', () => {
    logger.info('TestModule', 'Simple message')
    expect(consoleSpy).toHaveBeenCalled()
  })
})