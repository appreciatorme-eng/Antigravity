import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/ui/glass/glass.dart';

/// Bookings screen for trip history and travel documents
/// Replaces the "Messages" navigation with more valuable traveler features
class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
              child: Row(
                children: [
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Bookings',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Your trips and travel documents',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withAlpha(26),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.luggage,
                      color: AppTheme.primary,
                      size: 24,
                    ),
                  ),
                ],
              ),
            ),

            // Tabs
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              decoration: BoxDecoration(
                color: AppTheme.glassSurface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppTheme.glassBorder),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(999),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: Colors.white,
                unselectedLabelColor: AppTheme.textSecondary,
                labelStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                tabs: const [
                  Tab(text: 'Upcoming'),
                  Tab(text: 'Past'),
                  Tab(text: 'Documents'),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Tab Views
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: const [
                  _UpcomingTripsView(),
                  _PastTripsView(),
                  _DocumentsView(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UpcomingTripsView extends StatelessWidget {
  const _UpcomingTripsView();

  @override
  Widget build(BuildContext context) {
    // Mock upcoming trips
    final trips = [
      Trip(
        id: '1',
        destination: 'Paris, France',
        dates: 'Mar 15 - Mar 22, 2026',
        status: 'Confirmed',
        imageUrl: '',
        daysUntil: 29,
      ),
      Trip(
        id: '2',
        destination: 'Tokyo, Japan',
        dates: 'Apr 10 - Apr 20, 2026',
        status: 'Payment Pending',
        imageUrl: '',
        daysUntil: 55,
      ),
    ];

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: trips.length,
      itemBuilder: (context, index) {
        final trip = trips[index];
        return _TripCard(trip: trip);
      },
    );
  }
}

class _PastTripsView extends StatelessWidget {
  const _PastTripsView();

  @override
  Widget build(BuildContext context) {
    // Mock past trips
    final trips = [
      Trip(
        id: '3',
        destination: 'Rome, Italy',
        dates: 'Jan 5 - Jan 12, 2026',
        status: 'Completed',
        imageUrl: '',
        daysUntil: -33,
      ),
      Trip(
        id: '4',
        destination: 'Barcelona, Spain',
        dates: 'Dec 1 - Dec 8, 2025',
        status: 'Completed',
        imageUrl: '',
        daysUntil: -68,
      ),
    ];

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: trips.length,
      itemBuilder: (context, index) {
        final trip = trips[index];
        return _TripCard(trip: trip, isPast: true);
      },
    );
  }
}

class _DocumentsView extends StatelessWidget {
  const _DocumentsView();

  @override
  Widget build(BuildContext context) {
    // Mock documents
    final documents = [
      TravelDocument(
        id: '1',
        name: 'Flight Ticket - AI 416',
        type: 'Flight',
        tripName: 'Paris, France',
        date: 'Mar 15, 2026',
        icon: Icons.flight,
      ),
      TravelDocument(
        id: '2',
        name: 'Hotel Confirmation',
        type: 'Accommodation',
        tripName: 'Paris, France',
        date: 'Mar 15, 2026',
        icon: Icons.hotel,
      ),
      TravelDocument(
        id: '3',
        name: 'Travel Insurance',
        type: 'Insurance',
        tripName: 'Paris, France',
        date: 'Mar 15, 2026',
        icon: Icons.security,
      ),
      TravelDocument(
        id: '4',
        name: 'Visa Document',
        type: 'Visa',
        tripName: 'Tokyo, Japan',
        date: 'Apr 10, 2026',
        icon: Icons.description,
      ),
    ];

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: documents.length,
      itemBuilder: (context, index) {
        final doc = documents[index];
        return _DocumentCard(document: doc);
      },
    );
  }
}

class _TripCard extends StatelessWidget {
  final Trip trip;
  final bool isPast;

  const _TripCard({
    required this.trip,
    this.isPast = false,
  });

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Placeholder image
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withAlpha(26),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.location_city,
                    color: AppTheme.primary,
                    size: 30,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        trip.destination,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        trip.dates,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                _StatusBadge(status: trip.status),
              ],
            ),
            if (!isPast && trip.daysUntil > 0) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.secondary.withAlpha(26),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.schedule,
                      color: AppTheme.secondary,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${trip.daysUntil} days until departure',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (isPast) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Review feature coming soon!'),
                          ),
                        );
                      },
                      icon: const Icon(Icons.star_border, size: 16),
                      label: const Text('Leave Review'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.primary,
                        side: const BorderSide(color: AppTheme.primary),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Rebook feature coming soon!'),
                          ),
                        );
                      },
                      icon: const Icon(Icons.refresh, size: 16),
                      label: const Text('Book Again'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.secondary,
                        side: const BorderSide(color: AppTheme.secondary),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DocumentCard extends StatelessWidget {
  final TravelDocument document;

  const _DocumentCard({required this.document});

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.primary.withAlpha(26),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            document.icon,
            color: AppTheme.primary,
            size: 24,
          ),
        ),
        title: Text(
          document.name,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              document.tripName,
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.textSecondary,
              ),
            ),
            Text(
              document.date,
              style: const TextStyle(
                fontSize: 11,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.download_rounded),
              color: AppTheme.primary,
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Download feature coming soon!'),
                  ),
                );
              },
            ),
            IconButton(
              icon: const Icon(Icons.share),
              color: AppTheme.textSecondary,
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Share feature coming soon!'),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData? icon;

    switch (status.toLowerCase()) {
      case 'confirmed':
        color = AppTheme.secondary;
        icon = Icons.check_circle;
        break;
      case 'payment pending':
        color = Colors.orange;
        icon = Icons.pending;
        break;
      case 'completed':
        color = AppTheme.textSecondary;
        icon = Icons.done_all;
        break;
      default:
        color = AppTheme.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withAlpha(26),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            status,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

/// Trip model
class Trip {
  final String id;
  final String destination;
  final String dates;
  final String status;
  final String imageUrl;
  final int daysUntil;

  Trip({
    required this.id,
    required this.destination,
    required this.dates,
    required this.status,
    required this.imageUrl,
    required this.daysUntil,
  });
}

/// Travel document model
class TravelDocument {
  final String id;
  final String name;
  final String type;
  final String tripName;
  final String date;
  final IconData icon;

  TravelDocument({
    required this.id,
    required this.name,
    required this.type,
    required this.tripName,
    required this.date,
    required this.icon,
  });
}
