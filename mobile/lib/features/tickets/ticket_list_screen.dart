import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ticket_card.dart';
import '../../data/models/tiket_model.dart';
import '../../data/providers/ticket_provider.dart';
import '../../data/providers/auth_provider.dart';
import 'ticket_detail_screen.dart';

class TicketListScreen extends ConsumerStatefulWidget {
  const TicketListScreen({super.key});

  @override
  ConsumerState<TicketListScreen> createState() => _TicketListScreenState();
}

class _TicketListScreenState extends ConsumerState<TicketListScreen> {
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, String>> _statusTabs = const [
    {'key': 'all', 'label': 'Semua'},
    {'key': 'diterima', 'label': 'Diterima'},
    {'key': 'didiagnosis', 'label': 'Didiagnosis'},
    {'key': 'menunggu_persetujuan', 'label': 'Persetujuan'},
    {'key': 'disetujui', 'label': 'Disetujui'},
    {'key': 'dalam_perbaikan', 'label': 'Perbaikan'},
    {'key': 'selesai', 'label': 'Selesai'},
    {'key': 'diambil', 'label': 'Diambil'},
    {'key': 'dibatalkan', 'label': 'Dibatalkan'},
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(ticketsProvider);
    final filter = ref.watch(ticketFilterProvider);
    final currentUser = ref.watch(authProvider).user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daftar Tiket Servis'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(ticketsProvider),
            tooltip: 'Segarkan',
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter & Search Header
          Container(
            padding: const EdgeInsets.all(16),
            color: AppTheme.surface,
            child: Column(
              children: [
                // Search box
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Cari nomor tiket, nama customer, perangkat...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              ref.read(ticketFilterProvider.notifier).state =
                                  filter.copyWith(searchQuery: '');
                            },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                  onSubmitted: (val) {
                    ref.read(ticketFilterProvider.notifier).state =
                        filter.copyWith(searchQuery: val.trim());
                  },
                ),
                const SizedBox(height: 12),

                // Toggle "Hanya Tiket Saya" vs "Semua Tiket Bengkel"
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      filter.onlyMyTickets ? 'Tiket Tugas Saya' : 'Semua Antrean Bengkel',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppTheme.textPrimary),
                    ),
                    Switch.adaptive(
                      value: filter.onlyMyTickets,
                      activeTrackColor: AppTheme.accent,
                      onChanged: (val) {
                        ref.read(ticketFilterProvider.notifier).state =
                            filter.copyWith(onlyMyTickets: val);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Horizontal Status Pills
                SizedBox(
                  height: 36,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _statusTabs.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, idx) {
                      final tab = _statusTabs[idx];
                      final isSelected = filter.status == tab['key'];
                      return ChoiceChip(
                        label: Text(tab['label']!),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            ref.read(ticketFilterProvider.notifier).state =
                                filter.copyWith(status: tab['key']);
                          }
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
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),

          // Tickets List View
          Expanded(
            child: ticketsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: AppTheme.error),
                    const SizedBox(height: 12),
                    const Text('Gagal memuat tiket servis', style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 32),
                      child: Text(
                        '$err',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: () => ref.invalidate(ticketsProvider),
                      child: const Text('Coba Lagi'),
                    ),
                  ],
                ),
              ),
              data: (tickets) {
                // Filter client-side for "only my tickets"
                List<TiketModel> displayList = tickets;
                if (filter.onlyMyTickets && currentUser != null) {
                  displayList = displayList.where((t) => t.teknisiId == currentUser.id).toList();
                }

                if (displayList.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.assignment_outlined, size: 48, color: AppTheme.textMuted),
                        const SizedBox(height: 12),
                        const Text(
                          'Tidak ada tiket servis ditemukan',
                          style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                        ),
                        if (filter.onlyMyTickets)
                          TextButton(
                            onPressed: () {
                              ref.read(ticketFilterProvider.notifier).state =
                                  filter.copyWith(onlyMyTickets: false);
                            },
                            child: const Text('Tampilkan Semua Tiket Bengkel'),
                          ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(ticketsProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: displayList.length,
                    itemBuilder: (context, idx) {
                      final ticket = displayList[idx];
                      return TicketCard(
                        ticket: ticket,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => TicketDetailScreen(ticketId: ticket.id),
                            ),
                          ).then((_) => ref.invalidate(ticketsProvider));
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
