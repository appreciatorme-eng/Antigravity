import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/ui/glass/glass.dart';
import 'trip_detail_screen.dart';
import '../../../auth/presentation/screens/onboarding_screen.dart';
import 'inbox_screen.dart';
import 'profile_screen.dart';
import 'support_screen.dart';
import '../widgets/driver_dashboard.dart';
import '../widgets/traveler_dashboard.dart';

class TripsScreen extends StatefulWidget {
  const TripsScreen({super.key});

  @override
  State<TripsScreen> createState() => _TripsScreenState();
}

class _TripsScreenState extends State<TripsScreen> {
  List<Map<String, dynamic>> _trips = [];
  bool _loading = true;
  String? _error;
  String _userRole = 'client';
  bool _driverMapped = false;
  int _onboardingStep = 2;
  int _activeTripIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadTrips();
  }

  Future<void> _loadTrips() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final supabase = Supabase.instance.client;
      final user = supabase.auth.currentUser;
      if (user == null) {
        setState(() {
          _loading = false;
        });
        return;
      }

      final response = await supabase
          .from('profiles')
          .select('role, onboarding_step')
          .eq('id', user.id)
          .maybeSingle();

      final role = (response?['role'] as String?) ?? 'client';
      final step = (response?['onboarding_step'] as int?) ?? 0;
      List<Map<String, dynamic>> trips = [];
      var driverMapped = false;

      if (role == 'driver') {
        final directTrips = await supabase
            .from('trips')
            .select('*, itineraries(*)')
            .eq('driver_id', user.id)
            .order('start_date', ascending: false);

        final mappedAccount = await supabase
            .from('driver_accounts')
            .select('external_driver_id')
            .eq('profile_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

        final mappedDriverId = mappedAccount?['external_driver_id'] as String?;
        driverMapped = mappedDriverId != null && mappedDriverId.isNotEmpty;

        final tripIds = <String>{};
        for (final row in List<Map<String, dynamic>>.from(directTrips)) {
          final id = row['id'] as String?;
          if (id != null) tripIds.add(id);
        }

        if (mappedDriverId != null && mappedDriverId.isNotEmpty) {
          final assignmentRows = await supabase
              .from('trip_driver_assignments')
              .select('trip_id')
              .eq('external_driver_id', mappedDriverId);

          final mappedTripIds = assignmentRows
              .map((row) => row['trip_id'] as String?)
              .whereType<String>()
              .toSet();

          if (mappedTripIds.isNotEmpty) {
            final mappedTrips = await supabase
                .from('trips')
                .select('*, itineraries(*)')
                .inFilter('id', mappedTripIds.toList())
                .order('start_date', ascending: false);

            for (final row in List<Map<String, dynamic>>.from(mappedTrips)) {
              final id = row['id'] as String?;
              if (id != null) tripIds.add(id);
            }

            trips = [
              ...List<Map<String, dynamic>>.from(directTrips),
              ...List<Map<String, dynamic>>.from(mappedTrips),
            ];
          } else {
            trips = List<Map<String, dynamic>>.from(directTrips);
          }
        } else {
          trips = List<Map<String, dynamic>>.from(directTrips);
        }

        // Deduplicate merged trips by id.
        final byId = <String, Map<String, dynamic>>{};
        for (final trip in trips) {
          final id = trip['id'] as String?;
          if (id != null) byId[id] = trip;
        }
        trips = byId.values.toList()
          ..sort((a, b) {
            final aDate = a['start_date'] as String? ?? '';
            final bDate = b['start_date'] as String? ?? '';
            return bDate.compareTo(aDate);
          });
      } else {
        final clientTrips = await supabase
            .from('trips')
            .select('*, itineraries(*)')
            .eq('client_id', user.id)
            .order('start_date', ascending: false);
        trips = List<Map<String, dynamic>>.from(clientTrips);
      }

      setState(() {
        _userRole = role;
        _driverMapped = driverMapped;
        _onboardingStep = step;
        _trips = trips;
        _activeTripIndex = _pickActiveTripIndex(trips);
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load trips';
        _loading = false;
      });
    }
  }

  Future<void> _signOut() async {
    await Supabase.instance.client.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    Map<String, dynamic>? activeTrip() {
      if (_activeTripIndex < 0 || _activeTripIndex >= _trips.length)
        return null;
      return _trips[_activeTripIndex];
    }

    void openTrip({int initialDayIndex = 0, bool autoStartLive = false}) {
      final trip = activeTrip();
      if (trip == null) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => TripDetailScreen(
            trip: trip,
            initialDayIndex: initialDayIndex,
            autoStartLocationSharing: autoStartLive,
          ),
        ),
      );
    }

    Future<void> openOnboarding() async {
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => OnboardingScreen(
            onOnboardingComplete: () {
              Navigator.pop(context);
              _loadTrips();
            },
          ),
        ),
      );
    }

    void handleClientNav(int index) {
      switch (index) {
        case 0:
          return;
        case 1:
          return openTrip();
        case 2:
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const SupportScreen()),
          );
          return;
        case 3:
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ProfileScreen()),
          );
          return;
      }
    }

    void handleDriverNav(int index) {
      switch (index) {
        case 0:
          return;
        case 1:
          return openTrip(autoStartLive: true);
        case 2:
          return;
        case 3:
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const InboxScreen()),
          );
          return;
        case 4:
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ProfileScreen()),
          );
          return;
      }
    }

    final content = _loading
        ? _buildLoadingList()
        : _error != null
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 48,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(_error!),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loadTrips,
                  child: const Text('Retry'),
                ),
              ],
            ),
          )
        : _trips.isEmpty
        ? _buildEmptyState()
        : (_userRole == 'driver'
              ? DriverDashboard(
                  trips: _trips,
                  activeTripIndex: _activeTripIndex,
                  onSelectTrip: (i) => setState(() => _activeTripIndex = i),
                  onRefresh: _loadTrips,
                )
              : TravelerDashboard(
                  trips: _trips,
                  activeTripIndex: _activeTripIndex,
                  onSelectTrip: (i) => setState(() => _activeTripIndex = i),
                  onOpenTrip: (trip, {initialDayIndex = 0}) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => TripDetailScreen(
                          trip: trip,
                          initialDayIndex: initialDayIndex,
                        ),
                      ),
                    );
                  },
                  onRefresh: _loadTrips,
                ));

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: DecoratedBox(
        decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: SafeArea(
          child: Stack(
            children: [
              content,
              if (!_loading && _error == null && _trips.isNotEmpty)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: _userRole == 'driver'
                      ? GlassDriverFloatingNavBar(
                          activeIndex: 2,
                          onTap: handleDriverNav,
                        )
                      : GlassFloatingNavBar(
                          activeIndex: 0,
                          onTap: handleClientNav,
                        ),
                ),
              if (_onboardingStep < 2 && !_loading && _error == null)
                Positioned(
                  left: 16,
                  right: 16,
                  bottom: 84,
                  child: GestureDetector(
                    onTap: openOnboarding,
                    child: GlassCard(
                      padding: const EdgeInsets.all(14),
                      borderRadius: BorderRadius.circular(18),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.person_outline,
                            color: AppTheme.secondary,
                          ),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Text(
                              'Complete your profile to unlock better trip details.',
                              style: TextStyle(
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          Icon(
                            Icons.arrow_forward_ios,
                            size: 14,
                            color: AppTheme.secondary.withAlpha(200),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingList() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 3,
        itemBuilder: (context, index) => Container(
          margin: const EdgeInsets.only(bottom: 16),
          height: 240,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppTheme.primary.withAlpha(26),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.explore_outlined,
                size: 48,
                color: AppTheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No trips yet',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Your adventures will appear here once planned',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTripCard(Map<String, dynamic> trip) {
    final itinerary = trip['itineraries'] as Map<String, dynamic>?;
    final rawData =
        itinerary?['raw_data'] as Map<String, dynamic>? ??
        trip['raw_data'] as Map<String, dynamic>?;
    final destination =
        itinerary?['destination'] ??
        trip['destination'] ??
        'Unknown destination';
    final duration = itinerary?['duration_days'] ?? trip['duration_days'] ?? 1;
    final summary = itinerary?['summary'] ?? rawData?['summary'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Material(
        borderRadius: BorderRadius.circular(16),
        color: Colors.white,
        elevation: 2,
        shadowColor: Colors.black.withAlpha(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => TripDetailScreen(trip: trip)),
            );
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image placeholder
              Hero(
                tag: 'trip-bg-${trip['id']}',
                child: Container(
                  height: 140,
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(16),
                    ),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.primary.withAlpha(204),
                        AppTheme.secondary.withAlpha(204),
                      ],
                    ),
                  ),
                  child: Stack(
                    children: [
                      const Center(
                        child: Icon(
                          Icons.landscape_rounded,
                          size: 48,
                          color: Colors.white38,
                        ),
                      ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(230),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '$duration ${duration == 1 ? 'day' : 'days'}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // Content
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_rounded,
                          size: 18,
                          color: AppTheme.primary,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            destination,
                            style: Theme.of(context).textTheme.titleLarge,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    if (summary.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        summary,
                        style: Theme.of(context).textTheme.bodyMedium,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  int _pickActiveTripIndex(List<Map<String, dynamic>> trips) {
    if (trips.isEmpty) return 0;

    DateTime? parseDate(dynamic v) {
      final s = v?.toString();
      if (s == null || s.isEmpty) return null;
      try {
        return DateTime.parse(s);
      } catch (_) {
        return null;
      }
    }

    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);

    var bestIdx = 0;
    var bestScore = 1 << 30;

    for (var i = 0; i < trips.length; i++) {
      final t = trips[i];
      final start = parseDate(t['start_date']);
      final end = parseDate(t['end_date']);
      final status = (t['status'] ?? '').toString();

      // Prefer in-progress trips, then upcoming soonest, then most recent.
      var score = 1000000;
      if (status == 'in_progress') score = 0;
      if (start != null) {
        final startDate = DateTime(start.year, start.month, start.day);
        score += startDate.difference(todayDate).inDays.abs();
      }
      if (end != null) {
        final endDate = DateTime(end.year, end.month, end.day);
        if (endDate.isBefore(todayDate)) score += 1000;
      }

      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    return bestIdx;
  }
}
