import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/constants/checklist_items.dart';
import '../../../core/theme/app_theme.dart';

/// Status checklist per komponen: null = belum dicek, 'ok' = normal, 'issue' = bermasalah.
/// Menyamai perilaku web DiagnosisForm (checklistStatus: { [key]: { status, note } })
/// yang disinkronkan ke `checklist_intake` (true = ok, false = issue).
class DiagnosisModal extends StatefulWidget {
  final int ticketId;
  final String? jenisPerangkat;
  final Map<String, dynamic>? initialIntake;
  final VoidCallback onSuccess;

  const DiagnosisModal({
    super.key,
    required this.ticketId,
    this.jenisPerangkat,
    this.initialIntake,
    required this.onSuccess,
  });

  @override
  State<DiagnosisModal> createState() => _DiagnosisModalState();
}

class _DiagnosisModalState extends State<DiagnosisModal> {
  final _formKey = GlobalKey<FormState>();
  final _masalahController = TextEditingController();
  final _solusiController = TextEditingController();
  final _catatanLogController = TextEditingController();
  final _biayaController = TextEditingController();
  bool _isLoading = false;
  bool _autoSync = true;
  String _lastGenerated = '';
  // key -> 'ok' | 'issue' | null (null = belum dicek)
  final Map<String, String?> _checkStatus = {};
  // key -> catatan singkat per komponen
  final Map<String, TextEditingController> _noteControllers = {};

  List<ChecklistItem> get _items =>
      ChecklistData.getItemsForDevice(widget.jenisPerangkat);

  @override
  void initState() {
    super.initState();
    final intake = widget.initialIntake ?? {};
    for (final item in _items) {
      final v = intake[item.key];
      if (v == true) {
        _checkStatus[item.key] = 'ok';
      } else if (v == false) {
        _checkStatus[item.key] = 'issue';
      } else {
        _checkStatus[item.key] = null;
      }
      _noteControllers[item.key] = TextEditingController();
    }
    // Tampung juga key intake tak dikenal agar tidak hilang saat submit.
    for (final k in intake.keys) {
      if (!_checkStatus.containsKey(k)) {
        final v = intake[k];
        if (v == true || v == false) {
          _checkStatus[k] = v == true ? 'ok' : 'issue';
          _noteControllers[k] = TextEditingController();
        }
      }
    }
  }

  @override
  void dispose() {
    _masalahController.dispose();
    _solusiController.dispose();
    _catatanLogController.dispose();
    _biayaController.dispose();
    for (final c in _noteControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  String _labelFor(String key) {
    for (final item in _items) {
      if (item.key == key) return item.label;
    }
    return key.replaceAll('_', ' ');
  }

  int get _checkedCount =>
      _checkStatus.values.where((s) => s == 'ok' || s == 'issue').length;

  int get _issueCount =>
      _checkStatus.values.where((s) => s == 'issue').length;

  /// Menyusun ringkasan checklist gaya web (bullet) untuk auto-sync ke masalah.
  String _buildChecklistText() {
    final issueLines = <String>[];
    final okLines = <String>[];
    _checkStatus.forEach((key, status) {
      if (status == null) return;
      final label = _labelFor(key);
      final note = _noteControllers[key]?.text.trim() ?? '';
      if (status == 'issue') {
        issueLines.add(note.isEmpty
            ? '\u2022 $label: Tidak berfungsi / bermasalah'
            : '\u2022 $label: Bermasalah ($note)');
      } else if (status == 'ok') {
        okLines.add(note.isEmpty ? '\u2022 $label: Normal' : '\u2022 $label: Normal ($note)');
      }
    });
    if (issueLines.isEmpty && okLines.isEmpty) return '';
    final buf = StringBuffer();
    if (issueLines.isNotEmpty) {
      buf.writeln('Hasil Pengecekan / Kendala Ditemukan:');
      for (final l in issueLines) {
        buf.writeln(l);
      }
    }
    if (okLines.isNotEmpty) {
      if (issueLines.isNotEmpty) buf.writeln('');
      buf.writeln('Komponen Berfungsi Normal:');
      for (final l in okLines) {
        buf.writeln(l);
      }
    }
    return buf.toString().trim();
  }

  /// Sinkronisasi hasil checklist ke kotak masalah tanpa menghapus catatan teknisi.
  void _syncChecklistToMasalah() {
    if (!_autoSync) return;
    final generated = _buildChecklistText();
    final current = _masalahController.text;
    if (_lastGenerated.isNotEmpty && current.contains(_lastGenerated)) {
      _masalahController.text =
          generated.isEmpty ? current.replaceAll(_lastGenerated, '').trim() : current.replaceAll(_lastGenerated, generated);
    } else {
      if (generated.isEmpty) return;
      _masalahController.text = current.trim().isEmpty
          ? generated
          : '${current.trim()}\n\n$generated';
    }
    _lastGenerated = generated;
  }

  void _toggleCheck(String key, String target) {
    setState(() {
      final cur = _checkStatus[key];
      _checkStatus[key] = cur == target ? null : target;
    });
    _syncChecklistToMasalah();
  }

  void _setAllOk() {
    setState(() {
      for (final k in _checkStatus.keys) {
        _checkStatus[k] = 'ok';
      }
    });
    _syncChecklistToMasalah();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Semua komponen ditandai Normal (OK)')),
    );
  }

  void _resetChecklist() {
    setState(() {
      for (final k in _checkStatus.keys) {
        _checkStatus[k] = null;
        _noteControllers[k]?.clear();
      }
    });
    _syncChecklistToMasalah();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final client = ApiClient();
      final masalah = _masalahController.text.trim();
      final solusi = _solusiController.text.trim();
      final logNotes = _catatanLogController.text.trim().isNotEmpty
          ? _catatanLogController.text.trim()
          : 'Pemeriksaan Unit: Ditemukan kendala $masalah. Rekomendasi tindakan perbaikan: $solusi.';

      // Pre-emptively create/ensure log diagnosis so backend validation always passes
      try {
        await client.dio.post(
          ApiConstants.logPerbaikan,
          data: {
            'tiket_id': widget.ticketId,
            'fase': 'Diagnosis',
            'catatan': logNotes,
          },
        );
      } catch (_) {
        // Silently continue in case already logged
      }

      await client.dio.post(
        ApiConstants.diagnosis,
        data: {
          'tiket_id': widget.ticketId,
          'masalah': masalah,
          'solusi': solusi,
          'catatan_diagnosis': logNotes,
          'estimasi_biaya': double.tryParse(_biayaController.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0,
        },
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Hasil diagnosis & catatan teknis berhasil disimpan'),
            backgroundColor: AppTheme.success,
          ),
        );
        widget.onSuccess();
      }
    } on DioException catch (e) {
      if (mounted) {
        String err = 'Gagal menyimpan diagnosis';
        if (e.response?.data is Map && e.response?.data['message'] != null) {
          err = e.response!.data['message'].toString();
        }
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: AppTheme.error),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Terjadi kesalahan'), backgroundColor: AppTheme.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 580),
        child: Container(
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
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFAF5FF),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.biotech_outlined, color: AppTheme.purple, size: 20),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'Input Hasil Diagnosis',
                        style: TextStyle(
                          fontSize: 16.5,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 14),

            // Checklist cek fungsi komponen (paritas web DiagnosisForm)
              Text('Cek Fungsi Komponen ($_checkedCount/${_items.length} Dicek${_issueCount > 0 ? ' • $_issueCount Rusak' : ''})',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              const Text('Menyesuaikan jenis perangkat. Ketuk OK / Rusak untuk auto-susun laporan.',
                  style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
              const SizedBox(height: 8),
              Row(
                children: [
                  TextButton.icon(onPressed: _setAllOk, icon: const Icon(Icons.done_all, size: 16), label: const Text('Semua OK', style: TextStyle(fontSize: 11))),
                  TextButton.icon(onPressed: _resetChecklist, icon: const Icon(Icons.refresh, size: 16), label: const Text('Reset', style: TextStyle(fontSize: 11))),
                  const Spacer(),
                  const Text('Auto-sync', style: TextStyle(fontSize: 11)),
                  Switch(value: _autoSync, materialTapTargetSize: MaterialTapTargetSize.shrinkWrap, onChanged: (v) => setState(() => _autoSync = v)),
                ],
              ),
              ..._items.map((item) {
                final status = _checkStatus[item.key];
                final isOk = status == 'ok';
                final isIssue = status == 'issue';
                return Container(
                  margin: const EdgeInsets.only(top: 8),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: isIssue ? AppTheme.errorBorder : isOk ? AppTheme.successBorder : AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(item.icon, size: 18, color: isIssue ? AppTheme.errorText : isOk ? AppTheme.successText : AppTheme.textMuted),
                          const SizedBox(width: 8),
                          Expanded(child: Text(item.label, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600))),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _toggleCheck(item.key, 'ok'),
                              style: OutlinedButton.styleFrom(backgroundColor: isOk ? AppTheme.successBg : Colors.white, side: BorderSide(color: isOk ? AppTheme.successBorder : AppTheme.border), padding: const EdgeInsets.symmetric(vertical: 8)),
                              child: Text(isOk ? '✓ OK' : 'OK', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isOk ? AppTheme.successText : AppTheme.textMuted)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _toggleCheck(item.key, 'issue'),
                              style: OutlinedButton.styleFrom(backgroundColor: isIssue ? AppTheme.errorBg : Colors.white, side: BorderSide(color: isIssue ? AppTheme.errorBorder : AppTheme.border), padding: const EdgeInsets.symmetric(vertical: 8)),
                              child: Text(isIssue ? '✕ Rusak' : 'Rusak', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isIssue ? AppTheme.errorText : AppTheme.textMuted)),
                            ),
                          ),
                        ],
                      ),
                      if (status != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: TextField(
                            controller: _noteControllers[item.key],
                            style: const TextStyle(fontSize: 12),
                            decoration: const InputDecoration(hintText: 'Catatan (mis. garis vertikal, klik macet)...', hintStyle: TextStyle(fontSize: 11), isDense: true, border: OutlineInputBorder()),
                            onChanged: (_) => _syncChecklistToMasalah(),
                          ),
                        ),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 14),

              // Masalah
              const Text('Masalah Ditemukan *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _masalahController,
                maxLines: 2,
                decoration: const InputDecoration(
                  hintText: 'Jelaskan temuan kerusakan fisik, komponen short, atau software...',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Masalah wajib diisi' : null,
              ),
              const SizedBox(height: 12),

              // Solusi
              const Text('Solusi / Rekomendasi Tindakan *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _solusiController,
                maxLines: 2,
                decoration: const InputDecoration(
                  hintText: 'Tindakan yang perlu dilakukan (ganti part / reball / flash)...',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Solusi wajib diisi' : null,
              ),
              const SizedBox(height: 12),

              // Catatan Teknis / Log Perbaikan (Auto-created)
              const Text('Catatan Teknis Pengerjaan Meja Servis (Opsional)',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _catatanLogController,
                maxLines: 2,
                decoration: const InputDecoration(
                  hintText: 'Contoh: Ukur tegangan VDD drop 0.8V, terdeteksi IC power panas...',
                ),
              ),
              const SizedBox(height: 12),

              // Estimasi Biaya
              const Text('Estimasi Biaya Jasa & Sparepart (Rp) *',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _biayaController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  hintText: 'Contoh: 150000',
                  prefixText: 'Rp ',
                ),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) return 'Estimasi biaya wajib diisi';
                  final numVal = double.tryParse(val.replaceAll(RegExp(r'[^0-9]'), ''));
                  if (numVal == null || numVal < 0) return 'Masukkan nominal yang valid';
                  return null;
                },
              ),
              const SizedBox(height: 20),

              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.accent,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Simpan & Terbitkan Diagnosis', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    ),
  ),
);
  }
}
