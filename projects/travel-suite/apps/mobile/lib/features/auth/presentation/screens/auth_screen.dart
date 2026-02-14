import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:heroicons/heroicons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;

import '../../../../core/ui/app_icon.dart';
import '../../../../core/ui/glass/glass.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/config/supabase_config.dart';
import '../../../../core/services/profile_role_service.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();
  bool _isLogin = true;
  bool _loading = false;
  String? _errorMessage;
  String _selectedRole = 'client';
  bool _showPassword = false;
  final ProfileRoleService _profileRoleService = ProfileRoleService();

  @override
  void initState() {
    super.initState();
    _emailFocusNode.addListener(() {
      if (!mounted) return;
      setState(() {});
    });
    _passwordFocusNode.addListener(() {
      if (!mounted) return;
      setState(() {});
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  Future<void> _handleAuth() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final supabase = Supabase.instance.client;
      if (_isLogin) {
        await supabase.auth.signInWithPassword(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
        await _profileRoleService.applyPendingRoleForCurrentUser();
        await _sendWelcomeEmailIfNeeded();
      } else {
        final authResponse = await supabase.auth.signUp(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
        await _profileRoleService.savePendingRole(_selectedRole);

        if (authResponse.session != null) {
          await _profileRoleService.applyPendingRoleForCurrentUser();
        }
        await _sendWelcomeEmailIfNeeded();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Check your email for verification link'),
              backgroundColor: AppTheme.success,
            ),
          );
        }
      }
    } on AuthException catch (e) {
      if (mounted) setState(() => _errorMessage = e.message);
    } catch (e) {
      if (mounted)
        setState(() => _errorMessage = 'An unexpected error occurred');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _sendWelcomeEmailIfNeeded() async {
    try {
      final session = Supabase.instance.client.auth.currentSession;
      if (session == null) return;

      final url = Uri.parse('${SupabaseConfig.apiBaseUrl}/api/emails/welcome');
      await http.post(
        url,
        headers: {'Authorization': 'Bearer ${session.accessToken}'},
      );
    } catch (_) {
      // Non-blocking: welcome email should not stop auth flow
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      if (!_isLogin) {
        await _profileRoleService.savePendingRole(_selectedRole);
      }
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'com.gobuddy.gobuddymobile://login-callback',
      );
    } on AuthException catch (e) {
      if (mounted) setState(() => _errorMessage = e.message);
    } catch (e) {
      if (mounted)
        setState(() => _errorMessage = 'Failed to sign in with Google');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _sendPasswordReset() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _errorMessage = 'Enter your email address first.');
      return;
    }
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      await Supabase.instance.client.auth.resetPasswordForEmail(email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password reset email sent.'),
          backgroundColor: AppTheme.success,
        ),
      );
    } on AuthException catch (e) {
      if (mounted) setState(() => _errorMessage = e.message);
    } catch (_) {
      if (mounted) setState(() => _errorMessage = 'Unable to send reset email');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _roleToggle() {
    final isTraveler = _selectedRole == 'client';
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final pillW = (w - 8) / 2;
        final left = isTraveler ? 4.0 : 4.0 + pillW;

        return Container(
          height: 44,
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.black.withAlpha(18),
            borderRadius: BorderRadius.circular(999),
          ),
          child: Stack(
            children: [
              AnimatedPositioned(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                left: left,
                top: 0,
                bottom: 0,
                width: pillW,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(235),
                    borderRadius: BorderRadius.circular(999),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(14),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _selectedRole = 'client'),
                      borderRadius: BorderRadius.circular(999),
                      child: Center(
                        child: Text(
                          'Traveler',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: isTraveler
                                ? AppTheme.textPrimary
                                : AppTheme.textSecondary.withAlpha(170),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _selectedRole = 'driver'),
                      borderRadius: BorderRadius.circular(999),
                      child: Center(
                        child: Text(
                          'Driver',
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: isTraveler
                                ? AppTheme.textSecondary.withAlpha(170)
                                : AppTheme.textPrimary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _underlineAnimatedField({
    required TextEditingController controller,
    required FocusNode focusNode,
    required String hintText,
    required TextInputType keyboardType,
    required List<String> autofillHints,
    required Widget suffixIcon,
    bool obscureText = false,
    TextInputAction? textInputAction,
    VoidCallback? onSubmitted,
  }) {
    final focused = focusNode.hasFocus;
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: TextField(
                controller: controller,
                focusNode: focusNode,
                keyboardType: keyboardType,
                textInputAction: textInputAction,
                autofillHints: autofillHints,
                obscureText: obscureText,
                onSubmitted: (_) => onSubmitted?.call(),
                decoration: InputDecoration(
                  hintText: hintText,
                  filled: true,
                  fillColor: Colors.white.withAlpha(102),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                  suffixIcon: Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: suffixIcon,
                  ),
                  suffixIconConstraints: const BoxConstraints(
                    minWidth: 36,
                    minHeight: 36,
                  ),
                ),
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(height: 2, color: Colors.grey.shade300),
            ),
            Positioned(
              left: 0,
              bottom: 0,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 260),
                curve: Curves.easeOutCubic,
                height: 2,
                width: focused ? constraints.maxWidth : 0,
                color: AppTheme.primary,
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppTheme.backgroundGradient),
        child: SafeArea(
          child: Stack(
            children: [
              Positioned(
                top: -120,
                left: -120,
                child: ImageFiltered(
                  imageFilter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
                  child: Container(
                    width: 380,
                    height: 380,
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withAlpha(26),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: -140,
                right: -140,
                child: ImageFiltered(
                  imageFilter: ImageFilter.blur(sigmaX: 100, sigmaY: 100),
                  child: Container(
                    width: 440,
                    height: 440,
                    decoration: BoxDecoration(
                      color: AppTheme.secondary.withAlpha(14),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Travel Suite',
                          style: Theme.of(context).textTheme.displayMedium
                              ?.copyWith(
                                fontStyle: FontStyle.italic,
                                color: AppTheme.secondary,
                              ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Luxury Redefined',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: AppTheme.secondary.withAlpha(150),
                              ),
                        ),
                        const SizedBox(height: 28),
                        GlassCard(
                          padding: const EdgeInsets.all(20),
                          borderRadius: BorderRadius.circular(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _roleToggle(),
                              const SizedBox(height: 18),
                              _FieldLabel(text: 'Email Address'),
                              const SizedBox(height: 6),
                              _underlineAnimatedField(
                                controller: _emailController,
                                focusNode: _emailFocusNode,
                                keyboardType: TextInputType.emailAddress,
                                autofillHints: const [AutofillHints.email],
                                textInputAction: TextInputAction.next,
                                hintText: 'name@example.com',
                                suffixIcon: const AppIcon(
                                  HeroIcons.envelope,
                                  size: 18,
                                  color: Color(0x66124EA2),
                                ),
                                onSubmitted: () =>
                                    _passwordFocusNode.requestFocus(),
                              ),
                              const SizedBox(height: 16),
                              _FieldLabel(text: 'Password'),
                              const SizedBox(height: 6),
                              _underlineAnimatedField(
                                controller: _passwordController,
                                focusNode: _passwordFocusNode,
                                keyboardType: TextInputType.text,
                                autofillHints: const [AutofillHints.password],
                                hintText: '••••••••',
                                obscureText: !_showPassword,
                                textInputAction: TextInputAction.done,
                                suffixIcon: InkWell(
                                  onTap: () => setState(
                                    () => _showPassword = !_showPassword,
                                  ),
                                  borderRadius: BorderRadius.circular(999),
                                  child: AppIcon(
                                    _showPassword
                                        ? HeroIcons.eyeSlash
                                        : HeroIcons.eye,
                                    size: 18,
                                    color: AppTheme.secondary.withAlpha(110),
                                  ),
                                ),
                                onSubmitted: _handleAuth,
                              ),
                              const SizedBox(height: 10),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: _loading
                                      ? null
                                      : _sendPasswordReset,
                                  child: Text(
                                    'Forgot Password?',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.secondary.withAlpha(160),
                                    ),
                                  ),
                                ),
                              ),
                              if (_errorMessage != null) ...[
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppTheme.error.withAlpha(26),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: AppTheme.error.withAlpha(70),
                                    ),
                                  ),
                                  child: Text(
                                    _errorMessage!,
                                    style: const TextStyle(
                                      color: AppTheme.error,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ],
                              const SizedBox(height: 14),
                              SizedBox(
                                height: 52,
                                child: ElevatedButton(
                                  onPressed: _loading ? null : _handleAuth,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primary,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                  ),
                                  child: _loading
                                      ? const SizedBox(
                                          height: 20,
                                          width: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white,
                                          ),
                                        )
                                      : Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              _isLogin
                                                  ? 'Begin Journey'
                                                  : 'Request Access',
                                            ),
                                            const SizedBox(width: 10),
                                            const AppIcon(
                                              HeroIcons.arrowRight,
                                              size: 18,
                                              color: Colors.white,
                                              style: HeroIconStyle.solid,
                                            ),
                                          ],
                                        ),
                                ),
                              ),
                              const SizedBox(height: 14),
                              Row(
                                children: [
                                  Expanded(
                                    child: Divider(color: Colors.grey.shade300),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                    ),
                                    child: Text(
                                      'or',
                                      style: TextStyle(
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: Divider(color: Colors.grey.shade300),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              SizedBox(
                                height: 48,
                                child: OutlinedButton.icon(
                                  onPressed: _loading
                                      ? null
                                      : _handleGoogleSignIn,
                                  icon: Image.network(
                                    'https://www.google.com/favicon.ico',
                                    height: 18,
                                    width: 18,
                                    errorBuilder:
                                        (context, error, stackTrace) =>
                                            const Icon(
                                              Icons.g_mobiledata,
                                              size: 20,
                                            ),
                                  ),
                                  label: const Text('Continue with Google'),
                                ),
                              ),
                              if (_selectedRole == 'driver' && !_isLogin) ...[
                                const SizedBox(height: 14),
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary.withAlpha(18),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Text(
                                    'Driver accounts must be linked by admin before live trip operations are available.',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),
                        TextButton(
                          onPressed: () => setState(() => _isLogin = !_isLogin),
                          child: Text(
                            _isLogin
                                ? "Don't have an account? Request Access"
                                : 'Already have an account? Sign in',
                            style: TextStyle(color: AppTheme.secondary),
                          ),
                        ),
                      ],
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

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.2,
          color: AppTheme.secondary.withAlpha(180),
        ),
      ),
    );
  }
}
