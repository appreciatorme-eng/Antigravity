import 'package:supabase_flutter/supabase_flutter.dart';

/// Repository for managing add-ons and recommendations
class AddonsRepository {
  final SupabaseClient _supabase;

  AddonsRepository({SupabaseClient? supabase})
      : _supabase = supabase ?? Supabase.instance.client;

  /// Get recommended add-ons for a client using AI engine
  Future<List<RecommendedAddOn>> getRecommendations({
    required String clientId,
    String? tripId,
    int maxResults = 6,
  }) async {
    try {
      final response = await _supabase.rpc('get_recommended_addons', params: {
        'p_client_id': clientId,
        'p_trip_id': tripId,
        'p_max_results': maxResults,
      });

      if (response == null) return [];

      return (response as List)
          .map((json) => RecommendedAddOn.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching recommendations: $e');
      return [];
    }
  }

  /// Get trending add-ons (most purchased)
  Future<List<AddOnModel>> getTrending({
    required String organizationId,
    int days = 30,
    int maxResults = 6,
  }) async {
    try {
      final response = await _supabase.rpc('get_trending_addons', params: {
        'p_organization_id': organizationId,
        'p_days': days,
        'p_max_results': maxResults,
      });

      if (response == null) return [];

      return (response as List)
          .map((json) => AddOnModel.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching trending add-ons: $e');
      return [];
    }
  }

  /// Get special offers (add-ons with discounts)
  Future<List<RecommendedAddOn>> getSpecialOffers({
    required String clientId,
    int maxResults = 6,
  }) async {
    try {
      final response = await _supabase.rpc('get_special_offers', params: {
        'p_client_id': clientId,
        'p_max_results': maxResults,
      });

      if (response == null) return [];

      return (response as List)
          .map((json) => RecommendedAddOn.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching special offers: $e');
      return [];
    }
  }

  /// Get all add-ons for an organization (filtered by category)
  Future<List<AddOnModel>> getAddOns({
    required String organizationId,
    String? category,
  }) async {
    try {
      var query = _supabase
          .from('add_ons')
          .select()
          .eq('organization_id', organizationId)
          .eq('is_active', true);

      if (category != null && category != 'All') {
        query = query.eq('category', category);
      }

      final response = await query.order('price', ascending: true);

      return (response as List)
          .map((json) => AddOnModel.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching add-ons: $e');
      return [];
    }
  }

  /// Track when a client views an add-on (for analytics)
  Future<void> trackView({
    required String clientId,
    required String addOnId,
    String source = 'explore',
  }) async {
    try {
      await _supabase.rpc('track_addon_view', params: {
        'p_client_id': clientId,
        'p_add_on_id': addOnId,
        'p_source': source,
      });
    } catch (e) {
      print('Error tracking add-on view: $e');
    }
  }

  /// Purchase an add-on
  Future<bool> purchaseAddOn({
    required String clientId,
    required String addOnId,
    required double amount,
    String? tripId,
  }) async {
    try {
      await _supabase.from('client_add_ons').insert({
        'client_id': clientId,
        'add_on_id': addOnId,
        'trip_id': tripId,
        'amount_paid': amount,
        'status': 'pending',
      });

      return true;
    } catch (e) {
      print('Error purchasing add-on: $e');
      return false;
    }
  }

  /// Get client's purchased add-ons
  Future<List<PurchasedAddOn>> getPurchasedAddOns({
    required String clientId,
  }) async {
    try {
      final response = await _supabase
          .from('client_add_ons')
          .select('*, add_ons(*)')
          .eq('client_id', clientId)
          .order('purchased_at', ascending: false);

      return (response as List)
          .map((json) => PurchasedAddOn.fromJson(json))
          .toList();
    } catch (e) {
      print('Error fetching purchased add-ons: $e');
      return [];
    }
  }
}

/// Add-on model
class AddOnModel {
  final String id;
  final String name;
  final String description;
  final double price;
  final String category;
  final String? imageUrl;
  final String? duration;
  final int? purchaseCount; // Only for trending

  AddOnModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    this.imageUrl,
    this.duration,
    this.purchaseCount,
  });

  factory AddOnModel.fromJson(Map<String, dynamic> json) {
    return AddOnModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      price: (json['price'] as num).toDouble(),
      category: json['category'] as String,
      imageUrl: json['image_url'] as String?,
      duration: json['duration'] as String?,
      purchaseCount: json['purchase_count'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'category': category,
      'image_url': imageUrl,
      'duration': duration,
      'purchase_count': purchaseCount,
    };
  }
}

/// Recommended add-on with score and reason
class RecommendedAddOn extends AddOnModel {
  final int score;
  final String reason;
  final int? discount;

  RecommendedAddOn({
    required super.id,
    required super.name,
    required super.description,
    required super.price,
    required super.category,
    super.imageUrl,
    super.duration,
    required this.score,
    required this.reason,
    this.discount,
  });

  factory RecommendedAddOn.fromJson(Map<String, dynamic> json) {
    return RecommendedAddOn(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      price: (json['price'] as num).toDouble(),
      category: json['category'] as String,
      imageUrl: json['image_url'] as String?,
      duration: json['duration'] as String?,
      score: json['score'] as int,
      reason: json['reason'] as String,
      discount: json['discount'] as int?,
    );
  }

  /// Get display price (with discount applied)
  double get displayPrice {
    if (discount != null && discount! > 0) {
      return price * (1 - discount! / 100);
    }
    return price;
  }

  /// Check if has discount
  bool get hasDiscount => discount != null && discount! > 0;

  @override
  Map<String, dynamic> toJson() {
    return {
      ...super.toJson(),
      'score': score,
      'reason': reason,
      'discount': discount,
    };
  }
}

/// Purchased add-on
class PurchasedAddOn {
  final String id;
  final String clientId;
  final String addOnId;
  final String? tripId;
  final double amountPaid;
  final String status;
  final DateTime purchasedAt;
  final AddOnModel? addOn;

  PurchasedAddOn({
    required this.id,
    required this.clientId,
    required this.addOnId,
    this.tripId,
    required this.amountPaid,
    required this.status,
    required this.purchasedAt,
    this.addOn,
  });

  factory PurchasedAddOn.fromJson(Map<String, dynamic> json) {
    return PurchasedAddOn(
      id: json['id'] as String,
      clientId: json['client_id'] as String,
      addOnId: json['add_on_id'] as String,
      tripId: json['trip_id'] as String?,
      amountPaid: (json['amount_paid'] as num).toDouble(),
      status: json['status'] as String,
      purchasedAt: DateTime.parse(json['purchased_at'] as String),
      addOn: json['add_ons'] != null
          ? AddOnModel.fromJson(json['add_ons'] as Map<String, dynamic>)
          : null,
    );
  }
}
