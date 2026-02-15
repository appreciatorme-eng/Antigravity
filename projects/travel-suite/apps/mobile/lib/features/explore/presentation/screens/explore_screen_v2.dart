import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/ui/glass/glass.dart';
import '../../data/repositories/addons_repository.dart';

/// Explore screen with real AI-powered recommendations
class ExploreScreenV2 extends StatefulWidget {
  const ExploreScreenV2({super.key});

  @override
  State<ExploreScreenV2> createState() => _ExploreScreenV2State();
}

class _ExploreScreenV2State extends State<ExploreScreenV2> {
  final _repository = AddonsRepository();
  String _selectedCategory = 'All';
  bool _loading = true;
  String? _clientId;
  String? _organizationId;

  List<RecommendedAddOn> _recommendations = [];
  List<AddOnModel> _allAddOns = [];
  List<AddOnModel> _trendingAddOns = [];

  final List<String> _categories = [
    'All',
    'Activities',
    'Dining',
    'Transport',
    'Upgrades',
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);

    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;

      if (user == null) {
        setState(() => _loading = false);
        return;
      }

      // Get client info
      final clientData = await supabase
          .from('clients')
          .select('id, organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

      if (clientData == null) {
        setState(() => _loading = false);
        return;
      }

      _clientId = clientData['id'] as String;
      _organizationId = clientData['organization_id'] as String;

      // Load recommendations, all add-ons, and trending in parallel
      await Future.wait([
        _loadRecommendations(),
        _loadAllAddOns(),
        _loadTrending(),
      ]);
    } catch (e) {
      print('Error loading data: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadRecommendations() async {
    if (_clientId == null) return;

    final recommendations = await _repository.getRecommendations(
      clientId: _clientId!,
      maxResults: 6,
    );

    setState(() => _recommendations = recommendations);
  }

  Future<void> _loadAllAddOns() async {
    if (_organizationId == null) return;

    final addOns = await _repository.getAddOns(
      organizationId: _organizationId!,
      category: _selectedCategory,
    );

    setState(() => _allAddOns = addOns);
  }

  Future<void> _loadTrending() async {
    if (_organizationId == null) return;

    final trending = await _repository.getTrending(
      organizationId: _organizationId!,
      days: 30,
      maxResults: 6,
    );

    setState(() => _trendingAddOns = trending);
  }

  void _onCategoryChanged(String category) {
    setState(() => _selectedCategory = category);
    _loadAllAddOns();
  }

  Future<void> _onAddOnTap(String addOnId, String source) async {
    if (_clientId == null) return;

    // Track view for analytics
    await _repository.trackView(
      clientId: _clientId!,
      addOnId: addOnId,
      source: source,
    );

    // Show purchase dialog
    _showPurchaseDialog(addOnId);
  }

  void _showPurchaseDialog(String addOnId) {
    // Find the add-on (nullable promotion does not work well across closures,
    // so resolve once and store as a non-nullable `final`).
    final AddOnModel? resolved = () {
      final recIndex = _recommendations.indexWhere((a) => a.id == addOnId);
      if (recIndex != -1) return _recommendations[recIndex];

      final allIndex = _allAddOns.indexWhere((a) => a.id == addOnId);
      if (allIndex != -1) return _allAddOns[allIndex];

      final trendingIndex = _trendingAddOns.indexWhere((a) => a.id == addOnId);
      if (trendingIndex != -1) return _trendingAddOns[trendingIndex];

      return null;
    }();

    if (resolved == null) return;
    final AddOnModel addOn = resolved;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.glassSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(
          addOn.name,
          style: const TextStyle(
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              addOn.description,
              style: const TextStyle(color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 16),
            if (addOn is RecommendedAddOn && addOn.hasDiscount) ...[
              Row(
                children: [
                  Text(
                    '\$${addOn.price.toStringAsFixed(0)}',
                    style: const TextStyle(
                      color: AppTheme.textSecondary,
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '\$${addOn.displayPrice.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.secondary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.secondary.withAlpha(26),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${addOn.discount}% OFF',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.secondary,
                      ),
                    ),
                  ),
                ],
              ),
            ] else
              Text(
                '\$${addOn.price.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.secondary,
                ),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _purchaseAddOn(addOn);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
            ),
            child: const Text('Add to Trip'),
          ),
        ],
      ),
    );
  }

  Future<void> _purchaseAddOn(AddOnModel addOn) async {
    if (_clientId == null) return;

    final success = await _repository.purchaseAddOn(
      clientId: _clientId!,
      addOnId: addOn.id,
      amount: addOn.price,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${addOn.name} added to your trip!'),
          backgroundColor: AppTheme.secondary,
        ),
      );

      // Reload recommendations (to exclude purchased item)
      _loadRecommendations();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to add item. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _loadData,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Explore',
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Enhance your journey with exclusive experiences',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Recommendations Section
                      if (_recommendations.isNotEmpty) ...[
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 24),
                          child: Text(
                            'Recommended for You',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 200,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            itemCount: _recommendations.length,
                            itemBuilder: (context, index) {
                              final addOn = _recommendations[index];
                              return _RecommendedCard(
                                addOn: addOn,
                                onTap: () => _onAddOnTap(
                                    addOn.id, 'recommendations'),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Trending Section
                      if (_trendingAddOns.isNotEmpty) ...[
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 24),
                          child: Row(
                            children: [
                              Icon(Icons.trending_up,
                                  color: AppTheme.secondary, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Trending This Month',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 200,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            itemCount: _trendingAddOns.length,
                            itemBuilder: (context, index) {
                              final addOn = _trendingAddOns[index];
                              return _TrendingCard(
                                addOn: addOn,
                                onTap: () => _onAddOnTap(addOn.id, 'trending'),
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

                      // Category Tabs
                      SizedBox(
                        height: 50,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          itemCount: _categories.length,
                          itemBuilder: (context, index) {
                            final category = _categories[index];
                            final isSelected = category == _selectedCategory;

                            return GestureDetector(
                              onTap: () => _onCategoryChanged(category),
                              child: Container(
                                margin: const EdgeInsets.only(right: 12),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 20,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppTheme.primary
                                      : AppTheme.glassSurface,
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppTheme.primary
                                        : AppTheme.glassBorder,
                                  ),
                                ),
                                child: Text(
                                  category,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: isSelected
                                        ? Colors.white
                                        : AppTheme.textPrimary,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                      const SizedBox(height: 20),

                      // All Add-ons Grid
                      if (_allAddOns.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(24),
                          child: Center(
                            child: Text(
                              'No add-ons available',
                              style: TextStyle(color: AppTheme.textSecondary),
                            ),
                          ),
                        )
                      else
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            childAspectRatio: 0.75,
                          ),
                          itemCount: _allAddOns.length,
                          itemBuilder: (context, index) {
                            final addOn = _allAddOns[index];
                            return _AddOnCard(
                              addOn: addOn,
                              onTap: () => _onAddOnTap(addOn.id, 'explore'),
                            );
                          },
                        ),

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}

// Recommended card widget
class _RecommendedCard extends StatelessWidget {
  final RecommendedAddOn addOn;
  final VoidCallback onTap;

  const _RecommendedCard({required this.addOn, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 280,
        margin: const EdgeInsets.only(right: 16),
        child: GlassContainer(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withAlpha(26),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.star,
                              size: 12, color: AppTheme.primary),
                          const SizedBox(width: 4),
                          Text(
                            '${addOn.score}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (addOn.hasDiscount) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.secondary.withAlpha(26),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          '${addOn.discount}% OFF',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.secondary,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  addOn.name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  addOn.reason,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppTheme.textSecondary,
                    fontStyle: FontStyle.italic,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const Spacer(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (addOn.hasDiscount)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '\$${addOn.price.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                          Text(
                            '\$${addOn.displayPrice.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.secondary,
                            ),
                          ),
                        ],
                      )
                    else
                      Text(
                        '\$${addOn.price.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.secondary,
                        ),
                      ),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.add,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Trending card widget
class _TrendingCard extends StatelessWidget {
  final AddOnModel addOn;
  final VoidCallback onTap;

  const _TrendingCard({required this.addOn, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 200,
        margin: const EdgeInsets.only(right: 16),
        child: GlassContainer(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (addOn.purchaseCount != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.secondary.withAlpha(26),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${addOn.purchaseCount} bookings',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.secondary,
                      ),
                    ),
                  ),
                const SizedBox(height: 12),
                Text(
                  addOn.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const Spacer(),
                Text(
                  '\$${addOn.price.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppTheme.secondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Regular add-on card widget
class _AddOnCard extends StatelessWidget {
  final AddOnModel addOn;
  final VoidCallback onTap;

  const _AddOnCard({required this.addOn, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: GlassContainer(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image placeholder
            ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(20),
              ),
              child: Container(
                height: 120,
                color: AppTheme.primary.withAlpha(26),
                child: const Center(
                  child: Icon(
                    Icons.image_outlined,
                    size: 40,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ),

            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      addOn.name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    if (addOn.duration != null)
                      Text(
                        addOn.duration!,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    const Spacer(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '\$${addOn.price.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.secondary,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.add,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
