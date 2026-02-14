import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

/// Card expansion transition animation
/// Matches Stitch design: transition_state-flight_card_expansion.png

class ExpandableCard extends StatefulWidget {
  final Widget collapsedChild;
  final Widget expandedChild;
  final bool initiallyExpanded;
  final Duration animationDuration;
  final VoidCallback? onExpanded;
  final VoidCallback? onCollapsed;

  const ExpandableCard({
    super.key,
    required this.collapsedChild,
    required this.expandedChild,
    this.initiallyExpanded = false,
    this.animationDuration = const Duration(milliseconds: 400),
    this.onExpanded,
    this.onCollapsed,
  });

  @override
  State<ExpandableCard> createState() => _ExpandableCardState();
}

class _ExpandableCardState extends State<ExpandableCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _heightFactor;
  late Animation<double> _rotationAnimation;
  bool _isExpanded = false;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.initiallyExpanded;

    _controller = AnimationController(
      duration: widget.animationDuration,
      vsync: this,
      value: _isExpanded ? 1.0 : 0.0,
    );

    _heightFactor = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOutCubic,
      ),
    );

    _rotationAnimation = Tween<double>(begin: 0.0, end: 0.5).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ),
    );
  }

  void _toggleExpansion() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _controller.forward();
        widget.onExpanded?.call();
      } else {
        _controller.reverse();
        widget.onCollapsed?.call();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Collapsed content (always visible)
        GestureDetector(
          onTap: _toggleExpansion,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.glassSurface,
              borderRadius: BorderRadius.vertical(
                top: const Radius.circular(20),
                bottom: _isExpanded ? Radius.zero : const Radius.circular(20),
              ),
              border: Border.all(
                color: AppTheme.glassBorder,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Expanded(child: widget.collapsedChild),
                AnimatedBuilder(
                  animation: _rotationAnimation,
                  builder: (context, child) {
                    return RotationTransition(
                      turns: _rotationAnimation,
                      child: const Icon(
                        Icons.expand_more,
                        color: AppTheme.textSecondary,
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),

        // Expanded content (animated)
        AnimatedBuilder(
          animation: _heightFactor,
          builder: (context, child) {
            return ClipRect(
              child: Align(
                alignment: Alignment.topCenter,
                heightFactor: _heightFactor.value,
                child: child,
              ),
            );
          },
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.glassSurface,
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(20),
              ),
              border: Border.all(
                color: AppTheme.glassBorder,
                width: 1,
              ),
            ),
            child: widget.expandedChild,
          ),
        ),
      ],
    );
  }
}

/// Flight card with expansion
class FlightCard extends StatelessWidget {
  final String flightNumber;
  final String from;
  final String to;
  final String departureTime;
  final String arrivalTime;
  final String status;
  final Map<String, dynamic>? details;

  const FlightCard({
    super.key,
    required this.flightNumber,
    required this.from,
    required this.to,
    required this.departureTime,
    required this.arrivalTime,
    this.status = 'ON TIME',
    this.details,
  });

  @override
  Widget build(BuildContext context) {
    return ExpandableCard(
      collapsedChild: _buildCollapsedContent(),
      expandedChild: _buildExpandedContent(),
    );
  }

  Widget _buildCollapsedContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              flightNumber,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primary.withAlpha(26),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                status,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primary,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    from,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.secondary,
                    ),
                  ),
                  Text(
                    departureTime,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward, color: AppTheme.textSecondary),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    to,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.secondary,
                    ),
                  ),
                  Text(
                    arrivalTime,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildExpandedContent() {
    final detailsMap = details ?? {};

    return Column(
      children: [
        const Divider(),
        const SizedBox(height: 8),
        _buildDetailRow('Terminal', detailsMap['terminal'] ?? '3'),
        const SizedBox(height: 8),
        _buildDetailRow('Gate', detailsMap['gate'] ?? 'A12'),
        const SizedBox(height: 8),
        _buildDetailRow('Seat', detailsMap['seat'] ?? '2A'),
        const SizedBox(height: 8),
        _buildDetailRow('Boarding', detailsMap['boarding'] ?? '10:30 AM'),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: AppTheme.textSecondary,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }
}
