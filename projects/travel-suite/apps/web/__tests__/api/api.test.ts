/**
 * Tests for API utilities and helpers
 * Ensures API calls are properly formatted and validated
 */

describe('API Utilities', () => {
  describe('Request validation', () => {
    it('should validate itinerary generate request', () => {
      const validateTripPlanRequest = (data: any) => {
        const errors: string[] = []

        if (!data.prompt || typeof data.prompt !== 'string') {
          errors.push('prompt is required and must be a string')
        }
        if (!data.days || typeof data.days !== 'number' || data.days < 1 || data.days > 14) {
          errors.push('days must be between 1 and 14')
        }

        return { valid: errors.length === 0, errors }
      }

      // Valid request
      const valid = validateTripPlanRequest({
        prompt: 'Create a 3-day itinerary for Paris',
        days: 3,
      })
      expect(valid.valid).toBe(true)

      // Invalid - missing prompt
      const noPrompt = validateTripPlanRequest({
        days: 3,
      })
      expect(noPrompt.valid).toBe(false)
      expect(noPrompt.errors).toContain('prompt is required and must be a string')

      // Invalid - days out of range
      const invalidDays = validateTripPlanRequest({
        prompt: 'test',
        days: 30,
      })
      expect(invalidDays.valid).toBe(false)
      expect(invalidDays.errors).toContain('days must be between 1 and 14')
    })

    it('should validate notification send request', () => {
      const validateNotificationRequest = (data: any) => {
        const errors: string[] = []

        if (!data.trip_id || typeof data.trip_id !== 'string') {
          errors.push('trip_id is required')
        }
        if (data.title && typeof data.title !== 'string') {
          errors.push('title must be a string')
        }
        if (data.body && typeof data.body !== 'string') {
          errors.push('body must be a string')
        }

        return { valid: errors.length === 0, errors }
      }

      const valid = validateNotificationRequest({
        trip_id: 'trip-123',
        title: 'Trip Update',
        body: 'Your trip is starting soon',
      })
      expect(valid.valid).toBe(true)

      const invalid = validateNotificationRequest({
        trip_id: 123, // Wrong type
        title: 'Test',
      })
      expect(invalid.valid).toBe(false)
    })
  })

  describe('Response parsing', () => {
    it('should parse itinerary response', () => {
      const parseItinerary = (data: any) => {
        return {
          title: data.trip_title,
          destination: data.destination,
          days: data.days || [],
          summary: data.summary,
        }
      }

      const response = {
        trip_title: 'Paris Adventure',
        destination: 'Paris, France',
        summary: '3 days of culture and food',
        days: [
          { day_number: 1, theme: 'Arrival' },
          { day_number: 2, theme: 'Culture' },
        ],
      }

      const parsed = parseItinerary(response)
      expect(parsed.title).toBe('Paris Adventure')
      expect(parsed.destination).toBe('Paris, France')
      expect(parsed.days).toHaveLength(2)
    })

    it('should handle API error responses', () => {
      const handleApiError = (error: any) => {
        if (error.response) {
          return {
            status: error.response.status,
            message: error.response.data.message || 'Unknown error',
          }
        } else if (error.message) {
          return {
            status: 500,
            message: error.message,
          }
        }
        return {
          status: 500,
          message: 'An unexpected error occurred',
        }
      }

      const httpError = {
        response: {
          status: 422,
          data: { message: 'Validation failed' },
        },
      }
      const parsed = handleApiError(httpError)
      expect(parsed.status).toBe(422)
      expect(parsed.message).toBe('Validation failed')
    })
  })

  describe('Query building', () => {
    it('should build search query for trips', () => {
      const buildTripQuery = (filters: any) => {
        const params = new URLSearchParams()

        if (filters.destination) {
          params.append('destination', filters.destination)
        }
        if (filters.status) {
          params.append('status', filters.status)
        }
        if (filters.minBudget) {
          params.append('minBudget', String(filters.minBudget))
        }
        if (filters.maxBudget) {
          params.append('maxBudget', String(filters.maxBudget))
        }

        return params.toString()
      }

      const query = buildTripQuery({
        destination: 'Paris',
        status: 'active',
        minBudget: 1000,
        maxBudget: 5000,
      })

      expect(query).toContain('destination=Paris')
      expect(query).toContain('status=active')
      expect(query).toContain('minBudget=1000')
      expect(query).toContain('maxBudget=5000')
    })

    it('should handle pagination', () => {
      const buildPaginatedQuery = (page: number, limit: number) => {
        return `?page=${page}&limit=${limit}`
      }

      expect(buildPaginatedQuery(1, 10)).toBe('?page=1&limit=10')
      expect(buildPaginatedQuery(2, 20)).toBe('?page=2&limit=20')
    })
  })

  describe('Data transformation', () => {
    it('should transform API response to UI format', () => {
      const transformTrip = (apiData: any) => ({
        id: apiData.id,
        title: apiData.itinerary?.trip_title,
        destination: apiData.itinerary?.destination,
        startDate: new Date(apiData.start_date),
        endDate: new Date(apiData.end_date),
        status: apiData.status,
        days: apiData.itinerary?.days || [],
      })

      const apiTrip = {
        id: '1',
        start_date: '2026-02-15',
        end_date: '2026-02-18',
        status: 'confirmed',
        itinerary: {
          trip_title: 'Paris Weekend',
          destination: 'Paris',
          days: [{ day_number: 1 }],
        },
      }

      const uiTrip = transformTrip(apiTrip)
      expect(uiTrip.title).toBe('Paris Weekend')
      expect(uiTrip.destination).toBe('Paris')
      expect(uiTrip.status).toBe('confirmed')
    })

    it('should format currency', () => {
      const formatCurrency = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount)
      }

      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(1234.56, 'EUR')).toContain('€')
    })
  })
})
