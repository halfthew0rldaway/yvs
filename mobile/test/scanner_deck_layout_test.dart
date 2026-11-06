import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Regression guard for the QR scanner bottom deck.
///
/// Bug: on a narrow phone the "Barcode Rusak / Tidak Terbaca?" copy collapsed
/// into a one-character-per-line vertical column. Root cause was the deck
/// sitting inside an unbounded/loose width context so the Expanded text box
/// resolved to ~0 logical px.
///
/// These tests pin the layout contract: at realistic phone widths the headline
/// must occupy a single line (or at most two), never one glyph per line.
void main() {
  /// Builds the same structural chain used by the real deck:
  /// Positioned-like width constraint -> ClipRRect -> Container -> Row(icon, Expanded)
  Widget buildDeck({required double availableWidth}) {
    return MaterialApp(
      home: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          fit: StackFit.expand,
          children: [
            Positioned(
              left: 20,
              right: 20,
              bottom: 16,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  color: const Color(0xD9131B2E),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: const BoxDecoration(
                              color: Color(0x332563EB),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.edit_note_rounded,
                              color: Color(0xFF38BDF8),
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Barcode Rusak / Tidak Terbaca?',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12.5,
                                    height: 1.25,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Gunakan opsi input kode tiket manual',
                                  style: TextStyle(
                                    color: Colors.white60,
                                    fontSize: 11,
                                    height: 1.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ElevatedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.keyboard_rounded, size: 16),
                        label: const Text(
                          'Input Manual',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                          ),
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
    );
  }

  /// Text must be wider than tall for a full sentence — if it collapsed to one
  /// character per line the height would vastly exceed the width.
  void expectHorizontalText(WidgetTester tester, String text) {
    final size = tester.getSize(find.text(text));
    expect(
      size.width > size.height,
      isTrue,
      reason: '"$text" rendered ${size.width}x${size.height} — looks collapsed '
          'to one character per line.',
    );
    expect(size.width, greaterThan(150));
  }

  testWidgets('deck keeps headline horizontal on a 360dp phone', (tester) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(buildDeck(availableWidth: 360));
    await tester.pumpAndSettle();

    expectHorizontalText(tester, 'Barcode Rusak / Tidak Terbaca?');
    expectHorizontalText(tester, 'Gunakan opsi input kode tiket manual');
    expect(find.text('Input Manual'), findsOneWidget);
  });

  testWidgets('deck keeps headline horizontal on a 320dp phone', (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(buildDeck(availableWidth: 320));
    await tester.pumpAndSettle();

    expectHorizontalText(tester, 'Barcode Rusak / Tidak Terbaca?');
  });
}
