import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/checklist_items.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/status_helper.dart';
import '../../core/utils/whatsapp_helper.dart';
import '../../core/widgets/status_badge.dart';
import '../../core/widgets/image_viewer_dialog.dart';
import '../../data/models/tiket_model.dart';
import '../../data/providers/ticket_provider.dart';
import '../../data/providers/auth_provider.dart';
import '../wiki/wiki_detail_screen.dart';
import 'widgets/diagnosis_modal.dart';
import 'widgets/add_log_modal.dart';
import 'widgets/use_sparepart_modal.dart';
import 'widgets/qc_verification_modal.dart';

class TicketDetailScreen extends ConsumerStatefulWidget {
  final int ticketId;

  const TicketDetailScreen({
    super.key,
    required this.ticketId,
  });

  @override
  ConsumerState<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends ConsumerState<TicketDetailScreen> {
  final ApiClient _client = ApiClient();
  bool _isActionLoading = false;
  bool _showPassword = false;
  bool _isHistoryExpanded = false;

  void _refresh() {
    ref.invalidate(ticketDetailProvider(widget.ticketId));
    ref.invalidate(dashboardProvider);
    ref.invalidate(ticketsProvider);
  }

  // Update Status
  Future<void> _updateStatus(String newStatus, {String? catatanAdmin}) async {
    setState(() => _isActionLoading = true);
    try {
      final Map<String, dynamic> payload = {'status': newStatus};
      if (catatanAdmin != null && catatanAdmin.isNotEmpty) {
        payload['catatan_admin'] = catatanAdmin;
      }

      await _client.dio.put(
        '${ApiConstants.tickets}/${widget.ticketId}',
        data: payload,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status berhasil diubah menjadi: ${StatusHelper.getLabel(newStatus)}'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
      _refresh();
    } on DioException catch (e) {
      if (mounted) {
        String msg = 'Gagal memperbarui status';
        if (e.response?.data is Map && e.response?.data['message'] != null) {
          msg = e.response!.data['message'].toString();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: AppTheme.error),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Terjadi kesalahan'), backgroundColor: AppTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  // Take Over Ticket (Ambil Alih)
  Future<void> _takeOverTicket() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Ambil Alih Pengerjaan?'),
        content: const Text(
          'Anda akan ditugaskan sebagai teknisi penanggung jawab untuk tiket servis ini.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Ambil Alih'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final currentUser = ref.read(authProvider).user;
    if (currentUser == null) return;

    setState(() => _isActionLoading = true);
    try {
      await _client.dio.put(
        '${ApiConstants.tickets}/${widget.ticketId}',
        data: {
          'teknisi_id': currentUser.id,
          'status': 'didiagnosis',
        },
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Berhasil mengambil alih tiket! Status kini: Didiagnosis'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
      _refresh();
    } on DioException catch (e) {
      if (mounted) {
        String msg = 'Gagal mengambil alih tiket';
        if (e.response?.data is Map && e.response?.data['message'] != null) {
          msg = e.response!.data['message'].toString();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: AppTheme.error),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Terjadi kesalahan'), backgroundColor: AppTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  // Update QC Checklist
  Future<void> _toggleQc(Map<String, dynamic> currentQc, String key, bool value) async {
    final updated = Map<String, dynamic>.from(currentQc);
    updated[key] = value;

    try {
      await _client.dio.put(
        '${ApiConstants.tickets}/${widget.ticketId}',
        data: {'checklist_qc': updated},
      );
      _refresh();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gagal memperbarui Quality Control'), backgroundColor: AppTheme.error),
        );
      }
    }
  }

  // Update Warranty Settings (Kategori & Durasi Garansi)
  Future<void> _editWarrantySettings(TiketModel ticket) async {
    String selectedKategori = ticket.kategoriPerbaikan ?? 'Umum';
    String selectedDurasi = ticket.durasiGaransi ?? '1 Bulan';

    final categories = ['Baterai', 'SSD / Storage', 'Layar / LCD', 'Pembersihan & Thermal Paste', 'Software / OS', 'Umum'];
    final durations = ['1 Minggu', '2 Minggu', '1 Bulan', '2 Bulan', '3 Bulan', '6 Bulan', '1 Tahun'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Pengaturan Garansi & Tips Perawatan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedKategori,
                    decoration: const InputDecoration(labelText: 'Kategori Perbaikan'),
                    items: categories.map((cat) => DropdownMenuItem(value: cat, child: Text(cat))).toList(),
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedKategori = val);
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedDurasi,
                    decoration: const InputDecoration(labelText: 'Durasi Garansi'),
                    items: durations.map((dur) => DropdownMenuItem(value: dur, child: Text(dur))).toList(),
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedDurasi = val);
                    },
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      try {
                        await _client.dio.put(
                          '${ApiConstants.tickets}/${widget.ticketId}',
                          data: {
                            'kategori_perbaikan': selectedKategori,
                            'durasi_garansi': selectedDurasi,
                          },
                        );
                        _refresh();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Pengaturan garansi disimpan'), backgroundColor: AppTheme.success),
                          );
                        }
                      } catch (_) {}
                    },
                    child: const Text('Simpan Pengaturan Garansi'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // Update Credentials Vault Modal
  void _editCredentials(TiketModel ticket) {
    String selectedTipe = ticket.tipeKunci ?? 'Tidak Ada';
    final passCtrl = TextEditingController(text: ticket.passwordPerangkat ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Edit Kredensial Perangkat', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: selectedTipe,
                    decoration: const InputDecoration(labelText: 'Tipe Kunci'),
                    items: const [
                      DropdownMenuItem(value: 'Tidak Ada', child: Text('Tidak Ada (Tanpa Kunci)')),
                      DropdownMenuItem(value: 'PIN', child: Text('PIN Angka')),
                      DropdownMenuItem(value: 'Password', child: Text('Password / Kata Sandi')),
                      DropdownMenuItem(value: 'Pola Kunci', child: Text('Pola Kunci (Pattern)')),
                    ],
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedTipe = val);
                    },
                  ),
                  const SizedBox(height: 12),
                  if (selectedTipe != 'Tidak Ada')
                    TextFormField(
                      controller: passCtrl,
                      decoration: InputDecoration(
                        labelText: selectedTipe == 'PIN' ? 'Kode PIN' : 'Password Akun',
                      ),
                    ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(ctx);
                      try {
                        await _client.dio.put(
                          '${ApiConstants.tickets}/${widget.ticketId}',
                          data: {
                            'tipe_kunci': selectedTipe,
                            'password_perangkat': selectedTipe == 'Tidak Ada' ? null : passCtrl.text.trim(),
                          },
                        );
                        _refresh();
                      } catch (_) {}
                    },
                    child: const Text('Simpan Kredensial'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // Create Warranty Claim
  Future<void> _createWarrantyClaim(TiketModel ticket) async {
    final warranty = ticket.warrantyStatus;
    final isExpired = warranty?.isExpired ?? false;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isExpired ? '⚠️ Garansi Kedaluwarsa' : '🛡️ Klaim Garansi Retur'),
        content: Text(
          isExpired
              ? 'Masa garansi tiket ini telah berakhir. Terbitkan klaim garansi retur sebagai kebijakan bengkel?'
              : 'Masa garansi masih AKTIF (Sisa ${warranty?.sisaHari ?? 0} hari). Terbitkan tiket klaim garansi retur untuk tiket #${ticket.nomorTiket}?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: isExpired ? AppTheme.warning : AppTheme.accent),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Terbitkan Klaim'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isActionLoading = true);
    try {
      final res = await _client.dio.post(
        ApiConstants.ticketClaimGaransi(widget.ticketId),
        data: {'alasan': 'Klaim garansi retur perbaikan dari aplikasi mobile.'},
      );
      final newTicketId = res.data?['data']?['id'];
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tiket klaim garansi berhasil diterbitkan!'), backgroundColor: AppTheme.success),
        );
        if (newTicketId != null) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => TicketDetailScreen(ticketId: newTicketId)),
          );
        } else {
          _refresh();
        }
      }
    } on DioException catch (e) {
      if (mounted) {
        String msg = 'Gagal menerbitkan klaim garansi';
        if (e.response?.data is Map && e.response?.data['message'] != null) {
          msg = e.response!.data['message'].toString();
        }
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: AppTheme.error));
      }
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  // Send Pickup Reminder
  Future<void> _sendReminder(int months) async {
    final ticket = ref.read(ticketDetailProvider(widget.ticketId)).value;
    if (ticket == null) return;

    final waUrl = WhatsAppHelper.generateReminderWaLink(ticket, months);
    if (waUrl == null) return;

    await WhatsAppHelper.openUrl(waUrl);

    try {
      await _client.dio.put(
        ApiConstants.ticketReminder(widget.ticketId),
        data: {'last_reminder_sent': months},
      );
      _refresh();
    } catch (_) {}
  }

  int? _getReminderDue(TiketModel tiket) {
    if (tiket.status != 'selesai' || tiket.completedAt == null) return null;
    try {
      final completed = DateTime.parse(tiket.completedAt!);
      final diffDays = DateTime.now().difference(completed).inDays;
      final lastSent = int.tryParse(tiket.lastReminderSent ?? '0') ?? 0;

      if (diffDays >= 90 && lastSent < 3) return 3;
      if (diffDays >= 60 && lastSent < 2) return 2;
      if (diffDays >= 30 && lastSent < 1) return 1;
    } catch (_) {}
    return null;
  }

  String _calculateActiveDuration(TiketModel ticket) {
    DateTime? startTime;
    if (ticket.logPerbaikan != null && ticket.logPerbaikan!.isNotEmpty) {
      final repairLogs =
          ticket.logPerbaikan!.where((l) => l.fase == 'Perbaikan').toList();
      if (repairLogs.isNotEmpty && repairLogs.first.createdAt != null) {
        startTime = DateTime.tryParse(repairLogs.first.createdAt!);
      }
    }
    startTime ??= ticket.createdAt != null
        ? DateTime.tryParse(ticket.createdAt!)
        : null;
    if (startTime == null) return '-';

    final diff = DateTime.now().difference(startTime);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes} Menit';
    } else if (diff.inHours < 24) {
      final hours = diff.inHours;
      final mins = diff.inMinutes % 60;
      return '$hours Jam $mins Menit';
    } else {
      final days = diff.inDays;
      final hours = diff.inHours % 24;
      return '$days Hari $hours Jam';
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticketAsync = ref.watch(ticketDetailProvider(widget.ticketId));
    final currentUser = ref.watch(authProvider).user;
    final isAdmin = currentUser?.role == 'admin';

    return Scaffold(
      appBar: AppBar(
        title: Text(
          ticketAsync.valueOrNull != null
              ? '#${ticketAsync.valueOrNull!.nomorTiket}'
              : 'Tiket #${widget.ticketId}',
          style: GoogleFonts.jetBrainsMono(fontWeight: FontWeight.w700, fontSize: 16),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refresh,
            tooltip: 'Segarkan',
          ),
        ],
      ),
      bottomNavigationBar: ticketAsync.whenOrNull(
        data: (ticket) {
          final isAssignedToMe = currentUser != null && ticket.teknisiId == currentUser.id;
          final isUnassigned = ticket.teknisiId == null;
          return _buildBottomActionBar(ticket, isAssignedToMe, isUnassigned);
        },
      ),
      body: ticketAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppTheme.error),
              const SizedBox(height: 12),
              const Text('Gagal memuat detail tiket', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ElevatedButton(onPressed: _refresh, child: const Text('Coba Lagi')),
            ],
          ),
        ),
        data: (ticket) {
          final isAssignedToMe = currentUser != null && ticket.teknisiId == currentUser.id;
          final isUnassigned = ticket.teknisiId == null;
          final qcMap = ticket.checklistQc ?? {};
          final intakeMap = ticket.checklistIntake ?? {};
          final reminderDue = _getReminderDue(ticket);

          // Calculate total sparepart cost
          double totalSparepartBiaya = 0.0;
          if (ticket.penggunaanSparepart != null) {
            for (var p in ticket.penggunaanSparepart!) {
              totalSparepartBiaya += p.subtotal;
            }
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Master Ticket Header Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                  boxShadow: const [
                    BoxShadow(color: Color(0x060F172A), blurRadius: 4, offset: Offset(0, 1)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top: Ticket No + Badges
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          '#${ticket.nomorTiket}',
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primary,
                          ),
                        ),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            StatusBadge(status: ticket.status),
                            if (ticket.isOverdue) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: AppTheme.errorBg,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: AppTheme.errorBorder),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.alarm, size: 12, color: AppTheme.error),
                                    SizedBox(width: 3),
                                    Text(
                                      'OVERDUE',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.error,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ] else if (ticket.isExpress) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFFDE68A)),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.bolt, size: 12, color: Color(0xFFD97706)),
                                    SizedBox(width: 2),
                                    Text(
                                      'EXPRESS',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF92400E),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Device Name & Serial Number
                    Row(
                      children: [
                        const Icon(Icons.laptop_chromebook_rounded, size: 17, color: AppTheme.primary),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${ticket.perangkat?.merek ?? ""} ${ticket.perangkat?.model ?? ""}'.trim(),
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (ticket.perangkat?.serialNumber != null && ticket.perangkat!.serialNumber!.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.background,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: AppTheme.borderLight),
                            ),
                            child: Text(
                              'SN: ${ticket.perangkat!.serialNumber}',
                              style: GoogleFonts.jetBrainsMono(
                                fontSize: 10.5,
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Customer Row & WhatsApp Action
                    Row(
                      children: [
                        const Icon(Icons.person_outline, size: 16, color: AppTheme.textMuted),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '${ticket.perangkat?.customer?.nama ?? "-"} (${ticket.perangkat?.customer?.nomorTelepon ?? "-"})',
                            style: const TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (ticket.perangkat?.customer != null &&
                            ticket.perangkat!.customer!.nomorTelepon.isNotEmpty &&
                            ticket.perangkat!.customer!.nomorTelepon != '-')
                          InkWell(
                            onTap: () {
                              WhatsAppHelper.openChat(
                                ticket.perangkat!.customer!.nomorTelepon,
                                message: 'Halo kak ${ticket.perangkat!.customer!.nama}, saya teknisi dari Serv.io Workshop mengenai tiket #${ticket.nomorTiket} (${ticket.perangkat?.merek ?? ""} ${ticket.perangkat?.model ?? ""}).',
                              );
                            },
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: const Color(0xFFECFDF5),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFA7F3D0)),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.chat_bubble_outline_rounded, size: 13, color: Color(0xFF059669)),
                                  SizedBox(width: 4),
                                  Text(
                                    'WhatsApp',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF047857),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),

                    const Divider(height: 18),

                    // Dates and Metadata row
                    Wrap(
                      spacing: 12,
                      runSpacing: 4,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.calendar_today_outlined, size: 12, color: AppTheme.textMuted),
                            const SizedBox(width: 4),
                            Text(
                              'Masuk: ${CurrencyFormatter.formatDateOnly(ticket.createdAt)}',
                              style: const TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                        if (ticket.completedAt != null)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.check_circle_outline, size: 12, color: AppTheme.success),
                              const SizedBox(width: 4),
                              Text(
                                'Selesai: ${CurrencyFormatter.formatDateOnly(ticket.completedAt!)}',
                                style: const TextStyle(fontSize: 11.5, color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                        if (ticket.tglDiambil != null)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.outbox_outlined, size: 12, color: AppTheme.primary),
                              const SizedBox(width: 4),
                              Text(
                                'Diambil: ${CurrencyFormatter.formatDateOnly(ticket.tglDiambil!)}',
                                style: const TextStyle(fontSize: 11.5, color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                      ],
                    ),

                    if (ticket.ratingTeknisi != null && ticket.ratingTeknisi! > 0) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.star, color: AppTheme.warning, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            'Rating Pelanggan: ${ticket.ratingTeknisi!.toStringAsFixed(1)} / 5.0',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.textPrimary),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Active Workbench Timer Banner
              if (ticket.status == 'dalam_perbaikan' || ticket.status == 'disetujui') ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                  decoration: BoxDecoration(
                    color: ticket.status == 'dalam_perbaikan' ? const Color(0xFFEFF6FF) : const Color(0xFFF0FDF4),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: ticket.status == 'dalam_perbaikan' ? const Color(0xFFBFDBFE) : const Color(0xFFBBF7D0),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: ticket.status == 'dalam_perbaikan'
                              ? AppTheme.primary.withValues(alpha: 0.12)
                              : const Color(0xFF16A34A).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          ticket.status == 'dalam_perbaikan'
                              ? Icons.hourglass_top_rounded
                              : Icons.task_alt_rounded,
                          color: ticket.status == 'dalam_perbaikan'
                              ? AppTheme.primary
                              : const Color(0xFF16A34A),
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ticket.status == 'dalam_perbaikan'
                                  ? 'Unit Sedang Dikerjakan di Meja Servis'
                                  : 'Unit Disetujui Pelanggan (Siap Dieksekusi)',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: ticket.status == 'dalam_perbaikan'
                                    ? AppTheme.primary
                                    : const Color(0xFF15803D),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              ticket.status == 'dalam_perbaikan'
                                  ? 'Durasi pengerjaan aktif: ${_calculateActiveDuration(ticket)}'
                                  : 'Ketuk tombol di bawah untuk memulai pengerjaan.',
                              style: const TextStyle(fontSize: 11.5, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // 5-Phase Lifecycle Stepper
              _buildLifecycleStepper(ticket.status),
              const SizedBox(height: 12),

              // Suggested Wiki Knowledge Base
              _buildSuggestedWiki(ticket),

              // Photos Condition Awal (foto_kondisi)
              if (ticket.fotoKondisiList.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.photo_library_outlined, size: 18, color: AppTheme.accent),
                          SizedBox(width: 8),
                          Text('Foto Kondisi Fisik Masuk', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        ],
                      ),
                      const Divider(height: 20),
                      SizedBox(
                        height: 80,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: ticket.fotoKondisiList.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 10),
                          itemBuilder: (context, idx) {
                            final rawUrl = ticket.fotoKondisiList[idx];
                            final fullUrl = ApiConstants.resolveImageUrl(rawUrl);
                            return InkWell(
                              borderRadius: BorderRadius.circular(8),
                              onTap: () => ImageViewerDialog.show(context, fullUrl, title: 'Foto Kondisi #${idx + 1}'),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: CachedNetworkImage(
                                  imageUrl: fullUrl,
                                  width: 80,
                                  height: 80,
                                  fit: BoxFit.cover,
                                  placeholder: (_, __) => Container(width: 80, height: 80, color: AppTheme.borderLight),
                                  errorWidget: (_, __, ___) => Container(
                                    width: 80,
                                    height: 80,
                                    color: AppTheme.borderLight,
                                    child: const Icon(Icons.broken_image, size: 24, color: AppTheme.textMuted),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Unassigned Banner / Take Over Action
              if (isUnassigned && ticket.status != 'selesai' && ticket.status != 'diambil' && ticket.status != 'dibatalkan') ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.warningBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.warningBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.assignment_ind_outlined, color: AppTheme.warningText, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Tiket Belum Ditugaskan',
                            style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.warningText, fontSize: 14),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Tiket servis ini berada di antrean. Anda dapat mengambil alih pengerjaannya.',
                        style: TextStyle(fontSize: 12, color: AppTheme.warningText),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.handyman_outlined, size: 18),
                        label: const Text('Ambil Alih Tiket Ini'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.warning,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: _isActionLoading ? null : _takeOverTicket,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Pickup Reminder Alert Banner
              if (reminderDue != null) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.errorBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.errorBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.notifications_active_outlined, color: AppTheme.error, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Pengingat Pengambilan ($reminderDue Bulan)',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.errorText, fontSize: 14),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Perangkat ini telah selesai diperbaiki lebih dari ${reminderDue * 30} hari lalu namun belum diambil customer.',
                        style: const TextStyle(fontSize: 12, color: AppTheme.errorText),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.send, size: 16),
                        label: Text('Kirim Pengingat WhatsApp ($reminderDue Bulan)'),
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
                        onPressed: () => _sendReminder(reminderDue),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Detail Unit & Kredensial Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.devices_outlined, size: 18, color: AppTheme.primary),
                            SizedBox(width: 8),
                            Text('Detail Unit & Kredensial', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.primary),
                          onPressed: () => _editCredentials(ticket),
                          tooltip: 'Edit Kredensial',
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                    const Divider(height: 18),
                    _infoRow('Perangkat', '${ticket.perangkat?.merek ?? ''} ${ticket.perangkat?.model ?? ''}'),
                    _infoRow('Jenis & SN', '${ticket.perangkat?.jenisPerangkat ?? '-'} • SN: ${ticket.perangkat?.serialNumber ?? '-'}'),
                    _infoRow('Customer', '${ticket.perangkat?.customer?.nama ?? '-'} (${ticket.perangkat?.customer?.nomorTelepon ?? '-'})'),
                    if (ticket.kelengkapan != null && ticket.kelengkapan!.isNotEmpty)
                      _infoRow('Kelengkapan', ticket.kelengkapan!),
                    _infoRow('Teknisi PJ', ticket.teknisiNama),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppTheme.indigoBg,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.indigoBorder),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.lock_outline, size: 15, color: AppTheme.indigoText),
                              const SizedBox(width: 6),
                              Text(
                                '${ticket.tipeKunci ?? 'Kunci'}: ',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5, color: AppTheme.indigoText),
                              ),
                              if (ticket.tipeKunci != 'Tidak Ada' && ticket.passwordPerangkat != null)
                                Text(
                                  _showPassword ? ticket.passwordPerangkat! : '••••••••',
                                  style: GoogleFonts.jetBrainsMono(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary),
                                )
                              else
                                const Text('Tanpa sandi/kunci', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                            ],
                          ),
                          if (ticket.tipeKunci != 'Tidak Ada' && ticket.passwordPerangkat != null)
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                InkWell(
                                  onTap: () => setState(() => _showPassword = !_showPassword),
                                  child: Padding(
                                    padding: const EdgeInsets.all(4.0),
                                    child: Icon(_showPassword ? Icons.visibility_off : Icons.visibility, size: 18, color: AppTheme.indigoText),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                InkWell(
                                  onTap: () {
                                    Clipboard.setData(ClipboardData(text: ticket.passwordPerangkat!));
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Kredensial disalin ke clipboard!')),
                                    );
                                  },
                                  child: const Padding(
                                    padding: EdgeInsets.all(4.0),
                                    child: Icon(Icons.copy, size: 16, color: AppTheme.indigoText),
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Keluhan Pelanggan Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.report_problem_outlined, size: 18, color: AppTheme.warning),
                        SizedBox(width: 8),
                        Text('Keluhan Pelanggan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                    const Divider(height: 20),
                    Text(
                      ticket.keluhan,
                      style: const TextStyle(fontSize: 13, height: 1.4, color: AppTheme.textPrimary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Intake Inspection Checklist (Checklist Sebelum Servis)
              if (intakeMap.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.checklist, size: 18, color: AppTheme.accent),
                          SizedBox(width: 8),
                          Text('Checklist Intake (Fisik Masuk)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        ],
                      ),
                      const Divider(height: 20),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: ChecklistData.items.map((item) {
                          final isOk = intakeMap[item.key] == true;
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: isOk ? AppTheme.successBg : AppTheme.errorBg,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: isOk ? AppTheme.successBorder : AppTheme.errorBorder),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(item.icon, size: 14, color: isOk ? AppTheme.successText : AppTheme.errorText),
                                const SizedBox(width: 6),
                                Text(
                                  '${item.label} (${isOk ? "Normal" : "Rusak"})',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: isOk ? AppTheme.successText : AppTheme.errorText,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Diagnosis Section
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.biotech_outlined, size: 18, color: AppTheme.purple),
                            SizedBox(width: 8),
                            Text('Hasil Diagnosis', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          ],
                        ),
                        if (ticket.diagnosis == null && isAssignedToMe && (ticket.status == 'diterima' || ticket.status == 'didiagnosis'))
                          TextButton.icon(
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Input Diagnosis'),
                            onPressed: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                builder: (_) => DiagnosisModal(ticketId: ticket.id, onSuccess: _refresh),
                              );
                            },
                          ),
                      ],
                    ),
                    const Divider(height: 20),
                    if (ticket.diagnosis != null) ...[
                      _infoRow('Masalah', ticket.diagnosis!.masalah),
                      _infoRow('Solusi', ticket.diagnosis!.solusi),
                      _infoRow('Estimasi Biaya', CurrencyFormatter.formatRupiah(ticket.diagnosis!.estimasiBiaya)),
                      if (ticket.status == 'didiagnosis') ...[
                        const SizedBox(height: 12),
                        ElevatedButton.icon(
                          icon: const Icon(Icons.send_rounded, size: 16),
                          label: const Text('Selesaikan Diagnosa & Ajukan ke Admin'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.accent,
                            padding: const EdgeInsets.symmetric(vertical: 11),
                          ),
                          onPressed: _isActionLoading
                              ? null
                              : () async {
                                  final confirm = await showDialog<bool>(
                                    context: context,
                                    builder: (ctx) => AlertDialog(
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                      title: const Text('Ajukan Penawaran ke Admin?'),
                                      content: Text(
                                        'Hasil diagnosa dan estimasi biaya sebesar ${CurrencyFormatter.formatRupiah(ticket.diagnosis!.estimasiBiaya)} akan diteruskan ke admin untuk proses persetujuan (ACC) pelanggan.',
                                      ),
                                      actions: [
                                        TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
                                        ElevatedButton(
                                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                                          onPressed: () => Navigator.pop(ctx, true),
                                          child: const Text('Ya, Ajukan ke Admin'),
                                        ),
                                      ],
                                    ),
                                  );
                                  if (confirm == true) {
                                    await _updateStatus('menunggu_persetujuan');
                                  }
                                },
                        ),
                      ],
                      if (ticket.status == 'menunggu_persetujuan') ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.hourglass_top_rounded, size: 16, color: AppTheme.primary),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Menunggu Konfirmasi & ACC Pelanggan via Admin',
                                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppTheme.primary),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ] else
                      const Text(
                        'Belum ada hasil diagnosis untuk tiket ini.',
                        style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, fontStyle: FontStyle.italic),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Spareparts Used Section (Detailed Table)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.inventory_2_outlined, size: 18, color: AppTheme.indigo),
                            SizedBox(width: 8),
                            Text('Penggunaan Sparepart', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          ],
                        ),
                        if (ticket.status == 'dalam_perbaikan')
                          TextButton.icon(
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Tambah Part'),
                            onPressed: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                builder: (_) => UseSparepartModal(ticketId: ticket.id, onSuccess: _refresh),
                              );
                            },
                          ),
                      ],
                    ),
                    const Divider(height: 20),
                    if (ticket.penggunaanSparepart != null && ticket.penggunaanSparepart!.isNotEmpty) ...[
                      ...ticket.penggunaanSparepart!.map((item) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.background,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.borderLight),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${item.sparepartBrand.isNotEmpty ? "${item.sparepartBrand} " : ""}${item.sparepartNama}',
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '${CurrencyFormatter.formatRupiah(item.hargaSatuan)} x ${item.jumlah} pcs',
                                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                CurrencyFormatter.formatRupiah(item.subtotal),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                              ),
                            ],
                          ),
                        );
                      }),
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Biaya Sparepart:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                          Text(
                            CurrencyFormatter.formatRupiah(totalSparepartBiaya),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.accent),
                          ),
                        ],
                      ),
                    ] else
                      const Text(
                        'Tidak ada suku cadang yang digunakan.',
                        style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, fontStyle: FontStyle.italic),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Invoice & Total Tagihan
              if (ticket.invoice != null || totalSparepartBiaya > 0) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.receipt_long_outlined, size: 18, color: AppTheme.primary),
                          SizedBox(width: 8),
                          Text('Rincian Biaya & Invoice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        ],
                      ),
                      const Divider(height: 20),
                      _invoiceRow('Biaya Jasa Servis', CurrencyFormatter.formatRupiah(ticket.invoice?.biayaJasa ?? 0)),
                      _invoiceRow('Biaya Suku Cadang', CurrencyFormatter.formatRupiah(ticket.invoice?.biayaSparepart ?? totalSparepartBiaya)),
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Tagihan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          Text(
                            CurrencyFormatter.formatRupiah(ticket.invoice?.totalBiaya ?? ((ticket.invoice?.biayaJasa ?? 0) + totalSparepartBiaya)),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.successText),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Quality Control (QC Akhir) Checklist
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.verified_outlined, size: 18, color: AppTheme.success),
                            SizedBox(width: 8),
                            Text('Inspeksi QC (Pengecekan Akhir)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          ],
                        ),
                        if (qcMap['passed_qc'] == true)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.successBg,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: AppTheme.successBorder),
                            ),
                            child: const Text(
                              '✓ LULUS QC',
                              style: TextStyle(color: AppTheme.successText, fontWeight: FontWeight.bold, fontSize: 10),
                            ),
                          ),
                      ],
                    ),
                    const Divider(height: 20),
                    const Text(
                      'Centang pengujian perangkat sebelum unit diserahkan:',
                      style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 8),
                    ...ChecklistData.items.map((item) {
                      final isChecked = qcMap[item.key] == true;
                      return CheckboxListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text(item.label, style: const TextStyle(fontSize: 13)),
                        secondary: Icon(item.icon, size: 16),
                        value: isChecked,
                        onChanged: (val) {
                          if (val != null) _toggleQc(qcMap, item.key, val);
                        },
                      );
                    }),
                    const Divider(height: 16),
                    CheckboxListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: const Text(
                        'Quality Control PASSED (Final Approval)',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.successText),
                      ),
                      secondary: const Icon(Icons.workspace_premium, color: AppTheme.success),
                      value: qcMap['passed_qc'] == true,
                      onChanged: (val) {
                        if (val != null) _toggleQc(qcMap, 'passed_qc', val);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Repair Logs Timeline Section
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.timeline, size: 18, color: AppTheme.accent),
                            SizedBox(width: 8),
                            Text('Log Progres Servis', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          ],
                        ),
                        if (isAssignedToMe && (ticket.status == 'dalam_perbaikan' || ticket.status == 'diterima' || ticket.status == 'didiagnosis'))
                          TextButton.icon(
                            icon: const Icon(Icons.add, size: 16),
                            label: const Text('Tambah Log'),
                            onPressed: () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                builder: (_) => AddLogModal(ticketId: ticket.id, onSuccess: _refresh),
                              );
                            },
                          ),
                      ],
                    ),
                    const Divider(height: 20),
                    if (ticket.logPerbaikan != null && ticket.logPerbaikan!.isNotEmpty)
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: ticket.logPerbaikan!.length,
                        itemBuilder: (context, idx) {
                          final log = ticket.logPerbaikan![idx];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.background,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.borderLight),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: log.fase == 'Diagnosis' ? AppTheme.warningBg : AppTheme.infoBg,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        log.fase,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: log.fase == 'Diagnosis' ? AppTheme.warningText : AppTheme.infoText,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      CurrencyFormatter.formatDate(log.createdAt),
                                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(log.catatan, style: const TextStyle(fontSize: 13, height: 1.3)),
                                if (log.fotoUrl != null && log.fotoUrl!.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  InkWell(
                                    borderRadius: BorderRadius.circular(6),
                                    onTap: () {
                                      final img = ApiConstants.resolveImageUrl(log.fotoUrl!);
                                      ImageViewerDialog.show(context, img, title: 'Foto Progres: ${log.fase}');
                                    },
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(6),
                                      child: CachedNetworkImage(
                                        imageUrl: ApiConstants.resolveImageUrl(log.fotoUrl!),
                                        width: 120,
                                        height: 80,
                                        fit: BoxFit.cover,
                                        placeholder: (_, __) => Container(width: 120, height: 80, color: AppTheme.borderLight),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          );
                        },
                      )
                    else
                      const Text(
                        'Belum ada catatan aktivitas perbaikan.',
                        style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, fontStyle: FontStyle.italic),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Warranty Tracker & Maintenance Tips Section
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.security, size: 18, color: AppTheme.success),
                            SizedBox(width: 8),
                            Text('Garansi & Tips Perawatan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.accent),
                          onPressed: () => _editWarrantySettings(ticket),
                          tooltip: 'Ubah Garansi',
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    _infoRow('Kategori Perbaikan', ticket.kategoriPerbaikan ?? 'Umum'),
                    _infoRow('Durasi Garansi', ticket.durasiGaransi ?? '1 Bulan'),
                    if (ticket.status == 'diambil' && ticket.warrantyStatus != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: ticket.warrantyStatus!.isExpired ? AppTheme.errorBg : AppTheme.successBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: ticket.warrantyStatus!.isExpired ? AppTheme.errorBorder : AppTheme.successBorder),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              ticket.warrantyStatus!.isExpired ? Icons.gpp_bad_outlined : Icons.verified_user_outlined,
                              color: ticket.warrantyStatus!.isExpired ? AppTheme.error : AppTheme.success,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    ticket.warrantyStatus!.isExpired ? 'Masa Garansi Berakhir' : 'Garansi Servis Aktif',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: ticket.warrantyStatus!.isExpired ? AppTheme.errorText : AppTheme.successText,
                                    ),
                                  ),
                                  Text(
                                    ticket.warrantyStatus!.isExpired
                                        ? 'Kedaluwarsa ${ticket.warrantyStatus!.lewatHari} hari lalu (${CurrencyFormatter.formatDateOnly(ticket.warrantyStatus!.garansiBerakhirAt)})'
                                        : 'Tersisa ${ticket.warrantyStatus!.sisaHari} hari (Hingga ${CurrencyFormatter.formatDateOnly(ticket.warrantyStatus!.garansiBerakhirAt)})',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: ticket.warrantyStatus!.isExpired ? AppTheme.errorText : AppTheme.successText,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.replay_outlined, size: 18),
                        label: const Text('Terbitkan Klaim Garansi Retur'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: ticket.warrantyStatus!.isExpired ? AppTheme.warning : AppTheme.accent,
                        ),
                        onPressed: _isActionLoading ? null : () => _createWarrantyClaim(ticket),
                      ),
                    ],
                    if (ticket.status == 'selesai' || ticket.status == 'diambil') ...[
                      const SizedBox(height: 10),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.chat_outlined, size: 18, color: AppTheme.success),
                        label: const Text('Kirim Info Garansi & Tips WhatsApp', style: TextStyle(color: AppTheme.successText)),
                        onPressed: () {
                          final link = WhatsAppHelper.generateWarrantyWaLink(ticket);
                          if (link != null) WhatsAppHelper.openUrl(link);
                        },
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Device Medical History (Rekam Medis Perangkat)
              if (ticket.serviceHistory.isNotEmpty) ...[
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.history, color: AppTheme.primary),
                        title: Text(
                          'Rekam Medis Unit (${ticket.serviceHistory.length} Servis Sebelumnya)',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        trailing: Icon(_isHistoryExpanded ? Icons.expand_less : Icons.expand_more),
                        onTap: () => setState(() => _isHistoryExpanded = !_isHistoryExpanded),
                      ),
                      if (_isHistoryExpanded) ...[
                        const Divider(height: 1),
                        ...ticket.serviceHistory.map((pastTicket) {
                          final pastId = pastTicket['id'] is int ? pastTicket['id'] : int.tryParse(pastTicket['id'].toString()) ?? 0;
                          return ListTile(
                            dense: true,
                            title: Text(pastTicket['nomor_tiket']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Text(
                              'Keluhan: ${pastTicket['keluhan'] ?? '-'}\n${CurrencyFormatter.formatDateOnly(pastTicket['created_at'])}',
                            ),
                            trailing: StatusBadge(status: pastTicket['status']?.toString() ?? 'selesai'),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => TicketDetailScreen(ticketId: pastId)),
                              );
                            },
                          );
                        }),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // WhatsApp Notification for 'selesai'
              if (ticket.status == 'selesai') ...[
                ElevatedButton.icon(
                  icon: const Icon(Icons.check_circle_outline, size: 18),
                  label: const Text('Kirim Notifikasi Unit Siap Diambil (WhatsApp)'),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
                  onPressed: () {
                    final link = WhatsAppHelper.generateStatusWaLink(ticket);
                    if (link != null) WhatsAppHelper.openUrl(link);
                  },
                ),
                const SizedBox(height: 16),
              ],

              // Status Change Action Buttons for Technician & Admin
              if (isAssignedToMe && ticket.status == 'dalam_perbaikan') ...[
                ElevatedButton.icon(
                  icon: const Icon(Icons.verified_outlined, size: 20),
                  label: const Text('Verifikasi QC & Selesaikan Servis (8-Point WOW)'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: _isActionLoading
                      ? null
                      : () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
                            builder: (_) => QcVerificationModal(ticket: ticket, onSuccess: _refresh),
                          );
                        },
                ),
                const SizedBox(height: 16),
              ],

              // Admin Full Status Controls
              if (isAdmin) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.admin_panel_settings_outlined, size: 18, color: AppTheme.accent),
                          SizedBox(width: 8),
                          Text('Kontrol Status Admin', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        ],
                      ),
                      const Divider(height: 20),
                      DropdownButtonFormField<String>(
                        initialValue: ticket.status,
                        decoration: const InputDecoration(labelText: 'Pilih Transisi Status'),
                        items: const [
                          DropdownMenuItem(value: 'diterima', child: Text('Diterima')),
                          DropdownMenuItem(value: 'didiagnosis', child: Text('Didiagnosis')),
                          DropdownMenuItem(value: 'menunggu_persetujuan', child: Text('Menunggu Persetujuan')),
                          DropdownMenuItem(value: 'disetujui', child: Text('Disetujui')),
                          DropdownMenuItem(value: 'dalam_perbaikan', child: Text('Dalam Perbaikan')),
                          DropdownMenuItem(value: 'selesai', child: Text('Selesai')),
                          DropdownMenuItem(value: 'diambil', child: Text('Diambil')),
                          DropdownMenuItem(value: 'dibatalkan', child: Text('Dibatalkan')),
                        ],
                        onChanged: (newSt) {
                          if (newSt != null && newSt != ticket.status) {
                            _updateStatus(newSt);
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget? _buildBottomActionBar(TiketModel ticket, bool isAssignedToMe, bool isUnassigned) {
    Widget? actionButton;

    if (isUnassigned && ticket.status != 'selesai' && ticket.status != 'diambil' && ticket.status != 'dibatalkan') {
      actionButton = ElevatedButton.icon(
        icon: const Icon(Icons.handyman_outlined, size: 18),
        label: const Text('Ambil Alih Pengerjaan Tiket'),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFD97706),
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
        ),
        onPressed: _isActionLoading ? null : _takeOverTicket,
      );
    } else if (isAssignedToMe && (ticket.status == 'diterima' || ticket.status == 'didiagnosis')) {
      if (ticket.diagnosis == null) {
        actionButton = ElevatedButton.icon(
          icon: const Icon(Icons.biotech_outlined, size: 18),
          label: const Text('Input Hasil Diagnosis & Estimasi'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(48),
          ),
          onPressed: () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              builder: (_) => DiagnosisModal(ticketId: ticket.id, onSuccess: _refresh),
            );
          },
        );
      } else {
        // Diagnosis is already filled! Show button to advance stage to 'menunggu_persetujuan' (Penawaran Admin)
        actionButton = ElevatedButton.icon(
          icon: const Icon(Icons.send_rounded, size: 18),
          label: const Text('Selesaikan Diagnosa & Ajukan ke Admin'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.accent,
            foregroundColor: Colors.white,
            minimumSize: const Size.fromHeight(48),
          ),
          onPressed: _isActionLoading
              ? null
              : () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      title: const Text('Ajukan Penawaran ke Admin?'),
                      content: Text(
                        'Hasil diagnosa dan estimasi biaya sebesar ${CurrencyFormatter.formatRupiah(ticket.diagnosis!.estimasiBiaya)} akan diteruskan ke admin untuk proses persetujuan (ACC) pelanggan.',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx, false),
                          child: const Text('Batal'),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                          onPressed: () => Navigator.pop(ctx, true),
                          child: const Text('Ya, Ajukan ke Admin'),
                        ),
                      ],
                    ),
                  );
                  if (confirm == true) {
                    await _updateStatus('menunggu_persetujuan');
                  }
                },
        );
      }
    } else if (isAssignedToMe && ticket.status == 'menunggu_persetujuan') {
      actionButton = Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFBFDBFE)),
        ),
        child: const Row(
          children: [
            Icon(Icons.hourglass_top_rounded, color: AppTheme.primary, size: 18),
            SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Tahap Penawaran & ACC Admin',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primary),
                  ),
                  Text(
                    'Admin sedang menghubungi pelanggan untuk konfirmasi biaya. Teknisi akan melanjutkan pengerjaan setelah tiket disetujui.',
                    style: TextStyle(fontSize: 10.5, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    } else if (isAssignedToMe && ticket.status == 'disetujui') {
      actionButton = ElevatedButton.icon(
        icon: const Icon(Icons.play_arrow_rounded, size: 20),
        label: const Text('Mulai Perbaikan Unit'),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.indigo,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
        ),
        onPressed: _isActionLoading ? null : () => _updateStatus('dalam_perbaikan'),
      );
    } else if (isAssignedToMe && ticket.status == 'dalam_perbaikan') {
      actionButton = ElevatedButton.icon(
        icon: const Icon(Icons.verified_outlined, size: 18),
        label: const Text('Verifikasi QC & Selesaikan Servis'),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF059669),
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(48),
        ),
        onPressed: _isActionLoading
            ? null
            : () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
                  builder: (_) => QcVerificationModal(ticket: ticket, onSuccess: _refresh),
                );
              },
      );
    } else if (ticket.status == 'selesai') {
      actionButton = Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFBBF7D0)),
        ),
        child: const Row(
          children: [
            Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 18),
            SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Perbaikan Selesai (Meja Admin / Kasir)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF15803D)),
                  ),
                  Text(
                    'Unit telah lulus QC. Penyerahan unit & proses pelunasan kasir dikelola oleh tim admin.',
                    style: TextStyle(fontSize: 10.5, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (actionButton == null) return null;

    return Container(
      padding: EdgeInsets.fromLTRB(16, 10, 16, MediaQuery.of(context).padding.bottom + 10),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        border: Border(top: BorderSide(color: AppTheme.border)),
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: actionButton,
    );
  }

  Widget _buildLifecycleStepper(String status) {
    final phases = [
      ('Diterima', 'diterima'),
      ('Diagnosis', 'didiagnosis'),
      ('ACC', 'menunggu_persetujuan'),
      ('Perbaikan', 'dalam_perbaikan'),
      ('Selesai', 'selesai'),
    ];

    int currentStep = 0;
    if (status == 'didiagnosis') {
      currentStep = 1;
    } else if (status == 'menunggu_persetujuan' || status == 'disetujui') {
      currentStep = 2;
    } else if (status == 'dalam_perbaikan') {
      currentStep = 3;
    } else if (status == 'selesai' || status == 'diambil') {
      currentStep = 4;
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Alur Proses Servis',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
              ),
              Text(
                'Fase ${currentStep + 1} dari 5',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(phases.length, (idx) {
              final isDone = idx < currentStep;
              final isCurrent = idx == currentStep;
              final phase = phases[idx];

              Color circleColor;
              Widget circleChild;

              if (isDone) {
                circleColor = const Color(0xFF10B981);
                circleChild = const Icon(Icons.check, size: 13, color: Colors.white);
              } else if (isCurrent) {
                circleColor = AppTheme.primary;
                circleChild = Text(
                  '${idx + 1}',
                  style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                );
              } else {
                circleColor = const Color(0xFFF1F5F9);
                circleChild = Text(
                  '${idx + 1}',
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                );
              }

              return Expanded(
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            height: 2,
                            color: idx == 0
                                ? Colors.transparent
                                : (idx <= currentStep ? const Color(0xFF10B981) : AppTheme.borderLight),
                          ),
                        ),
                        Container(
                          width: 26,
                          height: 26,
                          decoration: BoxDecoration(
                            color: circleColor,
                            shape: BoxShape.circle,
                            border: isCurrent
                                ? Border.all(color: const Color(0xFFBFDBFE), width: 3)
                                : null,
                          ),
                          child: Center(child: circleChild),
                        ),
                        Expanded(
                          child: Container(
                            height: 2,
                            color: idx == phases.length - 1
                                ? Colors.transparent
                                : (idx < currentStep ? const Color(0xFF10B981) : AppTheme.borderLight),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      phase.$1,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                        color: isCurrent ? AppTheme.primary : AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildSuggestedWiki(TiketModel ticket) {
    final wikiAsync = ref.watch(
      suggestedWikiProvider((merek: ticket.perangkat?.merek, model: ticket.perangkat?.model)),
    );

    return wikiAsync.when(
      data: (wikis) {
        if (wikis.isEmpty) return const SizedBox.shrink();
        final wiki = wikis.first;
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.menu_book_rounded, size: 16, color: AppTheme.primary),
                      SizedBox(width: 6),
                      Text(
                        'Pustaka Solusi SOP Toko',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textPrimary),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'Rekomendasi Unit',
                      style: TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => WikiDetailScreen(wiki: wiki)),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              wiki.judul,
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 3),
                            Text(
                              '${wiki.tingkatSukses}% Tingkat Sukses • Penulis: ${wiki.authorName}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, size: 13, color: AppTheme.primary),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
          ),
        ],
      ),
    );
  }

  Widget _invoiceRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
        ],
      ),
    );
  }
}
