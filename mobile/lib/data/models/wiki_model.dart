class WikiModel {
  final int id;
  final int? brandId;
  final String? merek;
  final String? modelSeri;
  final String kategori;
  final String judul;
  final String gejala;
  final String? penyebab;
  final String solusiLangkah;
  final String? komponenTerkait;
  final String tingkatKesulitan;
  final String? estimasiWaktu;
  final int tingkatSukses;
  final int? sumberTiketId;
  final String? createdAt;
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? brand;

  WikiModel({
    required this.id,
    this.brandId,
    this.merek,
    this.modelSeri,
    required this.kategori,
    required this.judul,
    required this.gejala,
    this.penyebab,
    required this.solusiLangkah,
    this.komponenTerkait,
    this.tingkatKesulitan = 'Menengah',
    this.estimasiWaktu = '1-2 Jam',
    this.tingkatSukses = 90,
    this.sumberTiketId,
    this.createdAt,
    this.user,
    this.brand,
  });

  String get authorName => user?['nama']?.toString() ?? 'Tim Serv.io';
  String get brandName => brand?['nama']?.toString() ?? merek ?? 'Umum';

  factory WikiModel.fromJson(Map<String, dynamic> json) {
    return WikiModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      brandId: json['brand_id'] is int ? json['brand_id'] : int.tryParse(json['brand_id']?.toString() ?? ''),
      merek: json['merek']?.toString(),
      modelSeri: json['model_seri']?.toString(),
      kategori: json['kategori']?.toString() ?? 'Motherboard / Power',
      judul: json['judul']?.toString() ?? '',
      gejala: json['gejala']?.toString() ?? '',
      penyebab: json['penyebab']?.toString(),
      solusiLangkah: json['solusi_langkah']?.toString() ?? '',
      komponenTerkait: json['komponen_terkait']?.toString(),
      tingkatKesulitan: json['tingkat_kesulitan']?.toString() ?? 'Menengah',
      estimasiWaktu: json['estimasi_waktu']?.toString() ?? '1-2 Jam',
      tingkatSukses: json['tingkat_sukses'] is int
          ? json['tingkat_sukses']
          : int.tryParse(json['tingkat_sukses']?.toString() ?? '90') ?? 90,
      sumberTiketId: json['sumber_tiket_id'] is int ? json['sumber_tiket_id'] : int.tryParse(json['sumber_tiket_id']?.toString() ?? ''),
      createdAt: json['created_at']?.toString(),
      user: json['user'] is Map<String, dynamic> ? json['user'] : null,
      brand: json['brand'] is Map<String, dynamic> ? json['brand'] : null,
    );
  }
}

