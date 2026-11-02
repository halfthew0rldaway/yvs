import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../data/providers/auth_provider.dart';
import '../../data/providers/notification_provider.dart';
import '../dashboard/dashboard_screen.dart';
import '../handover/handover_screen.dart';
import '../profile/profile_screen.dart';
import '../scanner/qr_scanner_screen.dart';
import '../sparepart/sparepart_list_screen.dart';
import '../tickets/ticket_list_screen.dart';
import 'diagonal_floating_dock.dart';

class MainNavigationScreen extends ConsumerStatefulWidget {
  final int initialIndex;

  const MainNavigationScreen({
    super.key,
    this.initialIndex = 0,
  });

  @override
  ConsumerState<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends ConsumerState<MainNavigationScreen> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  void _onTabSelected(int index) {
    if (_currentIndex != index) {
      HapticFeedback.selectionClick();
      setState(() => _currentIndex = index);
    }
  }

  void _openQrScanner() {
    HapticFeedback.mediumImpact();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const QrScannerScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isFrontmanOrAdmin = user?.role == 'admin' || user?.role == 'pimpinan' || user?.role == 'frontman';

    final notificationsAsync = ref.watch(notificationsProvider);
    final unreadCount = notificationsAsync.valueOrNull?.where((n) => !n.isRead).length ?? 0;

    // Dynamic Pages based on role (4 destinations flanked around center QR scanner)
    final List<Widget> pages = isFrontmanOrAdmin
        ? [
            const DashboardScreen(),
            const HandoverScreen(),
            const TicketListScreen(),
            const ProfileScreen(),
          ]
        : [
            const DashboardScreen(),
            const TicketListScreen(),
            const SparepartListScreen(),
            const ProfileScreen(),
          ];

    // Dynamic Destinations for Scooped Floating Dock
    final List<NavDestination> destinations = isFrontmanOrAdmin
        ? [
            const NavDestination(
              index: 0,
              label: 'Beranda',
              icon: Icons.dashboard_outlined,
              selectedIcon: Icons.dashboard_rounded,
            ),
            const NavDestination(
              index: 1,
              label: 'Handover',
              icon: Icons.handshake_outlined,
              selectedIcon: Icons.handshake_rounded,
            ),
            const NavDestination(
              index: 2,
              label: 'Tiket',
              icon: Icons.assignment_outlined,
              selectedIcon: Icons.assignment_rounded,
            ),
            NavDestination(
              index: 3,
              label: 'Profil',
              icon: Icons.person_outline_rounded,
              selectedIcon: Icons.person_rounded,
              badgeCount: unreadCount > 0 ? unreadCount : null,
            ),
          ]
        : [
            const NavDestination(
              index: 0,
              label: 'Beranda',
              icon: Icons.dashboard_outlined,
              selectedIcon: Icons.dashboard_rounded,
            ),
            const NavDestination(
              index: 1,
              label: 'Tiket',
              icon: Icons.assignment_outlined,
              selectedIcon: Icons.assignment_rounded,
            ),
            const NavDestination(
              index: 2,
              label: 'Sparepart',
              icon: Icons.inventory_2_outlined,
              selectedIcon: Icons.inventory_2_rounded,
            ),
            NavDestination(
              index: 3,
              label: 'Profil',
              icon: Icons.person_outline_rounded,
              selectedIcon: Icons.person_rounded,
              badgeCount: unreadCount > 0 ? unreadCount : null,
            ),
          ];

    // Ensure index within bounds
    final safeIndex = _currentIndex >= pages.length ? 0 : _currentIndex;

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: IndexedStack(
        index: safeIndex,
        children: pages,
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        bottom: true,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: ScoopedFloatingDock(
            currentIndex: safeIndex,
            onItemSelected: _onTabSelected,
            onCenterAction: _openQrScanner,
            centerIcon: Icons.qr_code_scanner_rounded,
            centerTooltip: 'Pindai QR Tiket / Unit',
            destinations: destinations,
          ),
        ),
      ),
    );
  }
}
