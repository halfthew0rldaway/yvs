import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:servio_technician/data/models/sparepart_model.dart';

void main() {
  test('parse all spareparts from backend', () async {
    final process = await Process.run('node', [
      '-e',
      'const p = require("../backend/src/config/database"); p.sparepart.findMany({ include: { brand: true } }).then(s => { console.log(JSON.stringify(s)); process.exit(0); })'
    ]);
    final List<dynamic> list = jsonDecode(process.stdout);
    expect(list.isNotEmpty, true);
    for (final item in list) {
      final model = SparepartModel.fromJson(item as Map<String, dynamic>);
      expect(model.id > 0, true);
      expect(model.nama.isNotEmpty, true);
      expect(model.displayName.isNotEmpty, true);
    }
  });
}

