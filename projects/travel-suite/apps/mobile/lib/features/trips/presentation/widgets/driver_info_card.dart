import 'package:flutter/material.dart';
import 'package:gobuddy_mobile/core/ui/app_icon.dart';
import 'package:gobuddy_mobile/core/ui/glass/glass.dart';
import 'package:gobuddy_mobile/core/theme/app_theme.dart';
import 'package:gobuddy_mobile/features/trips/domain/models/driver.dart';
import 'package:heroicons/heroicons.dart';
import 'package:url_launcher/url_launcher.dart';

class DriverInfoCard extends StatelessWidget {
  final DriverAssignment assignment;

  const DriverInfoCard({super.key, required this.assignment});

  @override
  Widget build(BuildContext context) {
    final driver = assignment.driver;
    if (driver == null) return const SizedBox.shrink();

    return GlassCard(
      padding: const EdgeInsets.all(16),
      borderRadius: BorderRadius.circular(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.secondary.withAlpha(18),
                  border: Border.all(color: Colors.white, width: 2),
                  image: driver.photoUrl == null
                      ? null
                      : DecorationImage(
                          image: NetworkImage(driver.photoUrl!),
                          fit: BoxFit.cover,
                        ),
                ),
                alignment: Alignment.center,
                child: driver.photoUrl != null
                    ? null
                    : const AppIcon(
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
                      'Your driver',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.6,
                      ),
                    ),
                    Text(
                      driver.fullName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              GlassIconButton(
                onPressed: driver.phone.trim().isEmpty
                    ? null
                    : () => launchUrl(Uri.parse('tel:${driver.phone}')),
                size: 38,
                background: AppTheme.primary.withAlpha(18),
                icon: const AppIcon(
                  HeroIcons.phone,
                  size: 18,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildInfoItem(
                  context,
                  HeroIcons.truck,
                  (driver.vehicleType ?? 'Vehicle').toUpperCase(),
                  driver.vehiclePlate ?? 'On arrival',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildInfoItem(
                  context,
                  HeroIcons.clock,
                  'PICKUP',
                  assignment.pickupTime ?? 'TBD',
                ),
              ),
            ],
          ),
          if (assignment.pickupLocation != null &&
              assignment.pickupLocation!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
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
                    assignment.pickupLocation!,
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
          ],
        ],
      ),
    );
  }

  Widget _buildInfoItem(
    BuildContext context,
    HeroIcons icon,
    String label,
    String value,
  ) {
    return Row(
      children: [
        AppIcon(icon, size: 18, color: AppTheme.textSecondary),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.6,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
