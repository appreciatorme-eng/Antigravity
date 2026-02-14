import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gobuddy_mobile/features/auth/presentation/screens/auth_screen.dart';

void main() {
  Widget buildSubject() {
    return const MaterialApp(home: AuthScreen());
  }

  testWidgets('renders login mode by default', (tester) async {
    await tester.pumpWidget(buildSubject());

    expect(find.text('Begin Journey'), findsOneWidget);
    expect(find.text("Don't have an account? Request Access"), findsOneWidget);
    // Role toggle is visible in both login and signup (Stitch wireframe parity).
    expect(find.text('Traveler'), findsOneWidget);
    expect(find.text('Driver'), findsOneWidget);
  });

  testWidgets('shows driver onboarding hint when driver role is selected', (
    tester,
  ) async {
    await tester.pumpWidget(buildSubject());

    final toggleFinder = find.text("Don't have an account? Request Access");
    await tester.ensureVisible(toggleFinder);
    await tester.tap(toggleFinder);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Driver'));
    await tester.pumpAndSettle();

    expect(
      find.textContaining('Driver accounts must be linked by admin'),
      findsOneWidget,
    );
  });

  testWidgets('shows role selection in signup mode', (tester) async {
    await tester.pumpWidget(buildSubject());

    final toggleFinder = find.text("Don't have an account? Request Access");
    await tester.ensureVisible(toggleFinder);
    await tester.tap(toggleFinder);
    await tester.pumpAndSettle();

    expect(find.text('Request Access'), findsOneWidget);
    expect(find.text('Driver'), findsOneWidget);
    expect(find.text('Traveler'), findsOneWidget);
  });
}
