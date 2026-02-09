import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:gobuddy_mobile/features/trips/data/repositories/driver_repository.dart';
import 'package:gobuddy_mobile/features/trips/domain/models/driver.dart';
import 'package:gobuddy_mobile/features/trips/presentation/widgets/driver_info_card.dart';

import 'package:gobuddy_mobile/core/services/notification_service.dart';
import '../../../../core/theme/app_theme.dart';

class TripDetailScreen extends StatefulWidget {
  final Map<String, dynamic> trip;

  const TripDetailScreen({super.key, required this.trip});

  @override
  State<TripDetailScreen> createState() => _TripDetailScreenState();
}

class _TripDetailScreenState extends State<TripDetailScreen> {
  int _selectedDayIndex = 0;
  List<DriverAssignment> _assignments = [];
  bool _loadingDriver = true;

  @override
  void initState() {
    super.initState();
    _loadDriverAssignments();
  }

  Future<void> _loadDriverAssignments() async {
    final repo = DriverRepository(Supabase.instance.client);
    // Ensure trip has an ID
    final tripId = widget.trip['id'];
    if (tripId != null) {
      final results = await repo.getDriverAssignments(tripId);
      if (mounted) {
        setState(() {
          _assignments = results;
          _loadingDriver = false;
        });
      }
    } else {
        if (mounted) setState(() => _loadingDriver = false);
    }
  }

  Future<void> _notifyLanded() async {
    try {
      // Update trip status to in_progress
      await Supabase.instance.client
          .from('trips')
          .update({'status': 'in_progress'})
          .eq('id', widget.trip['id']);

      // Show local notification
      await NotificationService().showNotification(
        id: 1,
        title: 'Welcome to ${widget.trip['destination'] ?? 'GoBuddy'}!',
        body: 'Your driver has been notified of your arrival.',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Driver notified via App System!'),
            backgroundColor: AppTheme.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error notifying driver: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Map<String, dynamic> get rawData =>
      widget.trip['raw_data'] as Map<String, dynamic>? ?? {};

  List<dynamic> get days => rawData['days'] as List<dynamic>? ?? [];

  @override
  Widget build(BuildContext context) {
    final destination = widget.trip['destination'] ?? 'Trip Details';
    final summary = rawData['summary'] ?? '';

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_ios_rounded),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            destination,
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                          if (summary.isNotEmpty)
                            Text(
                              summary,
                              style: Theme.of(context).textTheme.bodyMedium,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        // TODO: Implement share/PDF
                      },
                      icon: const Icon(Icons.share_rounded),
                    ),
                  ],
                ),
              ),

              // Day Selector
              if (days.isNotEmpty)
                SizedBox(
                  height: 50,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: days.length,
                    itemBuilder: (context, index) {
                      final isSelected = index == _selectedDayIndex;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          selected: isSelected,
                          label: Text('Day ${index + 1}'),
                          selectedColor: AppTheme.primary,
                          labelStyle: TextStyle(
                            color: isSelected
                                ? Colors.white
                                : AppTheme.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                          onSelected: (_) =>
                              setState(() => _selectedDayIndex = index),
                        ),
                      );
                    },
                  ),
                ),

              const SizedBox(height: 16),

              // Content
              Expanded(
                child: days.isEmpty
                    ? const Center(child: Text('No itinerary data'))
                    : _buildDayContent(days[_selectedDayIndex]),
              ),
            ],
          ),
        ),
      ),
      // I've Landed Button (Phase 2 feature)
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _notifyLanded,
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.flight_land_rounded),
        label: const Text("I've Landed"),
      ),
    );
  }

  Widget _buildDayContent(dynamic dayData) {
    final day = dayData as Map<String, dynamic>;
    final theme = day['theme'] ?? '';
    final activities = day['activities'] as List<dynamic>? ?? [];

    // Check for driver assignment for this day (1-based index)
    final assignment = _assignments.firstWhere(
      (a) => a.dayNumber == _selectedDayIndex + 1,
      orElse: () => const DriverAssignment(id: '', tripId: '', driverId: '', dayNumber: -1),
    );
    final hasDriver = assignment.dayNumber != -1;

    // Collect coordinates for map
    final markers = <Marker>[];
    for (final activity in activities) {
      final coords = activity['coordinates'] as Map<String, dynamic>?;
      if (coords != null) {
        final lat = coords['lat'] as num?;
        final lng = coords['lng'] as num?;
        if (lat != null && lng != null) {
          markers.add(
            Marker(
              point: LatLng(lat.toDouble(), lng.toDouble()),
              child: Container(
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.2),
                      blurRadius: 4,
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(8),
                child: const Icon(Icons.place, color: Colors.white, size: 16),
              ),
            ),
          );
        }
      }
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Day Theme
          if (theme.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                theme,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          const SizedBox(height: 16),
          
          if (hasDriver) ...[
             DriverInfoCard(assignment: assignment),
             const SizedBox(height: 16),
          ],

          // Map
          if (markers.isNotEmpty)
            Container(
              height: 200,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: FlutterMap(
                options: MapOptions(
                  initialCenter: markers.first.point,
                  initialZoom: 13,
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  ),
                  MarkerLayer(markers: markers),
                ],
              ),
            ),

          // Activities
          ...activities.asMap().entries.map((entry) {
            final index = entry.key;
            final activity = entry.value as Map<String, dynamic>;
            return _buildActivityCard(activity, index);
          }),

          const SizedBox(height: 100), // FAB clearance
        ],
      ),
    );
  }

  Widget _buildActivityCard(Map<String, dynamic> activity, int index) {
    final time = activity['time'] ?? '';
    final title = activity['title'] ?? 'Activity';
    final description = activity['description'] ?? '';
    final location = activity['location'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  gradient: AppTheme.primaryGradient,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    '${index + 1}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              if (index < 10) // Show line between items
                Container(
                  width: 2,
                  height: 60,
                  color: AppTheme.primary.withOpacity(0.3),
                ),
            ],
          ),
          const SizedBox(width: 12),
          // Card
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (time.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.secondary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        time,
                        style: TextStyle(
                          color: AppTheme.secondary,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                  if (location.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined,
                            size: 14, color: Colors.grey.shade500),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            location,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
