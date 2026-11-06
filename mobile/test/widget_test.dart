// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:servio_companion/main.dart';

void main() {
  testWidgets('ServioCompanionApp smoke test renders login', (WidgetTester tester) async {
    // Build our app and trigger a frame wrapped in ProviderScope.
    await tester.pumpWidget(
      const ProviderScope(
        child: ServioCompanionApp(),
      ),
    );

    await tester.pump();

    // Verify that the title and login widgets render
    expect(find.text('YANGVERSA'), findsOneWidget);
    expect(find.text('Masuk Akun Workshop'), findsOneWidget);
    expect(find.byType(TextField), findsNWidgets(2));
  });
}
