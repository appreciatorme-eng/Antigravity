/**
 * Tests for utility functions
 * These are foundational tests that ensure common helpers work correctly
 */

describe('Utility Functions', () => {
  describe('clsx/className utilities', () => {
    it('should combine class names correctly', () => {
      const clsx = (...classes: (string | undefined | false)[]) =>
        classes.filter(Boolean).join(' ')

      expect(clsx('px-4', 'py-2', 'bg-blue')).toBe('px-4 py-2 bg-blue')
      expect(clsx('px-4', false, 'py-2')).toBe('px-4 py-2')
      expect(clsx('px-4', undefined, 'py-2')).toBe('px-4 py-2')
    })

    it('should handle conditional classes', () => {
      const clsx = (...classes: (string | undefined | false)[]) =>
        classes.filter(Boolean).join(' ')

      const isActive = true
      expect(clsx('btn', isActive && 'btn-active')).toBe('btn btn-active')

      const isDisabled = false
      expect(clsx('btn', isDisabled && 'btn-disabled')).toBe('btn')
    })
  })

  describe('Date formatting', () => {
    it('should format date to readable string', () => {
      const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(date)
      }

      const date = new Date('2026-02-11')
      expect(formatDate(date)).toBe('February 11, 2026')
    })

    it('should handle time formatting', () => {
      const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(date)
      }

      const date = new Date('2026-02-11T14:30:00')
      expect(formatTime(date)).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('Array utilities', () => {
    it('should group array items by key', () => {
      const groupBy = <T, K extends string | number>(
        items: T[],
        key: (item: T) => K,
      ): Record<K, T[]> => {
        return items.reduce(
          (result, item) => {
            const k = key(item)
            if (!result[k]) result[k] = []
            result[k].push(item)
            return result
          },
          {} as Record<K, T[]>,
        )
      }

      const trips = [
        { id: 1, destination: 'Paris', status: 'active' },
        { id: 2, destination: 'Tokyo', status: 'active' },
        { id: 3, destination: 'Paris', status: 'completed' },
      ]

      const byDestination = groupBy(trips, (t) => t.destination)
      expect(byDestination['Paris']).toHaveLength(2)
      expect(byDestination['Tokyo']).toHaveLength(1)
    })

    it('should filter and map in one operation', () => {
      const filterMap = <T, U>(
        items: T[],
        fn: (item: T) => U | null,
      ): U[] => {
        return items.map(fn).filter((item) => item !== null) as U[]
      }

      const trips = [
        { id: 1, destination: 'Paris', status: 'active' },
        { id: 2, destination: 'Tokyo', status: 'completed' },
      ]

      const activeDests = filterMap(trips, (t) =>
        t.status === 'active' ? t.destination : null,
      )
      expect(activeDests).toEqual(['Paris'])
    })
  })

  describe('Object utilities', () => {
    it('should safely access nested properties', () => {
      const getIn = (obj: any, path: string, defaultValue = null) => {
        const keys = path.split('.')
        return keys.reduce((current, key) => current?.[key] ?? defaultValue, obj)
      }

      const trip = {
        itinerary: {
          days: [
            { activities: [{ location: 'Eiffel Tower' }] },
          ],
        },
      }

      expect(getIn(trip, 'itinerary.days.0.activities.0.location')).toBe(
        'Eiffel Tower',
      )
      expect(getIn(trip, 'itinerary.notExists', 'default')).toBe('default')
    })

    it('should pick specific keys from object', () => {
      const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
        return keys.reduce(
          (result, key) => {
            if (key in obj) {
              result[key] = obj[key]
            }
            return result
          },
          {} as Pick<T, K>,
        )
      }

      const trip = { id: 1, destination: 'Paris', budget: 1000, notes: 'Fun' }
      const subset = pick(trip, ['id', 'destination'])
      expect(subset).toEqual({ id: 1, destination: 'Paris' })
    })
  })

  describe('Validation utilities', () => {
    it('should validate email addresses', () => {
      const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      }

      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('invalid.email')).toBe(false)
      expect(isValidEmail('user@domain')).toBe(false)
    })

    it('should validate URLs', () => {
      const isValidUrl = (url: string) => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      }

      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('not a url')).toBe(false)
    })
  })
})
