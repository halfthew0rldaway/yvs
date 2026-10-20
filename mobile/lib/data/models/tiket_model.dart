class CustomerModel {
  final int id;
  final String nama;
  final String nomorTelepon;
  final String? alamat;

  CustomerModel({
    required this.id,
    required this.nama,
    required this.nomorTelepon,
    this.alamat,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      nama: json['nama']?.toString() ?? '-',
      nomorTelepon: json['nomor_telepon']?.toString() ?? '-',
      alamat: json['alamat']?.toString(),
    );
  }
}

class PerangkatModel {
  final int id;
  final String jenisPerangkat;
  final String merek;
  final String model;
  final String? serialNumber;
  final CustomerModel? customer;
  final List<dynamic>? tiketServis;

  PerangkatModel({
    required this.id,
    required this.jenisPerangkat,
    required this.merek,
    required this.model,
    this.serialNumber,
    this.customer,
    this.tiketServis,
  });

  factory PerangkatModel.fromJson(Map<String, dynamic> json) {
    return PerangkatModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      jenisPerangkat: json['jenis_perangkat']?.toString() ?? 'Perangkat',
      merek: json['merek']?.toString() ?? '',
      model: json['model']?.toString() ?? '',
      serialNumber: json['serial_number']?.toString(),
      customer: json['customer'] != null ? CustomerModel.fromJson(json['customer']) : null,
      tiketServis: json['tiket_servis'] as List<dynamic>?,
    );
  }
}

class DiagnosisModel {
  final int id;
  final int tiketId;
  final String masalah;
  final String solusi;
  final double estimasiBiaya;
  final String? createdAt;

  DiagnosisModel({
    required this.id,
    required this.tiketId,
    required this.masalah,
    required this.solusi,
    required this.estimasiBiaya,
    this.createdAt,
  });

  factory DiagnosisModel.fromJson(Map<String, dynamic> json) {
    return DiagnosisModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      tiketId: json['tiket_id'] is int ? json['tiket_id'] : int.tryParse(json['tiket_id'].toString()) ?? 0,
      masalah: json['masalah']?.toString() ?? '',
      solusi: json['solusi']?.toString() ?? '',
      estimasiBiaya: json['estimasi_biaya'] != null ? double.tryParse(json['estimasi_biaya'].toString()) ?? 0.0 : 0.0,
      createdAt: json['created_at']?.toString(),
    );
  }
}

class LogPerbaikanModel {
  final int id;
  final int tiketId;
  final String fase;
  final String catatan;
  final String? fotoUrl;
  final String? createdAt;

  LogPerbaikanModel({
    required this.id,
    required this.tiketId,
    required this.fase,
    required this.catatan,
    this.fotoUrl,
    this.createdAt,
  });

  factory LogPerbaikanModel.fromJson(Map<String, dynamic> json) {
    return LogPerbaikanModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      tiketId: json['tiket_id'] is int ? json['tiket_id'] : int.tryParse(json['tiket_id'].toString()) ?? 0,
      fase: json['fase']?.toString() ?? 'Perbaikan',
      catatan: json['catatan']?.toString() ?? '',
      fotoUrl: json['foto_url']?.toString(),
      createdAt: json['created_at']?.toString(),
    );
  }
}

class PenggunaanSparepartModel {
  final int id;
  final int tiketId;
  final int sparepartId;
  final int jumlah;
  final Map<String, dynamic>? sparepart;

  PenggunaanSparepartModel({
    required this.id,
    required this.tiketId,
    required this.sparepartId,
    required this.jumlah,
    this.sparepart,
  });

  String get sparepartNama => sparepart?['nama']?.toString() ?? 'Sparepart';
  String get sparepartBrand {
    final brand = sparepart?['brand'];
    if (brand is Map && brand['nama'] != null) return brand['nama'].toString();
    return '';
  }
  double get hargaSatuan {
    if (sparepart != null && sparepart!['harga'] != null) {
      return double.tryParse(sparepart!['harga'].toString()) ?? 0.0;
    }
    return 0.0;
  }
  double get subtotal => hargaSatuan * jumlah;

  factory PenggunaanSparepartModel.fromJson(Map<String, dynamic> json) {
    return PenggunaanSparepartModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      tiketId: json['tiket_id'] is int ? json['tiket_id'] : int.tryParse(json['tiket_id'].toString()) ?? 0,
      sparepartId: json['sparepart_id'] is int ? json['sparepart_id'] : int.tryParse(json['sparepart_id'].toString()) ?? 0,
      jumlah: json['jumlah'] is int ? json['jumlah'] : int.tryParse(json['jumlah'].toString()) ?? 1,
      sparepart: json['sparepart'] is Map<String, dynamic> ? json['sparepart'] : null,
    );
  }
}

class TeknisiModel {
  final int id;
  final String nama;
  final String? email;

  TeknisiModel({required this.id, required this.nama, this.email});

  factory TeknisiModel.fromJson(Map<String, dynamic> json) {
    return TeknisiModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      nama: json['nama']?.toString() ?? '',
      email: json['email']?.toString(),
    );
  }
}

class InvoiceModel {
  final double biayaJasa;
  final double biayaSparepart;
  final double totalBiaya;

  InvoiceModel({
    required this.biayaJasa,
    required this.biayaSparepart,
    required this.totalBiaya,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    return InvoiceModel(
      biayaJasa: _parseDouble(json['biaya_jasa']),
      biayaSparepart: _parseDouble(json['biaya_sparepart']),
      totalBiaya: _parseDouble(json['total_biaya']),
    );
  }

  static double _parseDouble(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    return double.tryParse(val.toString()) ?? 0.0;
  }
}

class WarrantyStatusModel {
  final bool isExpired;
  final int sisaHari;
  final int lewatHari;
  final String? garansiBerakhirAt;

  WarrantyStatusModel({
    required this.isExpired,
    required this.sisaHari,
    required this.lewatHari,
    this.garansiBerakhirAt,
  });

  factory WarrantyStatusModel.fromJson(Map<String, dynamic> json) {
    return WarrantyStatusModel(
      isExpired: json['isExpired'] == true,
      sisaHari: json['sisaHari'] is int ? json['sisaHari'] : int.tryParse(json['sisaHari']?.toString() ?? '0') ?? 0,
      lewatHari: json['lewatHari'] is int ? json['lewatHari'] : int.tryParse(json['lewatHari']?.toString() ?? '0') ?? 0,
      garansiBerakhirAt: json['garansi_berakhir_at']?.toString(),
    );
  }
}

class TiketModel {
  final int id;
  final String nomorTiket;
  final int perangkatId;
  final int? teknisiId;
  final String keluhan;
  final String? kelengkapan;
  final dynamic fotoKondisi;
  final String status;
  final String? createdAt;
  final String? completedAt;
  final String? tipeKunci;
  final String? passwordPerangkat;
  final Map<String, dynamic>? checklistIntake;
  final Map<String, dynamic>? checklistQc;
  final String? kategoriPerbaikan;
  final String? durasiGaransi;
  final PerangkatModel? perangkat;
  final TeknisiModel? teknisiModel;
  final Map<String, dynamic>? teknisi;
  final DiagnosisModel? diagnosis;
  final List<LogPerbaikanModel>? logPerbaikan;
  final List<PenggunaanSparepartModel>? penggunaanSparepart;
  final InvoiceModel? invoice;
  final WarrantyStatusModel? warrantyStatus;
  final String? catatanAdmin;
  final String? tglDiambil;
  final double? ratingTeknisi;
  final String? lastReminderSent;

  TiketModel({
    required this.id,
    required this.nomorTiket,
    required this.perangkatId,
    this.teknisiId,
    required this.keluhan,
    this.kelengkapan,
    this.fotoKondisi,
    required this.status,
    this.createdAt,
    this.completedAt,
    this.tipeKunci,
    this.passwordPerangkat,
    this.checklistIntake,
    this.checklistQc,
    this.kategoriPerbaikan,
    this.durasiGaransi,
    this.perangkat,
    this.teknisiModel,
    this.teknisi,
    this.diagnosis,
    this.logPerbaikan,
    this.penggunaanSparepart,
    this.invoice,
    this.warrantyStatus,
    this.catatanAdmin,
    this.tglDiambil,
    this.ratingTeknisi,
    this.lastReminderSent,
  });

  /// Parse foto_kondisi which can be a JSON string, a List, or null
  List<String> get fotoKondisiList {
    if (fotoKondisi == null) return [];
    if (fotoKondisi is List) {
      return (fotoKondisi as List).map((e) => e.toString()).toList();
    }
    if (fotoKondisi is String) {
      final str = fotoKondisi as String;
      if (str.isEmpty) return [];
      // Try parsing as JSON array
      try {
        if (str.startsWith('[')) {
          final parsed = _tryParseJsonList(str);
          if (parsed != null) return parsed;
        }
        // Single URL
        return [str];
      } catch (_) {
        return [str];
      }
    }
    return [];
  }

  static List<String>? _tryParseJsonList(String str) {
    try {
      // Manual safe parse since we can't import dart:convert in model easily
      // The API returns JSON arrays like ["url1","url2"]
      final cleaned = str.substring(1, str.length - 1); // remove [ ]
      if (cleaned.isEmpty) return [];
      return cleaned.split(',').map((s) {
        var trimmed = s.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          trimmed = trimmed.substring(1, trimmed.length - 1);
        }
        return trimmed;
      }).where((s) => s.isNotEmpty).toList();
    } catch (_) {
      return null;
    }
  }

  /// Service history from the same device
  List<Map<String, dynamic>> get serviceHistory {
    final history = perangkat?.tiketServis;
    if (history == null || history.isEmpty) return [];
    return history
        .where((t) => t is Map<String, dynamic> && t['id'] != id)
        .cast<Map<String, dynamic>>()
        .toList();
  }

  String get teknisiNama {
    if (teknisiModel != null) return teknisiModel!.nama;
    if (teknisi != null) return teknisi!['nama']?.toString() ?? 'Belum Ditugaskan';
    return 'Belum Ditugaskan';
  }

  factory TiketModel.fromJson(Map<String, dynamic> json) {
    List<LogPerbaikanModel>? logs;
    if (json['log_perbaikan'] is List) {
      logs = (json['log_perbaikan'] as List)
          .map((item) => LogPerbaikanModel.fromJson(item))
          .toList();
    }

    List<PenggunaanSparepartModel>? parts;
    if (json['penggunaan_sparepart'] is List) {
      parts = (json['penggunaan_sparepart'] as List)
          .map((item) => PenggunaanSparepartModel.fromJson(item))
          .toList();
    }

    // Parse teknisi as both TeknisiModel and raw Map
    TeknisiModel? teknisiModel;
    Map<String, dynamic>? teknisiRaw;
    if (json['teknisi'] is Map<String, dynamic>) {
      teknisiRaw = json['teknisi'];
      teknisiModel = TeknisiModel.fromJson(json['teknisi']);
    }

    // Parse invoice
    InvoiceModel? invoice;
    if (json['invoice'] is Map<String, dynamic>) {
      invoice = InvoiceModel.fromJson(json['invoice']);
    }

    // Parse warranty_status
    WarrantyStatusModel? warrantyStatus;
    if (json['warranty_status'] is Map<String, dynamic>) {
      warrantyStatus = WarrantyStatusModel.fromJson(json['warranty_status']);
    }

    return TiketModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      nomorTiket: json['nomor_tiket']?.toString() ?? '',
      perangkatId: json['perangkat_id'] is int ? json['perangkat_id'] : int.tryParse(json['perangkat_id'].toString()) ?? 0,
      teknisiId: json['teknisi_id'] != null ? int.tryParse(json['teknisi_id'].toString()) : null,
      keluhan: json['keluhan']?.toString() ?? '',
      kelengkapan: json['kelengkapan']?.toString(),
      fotoKondisi: json['foto_kondisi'],
      status: json['status']?.toString() ?? 'diterima',
      createdAt: json['created_at']?.toString(),
      completedAt: json['completed_at']?.toString(),
      tipeKunci: json['tipe_kunci']?.toString() ?? 'Tidak Ada',
      passwordPerangkat: json['password_perangkat']?.toString(),
      checklistIntake: json['checklist_intake'] is Map<String, dynamic> ? json['checklist_intake'] : null,
      checklistQc: json['checklist_qc'] is Map<String, dynamic> ? json['checklist_qc'] : null,
      kategoriPerbaikan: json['kategori_perbaikan']?.toString(),
      durasiGaransi: json['durasi_garansi']?.toString(),
      perangkat: json['perangkat'] != null ? PerangkatModel.fromJson(json['perangkat']) : null,
      teknisiModel: teknisiModel,
      teknisi: teknisiRaw,
      diagnosis: json['diagnosis'] != null ? DiagnosisModel.fromJson(json['diagnosis']) : null,
      logPerbaikan: logs,
      penggunaanSparepart: parts,
      invoice: invoice,
      warrantyStatus: warrantyStatus,
      catatanAdmin: json['catatan_admin']?.toString(),
      tglDiambil: json['tgl_diambil']?.toString(),
      ratingTeknisi: json['rating_teknisi'] != null ? double.tryParse(json['rating_teknisi'].toString()) : null,
      lastReminderSent: json['last_reminder_sent']?.toString(),
    );
  }
}
