import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/tiket_model.dart';

class QcVerificationModal extends StatefulWidget {
  final TiketModel ticket;
  final VoidCallback onSuccess;

  const QcVerificationModal({
    super.key,
    required this.ticket,
    required this.onSuccess,
  });

  @override
  State<QcVerificationModal> createState() => _QcVerificationModalState();
}

class _QcVerificationModalState extends State<QcVerificationModal> {
  final ApiClient _client = ApiClient();
  final _catatanController = TextEditingController();
  bool _isLoading = false;

  late Map<String, bool> _qcItems;

  final List<({String key, String label, IconData icon})> _checkpoints = const [
    (key: 'touchpad_keyboard', label: 'Touchpad & Keyboard responsif', icon: Icons.keyboard_outlined),
    (key: 'baterai_charging', label: 'Baterai & Charging terisi normal', icon: Icons.battery_charging_full_outlined),
    (key: 'layar_display', label: 'Layar & Display jernih (tanpa flicker/garis)', icon: Icons.laptop_chromebook),
    (key: 'speaker_audio', label: 'Speaker, Audio Jack & Mic jernih', icon: Icons.volume_up_outlined),
    (key: 'konektivitas', label: 'WiFi & Konektivitas jaringan lancar', icon: Icons.wifi),
    (key: 'port_io', label: 'Port USB & IO berfungsi presisi', icon: Icons.usb_outlined),
    (key: 'thermal_suhu', label: 'Suhu & Thermal kipas pendingin stabil', icon: Icons.thermostat_outlined),
    (key: 'kebersihan_fisik', label: 'Bodi bersih & baut terpasang presisi', icon: Icons.cleaning_services_outlined),
  ];

  @override
  void initState() {
    super.initState();
    final existingQc = widget.ticket.checklistQc ?? {};
    _qcItems = {};
    for (final cp in _checkpoints) {
      _qcItems[cp.key] = existingQc[cp.key] == true;
    }
  }

  @override
  void dispose() {
    _catatanController.dispose();
    super.dispose();
  }

  void _checkAll() {
    setState(() {
      for (final cp in _checkpoints) {
        _qcItems[cp.key] = true;
      }
    });
  }

  Future<void> _submit() async {
    final hasRepairLog = widget.ticket.logPerbaikan?.any((l) => l.fase == 'Perbaikan') ?? false;

    if (!hasRepairLog && _catatanController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Wajib mengisi catatan perbaikan sebelum menyelesaikan tiket!'),
          backgroundColor: AppTheme.warning,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // If no repair log exists yet, create it first
      if (!hasRepairLog) {
        await _client.dio.post(
          ApiConstants.logPerbaikan,
          data: {
            'tiket_id': widget.ticket.id,
            'fase': 'Perbaikan',
            'catatan': _catatanController.text.trim(),
          },
        );
      }

      // Update ticket with QC Checklist & mark as 'selesai'
      final Map<String, dynamic> qcPayload = Map.from(_qcItems);
      qcPayload['passed_qc'] = true;

      await _client.dio.put(
        '${ApiConstants.tickets}/${widget.ticket.id}',
        data: {
          'status': 'selesai',
          'checklist_qc': qcPayload,
        },
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Inspeksi QC Lulus! Tiket servis berhasil diselesaikan.'),
            backgroundColor: AppTheme.success,
          ),
        );
        widget.onSuccess();
      }
    } on DioException catch (e) {
      if (mounted) {
        String msg = 'Gagal menyelesaikan tiket';
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
          const SnackBar(content: Text('Terjadi kesalahan koneksi'), backgroundColor: AppTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasRepairLog = widget.ticket.logPerbaikan?.any((l) => l.fase == 'Perbaikan') ?? false;
    final allChecked = _qcItems.values.every((v) => v == true);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.verified_user_outlined, color: AppTheme.primary, size: 22),
                  SizedBox(width: 8),
                  Text(
                    'Verifikasi QC Meja Kerja',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: const Text(
                  '8-POINT WOW',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Pastikan unit telah melalui pengujian standar sebelum diserahkan ke bagian intake/front office.',
            style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 12),

          // Quick Check-all button
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: _checkAll,
              icon: const Icon(Icons.done_all, size: 16),
              label: const Text('Centang Semua Lolos QC', style: TextStyle(fontSize: 12)),
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),

          // Scrollable Checklist
          Expanded(
            child: ListView(
              children: [
                ..._checkpoints.map((cp) {
                  final isChecked = _qcItems[cp.key] == true;
                  return CheckboxListTile(
                    value: isChecked,
                    onChanged: (val) {
                      setState(() {
                        _qcItems[cp.key] = val ?? false;
                      });
                    },
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    secondary: Icon(cp.icon, size: 18, color: isChecked ? AppTheme.primary : AppTheme.textMuted),
                    title: Text(
                      cp.label,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isChecked ? FontWeight.w600 : FontWeight.normal,
                        color: isChecked ? AppTheme.textPrimary : AppTheme.textSecondary,
                      ),
                    ),
                    activeColor: AppTheme.primary,
                  );
                }),

                // If no repair log exists, require writing one inline
                if (!hasRepairLog) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.edit_note, size: 18, color: Color(0xFFB45309)),
                            SizedBox(width: 6),
                            Text(
                              'Catatan Log Perbaikan (Wajib)',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF92400E),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Sistem membutuhkan minimal satu log tindakan perbaikan sebelum unit dapat diselesaikan.',
                          style: TextStyle(fontSize: 11.5, color: Color(0xFF92400E)),
                        ),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _catatanController,
                          maxLines: 2,
                          decoration: InputDecoration(
                            hintText: 'Contoh: Penggantian MOSFET selesai, repaste thermal, running test 2 jam.',
                            hintStyle: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: Color(0xFFFDE68A)),
                            ),
                            contentPadding: const EdgeInsets.all(10),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Submit Button
          ElevatedButton.icon(
            onPressed: _isLoading ? null : _submit,
            icon: _isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.check_circle, size: 18),
            label: Text(_isLoading ? 'Menyimpan...' : 'Konfirmasi & Selesaikan Servis'),
            style: ElevatedButton.styleFrom(
              backgroundColor: allChecked ? const Color(0xFF059669) : AppTheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }
}

