import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_theme.dart';

/// Interactive mascot with tap animations
/// Matches Stitch designs: mascot_tap-flutter_&_tooltip_interaction.png
///                        mascot_tap-spin_&_ripple_interaction.png

enum MascotInteractionType {
  flutter,  // Flutter and tooltip
  spin,     // Spin and ripple
  ripple,   // Ripple only
}

class InteractiveMascot extends StatefulWidget {
  final Widget child;
  final MascotInteractionType interactionType;
  final VoidCallback? onTap;

  const InteractiveMascot({
    super.key,
    required this.child,
    this.interactionType = MascotInteractionType.flutter,
    this.onTap,
  });

  @override
  State<InteractiveMascot> createState() => _InteractiveMascotState();
}

class _InteractiveMascotState extends State<InteractiveMascot>
    with TickerProviderStateMixin {
  late AnimationController _rippleController;
  late AnimationController _spinController;
  late AnimationController _flutterController;

  late Animation<double> _rippleAnimation;
  late Animation<double> _rippleOpacity;
  late Animation<double> _spinAnimation;
  late Animation<double> _flutterAnimation;

  bool _isAnimating = false;

  @override
  void initState() {
    super.initState();
    _setupAnimations();
  }

  void _setupAnimations() {
    // Ripple animation
    _rippleController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _rippleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _rippleController, curve: Curves.easeOut),
    );

    _rippleOpacity = Tween<double>(begin: 0.6, end: 0.0).animate(
      CurvedAnimation(parent: _rippleController, curve: Curves.easeOut),
    );

    // Spin animation
    _spinController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _spinAnimation = Tween<double>(begin: 0.0, end: 2 * 3.14159).animate(
      CurvedAnimation(parent: _spinController, curve: Curves.easeInOut),
    );

    // Flutter animation
    _flutterController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _flutterAnimation = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: -10.0), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -10.0, end: 10.0), weight: 1),
      TweenSequenceItem(tween: Tween(begin: 10.0, end: -5.0), weight: 1),
      TweenSequenceItem(tween: Tween(begin: -5.0, end: 0.0), weight: 1),
    ]).animate(CurvedAnimation(
      parent: _flutterController,
      curve: Curves.elasticOut,
    ));
  }

  void _handleTap() {
    if (_isAnimating) return;

    setState(() => _isAnimating = true);

    // Haptic feedback
    HapticFeedback.mediumImpact();

    switch (widget.interactionType) {
      case MascotInteractionType.flutter:
        _flutterController.forward(from: 0).then((_) {
          if (mounted) setState(() => _isAnimating = false);
        });
        break;

      case MascotInteractionType.spin:
        _spinController.forward(from: 0);
        _rippleController.forward(from: 0).then((_) {
          if (mounted) setState(() => _isAnimating = false);
        });
        break;

      case MascotInteractionType.ripple:
        _rippleController.forward(from: 0).then((_) {
          if (mounted) setState(() => _isAnimating = false);
        });
        break;
    }

    widget.onTap?.call();
  }

  @override
  void dispose() {
    _rippleController.dispose();
    _spinController.dispose();
    _flutterController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _handleTap,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Ripple effect
          if (widget.interactionType != MascotInteractionType.flutter)
            AnimatedBuilder(
              animation: _rippleController,
              builder: (context, child) {
                return Container(
                  width: 120 * _rippleAnimation.value,
                  height: 120 * _rippleAnimation.value,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppTheme.primary.withOpacity(_rippleOpacity.value),
                      width: 3,
                    ),
                  ),
                );
              },
            ),

          // Mascot with spin/flutter
          AnimatedBuilder(
            animation: Listenable.merge([_spinController, _flutterController]),
            builder: (context, child) {
              Widget mascot = widget.child;

              if (widget.interactionType == MascotInteractionType.flutter ||
                  widget.interactionType == MascotInteractionType.spin) {
                if (widget.interactionType == MascotInteractionType.spin) {
                  mascot = Transform.rotate(
                    angle: _spinAnimation.value,
                    child: mascot,
                  );
                }

                if (widget.interactionType == MascotInteractionType.flutter) {
                  mascot = Transform.translate(
                    offset: Offset(_flutterAnimation.value, 0),
                    child: mascot,
                  );
                }
              }

              return mascot;
            },
          ),
        ],
      ),
    );
  }
}
