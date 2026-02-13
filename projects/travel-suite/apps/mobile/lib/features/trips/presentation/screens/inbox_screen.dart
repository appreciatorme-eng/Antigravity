import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:gobuddy_mobile/core/theme/app_theme.dart';
import 'package:gobuddy_mobile/core/ui/app_icon.dart';
import 'package:gobuddy_mobile/core/ui/glass/glass.dart';
import 'package:heroicons/heroicons.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _items = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      final rows = await Supabase.instance.client
          .from('notification_logs')
          .select('id,title,body,notification_type,status,sent_at,created_at')
          .eq('recipient_id', user.id)
          .order('sent_at', ascending: false)
          .order('created_at', ascending: false)
          .limit(50);

      final list = List<Map<String, dynamic>>.from(rows as List);
      if (!mounted) return;
      setState(() => _items = list);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString());
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  DateTime? _parseDate(Object? v) {
    if (v == null) return null;
    final s = v.toString();
    try {
      return DateTime.parse(s);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: DecoratedBox(
        decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: SafeArea(
          child: Stack(
            children: [
              RefreshIndicator(
                onRefresh: _load,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(24, 96, 24, 24),
                  children: [
                    if (_loading)
                      const GlassCard(
                        child: LinearProgressIndicator(minHeight: 2),
                      )
                    else if (_error != null)
                      GlassCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Unable to load inbox',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _error!,
                              style: const TextStyle(
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      )
                    else if (_items.isEmpty)
                      const GlassCard(
                        child: Text(
                          'No updates yet.',
                          style: TextStyle(
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      )
                    else
                      ..._items.map((it) {
                        final title = (it['title'] ?? 'Update')
                            .toString()
                            .trim();
                        final body = (it['body'] ?? '').toString().trim();
                        final when =
                            _parseDate(it['sent_at']) ??
                            _parseDate(it['created_at']);
                        final whenLabel = when == null
                            ? ''
                            : DateFormat('MMM d • h:mm a').format(when);
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: GlassCard(
                            padding: const EdgeInsets.all(16),
                            borderRadius: BorderRadius.circular(24),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        title,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                    ),
                                    if (whenLabel.isNotEmpty)
                                      Text(
                                        whenLabel,
                                        style: const TextStyle(
                                          color: AppTheme.textSecondary,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                  ],
                                ),
                                if (body.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    body,
                                    style: const TextStyle(
                                      color: AppTheme.textSecondary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      }),
                  ],
                ),
              ),
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                child: _TopBar(
                  title: 'Inbox',
                  onBack: () => Navigator.pop(context),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  final String title;
  final VoidCallback onBack;

  const _TopBar({required this.title, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.fromLTRB(24, 18, 24, 16),
          decoration: BoxDecoration(
            color: AppTheme.glassNavSurface,
            border: Border(bottom: BorderSide(color: AppTheme.glassBorder)),
          ),
          child: Row(
            children: [
              GlassIconButton(
                onPressed: onBack,
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
                title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
