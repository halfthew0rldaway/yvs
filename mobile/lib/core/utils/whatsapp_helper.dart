import 'package:url_launcher/url_launcher.dart';
import '../../data/models/tiket_model.dart';
import 'currency_formatter.dart';

class WhatsAppHelper {
  static const Map<String, List<String>> maintenanceTips = {
    'Baterai': [
      'Hindari menggunakan laptop di atas kasur/bantal agar sirkulasi udara tidak tersumbat.',
      'Cobalah untuk tidak mengisi daya terus-menerus saat baterai sudah 100%.',
      'Jangan biarkan baterai habis total (0%) terlalu sering.',
    ],
    'SSD / Storage': [
      'Sisakan kapasitas penyimpanan minimal 15-20% agar kecepatan SSD tetap optimal.',
      'Hindari mematikan perangkat secara paksa (shutdown via tombol power) saat proses simpan data.',
      'Lakukan backup berkala untuk data-data penting Anda.',
    ],
    'Layar / LCD': [
      'Bersihkan layar menggunakan kain microfiber halus (hindari cairan berbahan alkohol keras).',
      'Hindari menutup layar laptop dengan benda keras (pulpen/headset) di atas keyboard.',
      'Buka dan tutup engsel layar dari bagian tengah, bukan dari pojok.',
    ],
    'Pembersihan & Thermal Paste': [
      'Bersihkan debu ventilasi udara secara berkala.',
      'Disarankan melakukan repaste dan servis pembersihan berkala setiap 6-12 bulan.',
      'Pastikan kipas pendingin berputar lancar saat perangkat digunakan.',
    ],
    'Software / OS': [
      'Rutin lakukan update sistem operasi dan antivirus.',
      'Hindari mengunduh file atau software dari sumber yang tidak terpercaya.',
      'Bersihkan file temporary/cache secara berkala.',
    ],
    'Umum': [
      'Gunakan charger original atau berkualitas tinggi sesuai spesifikasi perangkat.',
      'Simpan perangkat di tempat kering dan terhindar dari paparan matahari langsung.',
      'Gunakan tas laptop bermaterial tebal saat bepergian.',
    ],
  };

  static String _formatPhone(String? phone) {
    if (phone == null || phone.isEmpty) return '';
    String cleaned = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (cleaned.startsWith('0')) {
      cleaned = '62${cleaned.substring(1)}';
    }
    return cleaned;
  }

  static String? generateStatusWaLink(TiketModel tiket) {
    final customer = tiket.perangkat?.customer;
    if (customer == null) return null;
    final phone = _formatPhone(customer.nomorTelepon);
    if (phone.isEmpty) return null;

    final deviceName = '${tiket.perangkat?.merek ?? ''} ${tiket.perangkat?.model ?? ''}'.trim();
    String text = '';

    if (tiket.status == 'menunggu_persetujuan') {
      final masalah = tiket.diagnosis?.masalah ?? 'Telah kami periksa (Hubungi admin untuk detail)';
      final solusi = tiket.diagnosis?.solusi ?? 'Menunggu konfirmasi tindakan lebih lanjut';
      final estimasi = CurrencyFormatter.formatRupiah(tiket.diagnosis?.estimasiBiaya ?? 0);

      text = 'Halo kak ${customer.nama},\n\n'
          'Terkait perangkat *$deviceName* dengan nomor tiket *${tiket.nomorTiket}*, teknisi kami telah selesai melakukan pengecekan.\n\n'
          '*Hasil Diagnosis:*\n'
          'Masalah: $masalah\n'
          'Solusi: $solusi\n\n'
          '*Estimasi Biaya:* $estimasi\n\n'
          'Apakah perbaikan ingin dilanjutkan? Mohon konfirmasinya ya kak. Terima kasih!';
    } else if (tiket.status == 'selesai') {
      final totalBiaya = tiket.invoice != null
          ? '\n*Total Tagihan:* ${CurrencyFormatter.formatRupiah(tiket.invoice!.totalBiaya)}\n'
          : '';

      text = 'Halo kak ${customer.nama},\n\n'
          'Kabar gembira! Perbaikan perangkat *$deviceName* milik kakak dengan nomor tiket *${tiket.nomorTiket}* telah selesai dikerjakan oleh teknisi kami. 🎉\n'
          '$totalBiaya'
          'Perangkat sudah bisa diambil di toko pada jam operasional kami. Mohon tunjukkan nomor tiket ini saat pengambilan.\n\n'
          'Terima kasih telah mempercayakan perbaikan perangkat Anda kepada kami! 🙏';
    }

    if (text.isEmpty) return null;
    return 'https://wa.me/$phone?text=${Uri.encodeComponent(text)}';
  }

  static String? generateWarrantyWaLink(TiketModel tiket) {
    final customer = tiket.perangkat?.customer;
    if (customer == null) return null;
    final phone = _formatPhone(customer.nomorTelepon);
    if (phone.isEmpty) return null;

    final deviceName = '${tiket.perangkat?.merek ?? ''} ${tiket.perangkat?.model ?? ''}'.trim();
    final kategori = tiket.kategoriPerbaikan ?? 'Umum';
    final durasi = tiket.durasiGaransi ?? '1 Bulan';
    final tips = maintenanceTips[kategori] ?? maintenanceTips['Umum']!;
    final tipsText = tips.asMap().entries.map((e) => '${e.key + 1}. ${e.value}').join('\n');

    String expiredInfo = '';
    if (tiket.warrantyStatus?.garansiBerakhirAt != null) {
      final expFormatted = CurrencyFormatter.formatDateOnly(tiket.warrantyStatus!.garansiBerakhirAt);
      expiredInfo = '\n📅 Garansi Berlaku Hingga: *$expFormatted*';
    }

    final text = 'Halo kak ${customer.nama},\n\n'
        'Terima kasih telah melakukan perbaikan perangkat *$deviceName* (No. Tiket: *${tiket.nomorTiket}*) di Serv.io Workshop. 🎉\n\n'
        '*Info Garansi Perbaikan:*\n'
        '🛡️ Durasi Garansi: *$durasi*$expiredInfo\n'
        '*(Garansi berlaku untuk perbaikan / sparepart yang diganti)*\n\n'
        '💡 *Tips Perawatan Perangkat ($kategori):*\n'
        '$tipsText\n\n'
        'Jika ada kendala selama masa garansi, jangan ragu untuk menghubungi kami atau membawa kembali unit ke toko. Semoga perangkatnya awet dan lancar selalu ya kak! 🙏';

    return 'https://wa.me/$phone?text=${Uri.encodeComponent(text)}';
  }

  static String? generateReminderWaLink(TiketModel tiket, int months) {
    final customer = tiket.perangkat?.customer;
    if (customer == null) return null;
    final phone = _formatPhone(customer.nomorTelepon);
    if (phone.isEmpty) return null;

    final deviceName = '${tiket.perangkat?.merek ?? ''} ${tiket.perangkat?.model ?? ''}'.trim();

    final text = 'Halo kak ${customer.nama},\n\n'
        'Kami dari Serv.io Workshop ingin mengingatkan kembali terkait perangkat *$deviceName* milik kakak dengan nomor tiket *${tiket.nomorTiket}*.\n\n'
        'Perangkat kakak telah selesai diperbaiki sejak $months bulan yang lalu dan saat ini masih berada di workshop kami. Mohon kesediaannya untuk segera mengambil perangkat tersebut pada jam operasional kami.\n\n'
        'Apabila ada kendala dalam pengambilan, mohon konfirmasikan kepada kami. Terima kasih! 🙏';

    return 'https://wa.me/$phone?text=${Uri.encodeComponent(text)}';
  }

  static Future<bool> openChat(String? phone, {String? message}) async {
    final clean = _formatPhone(phone);
    if (clean.isEmpty) return false;
    String url = 'https://wa.me/$clean';
    if (message != null && message.isNotEmpty) {
      url += '?text=${Uri.encodeComponent(message)}';
    }
    return openUrl(url);
  }

  static Future<bool> openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      return await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
    return false;
  }
}

