import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/whatsapp_helper.dart';
import '../../core/widgets/ticket_card.dart';
import '../../data/models/sparepart_model.dart';
import '../../data/providers/auth_provider.dart';
import '../../data/providers/notification_provider.dart';
import '../../data/providers/ticket_provider.dart';
import '../auth/login_screen.dart';
import '../notifications/notification_screen.dart';
import '../scanner/qr_scanner_screen.dart';
import '../sparepart/sparepart_list_screen.dart';
import '../tickets/ticket_detail_screen.dart';
import '../tickets/ticket_list_screen.dart';
import '../wiki/wiki_list_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final dashboardAsync = ref.watch(dashboardProvider);

    final nowStr = CurrencyFormatter.formatHeaderDateTime(DateTime.now());

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.handyman_rounded, color: AppTheme.primary, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Serv.io Workshop',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
                Text(
                  'Meja Kerja: ${user?.nama ?? "Teknisi"}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_outlined, color: AppTheme.primary),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const QrScannerScreen()),
              );
            },
            tooltip: 'Scan Tiket Servis',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardProvider);
          ref.invalidate(ticketsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          children: [
            // Technician Greeting & Status Panel
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x080F172A),
                    blurRadius: 4,
                    offset: Offset(0, 1),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Halo, ${user?.nama ?? "Teknisi"}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            const Icon(Icons.schedule, size: 13, color: AppTheme.textMuted),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                nowStr,
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  color: AppTheme.textSecondary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Row(
                    children: [
                      // Notification Bell with Badge
                      Consumer(
                        builder: (context, ref, child) {
                          final unreadAsync = ref.watch(unreadNotificationCountProvider);
                          final count = unreadAsync.value ?? 0;
                          return Stack(
                            clipBehavior: Clip.none,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.notifications_outlined, size: 21, color: AppTheme.textPrimary),
                                style: IconButton.styleFrom(
                                  backgroundColor: AppTheme.surface,
                                  shape: const CircleBorder(),
                                  padding: const EdgeInsets.all(7),
                                ),
                                tooltip: 'Notifikasi & Memo',
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const NotificationScreen()),
                                  );
                                },
                              ),
                              if (count > 0)
                                Positioned(
                                  right: 2,
                                  top: 2,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppTheme.error,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                    child: Text(
                                      count > 99 ? '99+' : '$count',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                            ],
                          );
                        },
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFA7F3D0)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 7,
                              height: 7,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            const Text(
                              'On Duty',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF047857),
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
            const SizedBox(height: 12),

            // SLA Donut Card & Dual Alerts
            dashboardAsync.when(
              loading: () => Container(
                height: 240,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: const CircularProgressIndicator(),
              ),
              error: (err, _) {
                final isAuthError = err is DioException && err.response?.statusCode == 401;
                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.errorBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.errorBorder),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.error_outline, color: AppTheme.error),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              isAuthError
                                  ? 'Sesi Anda telah berakhir atau belum terautentikasi di server live.'
                                  : 'Gagal memuat analitik SLA: $err',
                              style: const TextStyle(fontSize: 12, color: AppTheme.errorText),
                            ),
                          ),
                        ],
                      ),
                      if (isAuthError) ...[
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            icon: const Icon(Icons.login, size: 16),
                            label: const Text('Login Ulang ke Server'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                            ),
                            onPressed: () async {
                              await ref.read(authProvider.notifier).logout();
                              if (context.mounted) {
                                Navigator.pushAndRemoveUntil(
                                  context,
                                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                                  (route) => false,
                                );
                              }
                            },
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
              data: (data) => Column(
                children: [
                  _buildSlaCard(context, ref, data),
                  const SizedBox(height: 12),
                  _buildUrgentAlerts(context, ref, data),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Quick Actions Command Toolbar
            _buildQuickActions(context),
            const SizedBox(height: 16),

            // Active Workspace Section (Sedang Dikerjakan)
            dashboardAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (data) => _buildActiveWorkspaceSection(context, ref, data),
            ),
            const SizedBox(height: 16),

            // Low Stock Spareparts Section
            dashboardAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (data) => _buildLowStockSection(context, data.sparepartHampirHabis),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSlaCard(BuildContext context, WidgetRef ref, DashboardData data) {
    final sla = data.slaSummary;
    final total = sla.totalActive;
    final onTrack = sla.onTrackCount;
    final warning = sla.warningCount;
    final overdue = sla.overdueCount;
    final pendingAcc = sla.pendingApprovalCount;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x080F172A),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.timelapse_rounded, size: 18, color: AppTheme.primary),
                  SizedBox(width: 6),
                  Text(
                    'Status SLA Pengerjaan',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Text(
                  '${data.dalamPerbaikan} Dikerjakan',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Donut Chart Graphic
          Center(
            child: SizedBox(
              width: 130,
              height: 130,
              child: CustomPaint(
                painter: _SlaDonutPainter(
                  onTrack: onTrack,
                  warning: warning,
                  overdue: overdue,
                  pendingAcc: pendingAcc,
                  total: total,
                ),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$total',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                          height: 1.0,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'TIKET AKTIF',
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textMuted,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Donut Legend Matrix (2x2 Grid)
          Row(
            children: [
              Expanded(
                child: _buildLegendItem(
                  'On Track',
                  onTrack,
                  const Color(0xFF10B981),
                  const Color(0xFFF0FDF4),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildLegendItem(
                  'Warning',
                  warning,
                  const Color(0xFFF59E0B),
                  const Color(0xFFFFFBEB),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildLegendItem(
                  'Overdue',
                  overdue,
                  AppTheme.error,
                  AppTheme.errorBg,
                  isAlert: overdue > 0,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildLegendItem(
                  'Pause (ACC)',
                  pendingAcc,
                  AppTheme.primary,
                  const Color(0xFFEFF6FF),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, int count, Color indicatorColor, Color bgColor, {bool isAlert = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isAlert ? AppTheme.errorBorder : AppTheme.borderLight,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  color: indicatorColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: isAlert ? FontWeight.w700 : FontWeight.w500,
                  color: isAlert ? AppTheme.error : AppTheme.textSecondary,
                ),
              ),
            ],
          ),
          Text(
            '$count',
            style: GoogleFonts.jetBrainsMono(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isAlert ? AppTheme.error : AppTheme.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUrgentAlerts(BuildContext context, WidgetRef ref, DashboardData data) {
    return Row(
      children: [
        // Left: Overdue
        Expanded(
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                ref.read(ticketFilterProvider.notifier).state = const TicketFilterState(
                  slaUrgency: 'overdue',
                  onlyMyTickets: false,
                );
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const TicketListScreen()),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Icon(Icons.warning_amber_rounded, size: 20, color: AppTheme.error),
                        Icon(Icons.arrow_forward_rounded, size: 16, color: AppTheme.error),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${data.overdueCount}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.error,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Melewati Estimasi',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF991B1B),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),

        // Right: Priority Express
        Expanded(
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () {
                ref.read(ticketFilterProvider.notifier).state = const TicketFilterState(
                  slaPaket: 'express',
                  onlyMyTickets: false,
                );
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const TicketListScreen()),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Icon(Icons.bolt, size: 20, color: AppTheme.primary),
                        Icon(Icons.arrow_forward_rounded, size: 16, color: AppTheme.primary),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${data.expressCount}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primary,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Prioritas Express',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1E40AF),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildActionButton(
            context,
            icon: Icons.qr_code_scanner,
            label: 'Scan QR',
            iconColor: AppTheme.primary,
            bgColor: const Color(0xFFEFF6FF),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const QrScannerScreen()),
            ),
          ),
          _buildActionButton(
            context,
            icon: Icons.assignment_outlined,
            label: 'Tiket Saya',
            iconColor: AppTheme.indigo,
            bgColor: const Color(0xFFEEF2FF),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const TicketListScreen()),
            ),
          ),
          _buildActionButton(
            context,
            icon: Icons.inventory_2_outlined,
            label: 'Cek Stok',
            iconColor: const Color(0xFF0D9488),
            bgColor: const Color(0xFFCCFBF1),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SparepartListScreen()),
            ),
          ),
          _buildActionButton(
            context,
            icon: Icons.menu_book_rounded,
            label: 'Pustaka SOP',
            iconColor: const Color(0xFFD97706),
            bgColor: const Color(0xFFFEF3C7),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const WikiListScreen()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color iconColor,
    required Color bgColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: bgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveWorkspaceSection(BuildContext context, WidgetRef ref, DashboardData data) {
    final activeTickets = data.activeTickets;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Row(
              children: [
                Icon(Icons.build_circle_outlined, size: 18, color: AppTheme.primary),
                SizedBox(width: 6),
                Text(
                  'Sedang Dikerjakan di Meja',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            TextButton(
              onPressed: () {
                ref.read(ticketFilterProvider.notifier).state = const TicketFilterState(
                  status: 'dalam_perbaikan',
                  onlyMyTickets: true,
                );
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const TicketListScreen()),
                );
              },
              child: const Text('Lihat Antrean', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
        const SizedBox(height: 4),
        if (activeTickets.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: const Center(
              child: Text(
                'Tidak ada unit dalam perbaikan aktif saat ini.',
                style: TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
              ),
            ),
          )
        else
          ...activeTickets.take(3).map((ticket) {
            return TicketCard(
              ticket: ticket,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => TicketDetailScreen(ticketId: ticket.id),
                  ),
                );
              },
            );
          }),
      ],
    );
  }

  Widget _buildLowStockSection(BuildContext context, List<SparepartModel> parts) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Row(
              children: [
                Icon(Icons.warning_amber_rounded, size: 18, color: AppTheme.error),
                SizedBox(width: 6),
                Text(
                  'Stok Sparepart Kritis di Gudang',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SparepartListScreen()),
                );
              },
              child: const Text('Katalog Part', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: parts.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Center(
                    child: Text(
                      'Semua stok sparepart dalam batas aman.',
                      style: TextStyle(fontSize: 12.5, color: AppTheme.textSecondary),
                    ),
                  ),
                )
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: parts.take(4).length,
                  separatorBuilder: (_, __) => const Divider(height: 1, color: AppTheme.borderLight),
                  itemBuilder: (context, index) {
                    final part = parts[index];
                    final isZero = part.stok == 0;
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  part.nama,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${part.kategori} • ${CurrencyFormatter.formatRupiah(part.harga)}',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isZero ? AppTheme.errorBg : const Color(0xFFFFFBEB),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: isZero ? AppTheme.errorBorder : const Color(0xFFFDE68A),
                                  ),
                                ),
                                child: Text(
                                  '${part.stok} unit',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: isZero ? AppTheme.error : const Color(0xFF92400E),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              InkWell(
                                onTap: () => _handleReminderAdmin(context, part),
                                borderRadius: BorderRadius.circular(6),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryLight,
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: AppTheme.border),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.campaign_outlined, size: 14, color: AppTheme.primary),
                                      SizedBox(width: 4),
                                      Text(
                                        'Ingatkan Admin',
                                        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: AppTheme.primary),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  static Future<void> _handleReminderAdmin(BuildContext context, SparepartModel part) async {
    final client = ApiClient();
    try {
      final res = await client.dio.post(ApiConstants.sparepartReminder(part.id));
      final waText = res.data['wa_text']?.toString() ??
          'Halo Admin Serv.io, stok sparepart ${part.displayName} saat ini sisa ${part.stok} unit di gudang. Mohon segera pengadaan / restock. Terima kasih.';

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Notifikasi restock untuk ${part.displayName} terkirim ke Admin!'),
            backgroundColor: AppTheme.success,
            action: SnackBarAction(
              label: 'Kirim WA',
              textColor: Colors.white,
              onPressed: () {
                WhatsAppHelper.openCustomMessage(message: waText);
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Gagal mengirim pengingat ke Admin'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    }
  }
}

class _SlaDonutPainter extends CustomPainter {
  final int onTrack;
  final int warning;
  final int overdue;
  final int pendingAcc;
  final int total;

  _SlaDonutPainter({
    required this.onTrack,
    required this.warning,
    required this.overdue,
    required this.pendingAcc,
    required this.total,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - 16) / 2;
    const strokeWidth = 11.0;

    final bgPaint = Paint()
      ..color = const Color(0xFFF1F5F9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    canvas.drawCircle(center, radius, bgPaint);

    if (total == 0) return;

    final segments = [
      _Segment(overdue, AppTheme.error),
      _Segment(warning, const Color(0xFFF59E0B)),
      _Segment(pendingAcc, AppTheme.primary),
      _Segment(onTrack, const Color(0xFF10B981)),
    ];

    double startAngle = -math.pi / 2;

    for (final seg in segments) {
      if (seg.value <= 0) continue;
      final sweepAngle = (seg.value / total) * 2 * math.pi;

      final paint = Paint()
        ..color = seg.color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      // Small inset to separate segments cleanly
      final effectiveSweep = sweepAngle > 0.08 ? sweepAngle - 0.04 : sweepAngle;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle + 0.02,
        effectiveSweep,
        false,
        paint,
      );

      startAngle += sweepAngle;
    }
  }

  @override
  bool shouldRepaint(covariant _SlaDonutPainter oldDelegate) {
    return oldDelegate.onTrack != onTrack ||
        oldDelegate.warning != warning ||
        oldDelegate.overdue != overdue ||
        oldDelegate.pendingAcc != pendingAcc ||
        oldDelegate.total != total;
  }
}

class _Segment {
  final int value;
  final Color color;
  _Segment(this.value, this.color);
}
