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
      label: 'Presensi',
      icon: Icons.pin_drop_outlined,
      selectedIcon: Icons.pin_drop_rounded,
    ),
    NavDestination(
      index: 4,
      label: 'Profil',
      icon: Icons.person_outline_rounded,
      selectedIcon: Icons.person_rounded,
      badgeCount: 3,
    ),
  ];

  testWidgets('DiagonalFloatingDock renders all destinations and responds to tap', (WidgetTester tester) async {
    int selectedIndex = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          bottomNavigationBar: StatefulBuilder(
            builder: (context, setState) {
              return DiagonalFloatingDock(
                currentIndex: selectedIndex,
                onItemSelected: (idx) {
                  setState(() => selectedIndex = idx);
                },
                destinations: sampleDestinations,
              );
            },
          ),
        ),
      ),
    );

    // Verify all 5 destination labels are rendered
    expect(find.text('Beranda'), findsOneWidget);
    expect(find.text('Tiket'), findsOneWidget);
    expect(find.text('Sparepart'), findsOneWidget);
    expect(find.text('Presensi'), findsOneWidget);
    expect(find.text('Profil'), findsOneWidget);

    // Verify badge count 3 is rendered
    expect(find.text('3'), findsOneWidget);

    // Tap on 'Tiket' (index 1)
    await tester.tap(find.text('Tiket'));
    await tester.pumpAndSettle();

    // Verify selection updated
    expect(selectedIndex, 1);
  });
}
