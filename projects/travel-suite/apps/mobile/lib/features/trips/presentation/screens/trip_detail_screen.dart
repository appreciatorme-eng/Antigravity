import 'dart:async';
import 'dart:convert';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gobuddy_mobile/core/ui/app_icon.dart';
import 'package:gobuddy_mobile/core/ui/glass/glass.dart';
import 'package:shimmer/shimmer.dart';
import 'package:heroicons/heroicons.dart';
import 'package:intl/intl.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:gobuddy_mobile/features/trips/data/repositories/driver_repository.dart';
import 'package:gobuddy_mobile/features/trips/domain/models/driver.dart';
import 'package:gobuddy_mobile/features/trips/presentation/widgets/driver_info_card.dart';

import 'package:gobuddy_mobile/core/services/geocoding_service.dart';
import 'package:gobuddy_mobile/core/services/notification_service.dart';
import 'package:gobuddy_mobile/core/config/supabase_config.dart';
import '../../../../core/theme/app_theme.dart';
import 'package:http/http.dart' as http;
import 'inbox_screen.dart';
import 'profile_screen.dart';
import 'support_screen.dart';

class TripDetailScreen extends StatefulWidget {
  final Map<String, dynamic>? trip;
  final String? tripId;
  final int initialDayIndex;
  final bool autoStartLocationSharing;

  const TripDetailScreen({
    super.key,
    this.trip,
    this.tripId,
    this.initialDayIndex = 0,
    this.autoStartLocationSharing = false,
  }) : assert(
         trip != null || tripId != null,
         'Either trip or tripId must be provided',
       );

  @override
  State<TripDetailScreen> createState() => _TripDetailScreenState();
}

class _TripDetailScreenState extends State<TripDetailScreen> {
  late int _selectedDayIndex;
  List<DriverAssignment> _assignments = [];
  bool _loadingDriver = true;
  bool _loadingTrip = false;
  Map<String, dynamic>? _trip;
  bool _isDriverForTrip = false;
  bool _sharingLocation = false;
  bool _startingLocationShare = false;
  bool _autoStartAttempted = false;
  Timer? _locationTimer;

  final Set<String> _requestedGeocodes = {};

  @override
  void initState() {
    super.initState();
    _selectedDayIndex = widget.initialDayIndex;
    _trip = widget.trip;
    if (_trip == null && widget.tripId != null) {
      _fetchTripDetails();
    } else {
      _updateDriverMode();
      _loadDriverAssignments();
    }
  }

  Future<void> _fetchTripDetails() async {
    setState(() => _loadingTrip = true);
    try {
      final response = await Supabase.instance.client
          .from('trips')
          .select('*, itineraries(*)')
          .eq('id', widget.tripId!)
          .single();

      if (mounted) {
        setState(() {
          _trip = response;
          _loadingTrip = false;
        });
        await _updateDriverMode();
        _loadDriverAssignments();
      }
    } catch (e) {
      debugPrint('Error fetching trip details: $e');
      if (mounted) setState(() => _loadingTrip = false);
    }
  }

  Future<void> _loadDriverAssignments() async {
    if (_trip == null) return;

    final repo = DriverRepository(Supabase.instance.client);
    final tripId = _trip!['id'];
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

  Future<void> _updateDriverMode() async {
    final currentUserId = Supabase.instance.client.auth.currentUser?.id;
    final driverId = _trip?['driver_id'] as String?;
    final tripId = _trip?['id'] as String?;
    var isDriver =
        currentUserId != null && driverId != null && currentUserId == driverId;

    if (!isDriver && currentUserId != null && tripId != null) {
      try {
        final driverAccount = await Supabase.instance.client
            .from('driver_accounts')
            .select('external_driver_id')
            .eq('profile_id', currentUserId)
            .eq('is_active', true)
            .maybeSingle();

        final externalDriverId =
            driverAccount?['external_driver_id'] as String?;
        if (externalDriverId != null && externalDriverId.isNotEmpty) {
          final assignment = await Supabase.instance.client
              .from('trip_driver_assignments')
              .select('id')
              .eq('trip_id', tripId)
              .eq('external_driver_id', externalDriverId)
              .limit(1)
              .maybeSingle();
          isDriver = assignment != null;
        }
      } catch (_) {
        // Fallback to direct trip.driver_id detection only.
      }
    }

    if (!mounted) return;
    setState(() {
      _isDriverForTrip = isDriver;
    });

    _maybeAutoStartLocationSharing();
  }

  void _maybeAutoStartLocationSharing() {
    if (_autoStartAttempted) return;
    if (!widget.autoStartLocationSharing) return;
    if (!_isDriverForTrip) return;
    if (_sharingLocation || _startingLocationShare) return;
    _autoStartAttempted = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _toggleLocationSharing();
    });
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    super.dispose();
  }

  Future<void> _toggleLocationSharing() async {
    if (!_isDriverForTrip) return;

    if (_sharingLocation) {
      _stopLocationSharing();
      return;
    }

    setState(() => _startingLocationShare = true);
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Location services are disabled');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw Exception('Location permission denied');
      }

      await _sendCurrentLocationPing();
      _locationTimer = Timer.periodic(const Duration(seconds: 20), (_) async {
        await _sendCurrentLocationPing();
      });

      if (mounted) {
        setState(() => _sharingLocation = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Live location sharing started'),
            backgroundColor: AppTheme.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Unable to start location sharing: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _startingLocationShare = false);
    }
  }

  void _stopLocationSharing() {
    _locationTimer?.cancel();
    _locationTimer = null;
    if (!mounted) return;
    setState(() => _sharingLocation = false);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Live location sharing stopped'),
        backgroundColor: Colors.black87,
      ),
    );
  }

  Future<void> _sendCurrentLocationPing() async {
    final tripId = _trip?['id'] as String?;
    if (tripId == null) return;

    final session = Supabase.instance.client.auth.currentSession;
    final accessToken = session?.accessToken;
    if (accessToken == null) return;

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );

    final uri = Uri.parse('${SupabaseConfig.apiBaseUrl}/api/location/ping');
    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
      body: jsonEncode({
        'tripId': tripId,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'heading': position.heading,
        'speed': position.speed,
        'accuracy': position.accuracy,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Ping failed (${response.statusCode})');
    }
  }

  Future<void> _openLiveLocationForDay() async {
    try {
      final tripId = _trip?['id'] as String?;
      if (tripId == null) {
        throw Exception('Missing trip ID');
      }

      final session = Supabase.instance.client.auth.currentSession;
      final accessToken = session?.accessToken;
      if (accessToken == null) {
        throw Exception('User session expired');
      }

      final dayNumber = _selectedDayIndex + 1;
      final uri = Uri.parse(
        '${SupabaseConfig.apiBaseUrl}/api/location/client-share?tripId=$tripId&dayNumber=$dayNumber',
      );

      final response = await http.get(
        uri,
        headers: {'Authorization': 'Bearer $accessToken'},
      );

      final payload = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(payload['error'] ?? 'Failed to get live location link');
      }

      final liveUrl =
          (payload['share'] as Map<String, dynamic>?)?['live_url'] as String?;
      if (liveUrl == null || liveUrl.isEmpty) {
        throw Exception('Live location link unavailable');
      }

      final liveUri = Uri.parse(liveUrl);
      final launched = await launchUrl(
        liveUri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        throw Exception('Could not open live location link');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Unable to open live location: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _notifyLanded() async {
    try {
      final tripId = _trip?['id'] as String?;
      if (tripId == null) {
        throw Exception('Missing trip ID');
      }

      final session = Supabase.instance.client.auth.currentSession;
      final accessToken = session?.accessToken;
      if (accessToken == null) {
        throw Exception('User session expired');
      }

      final uri = Uri.parse(
        '${SupabaseConfig.apiBaseUrl}/api/notifications/client-landed',
      );

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $accessToken',
        },
        body: jsonEncode({'tripId': tripId}),
      );

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception('Failed to notify server');
      }

      // Show local confirmation notification
      final itinerary = _trip?['itineraries'] as Map<String, dynamic>?;
      final destination =
          itinerary?['destination'] ?? _trip?['destination'] ?? 'GoBuddy';
      await NotificationService().showNotification(
        id: 1,
        title: 'Welcome to $destination!',
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

  Map<String, dynamic> get rawData {
    final itinerary = _trip?['itineraries'] as Map<String, dynamic>?;
    final itineraryRaw = itinerary?['raw_data'] as Map<String, dynamic>?;
    final directRaw = _trip?['raw_data'] as Map<String, dynamic>?;
    return itineraryRaw ?? directRaw ?? {};
  }

  List<dynamic> get days => rawData['days'] as List<dynamic>? ?? [];

  @override
  Widget build(BuildContext context) {
    if (_loadingTrip || _trip == null) {
      return const Scaffold(
        backgroundColor: Colors.transparent,
        body: DecoratedBox(
          decoration: BoxDecoration(gradient: AppTheme.backgroundGradient),
          child: SafeArea(
            child: Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            ),
          ),
        ),
      );
    }

    DateTime? parseDate(Object? v) {
      if (v == null) return null;
      final s = v.toString().trim();
      if (s.isEmpty) return null;
      try {
        return DateTime.parse(s);
      } catch (_) {
        return null;
      }
    }

    final itinerary = _trip!['itineraries'] as Map<String, dynamic>?;
    final destination =
        itinerary?['destination'] ?? _trip!['destination'] ?? 'Trip Details';
    final startDate = parseDate(_trip!['start_date']);

    DateTime dayDate(int dayIndex) {
      final base = startDate ?? DateTime.now();
      return DateTime(
        base.year,
        base.month,
        base.day,
      ).add(Duration(days: dayIndex));
    }

    void goHome() => Navigator.of(context).popUntil((r) => r.isFirst);

    void handleClientNav(int index) {
      switch (index) {
        case 0:
          return goHome();
        case 1:
          return;
        case 2:
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const SupportScreen()),
          );
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

    void handleDriverNav(int index) {
      switch (index) {
        case 0:
          return goHome();
        case 1:
          return;
        case 2:
          return goHome();
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

    final dayList = days;
    final hasDays = dayList.isNotEmpty;
    final safeDayIndex = hasDays
        ? _selectedDayIndex.clamp(0, (dayList.length - 1).clamp(0, 9999))
        : 0;

    final day = hasDays
        ? (dayList[safeDayIndex] as Map<String, dynamic>? ?? const {})
        : const <String, dynamic>{};
    final theme = (day['theme'] ?? '').toString().trim();
    final activities = day['activities'] as List<dynamic>? ?? const [];

    Widget dayTabs() {
      if (!hasDays) return const SizedBox.shrink();
      return SizedBox(
        height: 44,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: dayList.length,
          padding: EdgeInsets.zero,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (context, i) {
            final selected = i == safeDayIndex;
            final dt = dayDate(i);
            final label = DateFormat.MMMd().format(dt);
            return InkWell(
              onTap: () => setState(() => _selectedDayIndex = i),
              borderRadius: BorderRadius.circular(999),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: selected
                      ? AppTheme.primary
                      : AppTheme.primary.withAlpha(18),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: selected
                        ? AppTheme.primary.withAlpha(60)
                        : AppTheme.primary.withAlpha(40),
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  label,
                  style: TextStyle(
                    color: selected ? Colors.white : AppTheme.textPrimary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            );
          },
        ),
      );
    }

    Widget timeline() {
      if (!hasDays) {
        return const GlassCard(
          child: Text(
            'No itinerary data yet.',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w700,
            ),
          ),
        );
      }

      final list = activities
          .map((a) => a as Map<String, dynamic>? ?? const <String, dynamic>{})
          .where(
            (a) => (a['title'] ?? a['name'] ?? '').toString().trim().isNotEmpty,
          )
          .toList();

      if (list.isEmpty) {
        return const GlassCard(
          child: Text(
            'No activities for this day yet.',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w700,
            ),
          ),
        );
      }

      return Column(
        children: [
          if (theme.isNotEmpty) ...[
            Align(
              alignment: Alignment.centerLeft,
              child: GlassPill(
                color: AppTheme.primary.withAlpha(18),
                borderColor: AppTheme.primary.withAlpha(40),
                child: Text(
                  theme,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),
          ],
          ...List.generate(list.length, (i) {
            final a = list[i];
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: _StitchTimelineItem(
                index: i,
                total: list.length,
                time: (a['time'] ?? '').toString().trim(),
                title: (a['title'] ?? a['name'] ?? '').toString().trim(),
                description: (a['description'] ?? '').toString().trim(),
                location: (a['location'] ?? a['address'] ?? '')
                    .toString()
                    .trim(),
              ),
            );
          }),
        ],
      );
    }

    final nav = _isDriverForTrip
        ? GlassDriverFloatingNavBar(activeIndex: 1, onTap: handleDriverNav)
        : GlassTravelerFloatingNavBar(activeIndex: 1, onTap: handleClientNav);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: DecoratedBox(
        decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: SafeArea(
          child: Stack(
            children: [
              ListView(
                padding: const EdgeInsets.fromLTRB(24, 96, 24, 120),
                children: [
                  dayTabs(),
                  if (hasDays) const SizedBox(height: 16),
                  timeline()
                      .animate(key: ValueKey(safeDayIndex))
                      .fadeIn(duration: 400.ms),
                ],
              ),
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                child: ClipRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(24, 18, 24, 16),
                      decoration: BoxDecoration(
                        color: AppTheme.glassNavSurface,
                        border: Border(
                          bottom: BorderSide(color: AppTheme.glassBorder),
                        ),
                      ),
                      child: Row(
                        children: [
                          GlassIconButton(
                            onPressed: () => Navigator.pop(context),
                            size: 34,
                            background: AppTheme.secondary.withAlpha(18),
                            icon: const AppIcon(
                              HeroIcons.arrowLeft,
                              size: 18,
                              color: AppTheme.secondary,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              destination,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.textPrimary,
                                  ),
                            ),
                          ),
                          if (_isDriverForTrip)
                            GlassIconButton(
                              onPressed: _startingLocationShare
                                  ? null
                                  : _toggleLocationSharing,
                              size: 34,
                              background: _sharingLocation
                                  ? AppTheme.success.withAlpha(26)
                                  : AppTheme.primary.withAlpha(18),
                              icon: AppIcon(
                                _sharingLocation
                                    ? HeroIcons.signalSlash
                                    : HeroIcons.signal,
                                size: 18,
                                color: _sharingLocation
                                    ? AppTheme.success
                                    : AppTheme.primary,
                              ),
                            ),
                          const SizedBox(width: 10),
                          GlassIconButton(
                            onPressed: () {
                              // placeholder for future share/menu actions
                            },
                            size: 34,
                            background: AppTheme.secondary.withAlpha(18),
                            icon: const AppIcon(
                              HeroIcons.ellipsisHorizontal,
                              size: 18,
                              color: AppTheme.secondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(left: 0, right: 0, bottom: 0, child: nav),
              if (!_isDriverForTrip)
                Positioned(
                  right: 16,
                  bottom: 84,
                  child: ElevatedButton.icon(
                    onPressed: _notifyLanded,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                      elevation: 8,
                      shadowColor: AppTheme.primary.withAlpha(77),
                    ),
                    icon: const AppIcon(
                      HeroIcons.paperAirplane,
                      color: Colors.white,
                      size: 18,
                    ),
                    label: const Text(
                      "I've Landed",
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _ensureGeocoded(String rawLocation) {
    final location = rawLocation.trim();
    if (location.isEmpty) return;
    if (_requestedGeocodes.contains(location)) return;
    if (GeocodingService.instance.getCached(location) != null) return;

    _requestedGeocodes.add(location);
    GeocodingService.instance.geocode(location).then((_) {
      if (!mounted) return;
      setState(() {});
    });
  }

  Widget _buildDayContent(dynamic dayData) {
    final day = dayData as Map<String, dynamic>;
    final theme = day['theme'] ?? '';
    final activities = day['activities'] as List<dynamic>? ?? [];

    Marker _buildMarker(LatLng point) {
      return Marker(
        point: point,
        child: Container(
          decoration: BoxDecoration(
            color: AppTheme.primary,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(color: Colors.black.withAlpha(51), blurRadius: 4),
            ],
          ),
          padding: const EdgeInsets.all(8),
          child: const Icon(Icons.place, color: Colors.white, size: 16),
        ),
      );
    }

    // Check for driver assignment for this day (1-based index)
    final assignment = _assignments.firstWhere(
      (a) => a.dayNumber == _selectedDayIndex + 1,
      orElse: () => const DriverAssignment(
        id: '',
        tripId: '',
        driverId: '',
        dayNumber: -1,
      ),
    );
    final hasDriver = assignment.dayNumber != -1;

    // Collect coordinates for map
    final markers = <Marker>[];
    var hasPotentialMapData = false;
    for (final activity in activities) {
      final coords = activity['coordinates'] as Map<String, dynamic>?;
      if (coords != null) {
        final lat = coords['lat'] as num?;
        final lng = coords['lng'] as num?;
        if (lat != null && lng != null) {
          hasPotentialMapData = true;
          markers.add(_buildMarker(LatLng(lat.toDouble(), lng.toDouble())));
          continue;
        }
      }

      final location = activity['location']?.toString();
      if (location != null && location.trim().isNotEmpty) {
        hasPotentialMapData = true;
        final cached = GeocodingService.instance.getCached(location);
        if (cached != null) {
          markers.add(_buildMarker(cached));
        } else {
          _ensureGeocoded(location);
        }
      }
    }

    return Padding(
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
            if (!_isDriverForTrip)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _openLiveLocationForDay,
                    icon: const Icon(Icons.navigation_rounded),
                    label: const Text('View Live Driver Location'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      side: BorderSide(color: AppTheme.primary.withAlpha(120)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 16),
          ],

          // Map
          if (hasPotentialMapData)
            Container(
              height: 200,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: Colors.black.withAlpha(26), blurRadius: 10),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: markers.isEmpty
                  ? const Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    )
                  : FlutterMap(
                      options: MapOptions(
                        initialCenter: markers.first.point,
                        initialZoom: 13,
                      ),
                      children: [
                        TileLayer(
                          urlTemplate:
                              'https://tile.openstreetmap.org/{z}/{x}/{y}.png?app=com.gobuddy.gobuddy_mobile',
                          userAgentPackageName: 'com.gobuddy.gobuddy_mobile',
                          tileProvider: NetworkTileProvider(
                            headers: {
                              'User-Agent':
                                  'com.gobuddy.gobuddy_mobile (Travel Suite dev)',
                            },
                          ),
                        ),
                        MarkerLayer(markers: markers),
                      ],
                    ),
            ),

          // Activities
          ...activities.asMap().entries.map((entry) {
            final index = entry.key;
            final activity = entry.value as Map<String, dynamic>;
            return _buildActivityCard(activity, index, activities.length);
          }),

          const SizedBox(height: 100), // FAB clearance
        ],
      ),
    );
  }

  Widget _buildActivityCard(
    Map<String, dynamic> activity,
    int index,
    int total,
  ) {
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
              if (index < total - 1) // Show line between items
                Container(
                  width: 2,
                  height: 60,
                  color: AppTheme.primary.withAlpha(77),
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
                    color: Colors.black.withAlpha(13),
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
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.secondary.withAlpha(26),
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
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
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
                        Icon(
                          Icons.location_on_outlined,
                          size: 14,
                          color: Colors.grey.shade500,
                        ),
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

class _StitchTimelineItem extends StatelessWidget {
  final int index;
  final int total;
  final String time;
  final String title;
  final String description;
  final String location;

  const _StitchTimelineItem({
    required this.index,
    required this.total,
    required this.time,
    required this.title,
    required this.description,
    required this.location,
  });

  @override
  Widget build(BuildContext context) {
    final hasTime = time.trim().isNotEmpty;
    final hasLocation = location.trim().isNotEmpty;
    final hasDescription = description.trim().isNotEmpty;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 34,
          child: Column(
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withAlpha(24),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.primary.withAlpha(70)),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${index + 1}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              if (index < total - 1)
                Container(
                  width: 2,
                  height: 86,
                  margin: const EdgeInsets.only(top: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withAlpha(50),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: GlassCard(
            padding: const EdgeInsets.all(16),
            borderRadius: BorderRadius.circular(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (hasTime)
                  GlassPill(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    color: AppTheme.secondary.withAlpha(18),
                    borderColor: AppTheme.secondary.withAlpha(40),
                    child: Text(
                      time,
                      style: const TextStyle(
                        color: AppTheme.secondary,
                        fontWeight: FontWeight.w900,
                        fontSize: 12,
                      ),
                    ),
                  ),
                if (hasTime) const SizedBox(height: 10),
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
                if (hasDescription) ...[
                  const SizedBox(height: 6),
                  Text(
                    description,
                    style: const TextStyle(
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                if (hasLocation) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      AppIcon(
                        HeroIcons.mapPin,
                        size: 18,
                        color: AppTheme.textSecondary.withAlpha(180),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          location,
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w600,
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
    );
  }
}

class _DaySelectorDelegate extends SliverPersistentHeaderDelegate {
  final List<dynamic> days;
  final int selectedIndex;
  final ValueChanged<int> onSelect;

  _DaySelectorDelegate({
    required this.days,
    required this.selectedIndex,
    required this.onSelect,
  });

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: Colors.white,
      height: 60,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: days.length,
        itemBuilder: (context, index) {
          final isSelected = index == selectedIndex;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text('Day ${index + 1}'),
              selected: isSelected,
              onSelected: (_) => onSelect(index),
              selectedColor: AppTheme.primary,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.black87,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              showCheckmark: false,
              backgroundColor: Colors.grey[100],
              side: BorderSide.none,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  double get maxExtent => 60;

  @override
  double get minExtent => 60;

  @override
  bool shouldRebuild(covariant _DaySelectorDelegate oldDelegate) {
    return oldDelegate.selectedIndex != selectedIndex ||
        oldDelegate.days != days;
  }
}
