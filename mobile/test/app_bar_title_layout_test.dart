import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Regression guard for AppBar titles built as `Row([fixed icon, SizedBox, Column])`.
///
/// Bug: the `Column` had no horizontal constraint inside the Row, so on a
/// 360dp phone the subtitle line ("Selfie & Geofencing GPS", "Handover & Tanda
/// Tangan Pelanggan") demanded more width than the AppBar title slot and the
/// whole bar threw a RenderFlex horizontal overflow.
///
/// Contract pinned here: the `Column` must sit inside an `Expanded`, and its
/// text must ellipsize instead of overflowing.
void main() {
  /// Mirrors the real structure minus the surrounding app shell.
  Widget buildScaffold({required Widget title, List<Widget> actions = const []}) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          titleSpacing: 16,
          title: title,
          actions: [...actions, const SizedBox(width: 12)],
        ),
      ),
    );
  }

  void useNarrowPhone(WidgetTester tester) {
    // Xiaomi 25028RN03A: 720x1640 @ 320dpi == 360x820 logical pixels.
    tester.view.physicalSize = const Size(360, 820);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
  }

  testWidgets('app bar title with icon + two-line column fits a 360dp phone',
      (tester) async {
    useNarrowPhone(tester);

    await tester.pumpWidget(buildScaffold(
      // Deliberately the longest strings used by the real screens.
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.pin_drop_rounded, size: 20),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Presensi Workshop',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
                Text(
                  'Selfie & Geofencing GPS',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [IconButton(onPressed: () {}, icon: const Icon(Icons.qr_code_scanner))],
    ));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Presensi Workshop'), findsOneWidget);
    expect(find.text('Selfie & Geofencing GPS'), findsOneWidget);
  });

  testWidgets('app bar title survives a very long user name', (tester) async {
    useNarrowPhone(tester);

    const longName = 'Muhammad Rizky Firmansyah Pratama Wijaya Kusuma';
    await tester.pumpWidget(buildScaffold(
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(
              color: Color(0xFFEFF6FF),
              borderRadius: BorderRadius.all(Radius.circular(8)),
            ),
            child: const Icon(Icons.computer, size: 24),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Yangversa Workshop',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
                Text(
                  'Meja Kerja: $longName',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    ));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.text('Meja Kerja: $longName'), findsOneWidget);
  });
}
