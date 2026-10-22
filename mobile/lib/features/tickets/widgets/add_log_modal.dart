import 'dart:io';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
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
  final ImagePicker _picker = ImagePicker();

  XFile? _selectedImage;
  bool _isLoading = false;

  @override
  void dispose() {
    _catatanController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 85,
      );
      if (picked != null) {
        setState(() => _selectedImage = picked);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengambil foto: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final client = ApiClient();
      final formData = FormData();

      formData.fields.add(MapEntry('tiket_id', widget.ticketId.toString()));
      formData.fields.add(MapEntry('catatan', _catatanController.text.trim()));

      if (_selectedImage != null) {
        formData.files.add(MapEntry(
          'foto',
          await MultipartFile.fromFile(
            _selectedImage!.path,
            filename: _selectedImage!.name,
          ),
        ));
      }

      await client.dio.post(
        ApiConstants.logPerbaikan,
        data: formData,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Catatan progres & foto perbaikan berhasil disimpan'),
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
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Terjadi kesalahan: $e'), backgroundColor: AppTheme.error),
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
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.timeline_rounded, color: AppTheme.primary, size: 20),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'Tambah Catatan Progres',
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

              // Catatan
              const Text('Catatan Pengerjaan *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              TextFormField(
                controller: _catatanController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Misal: Selesai re-balling IC power, pembersihan korosi jalur baterai, atau pengetesan tegangan...',
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Catatan perbaikan wajib diisi' : null,
              ),
              const SizedBox(height: 14),

              // Foto Dokumentasi
              const Text('Dokumentasi Foto Fisik (Kamera / Galeri)',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),

              if (_selectedImage != null)
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(_selectedImage!.path),
                          width: 64,
                          height: 64,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _selectedImage!.name,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Foto siap diunggah sebagai bukti pengerjaan',
                              style: TextStyle(fontSize: 10.5, color: Color(0xFF16A34A)),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, color: AppTheme.error, size: 20),
                        tooltip: 'Hapus Foto',
                        onPressed: () => setState(() => _selectedImage = null),
                      ),
                    ],
                  ),
                )
              else
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.camera_alt_outlined, size: 18),
                        label: const Text('Buka Kamera', style: TextStyle(fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: AppTheme.primary),
                          foregroundColor: AppTheme.primary,
                        ),
                        onPressed: () => _pickImage(ImageSource.camera),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.photo_library_outlined, size: 18),
                        label: const Text('Pilih Galeri', style: TextStyle(fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          side: const BorderSide(color: AppTheme.border),
                          foregroundColor: AppTheme.textSecondary,
                        ),
                        onPressed: () => _pickImage(ImageSource.gallery),
                      ),
                    ),
                  ],
                ),

              const SizedBox(height: 20),

              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Simpan Catatan & Foto', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
