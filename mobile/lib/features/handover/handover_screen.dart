import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/whatsapp_helper.dart';
import '../../core/widgets/digital_signature_pad.dart';
import '../../core/widgets/offline_banner.dart';
import '../../data/models/tiket_model.dart';
import '../../data/providers/attendance_provider.dart';
import '../../data/providers/auth_provider.dart';
import '../scanner/qr_scanner_screen.dart';

class HandoverScreen extends ConsumerStatefulWidget {
  const HandoverScreen({super.key});

  @override
  ConsumerState<HandoverScreen> createState() => _HandoverScreenState();
}

class _HandoverScreenState extends ConsumerState<HandoverScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<TiketModel> _tickets = [];
  bool _isLoading = true;
  bool _isFromCache = false;
  String _cachedTime = '';
  String _filterMode = 'selesai'; // 'selesai' = Siap Diambil, 'diambil' = Riwayat Diambil

  @override
  void initState() {
    super.initState();
    _loadHandoverTickets();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadHandoverTickets({bool forceRefresh = false}) async {
    setState(() => _isLoading = true);
    try {
      final client = ApiClient();
      final res = await client.getWithCache(
        ApiConstants.tickets,
        queryParameters: {'status': _filterMode},
        forceRefresh: forceRefresh,
      );

      dynamic rawData = res.data;
      if (rawData is Map && rawData['data'] is List) {
        rawData = rawData['data'];
      }

      if (rawData is List) {
        final list = rawData
            .map((item) {
              try {
                return TiketModel.fromJson(item as Map<String, dynamic>);
              } catch (_) {
                return null;
              }
            })
            .whereType<TiketModel>()
            .toList();

        if (mounted) {
          setState(() {
            _tickets = list;
            _isFromCache = res.isFromCache;
            _cachedTime = res.formattedTime;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        final String msg = (e is DioException && e.response?.data is Map && e.response?.data['message'] != null)
            ? e.response!.data['message'].toString()
            : 'Gagal memuat daftar unit handover';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  List<TiketModel> get _filteredTickets {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) return _tickets;
    return _tickets.where((t) {
      final matchNomor = t.nomorTiket.toLowerCase().contains(query);
      final matchCust = t.perangkat?.customer?.nama.toLowerCase().contains(query) ?? false;
      final matchPhone = t.perangkat?.customer?.nomorTelepon.contains(query) ?? false;
      final matchModel = '${t.perangkat?.merek} ${t.perangkat?.model}'.toLowerCase().contains(query);
      return matchNomor || matchCust || matchPhone || matchModel;
    }).toList();
  }

  void _openHandoverProcess(TiketModel tiket) {
    if (!AttendanceGuard.verifyOrPrompt(context, ref, actionName: 'memproses serah terima unit')) return;
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _HandoverBottomSheet(
        tiket: tiket,
        onSuccess: () {
          _loadHandoverTickets(forceRefresh: true);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final canAccessHandover = user?.role == 'frontman' || user?.role == 'admin' || user?.role == 'pimpinan';

    if (!canAccessHandover) {
      return Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: const Text('Meja Serah Terima'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: Color(0xFFFEF2F2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.shield_outlined, size: 48, color: AppTheme.error),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Akses Khusus Frontman & Admin',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Fitur Serah Terima (Handover) dan tanda tangan serah unit khusus ditujukan untuk Frontman (Service Advisor) dan Admin Meja Depan.\n\nSebagai Teknisi, silakan lanjutkan pekerjaan unit pada Meja Kerja Anda.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.handshake_outlined, color: AppTheme.primary, size: 20),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Serah Terima Unit',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  Text(
                    'Handover & Tanda Tangan Pelanggan',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_outlined, color: AppTheme.primary),
            tooltip: 'Pindai QR Tiket Pelanggan',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const QrScannerScreen()),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadHandoverTickets(forceRefresh: true),
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // Offline Banner jika membaca dari cache lokal
            if (_isFromCache)
              OfflineBanner(
                cachedTime: _cachedTime,
                onRefresh: () => _loadHandoverTickets(forceRefresh: true),
                isSyncing: _isLoading,
              ),

            // Search Bar & Scan Button
            Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(
                        hintText: 'Cari no tiket, nama, telepon...',
                        hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                        prefixIcon: Icon(Icons.search, size: 20, color: AppTheme.textMuted),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const QrScannerScreen()),
                    );
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withValues(alpha: 0.2),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.qr_code_scanner_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Filter Tabs (Siap Diambil vs Riwayat Diambil)
            Row(
              children: [
                _buildFilterChip(
                  label: 'Siap Diambil',
                  mode: 'selesai',
                  icon: Icons.check_circle_outline_rounded,
                ),
                const SizedBox(width: 8),
                _buildFilterChip(
                  label: 'Riwayat Diambil',
                  mode: 'diambil',
                  icon: Icons.history_rounded,
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Ticket List
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_filteredTickets.isEmpty)
              Container(
                padding: const EdgeInsets.all(28),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  children: [
                    Icon(
                      _filterMode == 'selesai' ? Icons.task_alt_rounded : Icons.history_rounded,
                      size: 40,
                      color: AppTheme.textMuted,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _filterMode == 'selesai'
                          ? 'Tidak ada unit servis yang siap diambil'
                          : 'Belum ada riwayat unit yang diambil',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textSecondary,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Unit berstatus "Selesai" dari teknisi akan otomatis masuk ke antrean ini.',
                      style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              )
            else
              ..._filteredTickets.map((tiket) => _buildHandoverCard(tiket)),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required String mode,
    required IconData icon,
  }) {
    final isSelected = _filterMode == mode;
    return InkWell(
      onTap: () {
        if (_filterMode != mode) {
          setState(() => _filterMode = mode);
          _loadHandoverTickets(forceRefresh: true);
        }
      },
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : AppTheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.border),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppTheme.primary.withValues(alpha: 0.2),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isSelected ? Colors.white : AppTheme.textSecondary,
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? Colors.white : AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHandoverCard(TiketModel tiket) {
    final customer = tiket.perangkat?.customer;
    final perangkat = tiket.perangkat;
    final totalBiaya = tiket.invoice?.totalBiaya ?? 0.0;
    final isDiambil = tiket.status == 'diambil';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x060F172A),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Tiket Number & Status Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.receipt_long_rounded, size: 16, color: AppTheme.primary),
                    const SizedBox(width: 6),
                    Text(
                      tiket.nomorTiket,
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isDiambil ? const Color(0xFFF1F5F9) : const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: isDiambil ? const Color(0xFFCBD5E1) : const Color(0xFFA7F3D0),
                    ),
                  ),
                  child: Text(
                    isDiambil ? 'SUDAH DISERAHKAN' : 'SIAP DIAMBIL',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: isDiambil ? const Color(0xFF475569) : const Color(0xFF047857),
                    ),
                  ),
                ),
              ],
            ),
            const Divider(height: 18, color: AppTheme.border),

            // Customer & Device Info
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        customer?.nama ?? 'Pelanggan',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${perangkat?.merek ?? ""} ${perangkat?.model ?? "Perangkat"}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                if (customer?.nomorTelepon != null && customer!.nomorTelepon.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18, color: Color(0xFF10B981)),
                    onPressed: () {
                      WhatsAppHelper.openChat(
                        customer.nomorTelepon,
                        message: 'Halo Kak ${customer.nama}, unit servis ${perangkat?.merek} ${perangkat?.model} (No Tiket: ${tiket.nomorTiket}) sudah selesai dan siap diambil di workshop Serv.io.',
                      );
                    },
                    tooltip: 'Kirim WhatsApp',
                  ),
              ],
            ),
            const SizedBox(height: 10),

            // Financial Summary & Action Button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total Biaya Servis:',
                    style: TextStyle(fontSize: 11.5, color: AppTheme.textSecondary),
                  ),
                  Text(
                    CurrencyFormatter.formatRupiah(totalBiaya),
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Handover Action Button
            if (!isDiambil)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _openHandoverProcess(tiket),
                  icon: const Icon(Icons.draw_outlined, size: 16),
                  label: const Text('Proses Serah Terima (TTD Pelanggan)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                ),
              )
            else
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    tiket.tglDiambil != null ? 'Diambil: ${tiket.tglDiambil}' : 'Telah diserahkan',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                  ),
                  InkWell(
                    onTap: () {
                      if (customer?.nomorTelepon != null) {
                        WhatsAppHelper.openChat(
                          customer!.nomorTelepon,
                          message: 'Halo Kak ${customer.nama}, berikut tautan kartu garansi digital servis Anda: https://yangversacomputer.com/tracking?nomor_tiket=${tiket.nomorTiket}',
                        );
                      }
                    },
                    child: const Text(
                      'Kirim Ulang Garansi WA',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.primary),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _HandoverBottomSheet extends StatefulWidget {
  final TiketModel tiket;
  final VoidCallback onSuccess;

  const _HandoverBottomSheet({
    required this.tiket,
    required this.onSuccess,
  });

  @override
  State<_HandoverBottomSheet> createState() => _HandoverBottomSheetState();
}

class _HandoverBottomSheetState extends State<_HandoverBottomSheet> {
  final SignatureController _sigController = SignatureController();
  final TextEditingController _signerNameController = TextEditingController();
  bool _isSubmitting = false;
  bool _isUnitChecked = true;

  @override
  void initState() {
    super.initState();
    _signerNameController.text = widget.tiket.perangkat?.customer?.nama ?? '';
  }

  @override
  void dispose() {
    _sigController.dispose();
    _signerNameController.dispose();
    super.dispose();
  }

  Future<void> _submitHandover() async {
    if (_sigController.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Harap bubuhkan tanda tangan digital pelanggan pada kotak tanda tangan.'),
          backgroundColor: AppTheme.warning,
        ),
      );
      return;
    }

    final signerName = _signerNameController.text.trim();
    if (signerName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Nama penerima unit wajib diisi.'),
          backgroundColor: AppTheme.warning,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    HapticFeedback.mediumImpact();

    try {
      final base64Signature = await _sigController.toBase64Png();
      final client = ApiClient();

      // 1. Simpan tanda tangan customer jika invoice ada
      if (widget.tiket.invoice != null) {
        try {
          await client.dio.post(
            '/invoice/${widget.tiket.id}/signature',
            data: {
              'ttd_customer': base64Signature,
              'ttd_customer_nama': signerName,
            },
          );
        } catch (_) {
          // Tetap lanjutkan transisi status tiket
        }
      }

      // 2. Update status tiket menjadi 'diambil'
      await client.dio.put(
        ApiConstants.ticketDetail(widget.tiket.id),
        data: {'status': 'diambil'},
      );

      HapticFeedback.heavyImpact();

      if (mounted) {
        Navigator.pop(context); // Tutup bottom sheet
        _showSuccessDialog();
        widget.onSuccess();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        final String msg = (e is DioException && e.response?.data is Map && e.response?.data['message'] != null)
            ? e.response!.data['message'].toString()
            : 'Gagal menyelesaikan serah terima unit';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  void _showSuccessDialog() {
    final customer = widget.tiket.perangkat?.customer;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 24),
            SizedBox(width: 8),
            Text('Serah Terima Sukses', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Perangkat ${widget.tiket.perangkat?.merek} ${widget.tiket.perangkat?.model} resmi diserahkan kepada ${customer?.nama}.',
              style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 8),
            const Text(
              'Masa garansi pengerjaan mulai aktif hari ini. Kartu garansi digital dapat langsung dikirimkan ke pelanggan.',
              style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Selesai'),
          ),
          if (customer?.nomorTelepon != null)
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(ctx);
                WhatsAppHelper.openChat(
                  customer!.nomorTelepon,
                  message: 'Halo Kak ${customer.nama}, terima kasih telah mempercayakan perbaikan di Serv.io! Berikut tautan resmi Kartu Garansi & Invoice servis Anda: https://yangversacomputer.com/tracking?nomor_tiket=${widget.tiket.nomorTiket}',
                );
              },
              icon: const Icon(Icons.send_rounded, size: 14),
              label: const Text('Kirim Garansi via WA'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Sheet
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Serah Terima Unit Selesai',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    Text(
                      'Verifikasi fisik & tanda tangan digital pelanggan',
                      style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const Divider(height: 20),

            // Ringkasan Tiket & Unit
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Nomor Tiket:', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                      Text(widget.tiket.nomorTiket, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, fontFamily: 'monospace')),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Unit Perangkat:', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                      Text('${widget.tiket.perangkat?.merek} ${widget.tiket.perangkat?.model}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Pelunasan:', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                      Text(CurrencyFormatter.formatRupiah(widget.tiket.invoice?.totalBiaya ?? 0), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppTheme.primary)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Nama Penerima
            const Text(
              'Nama Penerima / Pelanggan',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 6),
            TextField(
              controller: _signerNameController,
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 14),

            // Digital Signature Pad Canvas
            DigitalSignaturePad(
              controller: _sigController,
              height: 160,
              label: 'Tanda Tangan Digital Penerima',
            ),
            const SizedBox(height: 12),

            // Checklist Konfirmasi
            Row(
              children: [
                Checkbox(
                  value: _isUnitChecked,
                  onChanged: (val) => setState(() => _isUnitChecked = val ?? true),
                  activeColor: AppTheme.primary,
                ),
                const Expanded(
                  child: Text(
                    'Unit telah diperiksa bersama pelanggan dan berfungsi normal.',
                    style: TextStyle(fontSize: 11.5, color: AppTheme.textPrimary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Tombol Konfirmasi Final
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting || !_isUnitChecked ? null : _submitHandover,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle_outline_rounded, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Konfirmasi Penyerahan Unit',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

