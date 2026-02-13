import 'package:flutter/material.dart';
import 'package:heroicons/heroicons.dart';

import '../theme/app_theme.dart';

/// Centralized icon wrapper so icon sizing/color stays consistent across screens.
class AppIcon extends StatelessWidget {
  final HeroIcons icon;
  final double size;
  final Color? color;
  final HeroIconStyle style;

  const AppIcon(
    this.icon, {
    super.key,
    this.size = 20,
    this.color,
    this.style = HeroIconStyle.outline,
  });

  @override
  Widget build(BuildContext context) {
    return HeroIcon(
      icon,
      style: style,
      size: size,
      color: color ?? AppTheme.textPrimary,
    );
  }
}
