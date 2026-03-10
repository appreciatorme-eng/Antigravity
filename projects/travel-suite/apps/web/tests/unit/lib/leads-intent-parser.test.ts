import { describe, it, expect } from "vitest";

import {
  parseLeadMessage,
  detectDestination,
  extractTravelerCount,
  extractDuration,
  extractBudget,
  isLikelyInquiry,
} from "../../../src/lib/leads/intent-parser";

/* ================================================================== */
/*  parseLeadMessage (integration of all sub-extractors)              */
/* ================================================================== */

describe("parseLeadMessage", () => {
  it("extracts destination, duration, and travelers from a typical message", () => {
    const result = parseLeadMessage("I want to visit Bali... err, Goa for 5 days with 2 people");

    expect(result.destination).toBe("Goa");
    expect(result.durationDays).toBe(5);
    expect(result.travelers).toBe(2);
    expect(result.isInquiry).toBe(false);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("returns high confidence when all signals are present", () => {
    const result = parseLeadMessage(
      "I want to book a trip to Manali for 7 days, 4 people",
    );

    // destination (0.4) + travelers (0.2) + duration (0.2) + inquiry/trip (0.2) = 1.0
    expect(result.confidence).toBe(1.0);
    expect(result.destination).toBe("Himachal Pradesh");
    expect(result.durationDays).toBe(7);
    expect(result.travelers).toBe(4);
    expect(result.isInquiry).toBe(true);
  });

  it("returns zero confidence for an empty string", () => {
    const result = parseLeadMessage("");

    expect(result.destination).toBeNull();
    expect(result.travelers).toBeNull();
    expect(result.durationDays).toBeNull();
    expect(result.budgetTier).toBeNull();
    expect(result.rawBudget).toBeNull();
    expect(result.departureMonth).toBeNull();
    expect(result.isInquiry).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.extractedName).toBeNull();
  });

  it("handles gibberish gracefully", () => {
    const result = parseLeadMessage("asdf jkl; qwerty zxcvbnm 12345");

    expect(result.destination).toBeNull();
    expect(result.confidence).toBeLessThanOrEqual(0.2);
  });

  it("handles very long text without throwing", () => {
    const longText = "I want to visit Kerala ".repeat(500);
    const result = parseLeadMessage(longText);

    expect(result.destination).toBe("Kerala");
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("handles special characters in the message", () => {
    const result = parseLeadMessage("Trip to Goa!!! <script>alert('xss')</script> 3 days");

    expect(result.destination).toBe("Goa");
    expect(result.durationDays).toBe(3);
  });

  it("extracts departure month when present", () => {
    const result = parseLeadMessage("Planning a trip to Udaipur in June, 5 days");

    expect(result.destination).toBe("Rajasthan");
    expect(result.departureMonth).toBe("June");
    expect(result.durationDays).toBe(5);
  });

  it("extracts name when present", () => {
    const result = parseLeadMessage("I am Rahul and I want to visit Goa for 3 days");

    expect(result.extractedName).toBe("Rahul");
    expect(result.destination).toBe("Goa");
  });
});

/* ================================================================== */
/*  detectDestination                                                 */
/* ================================================================== */

describe("detectDestination", () => {
  it("detects an exact destination name with high confidence", () => {
    const result = detectDestination("I want to go to Kashmir");

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Kashmir");
    expect(result!.confidence).toBe(0.9);
  });

  it("detects a keyword match in the first 100 chars with medium confidence", () => {
    const result = detectDestination("looking for packages to srinagar this winter");

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Kashmir");
    expect(result!.confidence).toBe(0.8);
  });

  it("detects a keyword match after the first 100 chars with lower confidence", () => {
    // Pad with >100 chars before the keyword
    const padding = "x".repeat(110);
    const result = detectDestination(`${padding} visiting srinagar soon`);

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Kashmir");
    expect(result!.confidence).toBe(0.6);
  });

  it("returns null when no destination is found", () => {
    expect(detectDestination("hello world")).toBeNull();
  });

  it("detects each major destination region", () => {
    const cases: [string, string][] = [
      ["trip to baga beach", "Goa"],
      ["visiting jaipur fort", "Rajasthan"],
      ["backwaters of alleppey", "Kerala"],
      ["trekking in spiti valley", "Himachal Pradesh"],
      ["dal lake houseboat", "Kashmir"],
      ["rishikesh rafting", "Uttarakhand"],
      ["havelock island diving", "Andaman"],
      ["pangong lake trip", "Ladakh"],
      ["mysore palace visit", "Karnataka"],
      ["varanasi ghat tour", "Varanasi"],
      ["cherrapunji rainfall", "Meghalaya"],
      ["rann of kutch festival", "Gujarat"],
      ["golden triangle tour", "Golden Triangle"],
      ["kaziranga safari", "North East"],
    ];

    for (const [message, expectedDest] of cases) {
      const result = detectDestination(message);
      expect(result, `Failed for message: "${message}"`).not.toBeNull();
      expect(result!.name).toBe(expectedDest);
    }
  });

  it("is case-insensitive", () => {
    const result = detectDestination("TRIP TO GOA");

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Goa");
  });
});

/* ================================================================== */
/*  extractTravelerCount                                              */
/* ================================================================== */

describe("extractTravelerCount", () => {
  it("returns 1 for solo traveler", () => {
    expect(extractTravelerCount("solo trip to Goa")).toBe(1);
  });

  it("returns 2 for honeymoon", () => {
    expect(extractTravelerCount("honeymoon in Kerala")).toBe(2);
  });

  it("returns 2 for couple", () => {
    expect(extractTravelerCount("couple trip to Manali")).toBe(2);
  });

  it("extracts count from 'X people' pattern", () => {
    expect(extractTravelerCount("trip for 5 people")).toBe(5);
  });

  it("extracts count from 'X persons' pattern", () => {
    expect(extractTravelerCount("booking for 3 persons")).toBe(3);
  });

  it("extracts count from 'X pax' pattern", () => {
    expect(extractTravelerCount("4 pax for Goa trip")).toBe(4);
  });

  it("extracts count from 'X adults' pattern", () => {
    expect(extractTravelerCount("6 adults visiting Shimla")).toBe(6);
  });

  it("extracts count from 'family of X' pattern", () => {
    expect(extractTravelerCount("family of 4 going to Udaipur")).toBe(4);
  });

  it("extracts count from 'X ka group' pattern (Hindi)", () => {
    expect(extractTravelerCount("10 ka group for Ladakh")).toBe(10);
  });

  it("returns null when no traveler info is present", () => {
    expect(extractTravelerCount("I want to visit Goa")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractTravelerCount("")).toBeNull();
  });
});

/* ================================================================== */
/*  extractDuration                                                   */
/* ================================================================== */

describe("extractDuration", () => {
  it("returns 3 for 'weekend'", () => {
    expect(extractDuration("weekend trip to Goa")).toBe(3);
  });

  it("returns 4 for 'long weekend'", () => {
    expect(extractDuration("long weekend getaway")).toBe(4);
  });

  it("returns 7 for 'week'", () => {
    expect(extractDuration("a week in Kerala")).toBe(7);
  });

  it("extracts days from 'X days' pattern", () => {
    expect(extractDuration("5 days trip")).toBe(5);
  });

  it("extracts nights from 'X nights' pattern", () => {
    expect(extractDuration("3 nights stay")).toBe(3);
  });

  it("parses XN/XD format (e.g., 4N5D)", () => {
    expect(extractDuration("4N5D package")).toBe(5);
  });

  it("parses XN/XD format with space (e.g., 3N 4D)", () => {
    expect(extractDuration("3N 4D Goa package")).toBe(4);
  });

  it("handles Hindi duration words like 'din'", () => {
    expect(extractDuration("5 din ka trip")).toBe(5);
  });

  it("handles Hindi duration words like 'raat'", () => {
    expect(extractDuration("3 raat Shimla")).toBe(3);
  });

  it("returns null when no duration is mentioned", () => {
    expect(extractDuration("I want to visit Goa")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractDuration("")).toBeNull();
  });
});

/* ================================================================== */
/*  extractBudget                                                     */
/* ================================================================== */

describe("extractBudget", () => {
  it("classifies low amounts as budget tier", () => {
    const result = extractBudget("budget around 5000");

    expect(result).not.toBeNull();
    expect(result!.tier).toBe("budget");
    expect(result!.raw).toBe(5000);
  });

  it("classifies mid amounts as standard tier", () => {
    const result = extractBudget("budget around 10000");

    expect(result).not.toBeNull();
    expect(result!.tier).toBe("standard");
  });

  it("classifies higher amounts as premium tier", () => {
    const result = extractBudget("budget around 30000 per person");

    expect(result).not.toBeNull();
    expect(result!.tier).toBe("premium");
  });

  it("classifies very high amounts as luxury tier", () => {
    const result = extractBudget("budget around 50000 per person");

    expect(result).not.toBeNull();
    expect(result!.tier).toBe("luxury");
  });

  it("handles 'k' suffix (e.g., 10k)", () => {
    const result = extractBudget("around 10k per person");

    expect(result).not.toBeNull();
    expect(result!.raw).toBe(10000);
    expect(result!.tier).toBe("standard");
  });

  it("handles 'lakh' suffix", () => {
    const result = extractBudget("budget 1 lakh");

    expect(result).not.toBeNull();
    expect(result!.raw).toBe(100000);
  });

  it("handles 'L' suffix as lakh", () => {
    const result = extractBudget("budget 1.5L");

    expect(result).not.toBeNull();
    expect(result!.raw).toBe(150000);
  });

  it("handles comma-separated numbers", () => {
    const result = extractBudget("budget Rs. 25,000");

    expect(result).not.toBeNull();
    expect(result!.raw).toBe(25000);
  });

  it("handles INR prefix", () => {
    const result = extractBudget("inr 15000 per person");

    expect(result).not.toBeNull();
    expect(result!.raw).toBe(15000);
  });

  it("returns null when no numeric value is present", () => {
    expect(extractBudget("I want to visit Goa someday")).toBeNull();
  });

  it("picks up stray numbers as budget (greedy regex behavior)", () => {
    // The regex is greedy: bare digits like "3" in "3 days" will match.
    // This documents current behavior rather than ideal behavior.
    const result = extractBudget("I want to visit Goa for 3 days");
    expect(result).not.toBeNull();
    expect(result!.raw).toBe(3);
    expect(result!.tier).toBe("budget");
  });
});

/* ================================================================== */
/*  isLikelyInquiry                                                   */
/* ================================================================== */

describe("isLikelyInquiry", () => {
  it("returns true for messages containing travel keywords", () => {
    expect(isLikelyInquiry("I want to book a trip")).toBe(true);
    expect(isLikelyInquiry("need a tour package")).toBe(true);
    expect(isLikelyInquiry("plan my travel")).toBe(true);
    expect(isLikelyInquiry("what's the cost?")).toBe(true);
    expect(isLikelyInquiry("arrange a cab")).toBe(true);
    expect(isLikelyInquiry("send me a quote")).toBe(true);
    expect(isLikelyInquiry("itinerary for Goa")).toBe(true);
  });

  it("returns true for Hindi inquiry keywords", () => {
    expect(isLikelyInquiry("Goa ka trip kitna hoga")).toBe(true);
    expect(isLikelyInquiry("rate batao")).toBe(true);
    expect(isLikelyInquiry("booking chahiye")).toBe(true);
  });

  it("returns false for non-inquiry messages", () => {
    expect(isLikelyInquiry("hello")).toBe(false);
    expect(isLikelyInquiry("good morning")).toBe(false);
    expect(isLikelyInquiry("thanks")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isLikelyInquiry("")).toBe(false);
  });
});

/* ================================================================== */
/*  departure month extraction (via parseLeadMessage)                 */
/* ================================================================== */

describe("departure month extraction", () => {
  it("detects full month name 'June'", () => {
    const result = parseLeadMessage("trip in June");
    expect(result.departureMonth).toBe("June");
  });

  it("detects abbreviated month 'Mar'", () => {
    const result = parseLeadMessage("planning for Mar");
    expect(result.departureMonth).toBe("March");
  });

  it("detects 'next month' phrasing", () => {
    const result = parseLeadMessage("I want to go next month");
    expect(result.departureMonth).toBe("Next Month");
  });

  it("detects 'next March' phrasing", () => {
    const result = parseLeadMessage("planning for next March");
    expect(result.departureMonth).toBe("March");
  });

  it("returns null when no month is mentioned", () => {
    const result = parseLeadMessage("trip to Goa for 3 days");
    expect(result.departureMonth).toBeNull();
  });

  it.each([
    ["January", "jan"],
    ["February", "feb"],
    ["March", "mar"],
    ["April", "apr"],
    ["May", "may"],
    ["June", "jun"],
    ["July", "jul"],
    ["August", "aug"],
    ["September", "sep"],
    ["October", "oct"],
    ["November", "nov"],
    ["December", "dec"],
  ])("detects abbreviated month '%s' from '%s'", (expected, abbr) => {
    const result = parseLeadMessage(`trip in ${abbr}`);
    expect(result.departureMonth).toBe(expected);
  });
});

/* ================================================================== */
/*  name extraction (via parseLeadMessage)                            */
/* ================================================================== */

describe("name extraction", () => {
  it("extracts name from 'I am X' pattern", () => {
    const result = parseLeadMessage("I am Priya and I need a trip to Goa");
    expect(result.extractedName).toBe("Priya");
  });

  it("extracts name from 'my name is X' pattern", () => {
    const result = parseLeadMessage("my name is Vikram, looking for Kerala trip");
    expect(result.extractedName).toBe("Vikram");
  });

  it("returns null when no name pattern is found", () => {
    const result = parseLeadMessage("trip to Goa for 5 days");
    expect(result.extractedName).toBeNull();
  });
});

/* ================================================================== */
/*  confidence scoring                                                */
/* ================================================================== */

describe("confidence scoring", () => {
  it("returns 0 when nothing is detected", () => {
    const result = parseLeadMessage("hello world");
    expect(result.confidence).toBe(0);
  });

  it("returns 0.4 for destination only", () => {
    const result = parseLeadMessage("Goa is beautiful");
    expect(result.confidence).toBeCloseTo(0.4, 5);
  });

  it("returns 0.6 for destination + duration", () => {
    const result = parseLeadMessage("Goa for 5 days");
    expect(result.confidence).toBeCloseTo(0.6, 5);
  });

  it("returns 0.2 for inquiry keyword only", () => {
    const result = parseLeadMessage("I need a trip somewhere");
    expect(result.confidence).toBeCloseTo(0.2, 5);
  });

  it("returns 1.0 when all four signals are present", () => {
    const result = parseLeadMessage(
      "Book a trip to Goa for 3 days, 2 people",
    );
    expect(result.confidence).toBeCloseTo(1.0, 5);
  });
});
