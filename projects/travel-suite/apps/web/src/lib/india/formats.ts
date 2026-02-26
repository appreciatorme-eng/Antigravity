// Indian number formatting utilities

/**
 * Formats a number to Indian Rupee format using the Indian numbering system.
 * Under 1000: ₹500
 * Thousands: ₹1,500
 * Lakhs: ₹1,20,000 (1.2 lakh)
 * Crores: ₹1,20,00,000 (1.2 crore)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0'

  const isNegative = amount < 0
  const absAmount = Math.abs(Math.round(amount))

  // Convert to string and apply Indian grouping
  const str = absAmount.toString()
  const len = str.length

  let formatted: string

  if (len <= 3) {
    // Under 1000: no comma
    formatted = str
  } else if (len <= 5) {
    // Thousands: X,XXX or XX,XXX
    formatted = str.slice(0, len - 3) + ',' + str.slice(len - 3)
  } else if (len <= 7) {
    // Lakhs: X,XX,XXX or XX,XX,XXX
    const afterCrore = str.slice(len - 7)
    const thousands = afterCrore.slice(0, afterCrore.length - 3)
    const hundreds = afterCrore.slice(-3)
    // Handle lakh grouping: groups of 2 from left after first group
    const lakhs = thousands.length > 2
      ? thousands.slice(0, thousands.length - 2) + ',' + thousands.slice(-2)
      : thousands
    formatted = lakhs + ',' + hundreds
  } else {
    // Crores and beyond
    const croreStr = str.slice(0, len - 7)
    const remainder = str.slice(len - 7)
    // Format the crore part itself with Indian grouping
    const formattedCrore = formatIndianGrouping(croreStr)
    // Remainder: XX,XX,XXX
    const lakhPart = remainder.slice(0, 2)
    const thousandPart = remainder.slice(2, 4)
    const hundredPart = remainder.slice(4)
    formatted = formattedCrore + ',' + lakhPart + ',' + thousandPart + ',' + hundredPart
  }

  return (isNegative ? '-₹' : '₹') + formatted
}

/**
 * Helper: formats a number string using Indian grouping for crore+ values
 */
function formatIndianGrouping(str: string): string {
  const len = str.length
  if (len <= 3) return str
  if (len <= 5) return str.slice(0, len - 3) + ',' + str.slice(len - 3)
  // Group by 2s from right, first group of 3
  const first = str.slice(0, len - 4)
  const rest = str.slice(len - 4)
  // Apply 2-digit grouping to first
  const parts: string[] = []
  let remaining = first
  while (remaining.length > 2) {
    parts.unshift(remaining.slice(-2))
    remaining = remaining.slice(0, -2)
  }
  if (remaining.length > 0) parts.unshift(remaining)
  return parts.join(',') + ',' + rest.slice(0, 2) + ',' + rest.slice(2)
}

/**
 * Formats amount to short Indian format.
 * ₹500, ₹1.5K, ₹1.2L, ₹1.2Cr
 */
export function formatINRShort(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0'

  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (abs >= 1_00_00_000) {
    // 1 crore+
    const crores = abs / 1_00_00_000
    return `${sign}₹${parseFloat(crores.toFixed(1))}Cr`
  } else if (abs >= 1_00_000) {
    // 1 lakh+
    const lakhs = abs / 1_00_000
    return `${sign}₹${parseFloat(lakhs.toFixed(1))}L`
  } else if (abs >= 1_000) {
    // 1 thousand+
    const thousands = abs / 1_000
    return `${sign}₹${parseFloat(thousands.toFixed(1))}K`
  } else {
    return `${sign}₹${Math.round(abs)}`
  }
}

/**
 * Formats an Indian phone number to +91 XXXXX XXXXX format.
 * Accepts 10-digit numbers or numbers with +91 prefix.
 */
export function formatIndianPhone(phone: string): string {
  if (!phone) return ''

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Handle +91 prefix (12 digits) or raw 10 digits
  let tenDigit: string
  if (digits.length === 12 && digits.startsWith('91')) {
    tenDigit = digits.slice(2)
  } else if (digits.length === 10) {
    tenDigit = digits
  } else {
    // Return as-is if format is unrecognised
    return phone
  }

  return `+91 ${tenDigit.slice(0, 5)} ${tenDigit.slice(5)}`
}

/**
 * Returns the current time as a Date object adjusted to IST (UTC+5:30).
 */
export function getISTTime(): Date {
  const now = new Date()
  // IST offset: +5:30 = +330 minutes
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const istMs = utcMs + 5.5 * 60 * 60 * 1000
  return new Date(istMs)
}

/**
 * Formats a Date object to "26 Feb 2026, 2:30 PM IST" format.
 */
export function formatISTDateTime(date: Date): string {
  // Convert to IST
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60 * 1000
  const istDate = new Date(utcMs + 5.5 * 60 * 60 * 1000)

  const day = istDate.getDate()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[istDate.getMonth()]
  const year = istDate.getFullYear()

  const hours = istDate.getHours()
  const minutes = istDate.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  const minuteStr = minutes.toString().padStart(2, '0')

  return `${day} ${month} ${year}, ${hour12}:${minuteStr} ${ampm} IST`
}

/**
 * Formats a Date object to "2:30 PM" (IST time display).
 */
export function formatISTTime(date: Date): string {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60 * 1000
  const istDate = new Date(utcMs + 5.5 * 60 * 60 * 1000)

  const hours = istDate.getHours()
  const minutes = istDate.getMinutes()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  const minuteStr = minutes.toString().padStart(2, '0')

  return `${hour12}:${minuteStr} ${ampm}`
}

/**
 * Returns a time-based greeting in Indian English.
 * "Namaste! Good Morning" (5-12), "Good Afternoon" (12-17),
 * "Good Evening" (17-21), "Good Night" (21-5)
 */
export function getGreeting(): string {
  const ist = getISTTime()
  const hour = ist.getHours()

  let timeGreeting: string
  if (hour >= 5 && hour < 12) {
    timeGreeting = 'Good Morning'
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good Afternoon'
  } else if (hour >= 17 && hour < 21) {
    timeGreeting = 'Good Evening'
  } else {
    timeGreeting = 'Good Night'
  }

  return `Namaste! ${timeGreeting}`
}

/**
 * Formats a traveler count in a human-friendly way.
 * "1 traveler", "2 travelers", "family of 4", "group of 8"
 */
export function formatTravelerCount(count: number): string {
  if (count === 1) return '1 traveler'
  if (count === 2) return '2 travelers'
  if (count === 3) return '3 travelers'
  if (count >= 4 && count <= 6) return `family of ${count}`
  return `group of ${count}`
}
