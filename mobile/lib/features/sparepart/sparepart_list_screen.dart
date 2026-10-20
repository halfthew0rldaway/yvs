import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../data/providers/ticket_provider.dart';

class SparepartListScreen extends ConsumerStatefulWidget {
  const SparepartListScreen({super.key});

  @override
  ConsumerState<SparepartListScreen> createState() => _SparepartListScreenState();
}

class _SparepartListScreenState extends ConsumerState<SparepartListScreen> {
  String _searchQuery = '';
  String _selectedCategory = 'Semua';

  @override
  Widget build(BuildContext context) {
    final sparepartsAsync = ref.watch(sparepartsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Katalog Sparepart & Stok'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(sparepartsProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter header
          Container(
            padding: const EdgeInsets.all(16),
            color: AppTheme.surface,
            child: Column(
              children: [
                TextField(
                  onChanged: (val) => setState(() => _searchQuery = val),
                  decoration: const InputDecoration(
                    hintText: 'Cari nama sparepart, merk, atau tipe...',
                    prefixIcon: Icon(Icons.search, size: 20),
                    contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                ),
                const SizedBox(height: 10),
                sparepartsAsync.maybeWhen(
                  data: (parts) {
                    final categories = ['Semua', ...parts.map((p) => p.kategori).toSet()];
                    return SizedBox(
                      height: 36,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, idx) {
                          final cat = categories[idx];
                          final isSelected = _selectedCategory == cat;
                          return ChoiceChip(
                            label: Text(cat),
                            selected: isSelected,
                            onSelected: (selected) {
                              if (selected) setState(() => _selectedCategory = cat);
                            },
                            labelStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isSelected ? Colors.white : AppTheme.textPrimary,
                            ),
                            selectedColor: AppTheme.primary,
                            backgroundColor: AppTheme.background,
                            side: BorderSide(color: isSelected ? AppTheme.primary : AppTheme.border),
                            showCheckmark: false,
                          );
                        },
                      ),
                    );
                  },
                  orElse: () => const SizedBox.shrink(),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),

          // Spareparts List
          Expanded(
            child: sparepartsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: AppTheme.error),
                    const SizedBox(height: 12),
                    const Text('Gagal memuat katalog sparepart'),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () => ref.invalidate(sparepartsProvider),
                      child: const Text('Coba Lagi'),
                    ),
                  ],
                ),
              ),
              data: (spareparts) {
                final filtered = spareparts.where((item) {
                  final matchQuery = _searchQuery.isEmpty ||
                      item.displayName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                      item.kategori.toLowerCase().contains(_searchQuery.toLowerCase());
                  final matchCat = _selectedCategory == 'Semua' || item.kategori == _selectedCategory;
                  return matchQuery && matchCat;
                }).toList();

                if (filtered.isEmpty) {
                  return const Center(
                    child: Text('Tidak ada suku cadang yang cocok', style: TextStyle(color: AppTheme.textSecondary)),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  itemBuilder: (context, idx) {
                    final part = filtered[idx];
                    final isLowStock = part.stok <= 3 && part.stok > 0;
                    final isOutOfStock = part.stok <= 0;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
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
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Text(
                                  part.displayName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 14,
                                    color: AppTheme.textPrimary,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isOutOfStock
                                      ? AppTheme.errorBg
                                      : isLowStock
                                          ? AppTheme.warningBg
                                          : AppTheme.successBg,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: isOutOfStock
                                        ? AppTheme.errorBorder
                                        : isLowStock
                                            ? AppTheme.warningBorder
                                            : AppTheme.successBorder,
                                  ),
                                ),
                                child: Text(
                                  isOutOfStock ? 'Habis' : 'Stok: ${part.stok}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isOutOfStock
                                        ? AppTheme.errorText
                                        : isLowStock
                                            ? AppTheme.warningText
                                            : AppTheme.successText,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppTheme.background,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  part.kategori,
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                ),
                              ),
                              Text(
                                CurrencyFormatter.formatRupiah(part.harga),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
