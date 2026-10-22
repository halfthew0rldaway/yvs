import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_theme.dart';
import '../../data/providers/auth_provider.dart';
import '../../data/providers/notification_provider.dart';
import '../../data/providers/ticket_provider.dart';
import '../auth/login_screen.dart';
import '../notifications/notification_screen.dart';
import '../wiki/wiki_list_screen.dart';
import 'change_password_screen.dart';
import 'completed_tickets_screen.dart';
import 'csat_detail_screen.dart';
import 'edit_profile_screen.dart';
import 'resolution_time_screen.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    HapticFeedback.mediumImpact();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.error.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.logout_rounded, color: AppTheme.error, size: 20),
            ),
            const SizedBox(width: 12),
            const Text('Konfirmasi Keluar', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'Apakah Anda yakin ingin keluar dari akun teknisi? Riwayat kerja Anda tetap tersimpan aman di server.',
          style: TextStyle(fontSize: 13.5, color: AppTheme.textSecondary, height: 1.4),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            style: TextButton.styleFrom(
              foregroundColor: AppTheme.textSecondary,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.error,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              HapticFeedback.selectionClick();
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: const Text('Keluar', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
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
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final dashboardAsync = ref.watch(dashboardProvider);
    final ticketsAsync = ref.watch(technicianTicketsProvider);
    final notificationsAsync = ref.watch(notificationsProvider);

    final unreadNotificationCount = notificationsAsync.valueOrNull
            ?.where((n) => !n.isRead)
            .length ??
        0;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Profil & Akun'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Segarkan Data',
            onPressed: () {
              HapticFeedback.lightImpact();
              ref.invalidate(dashboardProvider);
              ref.invalidate(technicianTicketsProvider);
              ref.invalidate(notificationsProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          HapticFeedback.lightImpact();
          ref.invalidate(dashboardProvider);
          ref.invalidate(technicianTicketsProvider);
          ref.invalidate(notificationsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            // Technician Identity Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x060F172A),
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primary, Color(0xFF1D4ED8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primary.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        user?.nama.isNotEmpty == true ? user!.nama[0].toUpperCase() : 'T',
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.nama ?? 'Teknisi Servis',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 16.5,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          user?.email ?? '-',
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: AppTheme.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppTheme.indigoBg,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: AppTheme.indigoBorder),
                              ),
                              child: Text(
                                (user?.role ?? 'teknisi').toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.indigoText,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF0FDF4),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFBBF7D0)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF16A34A),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 5),
                                  const Text(
                                    'Aktif Bertugas',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF15803D),
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
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Performance Metrics Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'METRIK PERFORMA TEKNISI',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textSecondary,
                    letterSpacing: 0.8,
                  ),
                ),
                Text(
                  'Ketuk kartu untuk rincian',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppTheme.primary.withOpacity(0.85),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Interactive Metrics Cards
            dashboardAsync.when(
              data: (data) {
                int completedCount = data.tiketSelesai;
                double durationDays = data.rataRataDurasiHari;
                double csatScore = data.rataRataCsat;

                // Dynamic client-side verification to guarantee live data accuracy
                final allTickets = ticketsAsync.valueOrNull;
                if (allTickets != null) {
                  final completedList = allTickets
                      .where((t) => t.status == 'selesai' || t.status == 'diambil')
                      .toList();
                  if (completedCount == 0) {
                    completedCount = completedList.length;
                  }
                  if (durationDays <= 0) {
                    final withDates = completedList
                        .where((t) => t.createdAt != null && t.completedAt != null)
                        .toList();
                    if (withDates.isNotEmpty) {
                      double totalMs = 0;
                      int valid = 0;
                      for (final t in withDates) {
                        try {
                          final start = DateTime.parse(t.createdAt!);
                          final end = DateTime.parse(t.completedAt!);
                          final diff = end.difference(start).inMilliseconds;
                          if (diff > 0) {
                            totalMs += diff;
                            valid++;
                          }
                        } catch (_) {}
                      }
                      if (valid > 0) {
                        durationDays = (totalMs / valid) / (1000 * 60 * 60 * 24);
                      }
                    }
                  }
                  if (csatScore <= 0) {
                    final ratedList = allTickets
                        .where((t) => t.ratingTeknisi != null && t.ratingTeknisi! > 0)
                        .toList();
                    if (ratedList.isNotEmpty) {
                      final totalStars = ratedList.fold<double>(
                          0.0, (sum, t) => sum + t.ratingTeknisi!.toDouble());
                      csatScore = totalStars / ratedList.length;
                    }
                  }
                }

                return Row(
                  children: [
                    // Card 1: Completed Tickets
                    Expanded(
                      child: _MetricCard(
                        icon: Icons.task_alt_rounded,
                        iconColor: const Color(0xFF10B981),
                        iconBg: const Color(0xFFECFDF5),
                        value: '$completedCount',
                        label: 'Tiket Selesai',
                        hint: 'Riwayat Tiket',
                        onTap: () {
                          HapticFeedback.lightImpact();
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const CompletedTicketsScreen(),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Card 2: Resolution Time
                    Expanded(
                      child: _MetricCard(
                        icon: Icons.timer_outlined,
                        iconColor: AppTheme.primary,
                        iconBg: const Color(0xFFEFF6FF),
                        value: _formatDuration(durationDays),
                        label: 'Rata-rata Durasi',
                        hint: 'Analisis SLA',
                        onTap: () {
                          HapticFeedback.lightImpact();
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ResolutionTimeDetailScreen(),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Card 3: CSAT
                    Expanded(
                      child: _MetricCard(
                        icon: Icons.star_rounded,
                        iconColor: const Color(0xFFF59E0B),
                        iconBg: const Color(0xFFFFFBEB),
                        value: csatScore > 0 ? csatScore.toStringAsFixed(1) : '-',
                        label: 'Kepuasan (CSAT)',
                        hint: 'Ulasan User',
                        onTap: () {
                          HapticFeedback.lightImpact();
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const CsatDetailScreen(),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                );
              },
              loading: () => Container(
                padding: const EdgeInsets.symmetric(vertical: 28),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: const Center(
                  child: SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              ),
              error: (err, _) => Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: AppTheme.warning, size: 20),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'Metrik real-time belum dapat dimuat',
                        style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                    ),
                    TextButton(
                      onPressed: () => ref.invalidate(dashboardProvider),
                      child: const Text('Coba Lagi', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Section 1: Pengaturan Akun (Clean separate sections)
            const Text(
              'PENGATURAN AKUN',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                color: AppTheme.textSecondary,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            _SettingsGroup(
              children: [
                _SettingsTile(
                  icon: Icons.person_outline_rounded,
                  iconColor: AppTheme.primary,
                  iconBg: const Color(0xFFEFF6FF),
                  title: 'Informasi Profil',
                  subtitle: 'Nama lengkap, email akun & info teknisi',
                  onTap: () {
                    HapticFeedback.lightImpact();
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                    );
                  },
                ),
                _SettingsTile(
                  icon: Icons.lock_outline_rounded,
                  iconColor: const Color(0xFFD97706),
                  iconBg: const Color(0xFFFFFBEB),
                  title: 'Keamanan & Kata Sandi',
                  subtitle: 'Perbarui kata sandi akun secara berkala',
                  onTap: () {
                    HapticFeedback.lightImpact();
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ChangePasswordScreen()),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Section 2: Bantuan & Operasional
            const Text(
              'BANTUAN & OPERASIONAL',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                color: AppTheme.textSecondary,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            _SettingsGroup(
              children: [
                _SettingsTile(
                  icon: Icons.menu_book_rounded,
                  iconColor: const Color(0xFF6366F1),
                  iconBg: const Color(0xFFEEF2FF),
                  title: 'Buku Saku SOP Meja Kerja',
                  subtitle: 'Protokol ESD, 8-Point QC & Wiki Panduan Servis',
                  badgeText: 'WOW SOP',
                  badgeColor: const Color(0xFFEEF2FF),
                  badgeTextColor: const Color(0xFF4F46E5),
                  badgeBorderColor: const Color(0xFFC7D2FE),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const WikiListScreen()),
                    );
                  },
                ),
                _SettingsTile(
                  icon: Icons.notifications_outlined,
                  iconColor: const Color(0xFF0D9488),
                  iconBg: const Color(0xFFF0FDFA),
                  title: 'Pusat Notifikasi & Memo',
                  subtitle: 'Pemberitahuan workshop & memo dari admin',
                  badgeText: unreadNotificationCount > 0 ? '$unreadNotificationCount Baru' : null,
                  badgeColor: const Color(0xFFFEF2F2),
                  badgeTextColor: AppTheme.error,
                  badgeBorderColor: const Color(0xFFFECACA),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const NotificationScreen()),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Section 3: Sesi Kerja
            const Text(
              'SESI KERJA',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
                color: AppTheme.textSecondary,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 8),
            _SettingsGroup(
              children: [
                _SettingsTile(
                  icon: Icons.logout_rounded,
                  iconColor: AppTheme.error,
                  iconBg: const Color(0xFFFEF2F2),
                  title: 'Keluar dari Akun Teknisi',
                  subtitle: 'Akhiri sesi meja kerja di perangkat ini',
                  titleColor: AppTheme.error,
                  showChevron: true,
                  onTap: () => _showLogoutDialog(context, ref),
                ),
              ],
            ),
            const SizedBox(height: 28),

            // App Version Footer
            Center(
              child: Column(
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Color(0xFF10B981),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'Workbench Online & Sinkron',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Serv.io Mobile v1.0.0 • Bengkel Management System',
                    style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricCard extends StatefulWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String value;
  final String label;
  final String hint;
  final VoidCallback onTap;

  const _MetricCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.value,
    required this.label,
    required this.hint,
    required this.onTap,
  });

  @override
  State<_MetricCard> createState() => _MetricCardState();
}

class _MetricCardState extends State<_MetricCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _isPressed ? 0.96 : 1.0,
      duration: const Duration(milliseconds: 100),
      curve: Curves.easeInOut,
      child: Material(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          onTap: widget.onTap,
          onTapDown: (_) => setState(() => _isPressed = true),
          onTapUp: (_) => setState(() => _isPressed = false),
          onTapCancel: () => setState(() => _isPressed = false),
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.border),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x050F172A),
                  blurRadius: 4,
                  offset: Offset(0, 1),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: widget.iconBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(widget.icon, size: 16, color: widget.iconColor),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: AppTheme.textMuted),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  widget.value,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                    letterSpacing: -0.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  widget.label,
                  style: const TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  widget.hint,
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    color: widget.iconColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  final List<Widget> children;

  const _SettingsGroup({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x050F172A),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (int i = 0; i < children.length; i++) ...[
            children[i],
            if (i < children.length - 1)
              const Divider(height: 1, indent: 56, endIndent: 16, color: AppTheme.border),
          ],
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Color? titleColor;
  final String? badgeText;
  final Color? badgeColor;
  final Color? badgeTextColor;
  final Color? badgeBorderColor;
  final bool showChevron;

  const _SettingsTile({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.titleColor,
    this.badgeText,
    this.badgeColor,
    this.badgeTextColor,
    this.badgeBorderColor,
    this.showChevron = true,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 19),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                        color: titleColor ?? AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 11.5,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              if (badgeText != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: badgeColor ?? const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: badgeBorderColor ?? const Color(0xFFBFDBFE)),
                  ),
                  child: Text(
                    badgeText!,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: badgeTextColor ?? AppTheme.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
              ],
              if (showChevron)
                const Icon(Icons.chevron_right_rounded, size: 20, color: AppTheme.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
