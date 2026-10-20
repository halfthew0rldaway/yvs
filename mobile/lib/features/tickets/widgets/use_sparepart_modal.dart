import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../data/models/sparepart_model.dart';

class UseSparepartModal extends StatefulWidget {
  final int ticketId;
  final VoidCallback onSuccess;

  const UseSparepartModal({
    super.key,
    required this.ticketId,
    required this.onSuccess,
  });

  @override
  State<UseSparepartModal> createState() => _UseSparepartModalState();
}

class _UseSparepartModalState extends State<UseSparepartModal> {
  final ApiClient _client = ApiClient();
  List<SparepartModel> _spareparts = [];
  bool _isLoadingParts = true;
  bool _isSubmitting = false;

  SparepartModel? _selectedSparepart;
  int _quantity = 1;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _fetchSpareparts();
  }

  Future<void> _fetchSpareparts() async {
    try {
      final res = await _client.dio.get(ApiConstants.sparepart);
      if (res.data is List) {
        final list = (res.data as List)
            .map((item) => SparepartModel.fromJson(item))
            .where((s) => s.stok > 0)
            .toList();
        setState(() {
          _spareparts = list;
          _isLoadingParts = false;
        });
      }
    } catch (_) {
      setState(() => _isLoadingParts = false);
    }
  }

  Future<void> _submit() async {
    if (_selectedSparepart == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih sparepart terlebih dahulu'), backgroundColor: AppTheme.warning),
      );
      return;
    }

    if (_quantity <= 0 || _quantity > _selectedSparepart!.stok) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Jumlah maksimal ${_selectedSparepart!.stok} unit'), backgroundColor: AppTheme.warning),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      await _client.dio.post(
        ApiConstants.useSparepart,
        data: {
          'tiket_id': widget.ticketId,
          'sparepart_id': _selectedSparepart!.id,
          'jumlah': _quantity,
        },
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Sparepart berhasil digunakan untuk tiket'),
            backgroundColor: AppTheme.success,
          ),
        );
        widget.onSuccess();
      }
    } on DioException catch (e) {
      if (mounted) {
        String err = 'Gagal menggunakan sparepart';
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
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredParts = _spareparts.where((s) {
      if (_searchQuery.isEmpty) return true;
      return s.displayName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s.kategori.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Pasang Suku Cadang (Sparepart)',
                style: TextStyle(
                  fontSize: 16,
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

          // Search Field
          TextField(
            onChanged: (val) => setState(() => _searchQuery = val),
            decoration: const InputDecoration(
              hintText: 'Cari sparepart atau kategori...',
              prefixIcon: Icon(Icons.search, size: 18),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
          ),
          const SizedBox(height: 12),

          // Spareparts List
          Expanded(
            child: _isLoadingParts
                ? const Center(child: CircularProgressIndicator())
                : filteredParts.isEmpty
                    ? const Center(
                        child: Text('Tidak ada sparepart dengan stok tersedia', style: TextStyle(color: AppTheme.textSecondary)),
                      )
                    : ListView.builder(
                        itemCount: filteredParts.length,
                        itemBuilder: (context, idx) {
                          final part = filteredParts[idx];
                          final isSelected = _selectedSparepart?.id == part.id;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? AppTheme.indigoBg : AppTheme.surface,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isSelected ? AppTheme.indigo : AppTheme.border,
                                width: isSelected ? 1.5 : 1,
                              ),
                            ),
                            child: ListTile(
                              onTap: () {
                                setState(() {
                                  _selectedSparepart = part;
                                  if (_quantity > part.stok) _quantity = 1;
                                });
                              },
                              dense: true,
                              title: Text(
                                part.displayName,
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: isSelected ? AppTheme.indigoText : AppTheme.textPrimary,
                                ),
                              ),
                              subtitle: Text(
                                '${part.kategori} • Sisa stok: ${part.stok}',
                                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                              ),
                              trailing: Text(
                                CurrencyFormatter.formatRupiah(part.harga),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
          const SizedBox(height: 12),

          // Quantity Row
          if (_selectedSparepart != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.border),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Jumlah Dipasang:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, color: AppTheme.textSecondary),
                        onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                      ),
                      Text('$_quantity', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline, color: AppTheme.accent),
                        onPressed: _quantity < _selectedSparepart!.stok ? () => setState(() => _quantity++) : null,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          ElevatedButton(
            onPressed: _isSubmitting || _selectedSparepart == null ? null : _submit,
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.indigo),
            child: _isSubmitting
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Pasang Suku Cadang'),
          ),
        ],
      ),
    );
  }
}
