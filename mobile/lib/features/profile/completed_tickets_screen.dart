import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/whatsapp_helper.dart';
import '../../core/widgets/status_badge.dart';
import '../../data/models/tiket_model.dart';
import '../../data/providers/ticket_provider.dart';
import '../tickets/ticket_detail_screen.dart';

class CompletedTicketsScreen extends ConsumerStatefulWidget {
  const CompletedTicketsScreen({super.key});

  @override
  ConsumerState<CompletedTicketsScreen> createState() => _CompletedTicketsScreenState();
}

class _CompletedTicketsScreenState extends ConsumerState<CompletedTicketsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(technicianTicketsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Riwayat Tiket Selesai'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(technicianTicketsProvider);
              ref.invalidate(dashboardProvider);
            },
            tooltip: 'Segarkan',
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            color: AppTheme.surface,
            child: Container(
              height: 46,
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.border),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
                decoration: InputDecoration(
                  hintText: 'Cari tiket selesai, perangkat, customer...',
                  hintStyle: const TextStyle(fontSize: 12.5, color: AppTheme.textMuted),
                  prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.textSecondary),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 16),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),

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
                        'Gagal memuat riwayat tiket selesai',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '$err',
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        maxLines: 2,
                      ),
                      const SizedBox(height: 14),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(technicianTicketsProvider),
                        child: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (allTickets) {
                // Filter only completed tickets (selesai or diambil)
                final completedList = allTickets.where((t) {
                  final isDone = t.status == 'selesai' || t.status == 'diambil';
                  if (!isDone) return false;

                  if (_searchQuery.isEmpty) return true;
                  final matchNo = t.nomorTiket.toLowerCase().contains(_searchQuery);
                  final matchKeluhan = t.keluhan.toLowerCase().contains(_searchQuery);
                  final matchDevice = (t.perangkat?.merek.toLowerCase().contains(_searchQuery) ?? false) ||
                      (t.perangkat?.model.toLowerCase().contains(_searchQuery) ?? false);
                  final matchCust = t.perangkat?.customer?.nama.toLowerCase().contains(_searchQuery) ?? false;
                  return matchNo || matchKeluhan || matchDevice || matchCust;
                }).toList();

                if (completedList.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: Color(0xFFEFF6FF),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.check_circle_outline, size: 48, color: AppTheme.primary),
                          ),
                          const SizedBox(height: 14),
                          const Text(
                            'Belum Ada Tiket Selesai',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Tiket yang telah Anda selesaikan atau telah diambil oleh pelanggan akan tercatat di sini.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // Summary Stats
                final diambilCount = completedList.where((t) => t.status == 'diambil').length;
                final siapAmbilCount = completedList.where((t) => t.status == 'selesai').length;

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(technicianTicketsProvider);
                    ref.invalidate(dashboardProvider);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: completedList.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 14.0),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppTheme.surface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.border),
                              boxShadow: const [
                                BoxShadow(color: Color(0x060F172A), blurRadius: 4, offset: Offset(0, 1)),
                              ],
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'TOTAL SERVIS SELESAI',
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.textMuted,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${completedList.length} Unit',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 20,
                                          fontWeight: FontWeight.w800,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFECFDF5),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFA7F3D0)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.outbox_rounded, size: 14, color: Color(0xFF059669)),
                                      const SizedBox(width: 4),
                                      Text(
                                        '$diambilCount Diambil',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF047857),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFBFDBFE)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.inventory_rounded, size: 14, color: AppTheme.primary),
                                      const SizedBox(width: 4),
                                      Text(
                                        '$siapAmbilCount Siap',
                                        style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppTheme.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      final ticket = completedList[index - 1];
                      final device = ticket.perangkat;
                      final customer = device?.customer;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: AppTheme.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.border),
                          boxShadow: const [
                            BoxShadow(color: Color(0x060F172A), blurRadius: 4, offset: Offset(0, 1)),
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
                                  builder: (_) => TicketDetailScreen(ticketId: ticket.id),
                                ),
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(14.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Top: Ticket No + Status Badge
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '#${ticket.nomorTiket}',
                                        style: GoogleFonts.jetBrainsMono(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 13,
                                          color: AppTheme.textPrimary,
                                        ),
                                      ),
                                      StatusBadge(status: ticket.status),
                                    ],
                                  ),
                                  const SizedBox(height: 8),

                                  // Device
                                  Row(
                                    children: [
                                      const Icon(Icons.laptop_chromebook_rounded, size: 16, color: AppTheme.primary),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          '${device?.merek ?? ""} ${device?.model ?? ""}'.trim(),
                                          style: const TextStyle(
                                            fontSize: 13.5,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.textPrimary,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),

                                  // Customer & Contact
                                  Row(
                                    children: [
                                      const Icon(Icons.person_outline, size: 15, color: AppTheme.textMuted),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          customer?.nama ?? '-',
                                          style: const TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (customer != null && customer.nomorTelepon.isNotEmpty && customer.nomorTelepon != '-')
                                        InkWell(
                                          onTap: () {
                                            WhatsAppHelper.openChat(
                                              customer.nomorTelepon,
                                              message: 'Halo kak ${customer.nama}, saya teknisi dari Serv.io Workshop mengenai tiket #${ticket.nomorTiket}.',
                                            );
                                          },
                                          borderRadius: BorderRadius.circular(6),
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFECFDF5),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: const Color(0xFFA7F3D0)),
                                            ),
                                            child: const Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.chat_bubble_outline_rounded, size: 12, color: Color(0xFF059669)),
                                                SizedBox(width: 4),
                                                Text(
                                                  'WhatsApp',
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w600,
                                                    color: Color(0xFF047857),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),

                                  // Issue / Resolution summary
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(9),
                                    decoration: BoxDecoration(
                                      color: AppTheme.background,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: AppTheme.borderLight),
                                    ),
                                    child: Text(
                                      ticket.keluhan,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.35),
                                    ),
                                  ),

                                  const SizedBox(height: 8),

                                  // Footer: Selesai Date & Handling Technician
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Row(
                                          children: [
                                            const Icon(Icons.check_circle_outline, size: 13, color: Color(0xFF10B981)),
                                            const SizedBox(width: 4),
                                            Text(
                                              ticket.completedAt != null
                                                  ? CurrencyFormatter.formatDateOnly(ticket.completedAt!)
                                                  : 'Selesai',
                                              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                            ),
                                            const SizedBox(width: 6),
                                            const Text('•', style: TextStyle(color: AppTheme.border, fontSize: 12)),
                                            const SizedBox(width: 6),
                                            const Icon(Icons.engineering_outlined, size: 13, color: AppTheme.primary),
                                            const SizedBox(width: 4),
                                            Expanded(
                                              child: Text(
                                                'Ditangani: ${ticket.teknisiNama}',
                                                style: const TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w600,
                                                  color: AppTheme.primary,
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const Icon(Icons.chevron_right, size: 16, color: AppTheme.textMuted),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
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

