import 'package:flutter_test/flutter_test.dart';
import 'package:servio_companion/data/models/sparepart_model.dart';

void main() {
  test('SparepartModel.fromJson parses complete data and calculates displayName correctly', () {
    final Map<String, dynamic> sampleData = {
      'id': 42,
      'kode': 'SSD-NVME-512',
      'nama': 'SSD NVMe 512GB M.2',
      'kategori': 'Storage',
      'stok': 5,
      'stok_minimum': 2,
      'harga': 450000,
      'brand': {
        'id': 3,
        'nama': 'Kingston',
      },
    };

    final model = SparepartModel.fromJson(sampleData);

    expect(model.id, 42);
    expect(model.nama, 'SSD NVMe 512GB M.2');
    expect(model.stok, 5);
    expect(model.brand?['nama'], 'Kingston');
    expect(model.displayName, 'Kingston SSD NVMe 512GB M.2');
    expect(model.harga, 450000.0);
  });

  test('SparepartModel.fromJson handles null brand gracefully', () {
    final Map<String, dynamic> sampleData = {
      'id': 101,
      'kode': 'THML-PST',
      'nama': 'Thermal Paste Arctic MX-4',
      'kategori': 'Pasta',
      'stok': 0,
      'stok_minimum': 3,
      'harga': 85000,
      'brand': null,
    };

    final model = SparepartModel.fromJson(sampleData);

    expect(model.id, 101);
    expect(model.brand, null);
    expect(model.displayName, 'Thermal Paste Arctic MX-4');
    expect(model.stok, 0);
  });
}

