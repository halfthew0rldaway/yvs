import 'dart:io';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
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
  final ImagePicker _picker = ImagePicker();
  final List<XFile> _diagnosisPhotos = [];

  bool _isLoading = false;
  bool _autoSync = true;
  String _formatMode = 'bullet'; // 'bullet' (Poin List) | 'paragraph' (Paragraf Natural)
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

  Future<void> _pickPhoto(ImageSource source) async {
    if (_diagnosisPhotos.length >= 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maksimal 10 foto dokumentasi diagnosis.')),
      );
      return;
    }
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 85,
      );
      if (picked != null) {
        setState(() => _diagnosisPhotos.add(picked));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal mengambil foto: $e'), backgroundColor: AppTheme.error),
        );
      }
    }
  }

  void _removePhoto(int index) {
    if (index >= 0 && index < _diagnosisPhotos.length) {
      setState(() => _diagnosisPhotos.removeAt(index));
    }
  }

  /// Menyusun ringkasan checklist format Paragraf Natural atau Poin List (paritas penuh web DiagnosisForm)
  String _buildChecklistText() {
    final checkedKeys = _checkStatus.keys.where(
      (k) => _checkStatus[k] == 'ok' || _checkStatus[k] == 'issue'
    ).toList();
    if (checkedKeys.isEmpty) return '';

    final okItems = <Map<String, String>>[];
    final issueItems = <Map<String, String>>[];

    for (final k in checkedKeys) {
      final label = _labelFor(k);
      final note = _noteControllers[k]?.text.trim() ?? '';
      final status = _checkStatus[k];
      if (status == 'ok') {
        okItems.add({'label': label, 'note': note});
      } else if (status == 'issue') {
        issueItems.add({'label': label, 'note': note});
      }
    }

    if (_formatMode == 'paragraph') {
      final parts = <String>[];
      if (okItems.isNotEmpty) {
        final okNames = okItems.map((i) => i['note']!.isNotEmpty ? "${i['label']} (${i['note']})" : i['label']!).toList();
        parts.add("fungsi ${okNames.join(', ')} ok.");
      }
      if (issueItems.isNotEmpty) {
        final issueSentences = issueItems.map((i) {
          final note = i['note']!;
          final label = i['label']!;
          if (note.isNotEmpty) {
            final lower = note.toLowerCase();
            if (lower.startsWith("tidak") || lower.startsWith("rusak") || lower.startsWith("mati") || lower.startsWith("ada") || lower.startsWith("penuh")) {
              return "$label $note.";
            }
            return "$label bermasalah ($note).";
          }
          return "$label tidak fungsi / bermasalah.";
        }).toList();
        parts.addAll(issueSentences);
      }
      return parts.join(" ");
    } else {
      // Poin List (Bullet mode)
      final buf = StringBuffer();
      if (issueItems.isNotEmpty) {
        buf.writeln('Hasil Pengecekan / Kendala Ditemukan:');
        for (final item in issueItems) {
          final note = item['note']!;
          final label = item['label']!;
          if (note.isNotEmpty) {
            final lower = note.toLowerCase();
            if (lower.startsWith("tidak") || lower.startsWith("rusak") || lower.startsWith("mati") || lower.startsWith("ada") || lower.startsWith("penuh")) {
              buf.writeln('• $label: $note');
            } else {
              buf.writeln('• $label: Bermasalah ($note)');
            }
          } else {
            buf.writeln('• $label: Tidak berfungsi / bermasalah');
          }
        }
      }
      if (okItems.isNotEmpty) {
        if (issueItems.isNotEmpty) buf.writeln('');
        buf.writeln('Komponen Berfungsi Normal:');
        for (final item in okItems) {
          final note = item['note']!;
          final label = item['label']!;
          buf.writeln(note.isNotEmpty ? '• $label: Normal ($note)' : '• $label: Normal');
        }
      }
      return buf.toString().trim();
    }
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

      final formData = FormData();
      formData.fields.add(MapEntry('tiket_id', widget.ticketId.toString()));
      formData.fields.add(MapEntry('masalah', masalah));
      formData.fields.add(MapEntry('solusi', solusi));
      formData.fields.add(MapEntry('catatan_diagnosis', logNotes));
      formData.fields.add(MapEntry(
        'estimasi_biaya',
        (double.tryParse(_biayaController.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0).toString(),
      ));

      for (final photo in _diagnosisPhotos) {
        formData.files.add(MapEntry(
          'foto_diagnosis',
          await MultipartFile.fromFile(photo.path, filename: photo.name),
        ));
      }

      await client.dio.post(
        ApiConstants.diagnosis,
        data: formData,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Hasil diagnosis & foto dokumentasi berhasil disimpan'),
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
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 4,
                children: [
                  Text(
                    'Cek Komponen ($_checkedCount/${_items.length} Dicek${_issueCount > 0 ? ' • $_issueCount Rusak' : ''})',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Auto-sync', style: TextStyle(fontSize: 11)),
                      const SizedBox(width: 4),
                      Transform.scale(
                        scale: 0.85,
                        child: Switch(
                          value: _autoSync,
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          onChanged: (v) => setState(() => _autoSync = v),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 4),

              // Format Mode Selector (Poin List vs Paragraf Natural)
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          setState(() => _formatMode = 'bullet');
                          _syncChecklistToMasalah();
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 7),
                          decoration: BoxDecoration(
                            color: _formatMode == 'bullet' ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: _formatMode == 'bullet' ? const [BoxShadow(color: Color(0x0C000000), blurRadius: 4)] : null,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.format_list_bulleted, size: 14, color: _formatMode == 'bullet' ? AppTheme.primary : AppTheme.textMuted),
                              const SizedBox(width: 6),
                              Text(
                                'Poin List',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: _formatMode == 'bullet' ? FontWeight.w700 : FontWeight.w500,
                                  color: _formatMode == 'bullet' ? AppTheme.primary : AppTheme.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          setState(() => _formatMode = 'paragraph');
                          _syncChecklistToMasalah();
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 7),
                          decoration: BoxDecoration(
                            color: _formatMode == 'paragraph' ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: _formatMode == 'paragraph' ? const [BoxShadow(color: Color(0x0C000000), blurRadius: 4)] : null,
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.notes, size: 14, color: _formatMode == 'paragraph' ? AppTheme.primary : AppTheme.textMuted),
                              const SizedBox(width: 6),
                              Text(
                                'Paragraf Natural',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: _formatMode == 'paragraph' ? FontWeight.w700 : FontWeight.w500,
                                  color: _formatMode == 'paragraph' ? AppTheme.primary : AppTheme.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  TextButton.icon(
                    onPressed: _setAllOk,
                    icon: const Icon(Icons.done_all, size: 15),
                    label: const Text('Semua OK', style: TextStyle(fontSize: 11.5)),
                  ),
                  TextButton.icon(
                    onPressed: _resetChecklist,
                    icon: const Icon(Icons.refresh, size: 15),
                    label: const Text('Reset', style: TextStyle(fontSize: 11.5)),
                  ),
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Masalah Ditemukan *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  Text(
                    _formatMode == 'paragraph' ? 'Mode: Paragraf' : 'Mode: Poin List',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontStyle: FontStyle.italic),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _masalahController,
                minLines: 5,
                maxLines: 12,
                keyboardType: TextInputType.multiline,
                style: const TextStyle(fontSize: 13, height: 1.4),
                decoration: InputDecoration(
                  hintText: 'Jelaskan temuan kerusakan fisik, komponen short, atau software...',
                  alignLabelWithHint: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Masalah wajib diisi' : null,
              ),
              const SizedBox(height: 14),

              // Solusi
              const Text('Solusi / Rekomendasi Tindakan *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _solusiController,
                minLines: 4,
                maxLines: 8,
                keyboardType: TextInputType.multiline,
                style: const TextStyle(fontSize: 13, height: 1.4),
                decoration: InputDecoration(
                  hintText: 'Tindakan yang perlu dilakukan (ganti part / reball / flash)...',
                  alignLabelWithHint: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Solusi wajib diisi' : null,
              ),
              const SizedBox(height: 14),

              // Catatan Teknis / Log Perbaikan (Auto-created)
              const Text('Catatan Teknis Pengerjaan Meja Servis (Opsional)',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _catatanLogController,
                minLines: 3,
                maxLines: 6,
                keyboardType: TextInputType.multiline,
                style: const TextStyle(fontSize: 13, height: 1.4),
                decoration: InputDecoration(
                  hintText: 'Contoh: Ukur tegangan VDD drop 0.8V, terdeteksi IC power panas...',
                  alignLabelWithHint: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 14),

              // Dokumentasi Foto Diagnosis
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Dokumentasi Foto Diagnosis', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                  Text('${_diagnosisPhotos.length}/10 Foto',
                      style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                ],
              ),
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_diagnosisPhotos.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text(
                          'Belum ada foto dokumentasi (kerusakan komponen/hasil uji fisik).',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      )
                    else
                      SizedBox(
                        height: 90,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _diagnosisPhotos.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, idx) {
                            final file = _diagnosisPhotos[idx];
                            return Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.file(
                                    File(file.path),
                                    width: 90,
                                    height: 90,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                Positioned(
                                  top: 2,
                                  right: 2,
                                  child: InkWell(
                                    onTap: () => _removePhoto(idx),
                                    child: Container(
                                      decoration: const BoxDecoration(
                                        color: Colors.black54,
                                        shape: BoxShape.circle,
                                      ),
                                      padding: const EdgeInsets.all(2),
                                      child: const Icon(Icons.close, size: 14, color: Colors.white),
                                    ),
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        OutlinedButton.icon(
                          onPressed: _diagnosisPhotos.length >= 10 ? null : () => _pickPhoto(ImageSource.camera),
                          icon: const Icon(Icons.camera_alt, size: 16),
                          label: const Text('Kamera', style: TextStyle(fontSize: 12)),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            visualDensity: VisualDensity.compact,
                          ),
                        ),
                        const SizedBox(width: 8),
                        OutlinedButton.icon(
                          onPressed: _diagnosisPhotos.length >= 10 ? null : () => _pickPhoto(ImageSource.gallery),
                          icon: const Icon(Icons.photo_library, size: 16),
                          label: const Text('Galeri', style: TextStyle(fontSize: 12)),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            visualDensity: VisualDensity.compact,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Estimasi Biaya
              const Text('Estimasi Biaya Jasa & Sparepart (Rp) *',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _biayaController,
                keyboardType: TextInputType.number,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                decoration: InputDecoration(
                  hintText: 'Contoh: 150000',
                  prefixText: 'Rp ',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
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
