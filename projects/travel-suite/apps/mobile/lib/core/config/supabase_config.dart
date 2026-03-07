// GoBuddy Adventures - Supabase Configuration
class SupabaseConfig {
  static const String url = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://your-project-ref.supabase.co',
  );
  static const String anonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'your-anon-key-here',
  );
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://your-app.vercel.app',
  );

  static void validate() {
    if (url.isEmpty || url.contains('your-project-ref.supabase.co')) {
      throw StateError('SUPABASE_URL must be set at build time.');
    }

    if (anonKey.isEmpty || anonKey == 'your-anon-key-here') {
      throw StateError('SUPABASE_ANON_KEY must be set at build time.');
    }

    if (apiBaseUrl.isEmpty || apiBaseUrl.contains('your-app.vercel.app')) {
      throw StateError('API_BASE_URL must be set at build time.');
    }
  }
}
