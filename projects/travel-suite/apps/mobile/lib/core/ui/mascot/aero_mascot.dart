import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_theme.dart';

/// Aero mascot character with multiple states
/// Matches Stitch designs with mascot variants
enum AeroState {
  calm,      // Neutral/resting state
  gliding,   // Active travel/movement
  resting,   // Idle/sleeping
  active,    // Alert/engaged
  hovering,  // Floating/waiting
  vigilant,  // Monitoring/watching
  overseer,  // Admin/management
}

class AeroMascot extends StatefulWidget {
  final AeroState state;
  final double size;
  final bool enableTapInteraction;
  final VoidCallback? onTap;

  const AeroMascot({
    super.key,
    this.state = AeroState.calm,
    this.size = 80.0,
    this.enableTapInteraction = true,
    this.onTap,
  });

  @override
  State<AeroMascot> createState() => _AeroMascotState();
}

class _AeroMascotState extends State<AeroMascot>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _floatAnimation;
  late Animation<double> _rotateAnimation;
  bool _showTooltip = false;

  @override
  void initState() {
    super.initState();
    _setupAnimation();
  }

  void _setupAnimation() {
    final duration = _getAnimationDuration();
    _controller = AnimationController(
      duration: duration,
      vsync: this,
    );

    _floatAnimation = Tween<double>(
      begin: 0,
      end: _getFloatRange(),
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    _rotateAnimation = Tween<double>(
      begin: 0,
      end: _getRotationRange(),
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    if (_shouldAnimate()) {
      _controller.repeat(reverse: true);
    }
  }

  Duration _getAnimationDuration() {
    switch (widget.state) {
      case AeroState.gliding:
        return const Duration(milliseconds: 1200);
      case AeroState.hovering:
        return const Duration(milliseconds: 2000);
      case AeroState.active:
        return const Duration(milliseconds: 1500);
      default:
        return const Duration(milliseconds: 2500);
    }
  }

  double _getFloatRange() {
    switch (widget.state) {
      case AeroState.gliding:
        return 12.0;
      case AeroState.hovering:
        return 8.0;
      case AeroState.resting:
        return 3.0;
      default:
        return 6.0;
    }
  }

  double _getRotationRange() {
    switch (widget.state) {
      case AeroState.gliding:
        return 0.1;
      case AeroState.hovering:
        return 0.05;
      default:
        return 0.02;
    }
  }

  bool _shouldAnimate() {
    return widget.state != AeroState.resting;
  }

  Color _getMascotColor() {
    switch (widget.state) {
      case AeroState.vigilant:
      case AeroState.overseer:
        return AppTheme.secondary;
      case AeroState.active:
        return AppTheme.primary;
      default:
        return AppTheme.primary.withAlpha(204);
    }
  }

  IconData _getMascotIcon() {
    switch (widget.state) {
      case AeroState.gliding:
        return Icons.flight;
      case AeroState.hovering:
        return Icons.flight_takeoff;
      case AeroState.resting:
        return Icons.nightlight_round;
      case AeroState.vigilant:
        return Icons.visibility;
      case AeroState.overseer:
        return Icons.admin_panel_settings;
      default:
        return Icons.flight_rounded;
    }
  }

  void _handleTap() {
    if (!widget.enableTapInteraction) return;

    // Haptic feedback
    HapticFeedback.lightImpact();

    // Show tooltip briefly
    setState(() => _showTooltip = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _showTooltip = false);
    });

    widget.onTap?.call();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _handleTap,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.translate(
            offset: Offset(0, -_floatAnimation.value),
            child: Transform.rotate(
              angle: _rotateAnimation.value,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  // Mascot container
                  Container(
                    width: widget.size,
                    height: widget.size,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _getMascotColor(),
                      boxShadow: [
                        BoxShadow(
                          color: _getMascotColor().withAlpha(77),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Icon(
                      _getMascotIcon(),
                      size: widget.size * 0.5,
                      color: Colors.white,
                    ),
                  ),
                  // Tooltip
                  if (_showTooltip)
                    Positioned(
                      bottom: widget.size + 10,
                      left: -20,
                      child: _Tooltip(text: _getTooltipText()),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  String _getTooltipText() {
    switch (widget.state) {
      case AeroState.calm:
        return 'Ready for adventure!';
      case AeroState.gliding:
        return 'Soaring ahead!';
      case AeroState.resting:
        return 'Recharging...';
      case AeroState.active:
        return 'Let\'s go!';
      case AeroState.hovering:
        return 'Standing by...';
      case AeroState.vigilant:
        return 'Watching closely';
      case AeroState.overseer:
        return 'Managing flights';
    }
  }
}

class _Tooltip extends StatelessWidget {
  final String text;

  const _Tooltip({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.textPrimary,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(26),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
