import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../data/models/tiket_model.dart';
import '../../data/providers/ticket_provider.dart';
import '../tickets/ticket_detail_screen.dart';

class ResolutionTimeDetailScreen extends ConsumerStatefulWidget {
  const ResolutionTimeDetailScreen({super.key});

  @override
  ConsumerState<ResolutionTimeDetailScreen> createState() => _ResolutionTimeDetailScreenState();
}

class _ResolutionTimeDetailScreenState extends ConsumerState<ResolutionTimeDetailScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  double _calculateDurationDays(TiketModel ticket) {
    if (ticket.createdAt == null || ticket.completedAt == null) return 0.0;
    try {
      final start = DateTime.parse(ticket.createdAt!);
      final end = DateTime.parse(ticket.completedAt!);
      final diffMs = end.difference(start).inMilliseconds;
      if (diffMs <= 0) return 0.1;
      return diffMs / (1000 * 60 * 60 * 24);
    } catch (_) {
      return 0.0;
    }
  }

  String _formatDuration(double days) {
    if (days <= 0) return '-';
    if (days < 1.0) {
      final hours = (days * 24).round();
      return '$hours Jam';
    }
    return '${days.toStringAsFixed(1)} Hari';
  }

  @override
  Widget build(BuildContext context) {
    final ticketsAsync = ref.watch(technicianTicketsProvider);
    final dashboardAsync = ref.watch(dashboardProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Analisis Durasi Pengerjaan'),
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
                  hintText: 'Cari tiket servis, perangkat, customer...',
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

          // Detail Content
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
                        'Gagal memuat data durasi pengerjaan',
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
                // Completed tickets with dates
                final withDates = allTickets.where((t) {
                  final isDone = (t.status == 'selesai' || t.status == 'diambil') && t.completedAt != null;
                  if (!isDone) return false;

                  if (_searchQuery.isEmpty) return true;
                  final matchNo = t.nomorTiket.toLowerCase().contains(_searchQuery);
                  final matchDevice = (t.perangkat?.merek.toLowerCase().contains(_searchQuery) ?? false) ||
                      (t.perangkat?.model.toLowerCase().contains(_searchQuery) ?? false);
                  final matchCust = t.perangkat?.customer?.nama.toLowerCase().contains(_searchQuery) ?? false;
                  return matchNo || matchDevice || matchCust;
                }).toList();

                if (withDates.isEmpty) {
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
                            child: const Icon(Icons.speed, size: 48, color: AppTheme.primary),
                          ),
                          const SizedBox(height: 14),
                          const Text(
                            'Belum Ada Data Durasi',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textPrimary),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Data durasi resolusi dihitung secara otomatis saat Anda menandai tiket selesai diperbaiki.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // Compute real stats from completed tickets
                double totalDaysSum = 0.0;
                double minDays = double.infinity;
                double maxDays = 0.0;

                for (final t in withDates) {
                  final dur = _calculateDurationDays(t);
                  totalDaysSum += dur;
                  if (dur < minDays) minDays = dur;
                  if (dur > maxDays) maxDays = dur;
                }

                final avgDays = withDates.isNotEmpty ? (totalDaysSum / withDates.length) : 0.0;
                final avgDisplay = dashboardAsync.valueOrNull?.rataRataDurasiHari != null && dashboardAsync.valueOrNull!.rataRataDurasiHari > 0
                    ? dashboardAsync.valueOrNull!.rataRataDurasiHari
                    : avgDays;

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(technicianTicketsProvider);
                    ref.invalidate(dashboardProvider);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: withDates.length + 1,
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
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'RATA-RATA WAKTU PENYELESAIAN',
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textMuted,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEFF6FF),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '${withDates.length} Tiket Dianalisis',
                                        style: const TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w600,
                                          color: AppTheme.primary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.baseline,
                                  textBaseline: TextBaseline.alphabetic,
                                  children: [
                                    Text(
                                      _formatDuration(avgDisplay),
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 28,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'per tiket servis',
                                      style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                    ),
                                  ],
                                ),
                                const Divider(height: 20),
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Paling Cepat',
                                            style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            minDays < double.infinity ? _formatDuration(minDays) : '-',
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                              color: Color(0xFF047857),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Paling Lama',
                                            style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            maxDays > 0 ? _formatDuration(maxDays) : '-',
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                              color: AppTheme.textPrimary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      final ticket = withDates[index - 1];
                      final durDays = _calculateDurationDays(ticket);
                      final device = ticket.perangkat;

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
                                  // Top: Ticket No + Duration Badge
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
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEFF6FF),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: const Color(0xFFBFDBFE)),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.timer_outlined, size: 12, color: AppTheme.primary),
                                            const SizedBox(width: 4),
                                            Text(
                                              _formatDuration(durDays),
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
                                  const SizedBox(height: 8),

                                  // Timeline breakdown (created -> completed)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: AppTheme.background,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: AppTheme.borderLight),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text('Masuk Servis', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                                            Text(
                                              ticket.createdAt != null ? CurrencyFormatter.formatDateOnly(ticket.createdAt!) : '-',
                                              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                                            ),
                                          ],
                                        ),
                                        const Icon(Icons.arrow_forward_rounded, size: 14, color: AppTheme.textMuted),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            const Text('Selesai Perbaikan', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                                            Text(
                                              ticket.completedAt != null ? CurrencyFormatter.formatDateOnly(ticket.completedAt!) : '-',
                                              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF047857)),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 8),

                                  // Handling technician & Chevron
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          'Ditangani: ${ticket.teknisiNama}',
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: AppTheme.textSecondary),
                                          overflow: TextOverflow.ellipsis,
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

