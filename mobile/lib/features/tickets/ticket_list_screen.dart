import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ticket_card.dart';
import '../../data/models/tiket_model.dart';
import '../../data/providers/ticket_provider.dart';
import '../../data/providers/auth_provider.dart';
import '../scanner/qr_scanner_screen.dart';
import 'ticket_detail_screen.dart';

class TicketListScreen extends ConsumerStatefulWidget {
  final bool? initialOnlyMyTickets;

  const TicketListScreen({super.key, this.initialOnlyMyTickets});

  @override
  ConsumerState<TicketListScreen> createState() => _TicketListScreenState();
}

class _TicketListScreenState extends ConsumerState<TicketListScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ApiClient _client = ApiClient();
  bool _isClaiming = false;

  final List<Map<String, String>> _statusTabs = const [
    {'key': 'all', 'label': 'Semua'},
    {'key': 'diterima', 'label': 'Diterima'},
    {'key': 'didiagnosis', 'label': 'Didiagnosis'},
    {'key': 'menunggu_persetujuan', 'label': 'Menunggu ACC'},
    {'key': 'dalam_perbaikan', 'label': 'Perbaikan'},
    {'key': 'selesai', 'label': 'Selesai'},
    {'key': 'diambil', 'label': 'Diambil'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialOnlyMyTickets != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(ticketFilterProvider.notifier).state =
            ref.read(ticketFilterProvider).copyWith(onlyMyTickets: widget.initialOnlyMyTickets);
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _claimTicket(TiketModel ticket) async {
    final currentUser = ref.read(authProvider).user;
    if (currentUser == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Ambil Alih Tiket?'),
        content: Text(
          'Anda akan ditugaskan untuk mengerjakan tiket #${ticket.nomorTiket} (${ticket.perangkat?.merek ?? ""} ${ticket.perangkat?.model ?? ""}).',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            child: const Text('Ambil Alih'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isClaiming = true);
    try {
      await _client.dio.put(
        '${ApiConstants.tickets}/${ticket.id}',
        data: {'teknisi_id': currentUser.id},
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Tiket #${ticket.nomorTiket} berhasil diambil alih ke meja kerja Anda.'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
      ref.invalidate(ticketsProvider);
      ref.invalidate(dashboardProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal mengambil alih tiket. Silakan coba lagi.'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isClaiming = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(ticketsProvider);
    final filter = ref.watch(ticketFilterProvider);
    final currentUser = ref.watch(authProvider).user;

    final hasUrgencyFilter = filter.slaUrgency != null || filter.slaPaket != null;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Antrean Tiket Servis'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(ticketsProvider),
            tooltip: 'Segarkan',
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const QrScannerScreen()),
          );
        },
        backgroundColor: AppTheme.primary,
        tooltip: 'Pindai QR / Barcode',
        child: const Icon(Icons.qr_code_scanner, color: Colors.white),
      ),
      body: Column(
        children: [
          // Filter & Search Controls Header
          Container(
            color: AppTheme.surface,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
            child: Column(
              children: [
                // Search Box
                Container(
                  height: 42,
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Cari tiket, customer, perangkat, SN...',
                      hintStyle: const TextStyle(fontSize: 12.5, color: AppTheme.textMuted),
                      prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.textSecondary),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 16),
                              onPressed: () {
                                _searchController.clear();
                                ref.read(ticketFilterProvider.notifier).state =
                                    filter.copyWith(searchQuery: '');
                              },
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    onSubmitted: (val) {
                      ref.read(ticketFilterProvider.notifier).state =
                          filter.copyWith(searchQuery: val.trim());
                    },
                  ),
                ),
                const SizedBox(height: 10),

                // Segmented Switch ("Tiket Tugas Saya" vs "Semua Antrean")
                Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: AppTheme.background,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildSegmentButton(
                          label: 'Tiket Tugas Saya',
                          icon: Icons.person_outline,
                          isSelected: filter.onlyMyTickets,
                          onTap: () {
                            ref.read(ticketFilterProvider.notifier).state =
                                filter.copyWith(onlyMyTickets: true);
                          },
                        ),
                      ),
                      Expanded(
                        child: _buildSegmentButton(
                          label: 'Semua Antrean',
                          icon: Icons.format_list_bulleted,
                          isSelected: !filter.onlyMyTickets,
                          onTap: () {
                            ref.read(ticketFilterProvider.notifier).state =
                                filter.copyWith(onlyMyTickets: false);
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Active SLA Urgency Filter Notice (if filtered by Overdue or Express)
                if (hasUrgencyFilter) ...[
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: filter.slaUrgency == 'overdue'
                          ? const Color(0xFFFEF2F2)
                          : const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: filter.slaUrgency == 'overdue'
                            ? const Color(0xFFFECACA)
                            : const Color(0xFFBFDBFE),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(
                              filter.slaUrgency == 'overdue'
                                  ? Icons.alarm
                                  : Icons.bolt,
                              size: 15,
                              color: filter.slaUrgency == 'overdue'
                                  ? AppTheme.error
                                  : AppTheme.primary,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              filter.slaUrgency == 'overdue'
                                  ? 'Filter Aktif: Melewati SLA (Overdue)'
                                  : 'Filter Aktif: Prioritas Express',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: filter.slaUrgency == 'overdue'
                                    ? AppTheme.error
                                    : AppTheme.primary,
                              ),
                            ),
                          ],
                        ),
                        InkWell(
                          onTap: () {
                            ref.read(ticketFilterProvider.notifier).state =
                                filter.copyWith(clearSlaFilters: true);
                          },
                          child: const Padding(
                            padding: EdgeInsets.all(2.0),
                            child: Icon(Icons.close, size: 16, color: AppTheme.textSecondary),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Horizontal Status Pills
                SizedBox(
                  height: 32,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _statusTabs.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 6),
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
                          fontSize: 11.5,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
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
                        showCheckmark: false,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),
          if (_isClaiming) const LinearProgressIndicator(),

          // Tickets List View
          Expanded(
            child: ticketsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: AppTheme.error),
                      const SizedBox(height: 12),
                      const Text(
                        'Gagal memuat tiket servis',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '$err',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 14),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(ticketsProvider),
                        child: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
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
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.assignment_outlined, size: 54, color: AppTheme.textMuted),
                          const SizedBox(height: 12),
                          const Text(
                            'Tidak Ada Tiket Servis',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            filter.onlyMyTickets
                                ? 'Tidak ada tiket yang ditugaskan kepada Anda pada kategori ini.'
                                : 'Tidak ada tiket servis yang sesuai dengan filter pencarian.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                          ),
                          const SizedBox(height: 16),
                          if (filter.onlyMyTickets)
                            OutlinedButton.icon(
                              icon: const Icon(Icons.format_list_bulleted, size: 16),
                              label: const Text('Buka Semua Antrean Bengkel'),
                              onPressed: () {
                                ref.read(ticketFilterProvider.notifier).state =
                                    filter.copyWith(onlyMyTickets: false);
                              },
                            )
                          else if (hasUrgencyFilter || filter.status != 'all' || filter.searchQuery.isNotEmpty)
                            OutlinedButton(
                              onPressed: () {
                                _searchController.clear();
                                ref.read(ticketFilterProvider.notifier).state =
                                    const TicketFilterState(onlyMyTickets: false);
                              },
                              child: const Text('Reset Semua Filter'),
                            ),
                        ],
                      ),
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(ticketsProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
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
                        onTakeOver: () => _claimTicket(ticket),
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

  Widget _buildSegmentButton({
    required String label,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.surface : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: isSelected ? Border.all(color: const Color(0xFFBFDBFE)) : null,
          boxShadow: isSelected
              ? const [
                  BoxShadow(
                    color: Color(0x0A0F172A),
                    blurRadius: 2,
                    offset: Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 15,
              color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
