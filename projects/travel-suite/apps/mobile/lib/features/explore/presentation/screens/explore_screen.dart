import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/ui/glass/glass.dart';

/// Explore screen for browsing add-ons, upgrades, and experiences
/// Enables tour operators to upsell additional services
class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  String _selectedCategory = 'All';

  final List<String> _categories = [
    'All',
    'Activities',
    'Dining',
    'Transport',
    'Upgrades',
  ];

  // Mock add-ons data (will be replaced with API call)
  final List<AddOn> _addOns = [
    AddOn(
      id: '1',
      name: 'Hot Air Balloon Ride',
      description: 'Soar above Cappadocia at sunrise',
      price: 150.0,
      category: 'Activities',
      imageUrl: 'https://via.placeholder.com/300x200?text=Balloon',
      duration: '2 hours',
    ),
    AddOn(
      id: '2',
      name: 'Luxury Suite Upgrade',
      description: 'Upgrade to ocean view suite with balcony',
      price: 200.0,
      category: 'Upgrades',
      imageUrl: 'https://via.placeholder.com/300x200?text=Suite',
      duration: 'Per night',
    ),
    AddOn(
      id: '3',
      name: 'Private Chef Experience',
      description: '5-course meal prepared in your villa',
      price: 180.0,
      category: 'Dining',
      imageUrl: 'https://via.placeholder.com/300x200?text=Chef',
      duration: '3 hours',
    ),
    AddOn(
      id: '4',
      name: 'Helicopter Transfer',
      description: 'Skip traffic with scenic aerial transfer',
      price: 500.0,
      category: 'Transport',
      imageUrl: 'https://via.placeholder.com/300x200?text=Helicopter',
      duration: '30 minutes',
    ),
    AddOn(
      id: '5',
      name: 'Scuba Diving Adventure',
      description: 'Explore coral reefs with certified instructor',
      price: 120.0,
      category: 'Activities',
      imageUrl: 'https://via.placeholder.com/300x200?text=Diving',
      duration: '4 hours',
    ),
    AddOn(
      id: '6',
      name: 'Wine Tasting Tour',
      description: 'Visit 3 local vineyards with sommelier',
      price: 90.0,
      category: 'Activities',
      imageUrl: 'https://via.placeholder.com/300x200?text=Wine',
      duration: '5 hours',
    ),
  ];

  List<AddOn> get _filteredAddOns {
    if (_selectedCategory == 'All') return _addOns;
    return _addOns.where((a) => a.category == _selectedCategory).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Explore',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Enhance your journey with exclusive experiences',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Recommended Section
                  GlassContainer(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withAlpha(26),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.star_rounded,
                              color: AppTheme.primary,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 16),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Recommended for You',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'Based on your preferences',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.arrow_forward_ios,
                            color: AppTheme.textSecondary,
                            size: 16,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

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
                    onTap: () => setState(() => _selectedCategory = category),
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

            // Add-ons Grid
            Expanded(
              child: GridView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.75,
                ),
                itemCount: _filteredAddOns.length,
                itemBuilder: (context, index) {
                  final addOn = _filteredAddOns[index];
                  return _AddOnCard(addOn: addOn);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AddOnCard extends StatelessWidget {
  final AddOn addOn;

  const _AddOnCard({required this.addOn});

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
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
                  Text(
                    addOn.duration,
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
    );
  }
}

/// Add-on model
class AddOn {
  final String id;
  final String name;
  final String description;
  final double price;
  final String category;
  final String imageUrl;
  final String duration;

  AddOn({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    required this.imageUrl,
    required this.duration,
  });
}
