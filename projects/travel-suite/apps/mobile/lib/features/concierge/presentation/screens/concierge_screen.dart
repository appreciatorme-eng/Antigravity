import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/ui/glass/glass.dart';

/// Concierge screen for special requests and chat with tour guide
/// Replaces the generic "Plus" button with actionable concierge features
class ConciergeScreen extends StatefulWidget {
  const ConciergeScreen({super.key});

  @override
  State<ConciergeScreen> createState() => _ConciergeScreenState();
}

class _ConciergeScreenState extends State<ConciergeScreen> {
  final TextEditingController _messageController = TextEditingController();
  final List<ConciergeRequest> _requests = [
    ConciergeRequest(
      id: '1',
      type: 'Dietary',
      message: 'I need gluten-free options for all meals',
      status: 'completed',
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
      response: 'All set! We\'ve arranged gluten-free meals for your entire trip.',
    ),
    ConciergeRequest(
      id: '2',
      type: 'Special Occasion',
      message: 'Can you arrange a surprise birthday cake for my partner?',
      status: 'in_progress',
      createdAt: DateTime.now().subtract(const Duration(hours: 5)),
    ),
  ];

  @override
  void dispose() {
    _messageController.dispose();
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Concierge',
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'We\'re here to make your trip perfect',
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
                          Icons.support_agent,
                          color: AppTheme.primary,
                          size: 24,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Quick Request Buttons
            SizedBox(
              height: 100,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                children: [
                  _QuickRequestButton(
                    icon: Icons.restaurant,
                    label: 'Dietary',
                    onTap: () => _showRequestDialog('Dietary'),
                  ),
                  _QuickRequestButton(
                    icon: Icons.accessible,
                    label: 'Accessibility',
                    onTap: () => _showRequestDialog('Accessibility'),
                  ),
                  _QuickRequestButton(
                    icon: Icons.cake,
                    label: 'Special Occasion',
                    onTap: () => _showRequestDialog('Special Occasion'),
                  ),
                  _QuickRequestButton(
                    icon: Icons.local_hospital,
                    label: 'Medical',
                    onTap: () => _showRequestDialog('Medical'),
                  ),
                  _QuickRequestButton(
                    icon: Icons.more_horiz,
                    label: 'Other',
                    onTap: () => _showRequestDialog('Other'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Requests Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Your Requests',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withAlpha(26),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      '${_requests.length}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Requests List
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                itemCount: _requests.length,
                itemBuilder: (context, index) {
                  final request = _requests[index];
                  return _RequestCard(request: request);
                },
              ),
            ),

            // Chat Input (Coming Soon)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppTheme.glassSurface,
                border: Border(
                  top: BorderSide(
                    color: AppTheme.glassBorder,
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: AppTheme.glassBorder,
                        ),
                      ),
                      child: const TextField(
                        decoration: InputDecoration(
                          hintText: 'Chat with your guide (coming soon)...',
                          hintStyle: TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 14,
                          ),
                          border: InputBorder.none,
                        ),
                        enabled: false,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withAlpha(77),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.send,
                      color: AppTheme.textSecondary,
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showRequestDialog(String type) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.glassSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(
          '$type Request',
          style: const TextStyle(
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.w700,
          ),
        ),
        content: TextField(
          controller: _messageController,
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'Describe your request...',
            hintStyle: TextStyle(color: AppTheme.textSecondary),
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textSecondary),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              // TODO: Submit request to backend
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Request submitted! Our team will respond soon.'),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
            ),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }
}

class _QuickRequestButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickRequestButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 80,
        margin: const EdgeInsets.only(right: 12),
        child: Column(
          children: [
            GlassContainer(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Icon(
                  icon,
                  color: AppTheme.primary,
                  size: 28,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                color: AppTheme.textPrimary,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final ConciergeRequest request;

  const _RequestCard({required this.request});

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withAlpha(26),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    request.type,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primary,
                    ),
                  ),
                ),
                _StatusBadge(status: request.status),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              request.message,
              style: const TextStyle(
                fontSize: 14,
                color: AppTheme.textPrimary,
                height: 1.5,
              ),
            ),
            if (request.response != null) ...[
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
                      Icons.check_circle,
                      color: AppTheme.secondary,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        request.response!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 8),
            Text(
              _formatDate(request.createdAt),
              style: const TextStyle(
                fontSize: 11,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        return '${difference.inMinutes} minutes ago';
      }
      return '${difference.inHours} hours ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else {
      return '${difference.inDays} days ago';
    }
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;

    switch (status) {
      case 'completed':
        color = AppTheme.secondary;
        label = 'Completed';
        break;
      case 'in_progress':
        color = AppTheme.primary;
        label = 'In Progress';
        break;
      default:
        color = AppTheme.textSecondary;
        label = 'Pending';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(26),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: color,
        ),
      ),
    );
  }
}

/// Concierge request model
class ConciergeRequest {
  final String id;
  final String type;
  final String message;
  final String status;
  final DateTime createdAt;
  final String? response;

  ConciergeRequest({
    required this.id,
    required this.type,
    required this.message,
    required this.status,
    required this.createdAt,
    this.response,
  });
}
