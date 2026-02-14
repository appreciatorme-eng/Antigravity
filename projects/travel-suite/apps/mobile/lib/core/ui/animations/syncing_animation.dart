import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

/// Syncing/loading animation component
/// Matches Stitch design: aero_syncing_flight_data_animation.png
class SyncingAnimation extends StatefulWidget {
  final String message;
  final double size;

  const SyncingAnimation({
    super.key,
    this.message = 'Syncing flight data...',
    this.size = 60.0,
  });

  @override
  State<SyncingAnimation> createState() => _SyncingAnimationState();
}

class _SyncingAnimationState extends State<SyncingAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: widget.size,
          height: widget.size,
          child: Stack(
            children: [
              // Outer rotating ring
              AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  return Transform.rotate(
                    angle: _controller.value * 2 * 3.14159,
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppTheme.primary.withAlpha(51),
                          width: 3,
                        ),
                      ),
                    ),
                  );
                },
              ),
              // Animated arc
              AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  return Transform.rotate(
                    angle: _controller.value * 2 * 3.14159,
                    child: CustomPaint(
                      painter: _ArcPainter(
                        progress: _controller.value,
                        color: AppTheme.primary,
                      ),
                      size: Size(widget.size, widget.size),
                    ),
                  );
                },
              ),
              // Center icon
              Center(
                child: Icon(
                  Icons.flight_takeoff_rounded,
                  color: AppTheme.primary,
                  size: widget.size * 0.4,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          widget.message,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textSecondary,
              ),
        ),
      ],
    );
  }
}

class _ArcPainter extends CustomPainter {
  final double progress;
  final Color color;

  _ArcPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    const startAngle = -3.14159 / 2; // Top
    final sweepAngle = 3.14159 * 1.5 * progress;

    canvas.drawArc(rect, startAngle, sweepAngle, false, paint);
  }

  @override
  bool shouldRepaint(_ArcPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
