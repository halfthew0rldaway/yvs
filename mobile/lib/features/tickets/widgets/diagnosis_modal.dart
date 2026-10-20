import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_theme.dart';

class DiagnosisModal extends StatefulWidget {
  final int ticketId;
  final VoidCallback onSuccess;

  const DiagnosisModal({
    super.key,
    required this.ticketId,
    required this.onSuccess,
  });

  @override
  State<DiagnosisModal> createState() => _DiagnosisModalState();
}

class _DiagnosisModalState extends State<DiagnosisModal> {
  final _formKey = GlobalKey<FormState>();
  final _masalahController = TextEditingController();
  final _solusiController = TextEditingController();
  final _biayaController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _masalahController.dispose();
    _solusiController.dispose();
    _biayaController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final client = ApiClient();
      await client.dio.post(
        ApiConstants.diagnosis,
        data: {
          'tiket_id': widget.ticketId,
          'masalah': _masalahController.text.trim(),
          'solusi': _solusiController.text.trim(),
          'estimasi_biaya': double.tryParse(_biayaController.text.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0,
        },
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Hasil diagnosis berhasil disimpan'),
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
    return Container(
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
                  const Text(
                    'Input Hasil Diagnosis',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // Masalah
              const Text('Masalah Ditemukan *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _masalahController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Jelaskan temuan kerusakan fisik / software...',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Masalah wajib diisi' : null,
              ),
              const SizedBox(height: 14),

              // Solusi
              const Text('Solusi / Rekomendasi Tindakan *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _solusiController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Tindakan yang perlu dilakukan...',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Solusi wajib diisi' : null,
              ),
              const SizedBox(height: 14),

              // Estimasi Biaya
              const Text('Estimasi Biaya Jasa & Sparepart (Rp) *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
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
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accent),
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Simpan & Ajukan Diagnosis'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
