import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_theme.dart';

class AddLogModal extends StatefulWidget {
  final int ticketId;
  final VoidCallback onSuccess;

  const AddLogModal({
    super.key,
    required this.ticketId,
    required this.onSuccess,
  });

  @override
  State<AddLogModal> createState() => _AddLogModalState();
}

class _AddLogModalState extends State<AddLogModal> {
  final _formKey = GlobalKey<FormState>();
  final _catatanController = TextEditingController();
  final _fotoUrlController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _catatanController.dispose();
    _fotoUrlController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final client = ApiClient();
      final Map<String, dynamic> body = {
        'tiket_id': widget.ticketId,
        'catatan': _catatanController.text.trim(),
      };
      if (_fotoUrlController.text.trim().isNotEmpty) {
        body['foto_url'] = _fotoUrlController.text.trim();
      }

      await client.dio.post(
        ApiConstants.logPerbaikan,
        data: body,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Catatan progres perbaikan berhasil disimpan'),
            backgroundColor: AppTheme.success,
          ),
        );
        widget.onSuccess();
      }
    } on DioException catch (e) {
      if (mounted) {
        String err = 'Gagal menyimpan catatan';
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
                    'Tambah Catatan Progres',
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
              
              const Text('Catatan Perbaikan *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _catatanController,
                maxLines: 4,
                decoration: const InputDecoration(
                  hintText: 'Misal: Selesai re-balling chip VGA / Pembersihan kipas & ganti pasta pendingin...',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Catatan wajib diisi' : null,
              ),
              const SizedBox(height: 14),

              const Text('URL Foto Dokumentasi (Opsional)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _fotoUrlController,
                decoration: const InputDecoration(
                  hintText: 'https://... atau /uploads/...',
                  prefixIcon: Icon(Icons.link, size: 20),
                ),
              ),
              const SizedBox(height: 20),

              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                child: _isLoading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Simpan Catatan'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
