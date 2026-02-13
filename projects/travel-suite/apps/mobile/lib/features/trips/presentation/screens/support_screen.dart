import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:gobuddy_mobile/core/theme/app_theme.dart';
import 'package:gobuddy_mobile/core/ui/app_icon.dart';
import 'package:gobuddy_mobile/core/ui/glass/glass.dart';
import 'package:heroicons/heroicons.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: DecoratedBox(
        decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: SafeArea(
          child: Stack(
            children: [
              ListView(
                padding: const EdgeInsets.fromLTRB(24, 96, 24, 24),
                children: [
                  GlassCard(
                    padding: const EdgeInsets.all(18),
                    borderRadius: BorderRadius.circular(28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Concierge & Support',
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppTheme.textPrimary,
                              ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Your tour operator can configure in-app support contact details. '
                          'Once enabled, you will be able to call or message the operator directly from here.',
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
                    padding: const EdgeInsets.all(18),
                    borderRadius: BorderRadius.circular(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withAlpha(18),
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: const AppIcon(
                                HeroIcons.chatBubbleLeftRight,
                                size: 18,
                                color: AppTheme.primary,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Not configured yet',
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.textPrimary,
                                    ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Ask your operator to add a support phone/WhatsApp number. '
                          'In the meantime, check the itinerary for emergency contact info.',
                          style: TextStyle(
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
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
                          Text(
                            'Support',
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textPrimary,
                                ),
                          ),
                        ],
                      ),
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
}
