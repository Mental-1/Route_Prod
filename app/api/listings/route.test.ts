import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from './route'

jest.mock('../../../lib/database', () => ({
  getListings: jest.fn(),
  createListing: jest.fn(),
  updateListing: jest.fn(),
  deleteListing: jest.fn(),
  getListingById: jest.fn(),
}))

jest.mock('../../../lib/auth', () => ({
  validateUser: jest.fn(),
  isAuthenticated: jest.fn(),
}))

jest.mock('../../../lib/validation', () => ({
  validateListingData: jest.fn(),
}))

const mockDatabase = require('../../../lib/database')
const mockAuth = require('../../../lib/auth')
const mockValidation = require('../../../lib/validation')

// Test data
const mockListing = {
  id: '1',
  title: 'Test Listing',
  description: 'A test listing description',
  price: 100,
  category: 'electronics',
  userId: 'user123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const mockListings = [
  mockListing,
  {
    id: '2',
    title: 'Another Listing',
    description: 'Another test listing',
    price: 200,
    category: 'books',
    userId: 'user456',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Helper to build mock NextRequest
const createMockRequest = (
  method: string,
  body?: any,
  searchParams?: Record<string, string>,
  headers?: Record<string, string>
): NextRequest => {
  const url = new URL('http://localhost:3000/api/listings')
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  return new NextRequest(url.toString(), {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

describe('Listings API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.isAuthenticated.mockResolvedValue(true)
    mockAuth.validateUser.mockResolvedValue({ id: 'user123', email: 'test@example.com' })
    mockValidation.validateListingData.mockReturnValue({ isValid: true, errors: [] })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET /api/listings', () => {
    it('should return all listings successfully', async () => {
      mockDatabase.getListings.mockResolvedValue(mockListings)

      const request = createMockRequest('GET')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.listings).toEqual(mockListings)
      expect(mockDatabase.getListings).toHaveBeenCalledWith({})
    })

    it('should handle query parameters for filtering', async () => {
      const filtered = [mockListing]
      mockDatabase.getListings.mockResolvedValue(filtered)

      const request = createMockRequest('GET', null, {
        category: 'electronics',
        minPrice: '50',
        maxPrice: '150',
      })
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.listings).toEqual(filtered)
      expect(mockDatabase.getListings).toHaveBeenCalledWith({
        category: 'electronics',
        minPrice: 50,
        maxPrice: 150,
      })
    })

    it('should handle pagination parameters', async () => {
      mockDatabase.getListings.mockResolvedValue({
        listings: [mockListing],
        total: 1,
        page: 1,
        limit: 10,
      })

      const request = createMockRequest('GET', null, { page: '1', limit: '10' })
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
    })

    it('should return empty array when no listings exist', async () => {
      mockDatabase.getListings.mockResolvedValue([])

      const request = createMockRequest('GET')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.listings).toEqual([])
    })

    it('should handle database errors gracefully', async () => {
      mockDatabase.getListings.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest('GET')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle invalid query parameters', async () => {
      const request = createMockRequest('GET', null, {
        minPrice: 'invalid',
        limit: '-1',
      })
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid query parameters')
    })
  })

  describe('POST /api/listings', () => {
    const validListingData = {
      title: 'New Listing',
      description: 'A new listing description',
      price: 150,
      category: 'electronics',
    }

    it('should create a new listing successfully', async () => {
      const created = { ...mockListing, ...validListingData }
      mockDatabase.createListing.mockResolvedValue(created)

      const request = createMockRequest('POST', validListingData, null, {
        Authorization: 'Bearer valid-token',
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.listing).toEqual(created)
      expect(mockDatabase.createListing).toHaveBeenCalledWith(validListingData, 'user123')
    })

    it('should require authentication', async () => {
      mockAuth.isAuthenticated.mockResolvedValue(false)

      const request = createMockRequest('POST', validListingData)
      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should validate required fields', async () => {
      mockValidation.validateListingData.mockReturnValue({
        isValid: false,
        errors: ['Title is required', 'Price must be a positive number'],
      })

      const invalid = { description: 'Missing title and price' }
      const request = createMockRequest('POST', invalid, null, {
        Authorization: 'Bearer valid-token',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Title is required')
      expect(data.errors).toContain('Price must be a positive number')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle database creation errors', async () => {
      mockDatabase.createListing.mockRejectedValue(new Error('Duplicate entry'))

      const request = createMockRequest('POST', validListingData, null, {
        Authorization: 'Bearer valid-token',
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create listing')
    })

    it('should handle large payloads', async () => {
      const large = { ...validListingData, description: 'A'.repeat(10000) }

      const request = createMockRequest('POST', large, null, {
        Authorization: 'Bearer valid-token',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Payload too large')
    })
  })

  describe('PUT /api/listings', () => {
    const updateData = {
      id: '1',
      title: 'Updated Listing',
      description: 'Updated description',
      price: 200,
    }

    it('should update an existing listing successfully', async () => {
      const updated = { ...mockListing, ...updateData }
      mockDatabase.getListingById.mockResolvedValue(mockListing)
      mockDatabase.updateListing.mockResolvedValue(updated)

      const request = createMockRequest('PUT', updateData, null, {
        Authorization: 'Bearer valid-token',
      })
      const response = await PUT(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.listing).toEqual(updated)
    })

    it('should require authentication for updates', async () => {
      mockAuth.isAuthenticated.mockResolvedValue(false)

      const request = createMockRequest('PUT', updateData)
      const response = await PUT(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should only allow owner to update listing', async () => {
      mockDatabase.getListingById.mockResolvedValue({ ...mockListing, userId: 'other' })

      const request = createMockRequest('PUT', updateData, null, {
        Authorization: 'Bearer valid-token',
      })
      const response = await PUT(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Not authorized to update this listing')
    })

    it('should return 404 for non-existent listing', async () => {
      mockDatabase.getListingById.mockResolvedValue(null)

      const request = createMockRequest('PUT', updateData, null, {
        Authorization: 'Bearer valid-token',
      })
      const response = await PUT(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Listing not found')
    })

    it('should validate update data', async () => {
      mockValidation.validateListingData.mockReturnValue({
        isValid: false,
        errors: ['Price must be positive'],
      })

      const invalid = { ...updateData, price: -100 }
      const request = createMockRequest('PUT', invalid, null, {
        Authorization: 'Bearer valid-token',
      })
      const response = await PUT(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.errors).toContain('Price must be positive')
    })
  })

  describe('DELETE /api/listings', () => {
    it('should delete an existing listing successfully', async () => {
      mockDatabase.getListingById.mockResolvedValue(mockListing)
      mockDatabase.deleteListing.mockResolvedValue(true)

      const request = createMockRequest('DELETE', null, { id: '1' }, {
        Authorization: 'Bearer valid-token',
      })
      const response = await DELETE(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('Listing deleted successfully')
      expect(mockDatabase.deleteListing).toHaveBeenCalledWith('1')
    })

    it('should require authentication for deletion', async () => {
      mockAuth.isAuthenticated.mockResolvedValue(false)

      const request = createMockRequest('DELETE', null, { id: '1' })
      const response = await DELETE(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Authentication required')
    })

    it('should only allow owner to delete listing', async () => {
      mockDatabase.getListingById.mockResolvedValue({ ...mockListing, userId: 'other' })

      const request = createMockRequest('DELETE', null, { id: '1' }, {
        Authorization: 'Bearer valid-token',
      })
      const response = await DELETE(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Not authorized to delete this listing')
    })

    it('should return 404 for non-existent listing', async () => {
      mockDatabase.getListingById.mockResolvedValue(null)

      const request = createMockRequest('DELETE', null, { id: '999' }, {
        Authorization: 'Bearer valid-token',
      })
      const response = await DELETE(request)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Listing not found')
    })

    it('should require listing ID parameter', async () => {
      const request = createMockRequest('DELETE')
      const response = await DELETE(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Listing ID is required')
    })

    it('should handle database deletion errors', async () => {
      mockDatabase.getListingById.mockResolvedValue(mockListing)
      mockDatabase.deleteListing.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('DELETE', null, { id: '1' }, {
        Authorization: 'Bearer valid-token',
      })
      const response = await DELETE(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to delete listing')
    })
  })

  describe('Edge Cases and Integration Scenarios', () => {
    it('should handle concurrent requests gracefully', async () => {
      const requests = Array(5).fill(null).map(() => createMockRequest('GET'))
      mockDatabase.getListings.mockResolvedValue(mockListings)

      const responses = await Promise.all(requests.map(r => GET(r)))
      responses.forEach(res => expect(res.status).toBe(200))
      expect(mockDatabase.getListings).toHaveBeenCalledTimes(5)
    })

    it('should handle invalid HTTP methods', async () => {
      // Assuming the route doesn't implement PATCH
      await expect(async () => {
        await (PATCH as any)(createMockRequest('PATCH', { foo: 'bar' }))
      }).rejects.toThrow('Method not allowed')
    })

    it('should handle requests without content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/listings', {
        method: 'POST',
        body: JSON.stringify({ title: 'X', price: 1 }),
      })
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should handle special characters in query parameters', async () => {
      mockDatabase.getListings.mockResolvedValue([])
      const request = createMockRequest('GET', null, {
        search: 'test & <script>',
        category: 'books/magazines',
      })
      const response = await GET(request)
      expect(response.status).toBe(200)
      expect(mockDatabase.getListings).toHaveBeenCalledWith({
        search: 'test & <script>',
        category: 'books/magazines',
      })
    })

    it('should handle rate limiting scenarios', async () => {
      // Simulate high volume of GET requests
      const requests = Array(100).fill(null).map(() => createMockRequest('GET'))
      mockDatabase.getListings.mockResolvedValue(mockListings)

      const results = await Promise.allSettled(requests.map(r => GET(r)))
      expect(results).toHaveLength(100)
    })
  })
})