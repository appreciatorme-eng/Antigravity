import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:heroicons/heroicons.dart';

import '../app_icon.dart';
import '../../theme/app_theme.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius borderRadius;
  final Color? color;
  final double blurSigma;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = const BorderRadius.all(Radius.circular(24)),
    this.color,
    this.blurSigma = 16,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: borderRadius,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: color ?? AppTheme.glassSurface,
            borderRadius: borderRadius,
            border: Border.all(color: AppTheme.glassBorder),
            boxShadow: [
              BoxShadow(
                color: const Color(0x1F1F2687).withAlpha(18),
                blurRadius: 32,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Padding(padding: padding, child: child),
        ),
      ),
    );
  }
}

class GlassContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;
  final BorderRadius borderRadius;

  const GlassContainer({
    super.key,
    required this.child,
    this.margin,
    this.padding,
    this.borderRadius = const BorderRadius.all(Radius.circular(20)),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: AppTheme.glassSurface,
        borderRadius: borderRadius,
        border: Border.all(color: AppTheme.glassBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(12),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: padding != null
          ? Padding(padding: padding!, child: child)
          : child,
    );
  }
}

class GlassPill extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius borderRadius;
  final Color? color;
  final Color? borderColor;

  const GlassPill({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
    this.borderRadius = const BorderRadius.all(Radius.circular(999)),
    this.color,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? AppTheme.primary.withAlpha(20),
        borderRadius: borderRadius,
        border: Border.all(
          color: borderColor ?? AppTheme.primary.withAlpha(40),
        ),
      ),
      child: child,
    );
  }
}

class GlassIconButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget icon;
  final double size;
  final Color? background;

  const GlassIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.size = 40,
    this.background,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(size / 2),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: background ?? Colors.white.withAlpha(204),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(12),
              blurRadius: 10,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: icon,
      ),
    );
  }
}

class GlassFloatingNavBar extends StatelessWidget {
  final int activeIndex;
  final void Function(int index) onTap;

  const GlassFloatingNavBar({
    super.key,
    required this.activeIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              height: 56,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.glassNavSurface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppTheme.glassBorder),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(18),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _NavItem(
                    isActive: activeIndex == 0,
                    onTap: () => onTap(0),
                    icon: HeroIcons.home,
                  ),
                  _NavItem(
                    isActive: activeIndex == 1,
                    onTap: () => onTap(1),
                    icon: HeroIcons.map,
                  ),
                  _NavItem(
                    isActive: activeIndex == 2,
                    onTap: () => onTap(2),
                    icon: HeroIcons.chatBubbleOvalLeftEllipsis,
                  ),
                  _NavItem(
                    isActive: activeIndex == 3,
                    onTap: () => onTap(3),
                    icon: HeroIcons.user,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class GlassTravelerFloatingNavBar extends StatelessWidget {
  /// 0 = Trip, 1 = Explore, 2 = Concierge, 3 = Bookings, 4 = Profile
  final int activeIndex;
  final void Function(int index) onTap;

  const GlassTravelerFloatingNavBar({
    super.key,
    required this.activeIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              height: 60,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.glassNavSurface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppTheme.glassBorder),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(18),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _NavItem(
                    isActive: activeIndex == 0,
                    onTap: () => onTap(0),
                    icon: HeroIcons.home,
                  ),
                  _NavItem(
                    isActive: activeIndex == 1,
                    onTap: () => onTap(1),
                    icon: HeroIcons.sparkles,
                  ),
                  _TravelerConciergeItem(onTap: () => onTap(2)),
                  _NavItem(
                    isActive: activeIndex == 3,
                    onTap: () => onTap(3),
                    icon: HeroIcons.ticket,
                  ),
                  _NavItem(
                    isActive: activeIndex == 4,
                    onTap: () => onTap(4),
                    icon: HeroIcons.user,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class GlassDriverFloatingNavBar extends StatelessWidget {
  /// 0 = Home, 1 = Route, 2 = Command, 3 = Inbox, 4 = Profile
  final int activeIndex;
  final void Function(int index) onTap;

  const GlassDriverFloatingNavBar({
    super.key,
    required this.activeIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.only(left: 16, right: 16, bottom: 12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
            child: Container(
              height: 60,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.glassNavSurface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppTheme.glassBorder),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withAlpha(18),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _NavItem(
                    isActive: activeIndex == 0,
                    onTap: () => onTap(0),
                    icon: HeroIcons.home,
                  ),
                  _NavItem(
                    isActive: activeIndex == 1,
                    onTap: () => onTap(1),
                    icon: HeroIcons.map,
                  ),
                  _DriverCommandItem(
                    isActive: activeIndex == 2,
                    onTap: () => onTap(2),
                  ),
                  _NavItem(
                    isActive: activeIndex == 3,
                    onTap: () => onTap(3),
                    icon: HeroIcons.inbox,
                  ),
                  _NavItem(
                    isActive: activeIndex == 4,
                    onTap: () => onTap(4),
                    icon: HeroIcons.user,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final bool isActive;
  final VoidCallback onTap;
  final HeroIcons icon;

  const _NavItem({
    required this.isActive,
    required this.onTap,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primary : Colors.transparent,
          shape: BoxShape.circle,
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppTheme.primary.withAlpha(77),
                    blurRadius: 14,
                    offset: const Offset(0, 8),
                  ),
                ]
              : null,
        ),
        alignment: Alignment.center,
        child: AppIcon(
          icon,
          size: 22,
          color: isActive ? Colors.white : AppTheme.textPrimary.withAlpha(140),
          style: isActive ? HeroIconStyle.solid : HeroIconStyle.outline,
        ),
      ),
    );
  }
}

class _DriverCommandItem extends StatelessWidget {
  final bool isActive;
  final VoidCallback onTap;

  const _DriverCommandItem({required this.isActive, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primary : Colors.white.withAlpha(204),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: (isActive ? AppTheme.primary : Colors.black).withAlpha(26),
              blurRadius: 14,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: AppIcon(
          HeroIcons.commandLine,
          size: 22,
          color: isActive ? Colors.white : AppTheme.textPrimary.withAlpha(170),
          style: isActive ? HeroIconStyle.solid : HeroIconStyle.outline,
        ),
      ),
    );
  }
}

class _TravelerConciergeItem extends StatelessWidget {
  final VoidCallback onTap;

  const _TravelerConciergeItem({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          color: AppTheme.primary,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withAlpha(102),
              blurRadius: 18,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        alignment: Alignment.center,
        child: const AppIcon(
          HeroIcons.sparkles,
          size: 24,
          color: Colors.white,
          style: HeroIconStyle.solid,
        ),
      ),
    );
  }
}
