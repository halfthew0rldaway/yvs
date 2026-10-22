import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/whatsapp_helper.dart';
import '../../data/models/tiket_model.dart';
import '../../data/providers/ticket_provider.dart';
import '../tickets/ticket_detail_screen.dart';

class CsatDetailScreen extends ConsumerStatefulWidget {
  const CsatDetailScreen({super.key});

  @override
  ConsumerState<CsatDetailScreen> createState() => _CsatDetailScreenState();
}

class _CsatDetailScreenState extends ConsumerState<CsatDetailScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  int? _selectedStarFilter;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Widget _buildStarRating(double rating, {double size = 16}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final starValue = index + 1;
        if (rating >= starValue) {
          return Icon(Icons.star_rounded, color: const Color(0xFFF59E0B), size: size);
        } else if (rating >= starValue - 0.5) {
          return Icon(Icons.star_half_rounded, color: const Color(0xFFF59E0B), size: size);
        } else {
          return Icon(Icons.star_outline_rounded, color: const Color(0xFFCBD5E1), size: size);
        }
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(technicianTicketsProvider);
    final dashboardAsync = ref.watch(dashboardProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Kepuasan Pelanggan (CSAT)'),
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
            child: Column(
              children: [
                Container(
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
                      hintText: 'Cari ulasan pelanggan, perangkat, keluhan...',
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
                const SizedBox(height: 10),

                // Star Rating Filter Pills
                SizedBox(
                  height: 32,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      _buildFilterChip('Semua Bintang', null),
                      const SizedBox(width: 6),
                      _buildFilterChip('5 Bintang', 5),
                      const SizedBox(width: 6),
                      _buildFilterChip('4 Bintang', 4),
                      const SizedBox(width: 6),
                      _buildFilterChip('3 Bintang', 3),
                      const SizedBox(width: 6),
                      _buildFilterChip('1-2 Bintang', 2),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: AppTheme.border),

          // Reviews Content
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
                        'Gagal memuat ulasan pelanggan',
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
                // Filter rated tickets
                final ratedList = allTickets.where((t) {
                  final hasRating = t.ratingTeknisi != null && t.ratingTeknisi! > 0;
                  if (!hasRating) return false;

                  if (_selectedStarFilter != null) {
                    if (_selectedStarFilter == 2) {
                      if (t.ratingTeknisi! > 2.0) return false;
                    } else if (t.ratingTeknisi!.round() != _selectedStarFilter) {
                      return false;
                    }
                  }

                  if (_searchQuery.isEmpty) return true;
                  final matchNo = t.nomorTiket.toLowerCase().contains(_searchQuery);
                  final matchCust = t.perangkat?.customer?.nama.toLowerCase().contains(_searchQuery) ?? false;
                  final matchDevice = (t.perangkat?.merek.toLowerCase().contains(_searchQuery) ?? false) ||
                      (t.perangkat?.model.toLowerCase().contains(_searchQuery) ?? false);
                  final matchKeluhan = t.keluhan.toLowerCase().contains(_searchQuery);
                  return matchNo || matchCust || matchDevice || matchKeluhan;
                }).toList();

                // Compute real CSAT stats from all rated tickets
                final allRated = allTickets.where((t) => t.ratingTeknisi != null && t.ratingTeknisi! > 0).toList();

                double avgCsat = 0.0;
                if (allRated.isNotEmpty) {
                  final sumRating = allRated.fold<double>(0.0, (prev, t) => prev + (t.ratingTeknisi ?? 0.0));
                  avgCsat = sumRating / allRated.length;
                } else if (dashboardAsync.valueOrNull?.rataRataCsat != null && dashboardAsync.valueOrNull!.rataRataCsat > 0) {
                  avgCsat = dashboardAsync.valueOrNull!.rataRataCsat;
                }

                if (ratedList.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: Color(0xFFFEF3C7),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.star_rounded, size: 48, color: Color(0xFFD97706)),
                          ),
                          const SizedBox(height: 14),
                          const Text(
                            'Belum Ada Ulasan Rating',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Ulasan dan bintang kepuasan akan muncul di sini setelah pelanggan memberikan penilaian pada tiket servis Anda.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(technicianTicketsProvider);
                    ref.invalidate(dashboardProvider);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: ratedList.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 14.0),
                          child: Container(
                            padding: const EdgeInsets.all(16),
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
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'SKOR KEPUASAN (CSAT)',
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textMuted,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.baseline,
                                      textBaseline: TextBaseline.alphabetic,
                                      children: [
                                        Text(
                                          avgCsat > 0 ? avgCsat.toStringAsFixed(1) : '-',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 32,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.textPrimary,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        const Text(
                                          '/ 5.0',
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    _buildStarRating(avgCsat, size: 18),
                                  ],
                                ),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFFFBEB),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: const Color(0xFFFDE68A)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      Text(
                                        '${allRated.length}',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 20,
                                          fontWeight: FontWeight.w800,
                                          color: const Color(0xFFB45309),
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      const Text(
                                        'Total Ulasan',
                                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF92400E)),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      final ticket = ratedList[index - 1];
                      final customer = ticket.perangkat?.customer;
                      final ratingVal = ticket.ratingTeknisi ?? 5.0;

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
                                  // Top: Customer Name & Rating Stars
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Row(
                                          children: [
                                            CircleAvatar(
                                              radius: 14,
                                              backgroundColor: AppTheme.primaryLight,
                                              child: Text(
                                                customer?.nama.isNotEmpty == true ? customer!.nama[0].toUpperCase() : 'C',
                                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primary),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    customer?.nama ?? 'Customer',
                                                    style: const TextStyle(
                                                      fontSize: 13.5,
                                                      fontWeight: FontWeight.w700,
                                                      color: AppTheme.textPrimary,
                                                    ),
                                                    maxLines: 1,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                  if (ticket.ratingSubmittedAt != null || ticket.completedAt != null)
                                                    Text(
                                                      CurrencyFormatter.formatDateOnly(ticket.ratingSubmittedAt ?? ticket.completedAt!),
                                                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                                    ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      _buildStarRating(ratingVal, size: 16),
                                    ],
                                  ),
                                  const SizedBox(height: 10),

                                  // Device info & Ticket No
                                  Row(
                                    children: [
                                      const Icon(Icons.laptop_chromebook_rounded, size: 15, color: AppTheme.primary),
                                      const SizedBox(width: 5),
                                      Expanded(
                                        child: Text(
                                          '${ticket.perangkat?.merek ?? ""} ${ticket.perangkat?.model ?? ""}'.trim(),
                                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        '#${ticket.nomorTiket}',
                                        style: GoogleFonts.jetBrainsMono(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w600,
                                          color: AppTheme.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),

                                  // Customer Review / Issue Solved
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: AppTheme.background,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: AppTheme.borderLight),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Masalah Servis Terselesaikan:',
                                          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          ticket.keluhan,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.35),
                                        ),
                                      ],
                                    ),
                                  ),

                                  const SizedBox(height: 8),

                                  // Footer
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Teknisi: ${ticket.teknisiNama}',
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppTheme.primary),
                                      ),
                                      if (customer != null && customer.nomorTelepon.isNotEmpty && customer.nomorTelepon != '-')
                                        InkWell(
                                          onTap: () {
                                            WhatsAppHelper.openChat(
                                              customer.nomorTelepon,
                                              message: 'Halo kak ${customer.nama}, terima kasih atas rating ulasan servis unit #${ticket.nomorTiket}.',
                                            );
                                          },
                                          borderRadius: BorderRadius.circular(6),
                                          child: const Padding(
                                            padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.chat_bubble_outline_rounded, size: 12, color: Color(0xFF059669)),
                                                SizedBox(width: 3),
                                                Text(
                                                  'Balas WA',
                                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF047857)),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
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

  Widget _buildFilterChip(String label, int? star) {
    final isSelected = _selectedStarFilter == star;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _selectedStarFilter = selected ? star : null);
      },
      labelStyle: TextStyle(
        fontSize: 11.5,
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        color: isSelected ? Colors.white : AppTheme.textPrimary,
      ),
      selectedColor: AppTheme.primary,
      backgroundColor: AppTheme.surface,
      side: BorderSide(color: isSelected ? AppTheme.primary : AppTheme.border),
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 8),
    );
  }
}

