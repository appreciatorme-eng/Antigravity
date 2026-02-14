import 'dart:async';

import 'package:flutter_test/flutter_test.dart';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  // Ensure the Flutter binding is available for code paths that touch services
  // (e.g. Theme creation time in plain `test()` cases).
  TestWidgetsFlutterBinding.ensureInitialized();

  await testMain();
}
