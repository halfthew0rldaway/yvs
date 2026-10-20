import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/ticket_card.dart';
import '../../data/providers/ticket_provider.dart';
import '../../data/providers/auth_provider.dart';
import '../scanner/qr_scanner_screen.dart';
import '../tickets/ticket_detail_screen.dart';
import '../tickets/ticket_list_screen.dart';
import '../sparepart/sparepart_list_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final dashboardAsync = ref.watch(dashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Meja Servis Teknisi',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              user?.nama ?? 'Teknisi Serv.io',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_outlined, color: AppTheme.accent),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const QrScannerScreen()),
              );
            },
            tooltip: 'Scan Tiket Servis',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardProvider);
          ref.invalidate(ticketsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16.0),
          children: [
            // KPI Stat Cards from backend /dashboard/teknisi
            dashboardAsync.when(
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 24.0),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (err, _) => Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.errorBg,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppTheme.errorBorder),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.warning_amber_rounded, color: AppTheme.error),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Tidak dapat terhubung ke server backend.',
                        style: TextStyle(fontSize: 13, color: AppTheme.errorText),
                      ),
                    ),
                  ],
                ),
              ),
              data: (data) => Column(
                children: [
                  Row(
                    children: [
                      _buildStatCard(
                        'Tiket Ditugaskan',
                        '${data.tiketDitugaskan}',
                        AppTheme.primary,
                        Icons.assignment_outlined,
                      ),
                      const SizedBox(width: 12),
                      _buildStatCard(
                        'Antrean Masuk',
                        '${data.tiketTersedia}',
                        AppTheme.warning,
                        Icons.pending_actions_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildStatCard(
                        'Menunggu Diagnosis',
                        '${data.menungguDiagnosis}',
                        AppTheme.purple,
                        Icons.biotech_outlined,
                      ),
                      const SizedBox(width: 12),
                      _buildStatCard(
                        'Dalam Perbaikan',
                        '${data.dalamPerbaikan}',
                        AppTheme.indigo,
                        Icons.build_circle_outlined,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _buildStatCard(
                        'Tiket Selesai Dikerjakan',
                        '${data.tiketSelesai}',
                        AppTheme.success,
                        Icons.check_circle_outline,
                      ),
                    ],
                  ),
                  if (data.chartData.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    _buildWorkloadBreakdown(data.chartData),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Quick Action Bar
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.qr_code_scanner, size: 18),
                    label: const Text('Scan QR Tiket'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accent),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const QrScannerScreen()),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.inventory_2_outlined, size: 18),
                    label: const Text('Katalog Part'),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const SparepartListScreen()),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Section Header: Active Tickets
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Tiket Aktif Dikerjakan',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const TicketListScreen()),
                    );
                  },
                  child: const Text('Lihat Semua'),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Active Tickets List from Dashboard API
            dashboardAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (data) {
                if (data.activeTickets.isEmpty) {
                  return Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: const Center(
                      child: Column(
                        children: [
                          Icon(Icons.done_all, color: AppTheme.success, size: 36),
                          SizedBox(height: 8),
                          Text(
                            'Tidak ada tiket servis aktif saat ini.',
                            style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Periksa antrean tiket untuk mengambil tugas baru.',
                            style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return Column(
                  children: data.activeTickets.map((t) {
                    return TicketCard(
                      ticket: t,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => TicketDetailScreen(ticketId: t.id),
                          ),
                        ).then((_) {
                          ref.invalidate(dashboardProvider);
                          ref.invalidate(ticketsProvider);
                        });
                      },
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String count, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
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
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(icon, size: 18, color: color),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              count,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkloadBreakdown(List<ChartDataItem> chartData) {
    final total = chartData.fold<int>(0, (sum, item) => sum + item.value);

    return Container(
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
            children: [
              const Row(
                children: [
                  Icon(Icons.pie_chart_outline, size: 16, color: AppTheme.accent),
                  SizedBox(width: 8),
                  Text(
                    'Distribusi Beban Kerja',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                ],
              ),
              Text(
                'Total: $total Unit',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
              ),
            ],
          ),
          const Divider(height: 20),
          ...chartData.map((item) {
            final double pct = total > 0 ? (item.value / total) : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(item.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                      Text('${item.value} unit (${(pct * 100).toStringAsFixed(0)}%)',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.textSecondary)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: pct,
                      minHeight: 6,
                      backgroundColor: AppTheme.borderLight,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accent),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
