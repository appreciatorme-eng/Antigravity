import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/ui/glass/glass.dart';
import 'inbox_screen.dart';
import 'profile_screen.dart';

class ItineraryTimelineScreen extends StatefulWidget {
  final Map<String, dynamic> trip;
  final int initialDayIndex;

  const ItineraryTimelineScreen({
    super.key,
    required this.trip,
    this.initialDayIndex = 0,
  });

  @override
  State<ItineraryTimelineScreen> createState() =>
      _ItineraryTimelineScreenState();
}

class _ItineraryTimelineScreenState extends State<ItineraryTimelineScreen> {
  late int _selectedDayIndex;

  @override
  void initState() {
    super.initState();
    _selectedDayIndex = widget.initialDayIndex;
  }

  Map<String, dynamic> get _rawData {
    final itinerary = widget.trip['itineraries'] as Map<String, dynamic>?;
    final itineraryRaw = itinerary?['raw_data'] as Map<String, dynamic>?;
    final directRaw = widget.trip['raw_data'] as Map<String, dynamic>?;
    return itineraryRaw ?? directRaw ?? const <String, dynamic>{};
  }

  List<dynamic> get _days => _rawData['days'] as List<dynamic>? ?? const [];

  DateTime? _parseDate(Object? v) {
    if (v == null) return null;
    final s = v.toString().trim();
    if (s.isEmpty) return null;
    return DateTime.tryParse(s);
  }

  DateTime _dayDate(int dayIndex) {
    final startDate = _parseDate(widget.trip['start_date']);
    final base = startDate ?? DateTime.now();
    final start = DateTime(base.year, base.month, base.day);
    return start.add(Duration(days: dayIndex));
  }

  void _goHome() => Navigator.of(context).popUntil((r) => r.isFirst);

  void _handleNav(int index) {
    switch (index) {
      case 0:
        _goHome();
        return;
      case 1:
        return;
      case 2:
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const InboxScreen()),
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

  @override
  Widget build(BuildContext context) {
    final safeDayIndex = _days.isEmpty
        ? 0
        : _selectedDayIndex.clamp(0, (_days.length - 1).clamp(0, 9999));
    final day = _days.isEmpty
        ? const <String, dynamic>{}
        : (_days[safeDayIndex] as Map<String, dynamic>? ?? const {});
    final activities = day['activities'] as List<dynamic>? ?? const [];

    Widget dayTabs() {
      if (_days.isEmpty) return const SizedBox.shrink();
      return SizedBox(
        height: 72,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.only(left: 24, right: 24, bottom: 6),
          itemCount: _days.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (context, i) {
            final selected = i == safeDayIndex;
            final dt = _dayDate(i);
            return InkWell(
              onTap: () => setState(() => _selectedDayIndex = i),
              borderRadius: BorderRadius.circular(20),
              child: Container(
                width: 86,
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: selected ? Colors.white : Colors.white.withAlpha(90),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withAlpha(selected ? 180 : 120),
                  ),
                  boxShadow: selected
                      ? [
                          BoxShadow(
                            color: Colors.black.withAlpha(10),
                            blurRadius: 10,
                            offset: const Offset(0, 6),
                          ),
                        ]
                      : null,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'DAY ${i + 1}',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.2,
                        color: selected
                            ? AppTheme.primary
                            : AppTheme.secondary.withAlpha(120),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      DateFormat.MMMd().format(dt),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: selected
                            ? AppTheme.secondary
                            : AppTheme.secondary.withAlpha(120),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      );
    }

    Widget timelineItem(Map<String, dynamic> activity, {required bool dimmed}) {
      final time = (activity['time'] ?? activity['start_time'] ?? '')
          .toString();
      final title = (activity['title'] ?? activity['name'] ?? 'Activity')
          .toString();
      final desc = (activity['description'] ?? activity['notes'] ?? '')
          .toString()
          .trim();
      final tags =
          (activity['tags'] as List?)?.whereType<String>().toList() ??
          const <String>[];

      final lower = title.toLowerCase();
      final isTransfer = lower.contains('transfer') || lower.contains('pickup');
      final isFood = lower.contains('lunch') || lower.contains('dinner');
      final isCheckin = lower.contains('check') && lower.contains('in');
      final isTour = lower.contains('tour') || lower.contains('fort');

      final icon = isTransfer
          ? Icons.local_taxi_rounded
          : isFood
          ? Icons.restaurant_rounded
          : isCheckin
          ? Icons.hotel_rounded
          : isTour
          ? Icons.castle_rounded
          : Icons.event_rounded;

      final imageUrl = (activity['image_url'] ?? activity['imageUrl'] ?? '')
          .toString()
          .trim();

      Widget cardChild() {
        if (imageUrl.isNotEmpty) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
                child: Stack(
                  children: [
                    Image.network(
                      imageUrl,
                      height: 130,
                      width: double.infinity,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        height: 130,
                        color: Colors.black.withAlpha(10),
                        alignment: Alignment.center,
                        child: Icon(
                          icon,
                          color: AppTheme.secondary.withAlpha(120),
                        ),
                      ),
                    ),
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [
                              Colors.black.withAlpha(130),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      left: 14,
                      bottom: 10,
                      child: Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (desc.isNotEmpty) ...[
                      Text(
                        desc,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.secondary.withAlpha(200),
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                    if (tags.isNotEmpty)
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: tags.take(3).map((t) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.secondary.withAlpha(10),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: AppTheme.secondary.withAlpha(20),
                              ),
                            ),
                            child: Text(
                              t,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.secondary,
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                  ],
                ),
              ),
            ],
          );
        }

        final showConfirmed = isTransfer;
        return Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.secondary.withAlpha(dimmed ? 150 : 255),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withAlpha(18),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Icon(icon, size: 18, color: AppTheme.primary),
                  ),
                ],
              ),
              if (desc.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  desc,
                  style: TextStyle(
                    fontSize: 13,
                    height: 1.4,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.secondary.withAlpha(dimmed ? 130 : 210),
                  ),
                ),
              ],
              if (showConfirmed) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(
                      Icons.check_circle_rounded,
                      size: 16,
                      color: AppTheme.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Driver Confirmed',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primary.withAlpha(dimmed ? 140 : 255),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        );
      }

      final baseCard = GlassCard(
        padding: EdgeInsets.zero,
        borderRadius: BorderRadius.circular(16),
        color: Colors.white.withAlpha(190),
        child: cardChild(),
      );

      final card = isFood
          ? Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border(
                  left: BorderSide(color: AppTheme.primary, width: 4),
                ),
              ),
              child: baseCard,
            )
          : baseCard;

      return Opacity(
        opacity: dimmed ? 0.6 : 1,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(width: 6),
            SizedBox(
              width: 56,
              child: Column(
                children: [
                  const SizedBox(height: 10),
                  Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: dimmed ? Colors.white : AppTheme.primary,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: dimmed
                            ? AppTheme.secondary.withAlpha(60)
                            : Colors.white,
                        width: dimmed ? 2 : 0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(10),
                          blurRadius: 10,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        time.isEmpty ? '--:--' : time,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.secondary,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        (time.toLowerCase().contains('am') ||
                                time.toLowerCase().contains('pm'))
                            ? ''
                            : '',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                          color: AppTheme.secondary.withAlpha(120),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  card,
                ],
              ),
            ),
          ],
        ),
      );
    }

    final sample = [
      {
        'time': '09:00',
        'title': 'Private Transfer',
        'description':
            'Pickup from DEL Terminal 3. Your chauffeur Raj is waiting at Gate 4.',
      },
      {
        'time': '11:30',
        'title': 'Red Fort Tour',
        'description':
            'Guided historical tour with Mr. Sharma. Walking shoes recommended.',
        'image_url':
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCsh15ioGjaQs3DUxYzjQq-YCkQs-EMD3inEWEdNN4OUcLOh62FW_HxTIFgsF2zSSIkZv6xzi_sUS58dkZ4p2dutceJnwS60VGZJmmFRQPK2UxOQr6tFfPjiT6edniCyJCVGX9fdsdKvw2RFiNGQZytmPUo_s87jLhmdZehJZuKZ389vMMDhQ6snGAOBBMNiE30q25HaK1rt2ziR3xKEr4tb9yOQwkxWjBQl3uk82HxFbdRll-eoPXmaILOnTxSz8F8UZ_liR9WZbEs',
        'tags': ['Historical', 'Guided'],
      },
      {
        'time': '13:30',
        'title': 'Lunch at Bukhara',
        'description': 'The ITC Maurya. Party of 2. Confirmed.',
      },
      {
        'time': '16:00',
        'title': 'Check-in',
        'description': 'The Imperial Hotel',
      },
    ];

    final items = activities.isEmpty
        ? sample
        : activities
              .whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: DecoratedBox(
        decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: SafeArea(
          child: Stack(
            children: [
              Positioned(
                left: 38,
                top: 110,
                bottom: 0,
                child: CustomPaint(painter: _DottedRailPainter()),
              ),
              Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(0),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                      child: Container(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
                        decoration: BoxDecoration(
                          color: AppTheme.glassNavSurface,
                          border: Border(
                            bottom: BorderSide(
                              color: Colors.white.withAlpha(120),
                            ),
                          ),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                IconButton(
                                  onPressed: () => Navigator.pop(context),
                                  icon: Icon(
                                    Icons.arrow_back_rounded,
                                    color: AppTheme.secondary.withAlpha(220),
                                  ),
                                ),
                                Expanded(
                                  child: Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      'Itinerary',
                                      style: Theme.of(context)
                                          .textTheme
                                          .headlineLarge
                                          ?.copyWith(
                                            fontFamilyFallback: const ['serif'],
                                            fontSize: 28,
                                            fontStyle: FontStyle.italic,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.secondary,
                                          ),
                                    ),
                                  ),
                                ),
                                GlassIconButton(
                                  onPressed: () {},
                                  icon: Icon(
                                    Icons.more_horiz_rounded,
                                    color: AppTheme.secondary.withAlpha(200),
                                  ),
                                  size: 40,
                                  background: Colors.white.withAlpha(120),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            dayTabs(),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(24, 18, 24, 170),
                      itemCount: items.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 26),
                      itemBuilder: (context, i) {
                        final activity = items[i];
                        final dimmed =
                            i == items.length - 1 && items.length > 3;
                        return timelineItem(activity, dimmed: dimmed);
                      },
                    ),
                  ),
                ],
              ),
              Positioned(
                right: 18,
                bottom: 86,
                child: ElevatedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text("Marked: I've Landed")),
                    );
                  },
                  icon: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: Colors.white.withAlpha(40),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: const Icon(
                      Icons.flight_land_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                  label: const Text("I've Landed"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    elevation: 10,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 14,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                    textStyle: const TextStyle(
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: GlassFloatingNavBar(
        activeIndex: 1,
        onTap: _handleNav,
      ),
    );
  }
}

class _DottedRailPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.secondary.withAlpha(50)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    const dash = 6.0;
    const gap = 6.0;
    var y = 0.0;
    while (y < size.height) {
      canvas.drawLine(Offset(0, y), Offset(0, y + dash), paint);
      y += dash + gap;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
