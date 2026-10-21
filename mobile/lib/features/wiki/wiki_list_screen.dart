import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/wiki_model.dart';
import '../../data/providers/ticket_provider.dart';
import 'wiki_detail_screen.dart';

class WikiListScreen extends ConsumerStatefulWidget {
  const WikiListScreen({super.key});

  @override
  ConsumerState<WikiListScreen> createState() => _WikiListScreenState();
}

class _WikiListScreenState extends ConsumerState<WikiListScreen> {
  final TextEditingController _searchController = TextEditingController();

  final List<String> _categories = [
    'Semua',
    'Motherboard / Power',
    'Layar / Flexgate',
    'Baterai / Charging',
    'Audio / Speaker',
    'Software / BIOS',
    'Keyboard / Trackpad',
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(wikiFilterProvider);
    final wikisAsync = ref.watch(wikisProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Pustaka SOP & Wiki'),
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            color: AppTheme.surface,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              children: [
                // Search Input
                Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Cari SOP, gejala, chipset, atau seri unit...',
                      hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                      prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.textSecondary),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                _searchController.clear();
                                ref.read(wikiFilterProvider.notifier).state =
                                    filter.copyWith(search: '');
                              },
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    onSubmitted: (value) {
                      ref.read(wikiFilterProvider.notifier).state =
                          filter.copyWith(search: value.trim());
                    },
                  ),
                ),
                const SizedBox(height: 10),

                // Category Chips (Horizontal Scroll)
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _categories.map((category) {
                      final isSelected = filter.kategori == category;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: ChoiceChip(
                          label: Text(category),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              ref.read(wikiFilterProvider.notifier).state =
                                  filter.copyWith(kategori: category);
                            }
                          },
                          labelStyle: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
                          ),
                          backgroundColor: AppTheme.surface,
                          selectedColor: const Color(0xFFEFF6FF),
                          side: BorderSide(
                            color: isSelected ? const Color(0xFFBFDBFE) : AppTheme.border,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),

          // Wiki List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(wikisProvider);
              },
              child: wikisAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AppTheme.error),
                        const SizedBox(height: 12),
                        const Text(
                          'Gagal memuat pustaka Wiki',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          err.toString(),
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => ref.invalidate(wikisProvider),
                          child: const Text('Coba Lagi'),
                        ),
                      ],
                    ),
                  ),
                ),
                data: (wikis) {
                  if (wikis.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.menu_book_outlined, size: 54, color: AppTheme.textMuted),
                            const SizedBox(height: 12),
                            const Text(
                              'Belum Ada SOP Terdaftar',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Coba ganti filter kategori atau kata kunci pencarian Anda.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                            ),
                            if (filter.search.isNotEmpty || filter.kategori != 'Semua') ...[
                              const SizedBox(height: 16),
                              OutlinedButton(
                                onPressed: () {
                                  _searchController.clear();
                                  ref.read(wikiFilterProvider.notifier).state =
                                      const WikiFilterState();
                                },
                                child: const Text('Reset Filter'),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: wikis.length,
                    itemBuilder: (context, index) {
                      final wiki = wikis[index];
                      return _buildWikiCard(context, wiki);
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWikiCard(BuildContext context, WikiModel wiki) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A0F172A),
            blurRadius: 3,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => WikiDetailScreen(wiki: wiki),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Badges Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: const Color(0xFFBFDBFE)),
                      ),
                      child: Text(
                        wiki.kategori,
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.check_circle_outline, size: 13, color: Color(0xFF059669)),
                        const SizedBox(width: 3),
                        Text(
                          '${wiki.tingkatSukses}% Sukses',
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF047857),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Title
                Text(
                  wiki.judul,
                  style: const TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),

                // Device compatibility tag
                Row(
                  children: [
                    const Icon(Icons.laptop_mac_outlined, size: 14, color: AppTheme.primary),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        '${wiki.brandName} ${wiki.modelSeri ?? ''}'.trim(),
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Gejala Preview
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Text(
                    wiki.gejala,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11.5,
                      color: AppTheme.textSecondary,
                      height: 1.3,
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Footer
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppTheme.background,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Text(
                            wiki.tingkatKesulitan,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ),
                        if (wiki.estimasiWaktu != null) ...[
                          const SizedBox(width: 6),
                          Text(
                            wiki.estimasiWaktu!,
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const Icon(Icons.chevron_right, size: 18, color: AppTheme.textMuted),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

