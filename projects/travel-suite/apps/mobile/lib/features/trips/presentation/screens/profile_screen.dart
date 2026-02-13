import 'package:flutter/material.dart';
import 'package:gobuddy_mobile/core/ui/app_icon.dart';
import 'package:gobuddy_mobile/core/ui/glass/glass.dart';
import 'package:gobuddy_mobile/core/theme/app_theme.dart';
import 'package:heroicons/heroicons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      final row = await Supabase.instance.client
          .from('profiles')
          .select('full_name, email, role, phone')
          .eq('id', user.id)
          .maybeSingle();
      if (!mounted) return;
      setState(
        () => _profile = row == null ? null : Map<String, dynamic>.from(row),
      );
    } finally {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _signOut() async {
    await Supabase.instance.client.auth.signOut();
    if (!mounted) return;
    Navigator.of(context).popUntil((r) => r.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    final fullName = (_profile?['full_name'] ?? 'Account').toString().trim();
    final email = (_profile?['email'] ?? '').toString().trim();
    final role = (_profile?['role'] ?? '').toString().trim();
    final phone = (_profile?['phone'] ?? '').toString().trim();

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
                    child: Row(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.secondary.withAlpha(18),
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          alignment: Alignment.center,
                          child: const AppIcon(
                            HeroIcons.user,
                            size: 22,
                            color: AppTheme.secondary,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                fullName.isEmpty ? 'Account' : fullName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.titleLarge
                                    ?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.textPrimary,
                                    ),
                              ),
                              if (email.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  email,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: AppTheme.textSecondary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  GlassCard(
                    padding: const EdgeInsets.all(18),
                    borderRadius: BorderRadius.circular(24),
                    child: _loading
                        ? const LinearProgressIndicator(minHeight: 2)
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Details',
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.textPrimary,
                                    ),
                              ),
                              const SizedBox(height: 12),
                              _RowDetail(
                                icon: HeroIcons.identification,
                                label: 'Role',
                                value: role.isEmpty ? 'client' : role,
                              ),
                              if (phone.isNotEmpty) ...[
                                const SizedBox(height: 10),
                                _RowDetail(
                                  icon: HeroIcons.phone,
                                  label: 'Phone',
                                  value: phone,
                                ),
                              ],
                            ],
                          ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _signOut,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      icon: const AppIcon(HeroIcons.arrowRightOnRectangle),
                      label: const Text(
                        'Sign out',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ],
              ),
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                child: _TopBar(
                  title: 'Profile',
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
    return GlassCard(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
      borderRadius: BorderRadius.circular(0),
      color: AppTheme.glassNavSurface,
      blurSigma: 20,
      child: Row(
        children: [
          GlassIconButton(
            onPressed: onBack,
            size: 36,
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
    );
  }
}

class _RowDetail extends StatelessWidget {
  final HeroIcons icon;
  final String label;
  final String value;

  const _RowDetail({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        AppIcon(icon, size: 18, color: AppTheme.textSecondary),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: AppTheme.textPrimary,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}
