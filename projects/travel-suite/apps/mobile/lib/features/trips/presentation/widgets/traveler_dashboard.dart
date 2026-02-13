import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:gobuddy_mobile/core/config/supabase_config.dart';
import 'package:gobuddy_mobile/core/services/geocoding_service.dart';
import 'package:gobuddy_mobile/core/services/traveler_prefs.dart';
import 'package:gobuddy_mobile/core/theme/app_theme.dart';
import 'package:gobuddy_mobile/features/trips/data/repositories/driver_repository.dart';
import 'package:gobuddy_mobile/features/trips/domain/models/driver.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class TravelerDashboard extends StatefulWidget {
  final List<Map<String, dynamic>> trips;
  final int activeTripIndex;
  final ValueChanged<int> onSelectTrip;
  final void Function(Map<String, dynamic> trip, {int initialDayIndex})
  onOpenTrip;

  const TravelerDashboard({
    super.key,
    required this.trips,
    required this.activeTripIndex,
    required this.onSelectTrip,
    required this.onOpenTrip,
  });

  @override
  State<TravelerDashboard> createState() => _TravelerDashboardState();
}

class _TravelerDashboardState extends State<TravelerDashboard> {
  Map<String, dynamic>? _org;
  Map<String, dynamic>? _orgOwner;
  bool _loadingOrg = false;

  List<DriverAssignment> _assignments = [];
  bool _loadingAssignments = false;

  Map<String, dynamic>? _accommodation;
  bool _loadingAccommodation = false;
  String? _accommodationTripId;
  int? _accommodationDayNumber;

  List<Map<String, dynamic>> _updates = [];
  bool _loadingUpdates = false;

  final Set<String> _requestedGeocodes = {};
  int? _reviewRating;

  Map<String, dynamic>? get _trip =>
      widget.trips.isEmpty ? null : widget.trips[widget.activeTripIndex];

  Map<String, dynamic>? get _itinerary =>
      _trip?['itineraries'] as Map<String, dynamic>?;

  Map<String, dynamic> get _rawData {
    final itinerary = _itinerary;
    final itineraryRaw = itinerary?['raw_data'] as Map<String, dynamic>?;
    final directRaw = _trip?['raw_data'] as Map<String, dynamic>?;
    return itineraryRaw ?? directRaw ?? {};
  }

  String get _destination =>
      (_itinerary?['destination'] ?? _trip?['destination'] ?? 'Your trip')
          .toString();

  String? get _tripId => _trip?['id'] as String?;

  DateTime? _parseDate(String? v) {
    if (v == null || v.trim().isEmpty) return null;
    try {
      return DateTime.parse(v);
    } catch (_) {
      return null;
    }
  }

  @override
  void initState() {
    super.initState();
    _loadOrgBranding();
    _reloadTripData();
  }

  @override
  void didUpdateWidget(covariant TravelerDashboard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeTripIndex != widget.activeTripIndex) {
      _reloadTripData();
    }
    if (oldWidget.trips.length != widget.trips.length) {
      _loadOrgBranding();
    }
  }

  void _reloadTripData() {
    _loadAssignments();
    _loadAccommodationForToday();
    _loadUpdates();
    _loadReviewState();
  }

  Future<void> _loadOrgBranding() async {
    if (_loadingOrg) return;
    setState(() => _loadingOrg = true);

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;

      final profile = await Supabase.instance.client
          .from('profiles')
          .select(
            'organization_id, organizations(id,name,logo_url,primary_color,owner_id)',
          )
          .eq('id', user.id)
          .maybeSingle();

      final org = profile?['organizations'] as Map<String, dynamic>?;
      Map<String, dynamic>? owner;
      final ownerId = org?['owner_id'] as String?;
      if (ownerId != null && ownerId.isNotEmpty) {
        owner = await Supabase.instance.client
            .from('profiles')
            .select('full_name, phone_normalized, phone')
            .eq('id', ownerId)
            .maybeSingle();
      }

      if (!mounted) return;
      setState(() {
        _org = org;
        _orgOwner = owner;
      });
    } catch (_) {
      // Non-blocking
    } finally {
      if (!mounted) return;
      setState(() => _loadingOrg = false);
    }
  }

  Future<void> _loadAssignments() async {
    final tripId = _tripId;
    if (tripId == null) return;
    if (_loadingAssignments) return;
    setState(() => _loadingAssignments = true);

    try {
      final repo = DriverRepository(Supabase.instance.client);
      final results = await repo.getDriverAssignments(tripId);
      if (!mounted) return;
      setState(() => _assignments = results);
    } finally {
      if (!mounted) return;
      setState(() => _loadingAssignments = false);
    }
  }

  Future<void> _loadAccommodationForToday() async {
    final tripId = _tripId;
    if (tripId == null) return;
    if (_loadingAccommodation) return;

    final now = DateTime.now();
    final dayIndex = _computeDayIndex(now);
    final days = _rawData['days'] as List<dynamic>? ?? [];
    final clampedDayIndex = days.isEmpty
        ? 0
        : dayIndex.clamp(0, (days.length - 1).clamp(0, 9999));
    final dayNumber = clampedDayIndex + 1;

    if (_accommodationTripId == tripId &&
        _accommodationDayNumber == dayNumber) {
      return;
    }

    setState(() => _loadingAccommodation = true);
    try {
      final row = await Supabase.instance.client
          .from('trip_accommodations')
          .select(
            'hotel_name,address,check_in_time,check_out_time,confirmation_number,contact_phone,notes,day_number',
          )
          .eq('trip_id', tripId)
          .eq('day_number', dayNumber)
          .maybeSingle();

      if (!mounted) return;
      setState(() {
        _accommodationTripId = tripId;
        _accommodationDayNumber = dayNumber;
        _accommodation = row == null ? null : Map<String, dynamic>.from(row);
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _accommodationTripId = tripId;
        _accommodationDayNumber = dayNumber;
        _accommodation = null;
      });
    } finally {
      if (!mounted) return;
      setState(() => _loadingAccommodation = false);
    }
  }

  Future<void> _loadUpdates() async {
    final tripId = _tripId;
    if (tripId == null) return;
    if (_loadingUpdates) return;
    setState(() => _loadingUpdates = true);

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;

      final rows = await Supabase.instance.client
          .from('notification_logs')
          .select('id,title,body,notification_type,status,sent_at,created_at')
          .eq('trip_id', tripId)
          .eq('recipient_id', user.id)
          .order('sent_at', ascending: false)
          .order('created_at', ascending: false)
          .limit(6);

      final list = List<Map<String, dynamic>>.from(rows as List);
      if (!mounted) return;
      setState(() => _updates = list);
    } catch (_) {
      // Non-blocking
    } finally {
      if (!mounted) return;
      setState(() => _loadingUpdates = false);
    }
  }

  Future<void> _loadReviewState() async {
    final tripId = _tripId;
    if (tripId == null) return;
    final rating = await TravelerPrefs.instance.getReviewRating(tripId);
    if (!mounted) return;
    setState(() => _reviewRating = rating);
  }

  int _computeDayIndex(DateTime now) {
    final start = _parseDate(_trip?['start_date']?.toString());
    if (start == null) return 0;
    final diff = now.difference(DateTime(start.year, start.month, start.day));
    final i = diff.inDays;
    if (i < 0) return 0;
    return i;
  }

  DriverAssignment? _assignmentForDay(int dayNumber) {
    for (final a in _assignments) {
      if (a.dayNumber == dayNumber) return a;
    }
    return null;
  }

  Map<String, dynamic>? _extractHotel(
    Map<String, dynamic> rawData,
    int dayIndex,
  ) {
    final days = rawData['days'] as List<dynamic>? ?? [];
    Map<String, dynamic>? fromDay;
    if (days.isNotEmpty && dayIndex >= 0 && dayIndex < days.length) {
      final day = days[dayIndex] as Map<String, dynamic>;
      final h1 = day['hotel'];
      final h2 = day['accommodation'];
      if (h1 is Map) fromDay = Map<String, dynamic>.from(h1);
      if (fromDay == null && h2 is Map) fromDay = Map<String, dynamic>.from(h2);
    }

    if (fromDay != null) return fromDay;

    final hotel = rawData['hotel'];
    final accommodation = rawData['accommodation'];
    if (hotel is Map) return Map<String, dynamic>.from(hotel);
    if (accommodation is Map) return Map<String, dynamic>.from(accommodation);

    final hotels = rawData['hotels'];
    if (hotels is List && hotels.isNotEmpty && hotels.first is Map) {
      return Map<String, dynamic>.from(hotels.first as Map);
    }

    // Last resort: scan activities for a hotel-like payload.
    if (days.isNotEmpty && dayIndex >= 0 && dayIndex < days.length) {
      final day = days[dayIndex] as Map<String, dynamic>;
      final activities = day['activities'] as List<dynamic>? ?? [];
      for (final a in activities) {
        if (a is! Map) continue;
        final kind = a['type']?.toString().toLowerCase();
        if (kind == 'hotel' || kind == 'accommodation') {
          final h = a['hotel'];
          if (h is Map) return Map<String, dynamic>.from(h);
        }
      }
    }
    return null;
  }

  String _normalizeForWhatsApp(String raw) =>
      raw.replaceAll(RegExp(r'\\D'), '');

  String _formatPickupTime(String? raw) {
    if (raw == null) return '';
    final s = raw.trim();
    if (s.isEmpty) return '';
    final m = RegExp(r'^(\\d{1,2}):(\\d{2})').firstMatch(s);
    if (m == null) return s;
    return '${m.group(1)!.padLeft(2, '0')}:${m.group(2)}';
  }

  Future<void> _copyText(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Copied')));
  }

  Future<void> _openLiveLocationForDay(int dayNumber) async {
    final tripId = _tripId;
    if (tripId == null) return;

    try {
      final now = DateTime.now().toUtc();

      Future<Map<String, dynamic>?> fetchForDay(int? day) async {
        var q = Supabase.instance.client
            .from('trip_location_shares')
            .select('share_token, expires_at, is_active, created_at')
            .eq('trip_id', tripId)
            .eq('is_active', true);

        if (day == null) {
          q = q.isFilter('day_number', null);
        } else {
          q = q.eq('day_number', day);
        }

        return q.order('created_at', ascending: false).limit(1).maybeSingle();
      }

      Map<String, dynamic>? row = await fetchForDay(dayNumber);
      row ??= await fetchForDay(null);
      if (row == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Live location is not available yet.')),
        );
        return;
      }

      final expiresAtRaw = row['expires_at']?.toString();
      if (expiresAtRaw != null) {
        final expiresAt = DateTime.tryParse(expiresAtRaw);
        if (expiresAt != null && expiresAt.toUtc().isBefore(now)) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Live location link has expired.')),
          );
          return;
        }
      }

      final token = row['share_token']?.toString();
      if (token == null || token.isEmpty) return;

      final baseUrl = SupabaseConfig.apiBaseUrl.contains('your-app.vercel.app')
          ? 'http://10.0.2.2:3000'
          : SupabaseConfig.apiBaseUrl;
      await _openUrl('$baseUrl/live/$token');
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open live location.')),
      );
    }
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

  List<Map<String, dynamic>> _activitiesForDayIndex(int index) {
    final days = _rawData['days'] as List<dynamic>? ?? [];
    if (days.isEmpty) return [];
    final clamped = index.clamp(0, days.length - 1);
    final day = days[clamped] as Map<String, dynamic>;
    final activities = day['activities'] as List<dynamic>? ?? [];
    return activities.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  DateTime? _parseActivityTimeOn(DateTime baseDate, String rawTime) {
    final t = rawTime.trim();
    if (t.isEmpty) return null;

    // HH:mm or H:mm
    final hm = RegExp(r'^(\\d{1,2}):(\\d{2})').firstMatch(t);
    if (hm != null) {
      final h = int.tryParse(hm.group(1)!) ?? 0;
      final m = int.tryParse(hm.group(2)!) ?? 0;
      return DateTime(baseDate.year, baseDate.month, baseDate.day, h, m);
    }

    final lower = t.toLowerCase();
    if (lower.contains('morning')) {
      return DateTime(baseDate.year, baseDate.month, baseDate.day, 9, 0);
    }
    if (lower.contains('afternoon')) {
      return DateTime(baseDate.year, baseDate.month, baseDate.day, 14, 0);
    }
    if (lower.contains('evening')) {
      return DateTime(baseDate.year, baseDate.month, baseDate.day, 19, 0);
    }
    return null;
  }

  ({Map<String, dynamic>? activity, DateTime? when}) _nextActivity(
    DateTime now,
    int dayIndex,
  ) {
    final start = _parseDate(_trip?['start_date']?.toString());
    final base = start == null
        ? DateTime(now.year, now.month, now.day)
        : DateTime(
            start.year,
            start.month,
            start.day,
          ).add(Duration(days: dayIndex));

    final activities = _activitiesForDayIndex(dayIndex);
    DateTime? bestWhen;
    Map<String, dynamic>? bestAct;

    for (final a in activities) {
      final time = a['time']?.toString() ?? '';
      final when = _parseActivityTimeOn(base, time) ?? base;
      if (when.isBefore(now)) continue;
      if (bestWhen == null || when.isBefore(bestWhen)) {
        bestWhen = when;
        bestAct = a;
      }
    }

    if (bestAct != null) return (activity: bestAct, when: bestWhen);

    // Fall back to the first activity of the day.
    if (activities.isNotEmpty) {
      final a = activities.first;
      final time = a['time']?.toString() ?? '';
      final when = _parseActivityTimeOn(base, time);
      return (activity: a, when: when);
    }
    return (activity: null, when: null);
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _openSupportWhatsApp() async {
    final phone = (_orgOwner?['phone_normalized'] ?? _orgOwner?['phone'])
        ?.toString()
        .trim();
    if (phone == null || phone.isEmpty) return;
    final msg = Uri.encodeComponent(
      'Hi, I need help with my trip to $_destination.',
    );
    await _openUrl('https://wa.me/$phone?text=$msg');
  }

  Future<void> _openSupportCall() async {
    final phone = (_orgOwner?['phone_normalized'] ?? _orgOwner?['phone'])
        ?.toString()
        .trim();
    if (phone == null || phone.isEmpty) return;
    await _openUrl('tel:$phone');
  }

  Color _parseHexColor(String? hex, {Color fallback = AppTheme.primary}) {
    if (hex == null) return fallback;
    final s = hex.trim().replaceAll('#', '');
    if (s.length != 6) return fallback;
    final v = int.tryParse('FF$s', radix: 16);
    if (v == null) return fallback;
    return Color(v);
  }

  Future<double?> _fetchFxRate(String from, String to) async {
    try {
      final uri = Uri.https('api.frankfurter.app', '/latest', {
        'from': from,
        'to': to,
      });
      final resp = await http.get(uri).timeout(const Duration(seconds: 6));
      if (resp.statusCode < 200 || resp.statusCode >= 300) return null;
      final decoded = jsonDecode(resp.body) as Map<String, dynamic>;
      final rates = decoded['rates'] as Map<String, dynamic>?;
      final v = rates?[to] as num?;
      return v?.toDouble();
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> _fetchWeather(LatLng at) async {
    try {
      final uri = Uri.https('api.open-meteo.com', '/v1/forecast', {
        'latitude': at.latitude.toString(),
        'longitude': at.longitude.toString(),
        'current': 'temperature_2m,weather_code',
        'timezone': 'auto',
      });
      final resp = await http.get(uri).timeout(const Duration(seconds: 6));
      if (resp.statusCode < 200 || resp.statusCode >= 300) return null;
      return jsonDecode(resp.body) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  String _inferDestCurrency(String destination) {
    final d = destination.toLowerCase();
    if (d.contains('india')) return 'INR';
    if (d.contains('japan')) return 'JPY';
    if (d.contains('indonesia') || d.contains('bali')) return 'IDR';
    if (d.contains('thailand')) return 'THB';
    if (d.contains('vietnam')) return 'VND';
    if (d.contains('singapore')) return 'SGD';
    if (d.contains('uae') || d.contains('dubai')) return 'AED';
    if (d.contains('uk') || d.contains('london')) return 'GBP';
    if (d.contains('europe') ||
        d.contains('france') ||
        d.contains('italy') ||
        d.contains('spain')) {
      return 'EUR';
    }
    return 'USD';
  }

  @override
  Widget build(BuildContext context) {
    final trip = _trip;
    if (trip == null) return const SizedBox.shrink();

    final now = DateTime.now();
    final dayIndex = _computeDayIndex(now);
    final days = _rawData['days'] as List<dynamic>? ?? [];
    final clampedDayIndex = days.isEmpty
        ? 0
        : dayIndex.clamp(0, days.length - 1);
    final dayNumber = clampedDayIndex + 1;
    final assignment = _assignmentForDay(dayNumber);
    final hotel = _accommodation ?? _extractHotel(_rawData, clampedDayIndex);

    final next = _nextActivity(now, clampedDayIndex);
    final nextAct = next.activity;
    final nextWhen = next.when;

    final orgName = (_org?['name'] ?? 'Your operator').toString();
    final orgColor = _parseHexColor(_org?['primary_color']?.toString());

    final startDate = _parseDate(trip['start_date']?.toString());
    final endDate = _parseDate(trip['end_date']?.toString());
    final dateRange = (startDate != null && endDate != null)
        ? '${DateFormat.MMMd().format(startDate)} - ${DateFormat.MMMd().format(endDate)}'
        : null;

    final activities = _activitiesForDayIndex(clampedDayIndex);
    final markers = <Marker>[];
    var hasPotentialMapData = false;

    Marker buildMarker(LatLng point) {
      return Marker(
        point: point,
        child: Container(
          decoration: BoxDecoration(
            color: orgColor,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 2),
            boxShadow: [
              BoxShadow(color: Colors.black.withAlpha(51), blurRadius: 4),
            ],
          ),
          padding: const EdgeInsets.all(7),
          child: const Icon(Icons.place, color: Colors.white, size: 14),
        ),
      );
    }

    for (final a in activities.take(8)) {
      final coords = a['coordinates'] as Map<String, dynamic>?;
      final lat = coords?['lat'] as num?;
      final lng = coords?['lng'] as num?;
      if (lat != null && lng != null) {
        hasPotentialMapData = true;
        markers.add(buildMarker(LatLng(lat.toDouble(), lng.toDouble())));
        continue;
      }
      final loc = a['location']?.toString();
      if (loc != null && loc.trim().isNotEmpty) {
        hasPotentialMapData = true;
        final cached = GeocodingService.instance.getCached(loc);
        if (cached != null) {
          markers.add(buildMarker(cached));
        } else {
          _ensureGeocoded(loc);
        }
      }
    }

    final destCurrency = _inferDestCurrency(_destination);

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
          title: orgName,
          subtitle: dateRange ?? 'Trip dashboard',
          leading: const Icon(Icons.verified_rounded, color: AppTheme.primary),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _destination,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  FilledButton.icon(
                    onPressed: () => widget.onOpenTrip(
                      trip,
                      initialDayIndex: clampedDayIndex,
                    ),
                    style: FilledButton.styleFrom(backgroundColor: orgColor),
                    icon: const Icon(Icons.today_rounded),
                    label: const Text("View Today"),
                  ),
                  OutlinedButton.icon(
                    onPressed:
                        (_orgOwner?['phone'] != null ||
                            _orgOwner?['phone_normalized'] != null)
                        ? _openSupportWhatsApp
                        : null,
                    icon: const Icon(Icons.chat_bubble_rounded),
                    label: const Text('Message Support'),
                  ),
                  OutlinedButton.icon(
                    onPressed:
                        (_orgOwner?['phone'] != null ||
                            _orgOwner?['phone_normalized'] != null)
                        ? _openSupportCall
                        : null,
                    icon: const Icon(Icons.call_rounded),
                    label: const Text('Call'),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        _SectionCard(
          title: 'Next moment',
          subtitle: nextAct == null
              ? 'No scheduled activities found'
              : (nextWhen == null
                    ? (nextAct['time']?.toString() ?? 'Upcoming')
                    : 'In ${_humanize(nextWhen.difference(now))}'),
          leading: const Icon(Icons.schedule_rounded, color: AppTheme.primary),
          child: nextAct == null
              ? const Text(
                  'Your itinerary will show up here once it is generated.',
                  style: TextStyle(color: AppTheme.textSecondary),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (nextAct['title'] ?? 'Next stop').toString(),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      (nextAct['location'] ?? '').toString(),
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                    if (assignment?.pickupLocation != null ||
                        assignment?.pickupTime != null) ...[
                      const SizedBox(height: 10),
                      _InfoPillRow(
                        items: [
                          if (assignment?.pickupTime != null)
                            _InfoPill(
                              icon: Icons.directions_car_rounded,
                              label:
                                  'Pickup ${_formatPickupTime(assignment!.pickupTime)}',
                            ),
                          if (assignment?.pickupLocation != null)
                            _InfoPill(
                              icon: Icons.place_rounded,
                              label: assignment!.pickupLocation!,
                            ),
                        ],
                      ),
                    ],
                  ],
                ),
        ),

        const SizedBox(height: 12),

        _HotelCard(
          hotel: hotel,
          startDate: startDate,
          endDate: endDate,
          onOpenMaps: (query) async {
            final encoded = Uri.encodeComponent(query);
            await _openUrl(
              'https://www.google.com/maps/search/?api=1&query=$encoded',
            );
          },
          onCopy: _copyText,
          onCall: (phone) => _openUrl('tel:$phone'),
        ),

        const SizedBox(height: 12),

        _SectionCard(
          title: 'Today at a glance',
          subtitle: 'Day $dayNumber',
          leading: const Icon(Icons.list_alt_rounded, color: AppTheme.primary),
          child: activities.isEmpty
              ? const Text(
                  'No itinerary activities found for today.',
                  style: TextStyle(color: AppTheme.textSecondary),
                )
              : Column(
                  children: activities.take(3).map((a) {
                    final t = (a['time'] ?? '').toString();
                    final title = (a['title'] ?? 'Activity').toString();
                    final loc = (a['location'] ?? '').toString();
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 54,
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            alignment: Alignment.topLeft,
                            child: Text(
                              t.isEmpty ? 'Next' : t,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                if (loc.isNotEmpty)
                                  Text(
                                    loc,
                                    style: const TextStyle(
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
        ),

        const SizedBox(height: 12),

        if (hasPotentialMapData)
          _SectionCard(
            title: 'Map',
            subtitle: 'Route preview',
            leading: const Icon(Icons.map_rounded, color: AppTheme.primary),
            child: Container(
              height: 180,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(color: Colors.black.withAlpha(18), blurRadius: 10),
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
                        initialZoom: 12.8,
                        interactionOptions: const InteractionOptions(
                          flags: InteractiveFlag.none,
                        ),
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
          ),

        const SizedBox(height: 12),

        if (_loadingAssignments)
          const SizedBox.shrink()
        else if (assignment != null)
          _SectionCard(
            title: 'Your driver',
            subtitle: 'Today',
            leading: const Icon(
              Icons.directions_car_filled,
              color: AppTheme.primary,
            ),
            child: assignment.driver == null
                ? _DriverPendingCard(
                    assignment: assignment,
                    pickupTimeLabel: _formatPickupTime(assignment.pickupTime),
                    onContactSupport: _openSupportWhatsApp,
                    onLiveLocation: () => _openLiveLocationForDay(dayNumber),
                  )
                : _DriverCard(
                    assignment: assignment,
                    pickupTimeLabel: _formatPickupTime(assignment.pickupTime),
                    onWhatsApp: () {
                      final digits = _normalizeForWhatsApp(
                        assignment.driver!.phone,
                      );
                      if (digits.isEmpty) return;
                      _openUrl('https://wa.me/$digits');
                    },
                    onLiveLocation: () => _openLiveLocationForDay(dayNumber),
                  ),
          ),

        const SizedBox(height: 12),

        _ChecklistCard(tripId: _tripId, rawData: _rawData),

        const SizedBox(height: 12),

        _DocumentsCard(
          itineraryId: _itinerary?['id']?.toString(),
          destination: _destination,
        ),

        const SizedBox(height: 12),

        _PaymentsCard(tripId: _tripId),

        const SizedBox(height: 12),

        _EssentialsCard(
          destination: _destination,
          destCurrency: destCurrency,
          markers: markers,
          fetchWeather: _fetchWeather,
          fetchFx: _fetchFxRate,
        ),

        const SizedBox(height: 12),

        _TipsCard(destination: _destination),

        const SizedBox(height: 12),

        _UpdatesCard(updates: _updates, loading: _loadingUpdates),

        const SizedBox(height: 12),

        _PostTripCard(
          tripId: _tripId,
          startDate: startDate,
          endDate: endDate,
          existingRating: _reviewRating,
          onRated: (r) async {
            final id = _tripId;
            if (id == null) return;
            await TravelerPrefs.instance.setReviewRating(id, r);
            if (!mounted) return;
            setState(() => _reviewRating = r);
          },
        ),
      ],
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

class _HotelCard extends StatelessWidget {
  final Map<String, dynamic>? hotel;
  final DateTime? startDate;
  final DateTime? endDate;
  final Future<void> Function(String query) onOpenMaps;
  final Future<void> Function(String text) onCopy;
  final Future<void> Function(String phone) onCall;

  const _HotelCard({
    required this.hotel,
    required this.startDate,
    required this.endDate,
    required this.onOpenMaps,
    required this.onCopy,
    required this.onCall,
  });

  String _pick(Map<String, dynamic> h, List<String> keys) {
    for (final k in keys) {
      final v = h[k];
      if (v == null) continue;
      final s = v.toString().trim();
      if (s.isNotEmpty) return s;
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final h = hotel;
    final name = h == null
        ? ''
        : _pick(h, const ['name', 'hotel_name', 'title', 'hotel']);
    final address = h == null
        ? ''
        : _pick(h, const ['address', 'hotel_address', 'location']);
    final phone = h == null ? '' : _pick(h, const ['phone', 'hotel_phone']);
    final confirmation = h == null
        ? ''
        : _pick(h, const [
            'confirmation',
            'confirmation_number',
            'reservation',
          ]);

    final checkIn = startDate == null
        ? ''
        : DateFormat.MMMd().format(startDate!);
    final checkOut = endDate == null ? '' : DateFormat.MMMd().format(endDate!);
    final dates = (checkIn.isNotEmpty && checkOut.isNotEmpty)
        ? '$checkIn → $checkOut'
        : (checkIn.isNotEmpty ? 'Check-in: $checkIn' : '');

    return _SectionCard(
      title: 'Hotel',
      subtitle: dates.isEmpty ? 'Stay details' : dates,
      leading: const Icon(Icons.hotel_rounded, color: AppTheme.primary),
      child:
          (name.isEmpty &&
              address.isEmpty &&
              phone.isEmpty &&
              confirmation.isEmpty)
          ? const Text(
              'Hotel details will appear here once your operator adds them.',
              style: TextStyle(color: AppTheme.textSecondary),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (name.isNotEmpty)
                  Text(
                    name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                if (address.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    address,
                    style: const TextStyle(color: AppTheme.textSecondary),
                  ),
                ],
                if (confirmation.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  _InfoPillRow(
                    items: [
                      _InfoPill(
                        icon: Icons.confirmation_number_rounded,
                        label: 'Reservation $confirmation',
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 10),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    OutlinedButton.icon(
                      onPressed: (address.isNotEmpty || name.isNotEmpty)
                          ? () =>
                                onOpenMaps(address.isNotEmpty ? address : name)
                          : null,
                      icon: const Icon(Icons.map_rounded),
                      label: const Text('Open maps'),
                    ),
                    OutlinedButton.icon(
                      onPressed: address.isNotEmpty
                          ? () => onCopy(address)
                          : null,
                      icon: const Icon(Icons.copy_rounded),
                      label: const Text('Copy address'),
                    ),
                    OutlinedButton.icon(
                      onPressed: phone.isNotEmpty ? () => onCall(phone) : null,
                      icon: const Icon(Icons.call_rounded),
                      label: const Text('Call hotel'),
                    ),
                  ],
                ),
              ],
            ),
    );
  }
}

class _DriverCard extends StatelessWidget {
  final DriverAssignment assignment;
  final String pickupTimeLabel;
  final VoidCallback onWhatsApp;
  final VoidCallback onLiveLocation;

  const _DriverCard({
    required this.assignment,
    required this.pickupTimeLabel,
    required this.onWhatsApp,
    required this.onLiveLocation,
  });

  @override
  Widget build(BuildContext context) {
    final d = assignment.driver!;
    final vehicle = [
      if (d.vehicleType != null) d.vehicleType!,
      if (d.vehiclePlate != null) d.vehiclePlate!,
    ].join(' • ');
    final pickupPills = <_InfoPill>[
      if (pickupTimeLabel.isNotEmpty)
        _InfoPill(
          icon: Icons.schedule_rounded,
          label: 'Pickup $pickupTimeLabel',
        ),
      if (assignment.pickupLocation != null &&
          assignment.pickupLocation!.trim().isNotEmpty)
        _InfoPill(
          icon: Icons.place_rounded,
          label: assignment.pickupLocation!.trim(),
        ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: AppTheme.primary.withAlpha(28),
              backgroundImage: d.photoUrl == null
                  ? null
                  : NetworkImage(d.photoUrl!),
              child: d.photoUrl != null
                  ? null
                  : const Icon(Icons.person, color: AppTheme.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    d.fullName,
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    vehicle,
                    style: const TextStyle(color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: () => launchUrl(Uri.parse('tel:${d.phone}')),
              icon: const Icon(Icons.call_rounded),
              tooltip: 'Call driver',
            ),
            IconButton(
              onPressed: onWhatsApp,
              icon: const Icon(Icons.chat_bubble_rounded),
              tooltip: 'WhatsApp',
            ),
          ],
        ),
        if (pickupPills.isNotEmpty) ...[
          const SizedBox(height: 10),
          _InfoPillRow(items: pickupPills),
        ],
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: onLiveLocation,
          icon: const Icon(Icons.navigation_rounded),
          label: const Text('View live location'),
        ),
      ],
    );
  }
}

class _DriverPendingCard extends StatelessWidget {
  final DriverAssignment assignment;
  final String pickupTimeLabel;
  final Future<void> Function() onContactSupport;
  final VoidCallback onLiveLocation;

  const _DriverPendingCard({
    required this.assignment,
    required this.pickupTimeLabel,
    required this.onContactSupport,
    required this.onLiveLocation,
  });

  @override
  Widget build(BuildContext context) {
    final pickupPills = <_InfoPill>[
      if (pickupTimeLabel.isNotEmpty)
        _InfoPill(
          icon: Icons.schedule_rounded,
          label: 'Pickup $pickupTimeLabel',
        ),
      if (assignment.pickupLocation != null &&
          assignment.pickupLocation!.trim().isNotEmpty)
        _InfoPill(
          icon: Icons.place_rounded,
          label: assignment.pickupLocation!.trim(),
        ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: AppTheme.primary.withAlpha(28),
              child: const Icon(Icons.person, color: AppTheme.primary),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Driver assigned',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Details will appear once shared by your operator.',
                    style: TextStyle(color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (pickupPills.isNotEmpty) ...[
          const SizedBox(height: 10),
          _InfoPillRow(items: pickupPills),
        ],
        const SizedBox(height: 10),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            OutlinedButton.icon(
              onPressed: () async => onContactSupport(),
              icon: const Icon(Icons.chat_bubble_rounded),
              label: const Text('Message support'),
            ),
            OutlinedButton.icon(
              onPressed: onLiveLocation,
              icon: const Icon(Icons.navigation_rounded),
              label: const Text('View live location'),
            ),
          ],
        ),
      ],
    );
  }
}

class _InfoPillRow extends StatelessWidget {
  final List<_InfoPill> items;
  const _InfoPillRow({required this.items});

  @override
  Widget build(BuildContext context) {
    return Wrap(spacing: 8, runSpacing: 8, children: items);
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
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChecklistCard extends StatefulWidget {
  final String? tripId;
  final Map<String, dynamic> rawData;

  const _ChecklistCard({required this.tripId, required this.rawData});

  @override
  State<_ChecklistCard> createState() => _ChecklistCardState();
}

class _ChecklistCardState extends State<_ChecklistCard> {
  final Map<String, bool> _done = {};
  bool _loading = false;

  List<Map<String, String>> _defaultItems() {
    final items = <Map<String, String>>[
      {'id': 'pickup', 'title': 'Confirm pickup details'},
      {'id': 'docs', 'title': 'Keep documents handy'},
      {'id': 'download', 'title': 'Download itinerary PDF'},
      {'id': 'support', 'title': 'Save support contact'},
    ];

    final raw = widget.rawData['checklist'];
    if (raw is List) {
      final dynamicItems = raw
          .whereType<Map>()
          .map(
            (e) => {
              'id': (e['id'] ?? e['title'] ?? '').toString(),
              'title': (e['title'] ?? '').toString(),
            },
          )
          .where((e) => e['id']!.isNotEmpty && e['title']!.isNotEmpty)
          .toList();
      if (dynamicItems.isNotEmpty) return dynamicItems;
    }
    return items;
  }

  @override
  void didUpdateWidget(covariant _ChecklistCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.tripId != widget.tripId) {
      _done.clear();
      _load();
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final tripId = widget.tripId;
    if (tripId == null) return;
    if (_loading) return;
    setState(() => _loading = true);
    try {
      final items = _defaultItems();
      for (final it in items) {
        final id = it['id']!;
        final v = await TravelerPrefs.instance.isChecklistDone(tripId, id);
        _done[id] = v;
      }
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _toggle(String itemId) async {
    final tripId = widget.tripId;
    if (tripId == null) return;
    final next = !(_done[itemId] ?? false);
    setState(() => _done[itemId] = next);
    await TravelerPrefs.instance.setChecklistDone(tripId, itemId, next);
  }

  @override
  Widget build(BuildContext context) {
    final items = _defaultItems();
    return _SectionCard(
      title: 'Checklist',
      subtitle: 'Operator-ready trip prep',
      leading: const Icon(Icons.check_circle_rounded, color: AppTheme.primary),
      child: _loading
          ? const LinearProgressIndicator(minHeight: 2)
          : Column(
              children: items.map((it) {
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

class _DocumentsCard extends StatelessWidget {
  final String? itineraryId;
  final String destination;

  const _DocumentsCard({required this.itineraryId, required this.destination});

  Future<void> _openWebItinerary() async {
    final id = itineraryId;
    if (id == null || id.isEmpty) return;

    // Fallback for local dev on Android emulator.
    final base = SupabaseConfig.apiBaseUrl.contains('your-app.vercel.app')
        ? 'http://10.0.2.2:3000'
        : SupabaseConfig.apiBaseUrl;
    await launchUrl(
      Uri.parse('$base/trips/$id'),
      mode: LaunchMode.externalApplication,
    );
  }

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Documents',
      subtitle: 'Wallet',
      leading: const Icon(Icons.folder_rounded, color: AppTheme.primary),
      child: Column(
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.picture_as_pdf_rounded),
            title: const Text('Itinerary (PDF download on web)'),
            subtitle: Text(destination),
            trailing: const Icon(Icons.open_in_new_rounded, size: 18),
            onTap: _openWebItinerary,
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.article_rounded),
            title: const Text('Full itinerary'),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: _openWebItinerary,
          ),
        ],
      ),
    );
  }
}

class _EssentialsCard extends StatefulWidget {
  final String destination;
  final String destCurrency;
  final List<Marker> markers;
  final Future<Map<String, dynamic>?> Function(LatLng at) fetchWeather;
  final Future<double?> Function(String from, String to) fetchFx;

  const _EssentialsCard({
    required this.destination,
    required this.destCurrency,
    required this.markers,
    required this.fetchWeather,
    required this.fetchFx,
  });

  @override
  State<_EssentialsCard> createState() => _EssentialsCardState();
}

class _EssentialsCardState extends State<_EssentialsCard> {
  Map<String, dynamic>? _weather;
  double? _fx;
  bool _loading = false;

  @override
  void didUpdateWidget(covariant _EssentialsCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.destination != widget.destination ||
        oldWidget.destCurrency != widget.destCurrency) {
      _weather = null;
      _fx = null;
      _load();
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      if (widget.markers.isNotEmpty) {
        final at = widget.markers.first.point;
        _weather = await widget.fetchWeather(at);
      }

      final home = await TravelerPrefs.instance.getHomeCurrency();
      if (home != widget.destCurrency) {
        _fx = await widget.fetchFx(home, widget.destCurrency);
      }
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  String _weatherLabel(int code) {
    // Minimal mapping (Open-Meteo codes)
    if (code == 0) return 'Clear';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 48) return 'Fog';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Showers';
    return 'Storm';
  }

  @override
  Widget build(BuildContext context) {
    final current = _weather?['current'] as Map<String, dynamic>?;
    final temp = current?['temperature_2m'] as num?;
    final code = current?['weather_code'] as num?;

    return _SectionCard(
      title: 'Essentials',
      subtitle: 'Weather and currency',
      leading: const Icon(Icons.wb_sunny_rounded, color: AppTheme.primary),
      child: _loading
          ? const LinearProgressIndicator(minHeight: 2)
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (temp != null && code != null)
                  _InfoPillRow(
                    items: [
                      _InfoPill(
                        icon: Icons.thermostat_rounded,
                        label:
                            '${temp.toStringAsFixed(0)}°C • ${_weatherLabel(code.toInt())}',
                      ),
                      _InfoPill(
                        icon: Icons.place_rounded,
                        label: widget.destination,
                      ),
                    ],
                  )
                else
                  const Text(
                    'Weather will appear once your itinerary has locations.',
                    style: TextStyle(color: AppTheme.textSecondary),
                  ),
                const SizedBox(height: 10),
                FutureBuilder<String>(
                  future: TravelerPrefs.instance.getHomeCurrency(),
                  builder: (context, snap) {
                    final home = snap.data ?? 'USD';
                    if (home == widget.destCurrency) {
                      return Text(
                        'Currency: $home',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      );
                    }
                    if (_fx == null) {
                      return Text(
                        'FX: $home → ${widget.destCurrency}',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      );
                    }
                    return Text(
                      'FX: 1 $home = ${_fx!.toStringAsFixed(2)} ${widget.destCurrency}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    );
                  },
                ),
              ],
            ),
    );
  }
}

class _UpdatesCard extends StatelessWidget {
  final List<Map<String, dynamic>> updates;
  final bool loading;

  const _UpdatesCard({required this.updates, required this.loading});

  @override
  Widget build(BuildContext context) {
    return _SectionCard(
      title: 'Updates',
      subtitle: 'Operator notifications',
      leading: const Icon(Icons.campaign_rounded, color: AppTheme.primary),
      child: loading
          ? const LinearProgressIndicator(minHeight: 2)
          : updates.isEmpty
          ? const Text(
              'No updates yet.',
              style: TextStyle(color: AppTheme.textSecondary),
            )
          : Column(
              children: updates.map((u) {
                final title = (u['title'] ?? u['notification_type'] ?? 'Update')
                    .toString();
                final body = (u['body'] ?? '').toString();
                final sentAt = u['sent_at'] ?? u['created_at'];
                final when = sentAt == null
                    ? null
                    : DateTime.tryParse(sentAt.toString());
                final time = when == null
                    ? null
                    : DateFormat.MMMd().add_jm().format(when);
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    [
                      if (time != null) time,
                      if (body.isNotEmpty) body,
                    ].join(' • '),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                );
              }).toList(),
            ),
    );
  }
}

class _PaymentsCard extends StatefulWidget {
  final String? tripId;
  const _PaymentsCard({required this.tripId});

  @override
  State<_PaymentsCard> createState() => _PaymentsCardState();
}

class _PaymentsCardState extends State<_PaymentsCard> {
  bool _loading = false;
  Map<String, dynamic>? _invoice;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant _PaymentsCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.tripId != widget.tripId) {
      _invoice = null;
      _load();
    }
  }

  Future<void> _load() async {
    final tripId = widget.tripId;
    if (tripId == null || tripId.isEmpty) return;
    if (_loading) return;
    setState(() => _loading = true);
    try {
      final rows = await Supabase.instance.client
          .from('invoices')
          .select(
            'invoice_number,currency,total_amount,paid_amount,balance_amount,status,due_date,issued_at,paid_at',
          )
          .eq('trip_id', tripId)
          .order('created_at', ascending: false)
          .limit(1);
      final list = List<Map<String, dynamic>>.from(rows as List);
      if (!mounted) return;
      setState(() => _invoice = list.isEmpty ? null : list.first);
    } catch (_) {
      // Travelers may not have RLS access. Show a safe fallback.
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final inv = _invoice;
    return _SectionCard(
      title: 'Payments',
      subtitle: 'Status',
      leading: const Icon(Icons.payments_rounded, color: AppTheme.primary),
      child: _loading
          ? const LinearProgressIndicator(minHeight: 2)
          : inv == null
          ? const Text(
              'Payment status is managed by your operator. Contact support if you need an invoice or receipt.',
              style: TextStyle(color: AppTheme.textSecondary),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Invoice ${inv['invoice_number']}',
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                _InfoPillRow(
                  items: [
                    _InfoPill(
                      icon: Icons.receipt_long_rounded,
                      label: '${inv['status']}',
                    ),
                    _InfoPill(
                      icon: Icons.attach_money_rounded,
                      label: '${inv['currency']} ${inv['balance_amount']} due',
                    ),
                  ],
                ),
              ],
            ),
    );
  }
}

class _TipsCard extends StatelessWidget {
  final String destination;
  const _TipsCard({required this.destination});

  List<String> _tips(String dest) {
    final d = dest.toLowerCase();
    if (d.contains('india') || d.contains('delhi')) {
      return const [
        'Carry small cash for tips and local purchases.',
        'Plan extra buffer time for traffic around peak hours.',
        'Keep a photo of your passport/ID saved offline.',
      ];
    }
    if (d.contains('japan')) {
      return const [
        'Have an IC card (Suica/PASMO) ready for transit.',
        'Many places are cash-friendly; keep some yen.',
        'Quiet etiquette on public transport helps.',
      ];
    }
    return const [
      'Keep documents and hotel address handy.',
      'Save support contact and meeting points.',
      'Download itinerary for offline access.',
    ];
  }

  @override
  Widget build(BuildContext context) {
    final tips = _tips(destination);
    return _SectionCard(
      title: 'Local tips',
      subtitle: 'Concierge',
      leading: const Icon(Icons.lightbulb_rounded, color: AppTheme.primary),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: tips
            .take(3)
            .map(
              (t) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 2),
                      child: Icon(
                        Icons.check_rounded,
                        size: 16,
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        t,
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _PostTripCard extends StatelessWidget {
  final String? tripId;
  final DateTime? startDate;
  final DateTime? endDate;
  final int? existingRating;
  final ValueChanged<int> onRated;

  const _PostTripCard({
    required this.tripId,
    required this.startDate,
    required this.endDate,
    required this.existingRating,
    required this.onRated,
  });

  bool get _isEnded {
    final end = endDate;
    if (end == null) return false;
    final today = DateTime.now();
    return DateTime(
      end.year,
      end.month,
      end.day,
    ).isBefore(DateTime(today.year, today.month, today.day));
  }

  @override
  Widget build(BuildContext context) {
    final id = tripId;
    if (!_isEnded || id == null) return const SizedBox.shrink();

    return _SectionCard(
      title: 'How was your trip?',
      subtitle: existingRating == null
          ? 'Leave a quick rating'
          : 'Thanks for your feedback',
      leading: const Icon(Icons.star_rounded, color: AppTheme.primary),
      child: existingRating != null
          ? Text(
              'Rating: $existingRating/5',
              style: const TextStyle(fontWeight: FontWeight.w800),
            )
          : Row(
              children: List.generate(5, (i) {
                final r = i + 1;
                return IconButton(
                  onPressed: () => onRated(r),
                  icon: const Icon(Icons.star_border_rounded),
                  tooltip: '$r',
                );
              }),
            ),
    );
  }
}

String _humanize(Duration d) {
  final s = d.inSeconds;
  if (s <= 0) return 'now';
  final m = d.inMinutes;
  if (m < 60) return '${m}m';
  final h = d.inHours;
  if (h < 48) return '${h}h';
  final days = d.inDays;
  return '${days}d';
}
