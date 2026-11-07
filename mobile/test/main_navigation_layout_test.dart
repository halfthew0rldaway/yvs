import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:servio_companion/features/navigation/diagonal_floating_dock.dart';

/// Regression guard for the blank-screen + only-navbar bug:
/// an unconstrained Align around the dock inside bottomNavigationBar
/// expands to fill the Scaffold slot and starves the body.
///
/// This pins the layout contract: the SizedBox(height: stackHeight)
/// contract of ScoopedFloatingDock must survive inside the same
/// Align > ConstrainedBox > Padding chain used by MainNavigationScreen,
/// leaving room for the body above it.
void main() {
  Widget buildShell() {
    const destinations = [
      NavDestination(index: 0, label: 'Beranda', icon: Icons.dashboard_outlined, selectedIcon: Icons.dashboard_rounded),
      NavDestination(index: 1, label: 'Handover', icon: Icons.handshake_outlined, selectedIcon: Icons.handshake_rounded),
      NavDestination(index: 2, label: 'Tiket', icon: Icons.assignment_outlined, selectedIcon: Icons.assignment_rounded),
      NavDestination(index: 3, label: 'Profil', icon: Icons.person_outline_rounded, selectedIcon: Icons.person_rounded),
    ];
    return MaterialApp(
      home: Scaffold(
        body: const Center(child: Text('BODY-CONTENT')),
        bottomNavigationBar: SafeArea(
          top: false,
          bottom: true,
          child: Align(
            alignment: Alignment.bottomCenter,
            heightFactor: 1.0,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 540),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: ScoopedFloatingDock(
                  currentIndex: 0,
                  onItemSelected: (_) {},
                  onCenterAction: () {},
                  destinations: destinations,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  testWidgets('dock bar wraps content, body stays visible', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(buildShell());
    await tester.pumpAndSettle();

    expect(find.text('BODY-CONTENT'), findsOneWidget);
    expect(find.text('Beranda'), findsOneWidget);

    final bodySize = tester.getSize(find.text('BODY-CONTENT'));
    expect(bodySize.height, greaterThan(0));

    // The bottom bar must wrap the 92px dock (+padding), never balloon
    // to fill the whole screen (which starved the IndexedStack body).
    final barSize = tester.getSize(find.byType(ScoopedFloatingDock));
    expect(barSize.height, lessThan(200));
  });
}
