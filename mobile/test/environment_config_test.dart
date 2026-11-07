import 'package:flutter_test/flutter_test.dart';
import 'package:servio_companion/core/constants/api_constants.dart';
import 'package:servio_companion/core/constants/checklist_items.dart';

void main() {
  group('ApiConstants environment wiring', () {
    test('baseUrl never falls back to a hardcoded local / private host', () {
      final url = ApiConstants.baseUrl;

      expect(url, isNotEmpty);
      expect(url.endsWith('/api'), isTrue);
      expect(url.contains('localhost'), isFalse);
      expect(url.contains('127.0.0.1'), isFalse);
      expect(url.contains('10.0.2.2'), isFalse);
      expect(url.contains('192.168.'), isFalse);
    });

    test('assetBaseUrl strips the /api suffix from the API base url', () {
      expect(ApiConstants.assetBaseUrl.contains('/api'), isFalse);
      expect(ApiConstants.baseUrl.startsWith(ApiConstants.assetBaseUrl), isTrue);
    });

    test('resolveImageUrl keeps absolute urls and prefixes relative paths', () {
      const absolute = 'https://example.com/foto.jpg';
      expect(ApiConstants.resolveImageUrl(absolute), absolute);

      final resolved = ApiConstants.resolveImageUrl('uploads/foto.jpg');
      expect(resolved, '${ApiConstants.assetBaseUrl}/uploads/foto.jpg');
    });

    test('environmentFingerprint isolates offline cache per backend', () {
      final fingerprint = ApiConstants.environmentFingerprint;

      // Tidak boleh mengandung karakter yang memecah key cache.
      expect(RegExp(r'[:/.]').hasMatch(fingerprint), isFalse);
      expect(fingerprint.contains(AppEnvironment.name), isTrue);
    });
  });

  group('ChecklistData follows staging payload', () {
    test('uses stored ticket checklist keys instead of the local template', () {
      final stored = <String, dynamic>{
        'layar': true,
        'keyboard': false,
        'custom_backend_key': true,
      };

      final items = ChecklistData.resolveForTicket('Laptop', stored);

      expect(items.map((i) => i.key).toList(), ['layar', 'keyboard', 'custom_backend_key']);
      // Key dikenal memakai label lokal, key asing tetap ditampilkan.
      expect(items[0].label, 'Layar / LCD');
      expect(items[2].label, 'custom backend key');
    });

    test('falls back to the device template when the ticket has no checklist yet', () {
      final items = ChecklistData.resolveForTicket('Laptop', null);

      expect(items, isNotEmpty);
      expect(items.map((i) => i.key).toList(), ChecklistData.laptopItems.map((i) => i.key).toList());
    });
  });
}