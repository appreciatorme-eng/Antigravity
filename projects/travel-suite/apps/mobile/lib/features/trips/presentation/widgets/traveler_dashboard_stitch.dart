import 'dart:ui';

import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/ui/glass/glass.dart';

class TravelerDashboardStitch extends StatelessWidget {
  final List<Map<String, dynamic>> trips;
  final int activeTripIndex;
  final ValueChanged<int> onSelectTrip;
  final void Function(Map<String, dynamic> trip, {int initialDayIndex})
  onOpenTrip;
  final Future<void> Function()? onRefresh;

  const TravelerDashboardStitch({
    super.key,
    required this.trips,
    required this.activeTripIndex,
    required this.onSelectTrip,
    required this.onOpenTrip,
    this.onRefresh,
  });

  Map<String, dynamic>? _activeTrip() {
    if (trips.isEmpty) return null;
    final i = activeTripIndex.clamp(0, (trips.length - 1).clamp(0, 9999));
    return trips[i];
  }

  DateTime? _parseDate(Object? v) {
    if (v == null) return null;
    if (v is DateTime) return DateTime(v.year, v.month, v.day);
    final s = v.toString();
    final dt = DateTime.tryParse(s);
    if (dt == null) return null;
    return DateTime(dt.year, dt.month, dt.day);
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

  int _dayIndexForTrip(Map<String, dynamic> trip, DateTime now) {
    final start = _parseDate(trip['start_date']);
    if (start == null) return 0;
    final today = DateTime(now.year, now.month, now.day);
    return today.difference(start).inDays.clamp(0, 9999);
  }

  ({Map<String, dynamic>? activity, DateTime? when}) _nextActivityForTrip(
    Map<String, dynamic> trip,
    DateTime now,
  ) {
    final raw = _rawDataForTrip(trip);
    final days = raw['days'] as List<dynamic>? ?? const [];
    if (days.isEmpty) return (activity: null, when: null);

    final dayIndex = _dayIndexForTrip(trip, now).clamp(0, days.length - 1);
    final day = days[dayIndex] as Map<String, dynamic>? ?? const {};
    final activities = day['activities'] as List<dynamic>? ?? const [];
    if (activities.isEmpty) return (activity: null, when: null);

    final base = DateTime(now.year, now.month, now.day);
    DateTime? bestWhen;
    Map<String, dynamic>? bestAct;

    for (final a0 in activities) {
      final a = a0 as Map<String, dynamic>? ?? const {};
      final time = (a['time'] ?? '').toString();
      final when = _parseActivityTimeOn(base, time);
      if (when == null) continue;
      if (when.isBefore(now)) continue;
      if (bestWhen == null || when.isBefore(bestWhen)) {
        bestWhen = when;
        bestAct = a;
      }
    }

    if (bestAct != null) return (activity: bestAct, when: bestWhen);

    final first = activities.first as Map<String, dynamic>? ?? const {};
    return (activity: first, when: null);
  }

  DateTime? _parseActivityTimeOn(DateTime baseDate, String label) {
    final s = label.trim().toLowerCase();
    final re = RegExp(r'(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?');
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

  String _twoDigit(int v) => v.toString().padLeft(2, '0');

  String _formatHm(DateTime dt) =>
      '${_twoDigit(dt.hour)}:${_twoDigit(dt.minute)}';

  @override
  Widget build(BuildContext context) {
    final trip = _activeTrip();
    if (trip == null) return const SizedBox.shrink();

    final now = DateTime.now();
    final destination = _destinationForTrip(trip);
    final start = _parseDate(trip['start_date']);
    final end = _parseDate(trip['end_date']);

    final locationLabel = destination.split(',').first.trim().isEmpty
        ? destination
        : destination.split(',').first.trim();

    final dateLabel = (start != null && end != null)
        ? '${start.month}/${start.day}-${end.month}/${end.day}'
        : '';

    final next = _nextActivityForTrip(trip, now);
    final nextTime = next.when == null ? '14:00' : _formatHm(next.when!);
    final nextTitle =
        (next.activity?['title'] ?? next.activity?['name'] ?? 'Check-in')
            .toString()
            .trim()
            .isEmpty
        ? 'Check-in'
        : (next.activity?['title'] ?? next.activity?['name']).toString().trim();
    final nextLocation =
        (next.activity?['location'] ??
                next.activity?['address'] ??
                'Janpath Ln, New Delhi')
            .toString()
            .trim();

    final dayIndex = _dayIndexForTrip(trip, now);
    final currentLabel = 'Current: Day ${dayIndex + 1} - Arrival';

    void openItinerary() => onOpenTrip(trip, initialDayIndex: dayIndex);

    Widget toolCard({
      required IconData icon,
      required String label,
      String? sublabel,
      VoidCallback? onTap,
    }) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: GlassCard(
          padding: const EdgeInsets.all(16),
          borderRadius: BorderRadius.circular(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.secondary.withAlpha(10),
                  borderRadius: BorderRadius.circular(18),
                ),
                alignment: Alignment.center,
                child: Icon(icon, color: AppTheme.secondary, size: 26),
              ),
              const SizedBox(height: 12),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              if (sublabel != null) ...[
                const SizedBox(height: 2),
                Text(
                  sublabel,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      );
    }

    final body = CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: Colors.transparent,
          elevation: 0,
          toolbarHeight: 96,
          automaticallyImplyLeading: false,
          flexibleSpace: ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                padding: const EdgeInsets.fromLTRB(24, 18, 24, 16),
                decoration: BoxDecoration(
                  color: AppTheme.glassNavSurface,
                  border: Border(
                    bottom: BorderSide(color: Colors.white.withAlpha(120)),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            [dateLabel, locationLabel]
                                .where((s) => s.trim().isNotEmpty)
                                .join(' • ')
                                .toUpperCase(),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.2,
                              color: AppTheme.primary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        GlassIconButton(
                          onPressed: () {},
                          icon: const Icon(
                            Icons.notifications_none_rounded,
                            size: 20,
                            color: AppTheme.secondary,
                          ),
                          size: 34,
                          background: AppTheme.secondary.withAlpha(18),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'My Journeys',
                      style: Theme.of(context).textTheme.displayMedium
                          ?.copyWith(
                            fontSize: 32,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.secondary,
                          ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 120),
          sliver: SliverList(
            delegate: SliverChildListDelegate.fixed([
              Align(
                alignment: Alignment.centerLeft,
                child: GlassPill(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const _PulsingDot(),
                      const SizedBox(width: 8),
                      Text(
                        currentLabel,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              GlassCard(
                padding: const EdgeInsets.all(18),
                borderRadius: BorderRadius.circular(24),
                child: Row(
                  children: [
                    Stack(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: Colors.white,
                          child: CircleAvatar(
                            radius: 26,
                            backgroundImage: const NetworkImage(
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuAaOZ7n2uK4-xV_G6Gju_m6svqOffMzskePjV7YyOxaA7QukX7Xgvf8mBnOuHy8B6qbIOhpt37NwGylj9VNeD5fAOi2vjAiGMrhjhZYMO_ZNUllSBmBuuNFPbMZf6LPZNVbiMjWs1abmQ7tP1ZVlXQw185j89c_eG0blF56kv1EQkT8mfOR5AP7niXK1PkRyyju0oAfeNi6YD0QwTm215NYe94twi_3GQ6jsj-2D-XBIwGSoPJOqHCHMEJWN8UZ9T9xIzVIXknCPnyY',
                            ),
                          ),
                        ),
                        Positioned(
                          right: 2,
                          bottom: 2,
                          child: Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: AppTheme.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            (trip['driver_name'] ?? 'Raj Singh').toString(),
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(
                                  fontFamilyFallback: const ['serif'],
                                  fontSize: 20,
                                  fontWeight: FontWeight.w700,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(
                                Icons.directions_car_filled_rounded,
                                size: 14,
                                color: AppTheme.textSecondary,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  (trip['vehicle_label'] ??
                                          'Toyota Innova • DL 1C 5592')
                                      .toString(),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.textSecondary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Row(
                      children: [
                        GlassIconButton(
                          onPressed: () {},
                          icon: const Icon(
                            Icons.call_rounded,
                            size: 20,
                            color: AppTheme.primary,
                          ),
                        ),
                        const SizedBox(width: 10),
                        GlassIconButton(
                          onPressed: () {},
                          icon: Icon(
                            Icons.chat_bubble_rounded,
                            size: 20,
                            color: AppTheme.secondary.withAlpha(210),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              GlassCard(
                padding: const EdgeInsets.all(20),
                borderRadius: BorderRadius.circular(32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'UP NEXT',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.4,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        const Spacer(),
                        Icon(
                          Icons.more_horiz_rounded,
                          color: AppTheme.secondary.withAlpha(90),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      nextTime,
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        fontSize: 40,
                        height: 1.0,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      nextTitle,
                      style: Theme.of(context).textTheme.headlineLarge
                          ?.copyWith(
                            fontFamilyFallback: const ['serif'],
                            fontStyle: FontStyle.italic,
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.secondary,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_rounded,
                          color: AppTheme.textSecondary,
                          size: 18,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            nextLocation,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      height: 1,
                      color: AppTheme.secondary.withAlpha(20),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        SizedBox(
                          height: 30,
                          child: Stack(
                            children: const [
                              Positioned(
                                left: 0,
                                child: CircleAvatar(
                                  radius: 14,
                                  backgroundColor: Colors.white,
                                  child: CircleAvatar(
                                    radius: 12,
                                    backgroundImage: NetworkImage(
                                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCR4DmYqqo85kqBISO17JAV_fCDhx8ORlTzhote91RcJdpLAQpp4IjorZZOWAFCWt71ls2caglze8mQk1JNAaNznzqBadewjQhf_wIRRb9I5G4HeSY7q4VLvES5kTRljDok20H0W9ioH1uSQ1QxAICxFDCTJ8aCm8Mpnsj_9b2oi2MOBY0jMhEy--hPlOmjXQWdWLdM7ZNoJTlRkC8TX1B0hYiS1xVDou3hlgSvrKtODBtJx4fcdxAdMbTW9_UkktV8SeYGL-XHY9U3',
                                    ),
                                  ),
                                ),
                              ),
                              Positioned(
                                left: 18,
                                child: CircleAvatar(
                                  radius: 14,
                                  backgroundColor: Colors.white,
                                  child: CircleAvatar(
                                    radius: 12,
                                    backgroundImage: NetworkImage(
                                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBH2cihiKs6FRgvEwqD3AZ3YuBbJkufe9lNoSEnpv93TVqJMEZ2Vf4D4Is2-nSlP0CFSzzc2liVj7nwWJOZQMmQSGYM6DHgKDvvhFVqdtarr1Hnb9SAO3cp6NgSKnzreMvqXwVysHa0SSw5KzRvXnEZz3_U3IljWcj1WvsL543nKe4cJqaGGnOmRS0wULWxLlE7JDXuKb2NJUUYoVTxX0ntEaYiKBKu42bGAkWIiLHoqKlso-qMQRHvskSsWwSCWFgZbWNl8aUq9Ivs',
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Spacer(),
                        TextButton.icon(
                          onPressed: () {},
                          icon: const Text('Get Directions'),
                          label: const Icon(
                            Icons.arrow_forward_rounded,
                            size: 16,
                          ),
                          style: TextButton.styleFrom(
                            foregroundColor: AppTheme.secondary,
                            textStyle: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                            padding: EdgeInsets.zero,
                            visualDensity: VisualDensity.compact,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              GridView.count(
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                crossAxisCount: 2,
                crossAxisSpacing: 14,
                mainAxisSpacing: 14,
                childAspectRatio: 1,
                children: [
                  toolCard(
                    icon: Icons.description_rounded,
                    label: 'Itinerary',
                    onTap: openItinerary,
                  ),
                  toolCard(
                    icon: Icons.credit_card_rounded,
                    label: 'Expenses',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Expenses coming soon')),
                      );
                    },
                  ),
                  toolCard(
                    icon: Icons.partly_cloudy_day_rounded,
                    label: '28°C $locationLabel',
                    sublabel: 'Clear Sky',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Weather coming soon')),
                      );
                    },
                  ),
                  toolCard(
                    icon: Icons.support_agent_rounded,
                    label: 'Concierge',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Concierge coming soon')),
                      );
                    },
                  ),
                ],
              ),
            ]),
          ),
        ),
      ],
    );

    return RefreshIndicator(onRefresh: onRefresh ?? () async {}, child: body);
  }
}

class _PulsingDot extends StatefulWidget {
  const _PulsingDot();

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _scale = Tween(
      begin: 0.75,
      end: 1.15,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scale,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppTheme.primary,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withAlpha(70),
              blurRadius: 10,
              spreadRadius: 1,
            ),
          ],
        ),
        child: const SizedBox(width: 8, height: 8),
      ),
    );
  }
}
