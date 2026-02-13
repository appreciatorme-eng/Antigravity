import 'dart:convert';

import 'package:flutter/material.dart';
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

  const DriverDashboard({
    super.key,
    required this.trips,
    required this.activeTripIndex,
    required this.onSelectTrip,
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
    final dateRange = (start != null && end != null)
        ? '${DateFormat.MMMd().format(start)} \u2192 ${DateFormat.MMMd().format(end)}'
        : null;

    final next = _nextActivityForTrip(trip, now);
    final nextAct = next.activity;
    final nextWhen = next.when;
    final nextTitle = (nextAct?['title'] ?? nextAct?['name'] ?? 'Next stop')
        .toString();
    final nextLocation = (nextAct?['location'] ?? nextAct?['address'] ?? '')
        .toString();
    final nextTime = nextWhen == null ? '' : DateFormat.jm().format(nextWhen);

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
    final pickupNotes = (a?['notes'] ?? '').toString().trim();

    final driverInfo = (_profile?['driver_info'] is Map)
        ? Map<String, dynamic>.from(_profile?['driver_info'] as Map)
        : _decodeJsonObject(_profile?['driver_info']);
    final vehicle = (driverInfo?['vehicle_details'] ?? '').toString().trim();
    final license = (driverInfo?['license_number'] ?? '').toString().trim();

    final activeTodayCount = widget.trips
        .where((t) => _isActiveToday(t, now))
        .length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _TripSwitchRow(
          trips: widget.trips,
          activeIndex: widget.activeTripIndex,
          onSelect: widget.onSelectTrip,
        ),
        const SizedBox(height: 12),
        _SectionCard(
          title: 'Today',
          subtitle: DateFormat.EEEE().format(now),
          leading: const Icon(Icons.badge_rounded, color: AppTheme.primary),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                destination,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              if (dateRange != null) ...[
                const SizedBox(height: 2),
                Text(
                  dateRange,
                  style: const TextStyle(color: AppTheme.textSecondary),
                ),
              ],
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _InfoPill(icon: Icons.today_rounded, label: 'Day $dayNumber'),
                  _InfoPill(
                    icon: Icons.directions_car_rounded,
                    label: '$activeTodayCount active today',
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withAlpha(16),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _onDuty
                                ? Icons.check_circle_rounded
                                : Icons.pause_circle_rounded,
                            color: _onDuty
                                ? AppTheme.success
                                : AppTheme.textSecondary,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _onDuty ? 'On duty' : 'Off duty',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  _loadingDuty
                      ? const SizedBox(
                          width: 44,
                          height: 44,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Switch(value: _onDuty, onChanged: _toggleDuty),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  ElevatedButton.icon(
                    onPressed: () => _openTrip(trip),
                    icon: const Icon(Icons.open_in_new_rounded),
                    label: const Text('Open trip'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _openTrip(trip, autoStartLive: true),
                    icon: const Icon(Icons.navigation_rounded),
                    label: const Text('Start live location'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _SectionCard(
          title: 'Next job',
          subtitle: nextTime.isEmpty ? 'Schedule' : nextTime,
          leading: const Icon(Icons.schedule_rounded, color: AppTheme.primary),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                nextTitle,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                nextLocation.isEmpty
                    ? 'Location will appear once added to itinerary.'
                    : nextLocation,
                style: const TextStyle(color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  OutlinedButton.icon(
                    onPressed: nextLocation.isEmpty
                        ? null
                        : () => _openMaps(nextLocation),
                    icon: const Icon(Icons.map_rounded),
                    label: const Text('Navigate'),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _openTrip(trip),
                    icon: const Icon(Icons.list_alt_rounded),
                    label: const Text('View full day'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        _SectionCard(
          title: 'Pickup',
          subtitle: 'Operator-provided details',
          leading: const Icon(Icons.place_rounded, color: AppTheme.primary),
          child: _loadingAssignment
              ? const LinearProgressIndicator(minHeight: 2)
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (pickupTime.isNotEmpty)
                      Text(
                        'Pickup $pickupTime',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      )
                    else
                      const Text(
                        'Pickup time will appear once the operator adds it.',
                        style: TextStyle(color: AppTheme.textSecondary),
                      ),
                    const SizedBox(height: 6),
                    if (pickupLocation.isNotEmpty)
                      Text(
                        pickupLocation,
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    if (dropoffLocation.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        'Dropoff: $dropoffLocation',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    ],
                    if (pickupNotes.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        pickupNotes,
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        OutlinedButton.icon(
                          onPressed: pickupLocation.isEmpty
                              ? null
                              : () => _openMaps(pickupLocation),
                          icon: const Icon(Icons.map_rounded),
                          label: const Text('Navigate to pickup'),
                        ),
                        OutlinedButton.icon(
                          onPressed: () => _openTrip(trip),
                          icon: const Icon(Icons.open_in_new_rounded),
                          label: const Text('Open trip'),
                        ),
                      ],
                    ),
                  ],
                ),
        ),
        const SizedBox(height: 12),
        _SectionCard(
          title: 'Vehicle',
          subtitle: 'Your details',
          leading: const Icon(
            Icons.car_rental_rounded,
            color: AppTheme.primary,
          ),
          child: _loadingProfile
              ? const LinearProgressIndicator(minHeight: 2)
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (vehicle.isNotEmpty)
                      Text(
                        vehicle,
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      )
                    else
                      const Text(
                        'Add vehicle details in onboarding to show them here.',
                        style: TextStyle(color: AppTheme.textSecondary),
                      ),
                    const SizedBox(height: 6),
                    if (license.isNotEmpty)
                      Text(
                        'License: $license',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      onPressed: () async {
                        if (!mounted) return;
                        await ScaffoldMessenger.of(context)
                            .showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Vehicle details are managed in your profile',
                                ),
                              ),
                            )
                            .closed;
                      },
                      icon: const Icon(Icons.person_rounded),
                      label: const Text('Profile'),
                    ),
                  ],
                ),
        ),
        const SizedBox(height: 12),
        _DriverChecklistCard(
          tripId: (trip['id'] ?? '').toString(),
          dayNumber: dayNumber,
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
