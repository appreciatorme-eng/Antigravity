/**
 * Upsell Engine - AI-driven recommendation system for tour operators
 *
 * This engine analyzes client profiles, preferences, past trips, and tags
 * to recommend relevant add-ons that maximize conversion rates.
 *
 * Algorithm Strategy:
 * 1. Rule-based recommendations (simple, fast, 80% effective)
 * 2. Collaborative filtering (future: ML model)
 * 3. Dynamic pricing based on demand
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface Client {
  id: string;
  name: string;
  email: string;
  tags?: string[];
  preferences?: Record<string, any>;
  lifecycle_stage?: string;
}

export interface Trip {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  duration?: string;
  organization_id: string;
  is_active: boolean;
}

export interface RecommendedAddOn extends AddOn {
  score: number; // 0-100, higher = more relevant
  reason: string; // Why this is recommended
  discount?: number; // Optional discount percentage
}

export interface UpsellEngineConfig {
  supabaseUrl: string;
  supabaseKey: string;
  maxRecommendations?: number;
  minScore?: number;
}

export class UpsellEngine {
  private supabase;
  private maxRecommendations: number;
  private minScore: number;

  constructor(config: UpsellEngineConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.maxRecommendations = config.maxRecommendations || 6;
    this.minScore = config.minScore || 50;
  }

  /**
   * Get personalized add-on recommendations for a client
   */
  async getRecommendations(
    clientId: string,
    tripId?: string
  ): Promise<RecommendedAddOn[]> {
    // Step 1: Load client profile
    const client = await this.getClient(clientId);
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    // Step 2: Load available add-ons for this organization
    const addOns = await this.getAvailableAddOns(client.organization_id);

    // Step 3: Load client's trip context (if tripId provided)
    let trip: Trip | null = null;
    if (tripId) {
      trip = await this.getTrip(tripId);
    }

    // Step 4: Load client's purchase history
    const purchasedAddOns = await this.getPurchasedAddOns(clientId);
    const purchasedIds = new Set(purchasedAddOns.map((a) => a.add_on_id));

    // Step 5: Score each add-on based on relevance
    const scoredAddOns: RecommendedAddOn[] = [];

    for (const addOn of addOns) {
      // Skip already purchased add-ons
      if (purchasedIds.has(addOn.id)) continue;

      const { score, reason, discount } = this.scoreAddOn(
        addOn,
        client,
        trip,
        purchasedAddOns
      );

      if (score >= this.minScore) {
        scoredAddOns.push({
          ...addOn,
          score,
          reason,
          discount,
        });
      }
    }

    // Step 6: Sort by score and return top N
    scoredAddOns.sort((a, b) => b.score - a.score);
    return scoredAddOns.slice(0, this.maxRecommendations);
  }

  /**
   * Score an add-on based on client profile and context
   * Returns: { score: 0-100, reason: string, discount?: number }
   */
  private scoreAddOn(
    addOn: AddOn,
    client: any,
    trip: Trip | null,
    purchaseHistory: any[]
  ): { score: number; reason: string; discount?: number } {
    let score = 50; // Base score
    let reasons: string[] = [];
    let discount: number | undefined;

    // Rule 1: Tag-based recommendations (VIP, Adventure, etc.)
    if (client.tags && Array.isArray(client.tags)) {
      if (client.tags.includes('VIP') && addOn.category === 'Upgrades') {
        score += 30;
        reasons.push('Perfect for VIP travelers');
      }

      if (client.tags.includes('Adventure') && addOn.category === 'Activities') {
        score += 25;
        reasons.push('Matches your adventurous spirit');
      }

      if (client.tags.includes('Foodie') && addOn.category === 'Dining') {
        score += 25;
        reasons.push('Curated for food lovers');
      }

      if (client.tags.includes('Luxury') && addOn.price > 200) {
        score += 20;
        reasons.push('Premium experience');
      }
    }

    // Rule 2: Price sensitivity (based on lifecycle stage)
    if (client.lifecycle_stage === 'active' && addOn.price < 150) {
      score += 15;
      reasons.push('Great value for money');
    }

    if (client.lifecycle_stage === 'payment_confirmed' && addOn.category === 'Transport') {
      score += 20;
      reasons.push('Essential for your journey');
    }

    // Rule 3: Trip destination context
    if (trip) {
      const destination = trip.destination.toLowerCase();

      // Beach destinations -> Water activities
      if (
        (destination.includes('bali') ||
          destination.includes('maldives') ||
          destination.includes('hawaii')) &&
        addOn.name.toLowerCase().includes('diving')
      ) {
        score += 20;
        reasons.push(`Popular in ${trip.destination}`);
      }

      // Mountain destinations -> Adventure activities
      if (
        (destination.includes('nepal') ||
          destination.includes('switzerland') ||
          destination.includes('colorado')) &&
        addOn.name.toLowerCase().includes('trek')
      ) {
        score += 20;
        reasons.push(`Must-do in ${trip.destination}`);
      }

      // Wine regions -> Wine tours
      if (
        (destination.includes('tuscany') ||
          destination.includes('napa') ||
          destination.includes('bordeaux')) &&
        addOn.name.toLowerCase().includes('wine')
      ) {
        score += 25;
        reasons.push('Signature experience of the region');
      }
    }

    // Rule 4: Category diversity (encourage trying new categories)
    const purchasedCategories = new Set(
      purchaseHistory.map((p) => p.add_on?.category).filter(Boolean)
    );

    if (!purchasedCategories.has(addOn.category)) {
      score += 10;
      reasons.push('Explore something new');
    }

    // Rule 5: Time-based discounts (limited-time offers)
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Weekend special for dining
    if ((dayOfWeek === 5 || dayOfWeek === 6) && addOn.category === 'Dining') {
      discount = 10;
      score += 15;
      reasons.push('Weekend special - 10% off!');
    }

    // Early bird discount (before 10 AM)
    const hour = now.getHours();
    if (hour < 10 && addOn.category === 'Activities') {
      discount = 15;
      score += 20;
      reasons.push('Early bird special - 15% off!');
    }

    // Rule 6: Purchase history patterns (repeat behavior)
    if (purchaseHistory.length > 0) {
      const lastPurchase = purchaseHistory[0];
      const daysSinceLastPurchase = Math.floor(
        (Date.now() - new Date(lastPurchase.purchased_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Frequent buyers get recommendations
      if (purchaseHistory.length >= 3) {
        score += 10;
        reasons.push('Exclusive for loyal customers');
      }

      // Suggest complementary add-ons
      if (
        lastPurchase.add_on?.category === 'Activities' &&
        addOn.category === 'Dining'
      ) {
        score += 15;
        reasons.push('Perfect after your activity');
      }
    }

    // Cap score at 100
    score = Math.min(score, 100);

    // Combine reasons
    const reason = reasons.length > 0 ? reasons[0] : 'Recommended for you';

    return { score, reason, discount };
  }

  /**
   * Get special offers (limited-time deals with discounts)
   */
  async getSpecialOffers(
    clientId: string
  ): Promise<RecommendedAddOn[]> {
    const recommendations = await this.getRecommendations(clientId);

    // Filter only items with discounts
    return recommendations.filter((r) => r.discount && r.discount > 0);
  }

  /**
   * Get trending add-ons (most purchased recently)
   */
  async getTrendingAddOns(organizationId: string): Promise<AddOn[]> {
    const { data, error } = await this.supabase
      .from('client_add_ons')
      .select('add_on_id, add_ons(*)')
      .eq('add_ons.organization_id', organizationId)
      .gte('purchased_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .limit(10);

    if (error) {
      console.error('Error fetching trending add-ons:', error);
      return [];
    }

    // Count purchases per add-on
    const purchaseCounts = new Map<string, number>();
    const addOnMap = new Map<string, AddOn>();

    data?.forEach((purchase: any) => {
      const addOnId = purchase.add_on_id;
      purchaseCounts.set(addOnId, (purchaseCounts.get(addOnId) || 0) + 1);
      if (purchase.add_ons) {
        addOnMap.set(addOnId, purchase.add_ons);
      }
    });

    // Sort by purchase count
    const sorted = Array.from(purchaseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return sorted.map(([id]) => addOnMap.get(id)).filter(Boolean) as AddOn[];
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  private async getClient(clientId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('*, organization_id')
      .eq('id', clientId)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      return null;
    }

    return data;
  }

  private async getAvailableAddOns(organizationId: string): Promise<AddOn[]> {
    const { data, error } = await this.supabase
      .from('add_ons')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching add-ons:', error);
      return [];
    }

    return data || [];
  }

  private async getTrip(tripId: string): Promise<Trip | null> {
    const { data, error } = await this.supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (error) {
      console.error('Error fetching trip:', error);
      return null;
    }

    return data;
  }

  private async getPurchasedAddOns(clientId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('client_add_ons')
      .select('*, add_ons(*)')
      .eq('client_id', clientId)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchased add-ons:', error);
      return [];
    }

    return data || [];
  }
}

// ============================================================================
// Export factory function
// ============================================================================

export function createUpsellEngine(config: UpsellEngineConfig): UpsellEngine {
  return new UpsellEngine(config);
}
