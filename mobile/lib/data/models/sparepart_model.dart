class SparepartModel {
  final int id;
  final String nama;
  final String kategori;
  final int stok;
  final double harga;
  final Map<String, dynamic>? brand;

  SparepartModel({
    required this.id,
    required this.nama,
    required this.kategori,
    required this.stok,
    required this.harga,
    this.brand,
  });

  String get displayName {
    if (brand != null && brand!['nama'] != null && brand!['nama'].toString().toLowerCase() != 'lainnya') {
      return '${brand!['nama']} $nama';
    }
    return nama;
  }

  factory SparepartModel.fromJson(Map<String, dynamic> json) {
    return SparepartModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      nama: json['nama']?.toString() ?? '',
      kategori: json['kategori']?.toString() ?? 'Umum',
      stok: json['stok'] is int ? json['stok'] : int.tryParse(json['stok'].toString()) ?? 0,
      harga: json['harga'] != null ? double.tryParse(json['harga'].toString()) ?? 0.0 : 0.0,
      brand: json['brand'] is Map<String, dynamic> ? json['brand'] : null,
    );
  }
}

