import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../data/providers/auth_provider.dart';
import '../../data/providers/notification_provider.dart';
import '../attendance/attendance_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../handover/handover_screen.dart';
import '../profile/profile_screen.dart';
import '../sparepart/sparepart_list_screen.dart';
import '../tickets/ticket_list_screen.dart';

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

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isFrontmanOrAdmin = user?.role == 'admin' || user?.role == 'pimpinan' || user?.role == 'frontman';

    final notificationsAsync = ref.watch(notificationsProvider);
    final unreadCount = notificationsAsync.valueOrNull?.where((n) => !n.isRead).length ?? 0;

    // Dynamic Pages based on role
    final List<Widget> pages = isFrontmanOrAdmin
        ? [
            const DashboardScreen(),
            const HandoverScreen(),
            const TicketListScreen(),
            const SparepartListScreen(),
            const AttendanceScreen(),
          ]
        : [
            const DashboardScreen(),
            const TicketListScreen(),
            const SparepartListScreen(),
            const AttendanceScreen(),
            const ProfileScreen(),
          ];

    // Ensure index within bounds
    final safeIndex = _currentIndex >= pages.length ? 0 : _currentIndex;

    return Scaffold(
      body: IndexedStack(
        index: safeIndex,
        children: pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppTheme.surface,
          border: const Border(
            top: BorderSide(color: AppTheme.border, width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: isFrontmanOrAdmin
                  ? [
                      _NavItem(
                        index: 0,
                        currentIndex: safeIndex,
                        icon: Icons.dashboard_outlined,
                        selectedIcon: Icons.dashboard_rounded,
                        label: 'Beranda',
                        onTap: () => _onTabSelected(0),
                      ),
                      _NavItem(
                        index: 1,
                        currentIndex: safeIndex,
                        icon: Icons.handshake_outlined,
                        selectedIcon: Icons.handshake_rounded,
                        label: 'Handover',
                        onTap: () => _onTabSelected(1),
                      ),
                      _NavItem(
                        index: 2,
                        currentIndex: safeIndex,
                        icon: Icons.assignment_outlined,
                        selectedIcon: Icons.assignment_rounded,
                        label: 'Tiket',
                        onTap: () => _onTabSelected(2),
                      ),
                      _NavItem(
                        index: 3,
                        currentIndex: safeIndex,
                        icon: Icons.inventory_2_outlined,
                        selectedIcon: Icons.inventory_2_rounded,
                        label: 'Sparepart',
                        onTap: () => _onTabSelected(3),
                      ),
                      _NavItem(
                        index: 4,
                        currentIndex: safeIndex,
                        icon: Icons.pin_drop_outlined,
                        selectedIcon: Icons.pin_drop_rounded,
                        label: 'Presensi',
                        onTap: () => _onTabSelected(4),
                      ),
                    ]
                  : [
                      _NavItem(
                        index: 0,
                        currentIndex: safeIndex,
                        icon: Icons.dashboard_outlined,
                        selectedIcon: Icons.dashboard_rounded,
                        label: 'Beranda',
                        onTap: () => _onTabSelected(0),
                      ),
                      _NavItem(
                        index: 1,
                        currentIndex: safeIndex,
                        icon: Icons.assignment_outlined,
                        selectedIcon: Icons.assignment_rounded,
                        label: 'Tiket',
                        onTap: () => _onTabSelected(1),
                      ),
                      _NavItem(
                        index: 2,
                        currentIndex: safeIndex,
                        icon: Icons.inventory_2_outlined,
                        selectedIcon: Icons.inventory_2_rounded,
                        label: 'Sparepart',
                        onTap: () => _onTabSelected(2),
                      ),
                      _NavItem(
                        index: 3,
                        currentIndex: safeIndex,
                        icon: Icons.pin_drop_outlined,
                        selectedIcon: Icons.pin_drop_rounded,
                        label: 'Presensi',
                        onTap: () => _onTabSelected(3),
                      ),
                      _NavItem(
                        index: 4,
                        currentIndex: safeIndex,
                        icon: Icons.person_outline_rounded,
                        selectedIcon: Icons.person_rounded,
                        label: 'Profil',
                        badgeCount: unreadCount > 0 ? unreadCount : null,
                        onTap: () => _onTabSelected(4),
                      ),
                    ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatefulWidget {
  final int index;
  final int currentIndex;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final int? badgeCount;
  final VoidCallback onTap;

  const _NavItem({
    required this.index,
    required this.currentIndex,
    required this.icon,
    required this.selectedIcon,
    required this.label,
    this.badgeCount,
    required this.onTap,
  });

  @override
  State<_NavItem> createState() => _NavItemState();
}

class _NavItemState extends State<_NavItem> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 180),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutBack),
    );

    if (widget.index == widget.currentIndex) {
      _animController.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(covariant _NavItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentIndex == widget.index && oldWidget.currentIndex != widget.index) {
      _animController.forward(from: 0.0);
    } else if (widget.currentIndex != widget.index && oldWidget.currentIndex == widget.index) {
      _animController.reverse();
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSelected = widget.index == widget.currentIndex;

    return InkWell(
      onTap: widget.onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                ScaleTransition(
                  scale: _scaleAnimation,
                  child: Icon(
                    isSelected ? widget.selectedIcon : widget.icon,
                    size: 22,
                    color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
                  ),
                ),
                if (widget.badgeCount != null && widget.badgeCount! > 0)
                  Positioned(
                    right: -6,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(3),
                      decoration: const BoxDecoration(
                        color: AppTheme.error,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 14,
                        minHeight: 14,
                      ),
                      child: Text(
                        widget.badgeCount! > 9 ? '9+' : '${widget.badgeCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              widget.label,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
