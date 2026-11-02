import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:servio_companion/features/navigation/diagonal_floating_dock.dart';

void main() {
  const sampleDestinations = [
    NavDestination(
      index: 0,
      label: 'Beranda',
      icon: Icons.dashboard_outlined,
      selectedIcon: Icons.dashboard_rounded,
    ),
    NavDestination(
      index: 1,
      label: 'Tiket',
      icon: Icons.assignment_outlined,
      selectedIcon: Icons.assignment_rounded,
    ),
    NavDestination(
      index: 2,
      label: 'Sparepart',
      icon: Icons.inventory_2_outlined,
      selectedIcon: Icons.inventory_2_rounded,
    ),
    NavDestination(
      index: 3,
      label: 'Profil',
      icon: Icons.person_outline_rounded,
      selectedIcon: Icons.person_rounded,
      badgeCount: 3,
    ),
  ];

  testWidgets('ScoopedFloatingDock renders destinations, center QR button, and responds to tap', (WidgetTester tester) async {
    int selectedIndex = 0;
    bool qrTapped = false;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          bottomNavigationBar: StatefulBuilder(
            builder: (context, setState) {
              return ScoopedFloatingDock(
                currentIndex: selectedIndex,
                onItemSelected: (idx) {
                  setState(() => selectedIndex = idx);
                },
                onCenterAction: () {
                  qrTapped = true;
                },
                centerIcon: Icons.qr_code_scanner_rounded,
                destinations: sampleDestinations,
              );
            },
          ),
        ),
      ),
    );

    // Verify all 4 destination labels are rendered
    expect(find.text('Beranda'), findsOneWidget);
    expect(find.text('Tiket'), findsOneWidget);
    expect(find.text('Sparepart'), findsOneWidget);
    expect(find.text('Profil'), findsOneWidget);

    // Verify center QR scanner icon is rendered
    expect(find.byIcon(Icons.qr_code_scanner_rounded), findsOneWidget);

    // Verify badge count 3 is rendered on Profil
    expect(find.text('3'), findsOneWidget);

    // Tap on 'Tiket' (index 1)
    await tester.tap(find.text('Tiket'));
    await tester.pumpAndSettle();

    // Verify selection updated
    expect(selectedIndex, 1);

    // Tap on Center QR button
    await tester.tap(find.byIcon(Icons.qr_code_scanner_rounded));
    await tester.pumpAndSettle();

    expect(qrTapped, isTrue);
  });
}
