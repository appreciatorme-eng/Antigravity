import 'dart:convert';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:gobuddy_mobile/core/ui/app_icon.dart';
import 'package:gobuddy_mobile/core/ui/glass/glass.dart';
import 'package:heroicons/heroicons.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/services/driver_prefs.dart';
import '../../../../core/theme/app_theme.dart';
import '../screens/trip_detail_screen.dart';

class DriverDashboard extends StatefulWidget {
  final List<Map<String, dynamic>> trips;
  final int activeTripIndex;
  final ValueChanged<int> onSelectTrip;
  final Future<void> Function()? onRefresh;

  const DriverDashboard({
    super.key,
    required this.trips,
    required this.activeTripIndex,
    required this.onSelectTrip,
    this.onRefresh,
  });

  @override
  State<DriverDashboard> createState() => _DriverDashboardState();
}

class _DriverDashboardState extends State<DriverDashboard> {
  Map<String, dynamic>? _profile;
  bool _loadingProfile = false;
  bool _onDuty = false;
  bool _loadingDuty = false;
  Map<String, dynamic>? _todayAssignment;
  bool _loadingAssignment = false;
  String? _assignmentTripId;
  int? _assignmentDayNumber;

  @override
  void initState() {
    super.initState();
    _loadProfile();
    _loadDuty();
    _loadTodayAssignment();
  }

  @override
  void didUpdateWidget(covariant DriverDashboard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeTripIndex != widget.activeTripIndex ||
        oldWidget.trips.length != widget.trips.length) {
      _loadTodayAssignment();
    }
  }

  Future<void> _loadProfile() async {
    if (_loadingProfile) return;
    setState(() => _loadingProfile = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      final row = await Supabase.instance.client
          .from('profiles')
          .select('full_name, driver_info, onboarding_step')
          .eq('id', user.id)
          .maybeSingle();
      if (!mounted) return;
      setState(
        () => _profile = row == null ? null : Map<String, dynamic>.from(row),
      );
    } finally {
      if (!mounted) return;
      setState(() => _loadingProfile = false);
    }
  }

  Future<void> _loadDuty() async {
    if (_loadingDuty) return;
    setState(() => _loadingDuty = true);
    try {
      final v = await DriverPrefs.instance.isOnDuty();
      if (!mounted) return;
      setState(() => _onDuty = v);
    } finally {
      if (!mounted) return;
      setState(() => _loadingDuty = false);
    }
  }

  Future<void> _loadTodayAssignment() async {
    final trip = _activeTrip();
    final tripId = trip?['id']?.toString();
    if (tripId == null || tripId.isEmpty) return;
    if (_loadingAssignment) return;

    final now = DateTime.now();
    final raw = trip == null
        ? const <String, dynamic>{}
        : _rawDataForTrip(trip);
    final days = raw['days'] as List<dynamic>? ?? const [];
    final dayIndex = days.isEmpty
        ? 0
        : _dayIndexForTrip(trip!, now).clamp(0, days.length - 1);
    final dayNumber = dayIndex + 1;

    if (_assignmentTripId == tripId && _assignmentDayNumber == dayNumber)
      return;

    setState(() => _loadingAssignment = true);
    try {
      final row = await Supabase.instance.client
          .from('trip_driver_assignments')
          .select(
            'pickup_time,pickup_location,dropoff_location,notes,day_number',
          )
          .eq('trip_id', tripId)
          .eq('day_number', dayNumber)
          .maybeSingle();

      if (!mounted) return;
      setState(() {
        _assignmentTripId = tripId;
        _assignmentDayNumber = dayNumber;
        _todayAssignment = row == null ? null : Map<String, dynamic>.from(row);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _assignmentTripId = tripId;
        _assignmentDayNumber = dayNumber;
        _todayAssignment = null;
      });
    } finally {
      if (!mounted) return;
      setState(() => _loadingAssignment = false);
    }
  }

  Future<void> _toggleDuty(bool next) async {
    setState(() => _onDuty = next);
    await DriverPrefs.instance.setOnDuty(next);
  }

  DateTime? _parseDate(Object? v) {
    if (v == null) return null;
    if (v is DateTime) return DateTime(v.year, v.month, v.day);
    final s = v.toString();
    final dt = DateTime.tryParse(s);
    if (dt == null) return null;
    return DateTime(dt.year, dt.month, dt.day);
  }

  int _dayIndexForTrip(Map<String, dynamic> trip, DateTime now) {
    final start = _parseDate(trip['start_date']);
    if (start == null) return 0;
    final today = DateTime(now.year, now.month, now.day);
    return today.difference(start).inDays;
  }

  bool _isActiveToday(Map<String, dynamic> trip, DateTime now) {
    final start = _parseDate(trip['start_date']);
    final end = _parseDate(trip['end_date']);
    if (start == null || end == null) return false;
    final today = DateTime(now.year, now.month, now.day);
    return !today.isBefore(start) && !today.isAfter(end);
  }

  Map<String, dynamic>? _activeTrip() {
    final i = widget.activeTripIndex;
    if (i < 0 || i >= widget.trips.length) return null;
    return widget.trips[i];
  }

  Map<String, dynamic> _rawDataForTrip(Map<String, dynamic> trip) {
    final itinerary = trip['itineraries'] as Map<String, dynamic>?;
    final raw =
        itinerary?['raw_data'] as Map<String, dynamic>? ??
        trip['raw_data'] as Map<String, dynamic>? ??
        const <String, dynamic>{};
    return raw;
  }

  String _destinationForTrip(Map<String, dynamic> trip) {
    final itinerary = trip['itineraries'] as Map<String, dynamic>?;
    return (itinerary?['destination'] ??
            trip['destination'] ??
            _rawDataForTrip(trip)['destination'] ??
            'Trip')
        .toString();
  }

  ({Map<String, dynamic>? activity, DateTime? when}) _nextActivityForTrip(
    Map<String, dynamic> trip,
    DateTime now,
  ) {
    final raw = _rawDataForTrip(trip);
    final days = raw['days'] as List<dynamic>? ?? const [];
    if (days.isEmpty) return (activity: null, when: null);

    final idx = _dayIndexForTrip(trip, now);
    final dayIndex = idx.clamp(0, days.length - 1);
    final day = days[dayIndex] as Map<String, dynamic>? ?? const {};
    final activities = day['activities'] as List<dynamic>? ?? const [];
    if (activities.isEmpty) return (activity: null, when: null);

    final base = DateTime(now.year, now.month, now.day);

    DateTime? bestWhen;
    Map<String, dynamic>? bestAct;
    for (final a0 in activities) {
      final a = a0 as Map<String, dynamic>? ?? const {};
      final time = (a['time'] ?? '').toString();
      final when = _parseActivityTimeOn(base, time) ?? base;
      if (when.isBefore(now)) continue;
      if (bestWhen == null || when.isBefore(bestWhen)) {
        bestWhen = when;
        bestAct = a;
      }
    }

    if (bestAct != null) return (activity: bestAct, when: bestWhen);

    final first = activities.first as Map<String, dynamic>? ?? const {};
    final time = (first['time'] ?? '').toString();
    return (activity: first, when: _parseActivityTimeOn(base, time));
  }

  DateTime? _parseActivityTimeOn(DateTime baseDate, String label) {
    final s = label.trim().toLowerCase();
    final re = RegExp(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm)?');
    final m = re.firstMatch(s);
    if (m != null) {
      final hh = int.tryParse(m.group(1)!) ?? 0;
      final mm = int.tryParse(m.group(2) ?? '0') ?? 0;
      final ap = m.group(3);
      var hour = hh;
      if (ap != null) {
        final isPm = ap == 'pm';
        if (isPm && hour < 12) hour += 12;
        if (!isPm && hour == 12) hour = 0;
      }
      if (hour >= 0 && hour <= 23 && mm >= 0 && mm <= 59) {
        return DateTime(baseDate.year, baseDate.month, baseDate.day, hour, mm);
      }
    }
    if (s.contains('morning')) {
      return DateTime(baseDate.year, baseDate.month, baseDate.day, 9, 0);
    }
    if (s.contains('afternoon')) {
      return DateTime(baseDate.year, baseDate.month, baseDate.day, 14, 0);
    }
    if (s.contains('evening')) {
      return DateTime(baseDate.year, baseDate.month, baseDate.day, 19, 0);
    }
    return null;
  }

  Future<void> _openMaps(String query) async {
    final encoded = Uri.encodeComponent(query);
    final uri = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=$encoded',
    );
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  String _formatTimeOfDay(Object? v) {
    if (v == null) return '';
    if (v is String) {
      // Supabase TIME often comes as "HH:MM:SS" or "HH:MM:SS+00".
      final m = RegExp(r'^(\\d{2}):(\\d{2})').firstMatch(v);
      if (m != null) {
        final hh = int.tryParse(m.group(1)!) ?? 0;
        final mm = int.tryParse(m.group(2)!) ?? 0;
        final dt = DateTime(2000, 1, 1, hh, mm);
        return DateFormat.jm().format(dt);
      }
    }
    return v.toString();
  }

  Future<void> _openTrip(
    Map<String, dynamic> trip, {
    bool autoStartLive = false,
  }) async {
    if (!mounted) return;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TripDetailScreen(
          trip: trip,
          autoStartLocationSharing: autoStartLive,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final trip = _activeTrip();
    if (trip == null) return const SizedBox.shrink();

    final now = DateTime.now();
    final destination = _destinationForTrip(trip);
    final start = _parseDate(trip['start_date']);
    final end = _parseDate(trip['end_date']);
    final kicker = (start != null && end != null)
        ? '${DateFormat.MMM().format(start).toUpperCase()} ${start.day}-${end.day} • ${destination.split(',').first.trim()}'
        : destination;

    final raw = _rawDataForTrip(trip);
    final days = raw['days'] as List<dynamic>? ?? const [];
    final dayIndex = days.isEmpty
        ? 0
        : _dayIndexForTrip(trip, now).clamp(0, days.length - 1);
    final dayNumber = dayIndex + 1;

    final a = _todayAssignment;
    final pickupTime = _formatTimeOfDay(a?['pickup_time']);
    final pickupLocation = (a?['pickup_location'] ?? '').toString().trim();
    final dropoffLocation = (a?['dropoff_location'] ?? '').toString().trim();
    final driverInfo = (_profile?['driver_info'] is Map)
        ? Map<String, dynamic>.from(_profile?['driver_info'] as Map)
        : _decodeJsonObject(_profile?['driver_info']);
    final vehicle = (driverInfo?['vehicle_details'] ?? '').toString().trim();
    final vehicleRangeKm =
        (driverInfo?['range_km'] ?? driverInfo?['vehicle_range_km'])
            ?.toString()
            .trim();

    String passengerName() {
      final v =
          (raw['traveler_name'] ??
                  raw['client_name'] ??
                  raw['guest_name'] ??
                  (raw['traveler'] is Map
                      ? (raw['traveler'] as Map)['name']
                      : null) ??
                  (raw['guest'] is Map ? (raw['guest'] as Map)['name'] : null))
              ?.toString()
              .trim();
      return (v == null || v.isEmpty) ? 'Traveler' : v;
    }

    List<Map<String, String>> upcomingRoute() {
      if (days.isEmpty) return const [];
      final day = days[dayIndex] as Map<String, dynamic>? ?? const {};
      final activities = day['activities'] as List<dynamic>? ?? const [];
      final base = DateTime(now.year, now.month, now.day);
      final out = <Map<String, String>>[];

      for (final a0 in activities) {
        final a = a0 as Map<String, dynamic>? ?? const {};
        final title = (a['title'] ?? a['name'] ?? '').toString().trim();
        final loc = (a['location'] ?? a['address'] ?? '').toString().trim();
        final timeLabel = (a['time'] ?? '').toString().trim();
        if (title.isEmpty) continue;

        final when = _parseActivityTimeOn(base, timeLabel);
        if (when != null && when.isBefore(now)) continue;

        out.add({
          'time': when == null ? timeLabel : DateFormat.Hm().format(when),
          'title': title,
          'location': loc,
        });
        if (out.length >= 3) break;
      }

      if (out.isNotEmpty) return out.take(3).toList();

      for (final a0 in activities.take(3)) {
        final a = a0 as Map<String, dynamic>? ?? const {};
        final title = (a['title'] ?? a['name'] ?? '').toString().trim();
        final loc = (a['location'] ?? a['address'] ?? '').toString().trim();
        final timeLabel = (a['time'] ?? '').toString().trim();
        if (title.isEmpty) continue;
        out.add({'time': timeLabel, 'title': title, 'location': loc});
      }
      return out;
    }

    final currentTimeLabel = pickupTime.isNotEmpty
        ? pickupTime
        : DateFormat.Hm().format(now);
    final upcoming = upcomingRoute();

    final list = ListView(
      padding: const EdgeInsets.fromLTRB(24, 120, 24, 96),
      children: [
        if (widget.trips.length > 1) ...[
          _TripSwitchRow(
            trips: widget.trips,
            activeIndex: widget.activeTripIndex,
            onSelect: widget.onSelectTrip,
          ),
          const SizedBox(height: 14),
        ],
        GlassCard(
          padding: const EdgeInsets.all(18),
          borderRadius: BorderRadius.circular(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  GlassPill(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    color: AppTheme.primary.withAlpha(22),
                    borderColor: AppTheme.primary.withAlpha(40),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppTheme.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Current: Day $dayNumber',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  GlassIconButton(
                    onPressed: () => _openTrip(trip, autoStartLive: true),
                    size: 36,
                    background: AppTheme.secondary.withAlpha(18),
                    icon: const AppIcon(
                      HeroIcons.signal,
                      size: 18,
                      color: AppTheme.secondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                currentTimeLabel,
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                  color: AppTheme.primary,
                  fontSize: 44,
                  height: 1,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Today, ${DateFormat.MMMd().format(now)}',
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'PASSENGER',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.4,
                  color: AppTheme.textSecondary.withAlpha(200),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                passengerName(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'PICKUP LOCATION',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.4,
                  color: AppTheme.textSecondary.withAlpha(200),
                ),
              ),
              const SizedBox(height: 6),
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
                      pickupLocation.isEmpty
                          ? 'Pickup details will appear once assigned.'
                          : pickupLocation,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              if (dropoffLocation.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Drop-off: $dropoffLocation',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: pickupLocation.isEmpty
                      ? null
                      : () => _openMaps(pickupLocation),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.secondary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AppIcon(HeroIcons.arrowUpRight, color: Colors.white),
                      SizedBox(width: 10),
                      Text(
                        'Start Navigation',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GlassCard(
          padding: const EdgeInsets.all(16),
          borderRadius: BorderRadius.circular(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'Upcoming Route',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'Today',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.secondary.withAlpha(180),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ...upcoming.map((it) {
                final time = (it['time'] ?? '').trim();
                final title = (it['title'] ?? '').trim();
                final loc = (it['location'] ?? '').trim();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 64,
                        child: Text(
                          time.isEmpty ? '--:--' : time,
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            if (loc.isNotEmpty)
                              Text(
                                loc,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: AppTheme.textSecondary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      GlassIconButton(
                        onPressed: loc.isEmpty ? null : () => _openMaps(loc),
                        size: 34,
                        background: AppTheme.primary.withAlpha(18),
                        icon: const AppIcon(
                          HeroIcons.arrowUpRight,
                          size: 18,
                          color: AppTheme.primary,
                        ),
                      ),
                    ],
                  ),
                );
              }),
              if (upcoming.isEmpty)
                const Text(
                  'Route will appear once itinerary activities are added.',
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GlassCard(
          padding: const EdgeInsets.all(16),
          borderRadius: BorderRadius.circular(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    'Vehicle Status',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    _onDuty ? 'ON DUTY' : 'OFF DUTY',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 11,
                      letterSpacing: 1.2,
                      color: _onDuty
                          ? AppTheme.success
                          : AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              if (_loadingProfile)
                const LinearProgressIndicator(minHeight: 2)
              else ...[
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppTheme.secondary.withAlpha(18),
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: const AppIcon(
                        HeroIcons.truck,
                        size: 18,
                        color: AppTheme.secondary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        vehicle.isEmpty ? 'Vehicle details' : vehicle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                    if (vehicleRangeKm != null && vehicleRangeKm.isNotEmpty)
                      Text(
                        'Range: $vehicleRangeKm km',
                        style: const TextStyle(
                          color: AppTheme.textSecondary,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );

    final scroll = widget.onRefresh == null
        ? list
        : RefreshIndicator(onRefresh: widget.onRefresh!, child: list);

    return Stack(
      children: [
        scroll,
        _DriverHeader(
          kicker: kicker,
          name: (_profile?['full_name'] ?? 'Driver').toString(),
          onDuty: _onDuty,
          loadingDuty: _loadingDuty,
          onToggleDuty: () => _toggleDuty(!_onDuty),
        ),
      ],
    );
  }

  Map<String, dynamic>? _decodeJsonObject(Object? raw) {
    if (raw == null) return null;
    if (raw is Map) return Map<String, dynamic>.from(raw);
    if (raw is String) {
      try {
        final v = jsonDecode(raw);
        if (v is Map) return Map<String, dynamic>.from(v);
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

class _DriverHeader extends StatelessWidget {
  final String kicker;
  final String name;
  final bool onDuty;
  final bool loadingDuty;
  final VoidCallback onToggleDuty;

  const _DriverHeader({
    required this.kicker,
    required this.name,
    required this.onDuty,
    required this.loadingDuty,
    required this.onToggleDuty,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
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
              border: Border(bottom: BorderSide(color: AppTheme.glassBorder)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        kicker.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.4,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                    if (loadingDuty)
                      const SizedBox(
                        width: 34,
                        height: 34,
                        child: Padding(
                          padding: EdgeInsets.all(7),
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    else
                      GlassIconButton(
                        onPressed: onToggleDuty,
                        size: 34,
                        background: onDuty
                            ? AppTheme.success.withAlpha(28)
                            : AppTheme.textSecondary.withAlpha(18),
                        icon: AppIcon(
                          HeroIcons.power,
                          size: 18,
                          color: onDuty
                              ? AppTheme.success
                              : AppTheme.textSecondary,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppTheme.secondary.withAlpha(18),
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      alignment: Alignment.center,
                      child: const AppIcon(
                        HeroIcons.user,
                        size: 18,
                        color: AppTheme.secondary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textPrimary,
                                ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            onDuty ? 'On duty' : 'Off duty',
                            style: TextStyle(
                              color: onDuty
                                  ? AppTheme.success
                                  : AppTheme.textSecondary,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ],
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

class _TripSwitchRow extends StatelessWidget {
  final List<Map<String, dynamic>> trips;
  final int activeIndex;
  final ValueChanged<int> onSelect;

  const _TripSwitchRow({
    required this.trips,
    required this.activeIndex,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    if (trips.length <= 1) return const SizedBox.shrink();
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: trips.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, i) {
          final itinerary = trips[i]['itineraries'] as Map<String, dynamic>?;
          final destination =
              (itinerary?['destination'] ?? trips[i]['destination'] ?? 'Trip')
                  .toString();
          final selected = i == activeIndex;
          return ChoiceChip(
            label: Text(destination, overflow: TextOverflow.ellipsis),
            selected: selected,
            onSelected: (_) => onSelect(i),
          );
        },
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? leading;
  final Widget child;

  const _SectionCard({
    required this.title,
    required this.child,
    this.subtitle,
    this.leading,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      elevation: 1.5,
      shadowColor: Colors.black.withAlpha(15),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (leading != null) ...[leading!, const SizedBox(width: 10)],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle!,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: AppTheme.textSecondary),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class _InfoPill extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoPill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.primary.withAlpha(18),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppTheme.primary),
          const SizedBox(width: 6),
          Text(
            label,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _DriverChecklistCard extends StatefulWidget {
  final String tripId;
  final int dayNumber;

  const _DriverChecklistCard({required this.tripId, required this.dayNumber});

  @override
  State<_DriverChecklistCard> createState() => _DriverChecklistCardState();
}

class _DriverChecklistCardState extends State<_DriverChecklistCard> {
  bool _loading = true;
  final Map<String, bool> _done = {};

  List<Map<String, String>> _items() => const [
    {'id': 'check_vehicle', 'title': 'Quick vehicle check (fuel, tires)'},
    {'id': 'confirm_route', 'title': 'Review today\'s route'},
    {'id': 'confirm_pickup', 'title': 'Confirm pickup details'},
    {'id': 'start_live', 'title': 'Start live location sharing'},
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final tripId = widget.tripId;
      final day = widget.dayNumber;
      for (final it in _items()) {
        final id = it['id']!;
        final v = await DriverPrefs.instance.isChecklistDone(tripId, day, id);
        _done[id] = v;
      }
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _toggle(String itemId) async {
    final tripId = widget.tripId;
    final day = widget.dayNumber;
    final next = !(_done[itemId] ?? false);
    setState(() => _done[itemId] = next);
    await DriverPrefs.instance.setChecklistDone(tripId, day, itemId, next);
  }

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Driver checklist',
      subtitle: 'Before you start',
      leading: const Icon(Icons.check_circle_rounded, color: AppTheme.primary),
      child: _loading
          ? const LinearProgressIndicator(minHeight: 2)
          : Column(
              children: _items().map((it) {
                final id = it['id']!;
                final title = it['title']!;
                final checked = _done[id] ?? false;
                return CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: checked,
                  onChanged: (_) => _toggle(id),
                  title: Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      decoration: checked ? TextDecoration.lineThrough : null,
                      color: checked
                          ? AppTheme.textSecondary
                          : AppTheme.textPrimary,
                    ),
                  ),
                );
              }).toList(),
            ),
    );
  }
}
