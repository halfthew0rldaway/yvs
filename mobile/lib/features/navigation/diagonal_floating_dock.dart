import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_theme.dart';

/// Model representing each navigation destination in the floating dock.
class NavDestination {
  final int index;
  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final int? badgeCount;
  final bool hasIndicatorDot;

  const NavDestination({
    required this.index,
    required this.label,
    required this.icon,
    required this.selectedIcon,
    this.badgeCount,
    this.hasIndicatorDot = false,
  });
}

/// A distinctive, contemporary Diagonal Floating Dock bottom navigation
/// designed specifically for the Serv.io Workshop Companion application.
///
/// Features:
/// - Floating rounded capsule geometry with subtle layered elevation.
/// - Asymmetrical diagonal pill active backdrop that smoothly slides between destinations.
/// - Circular floating active icon container with micro-elevation and glow.
/// - Accessible, predictable horizontal tap targets complying with WCAG guidelines.
/// - Smooth animated transitions without distracting bounce.
class DiagonalFloatingDock extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onItemSelected;
  final List<NavDestination> destinations;

  const DiagonalFloatingDock({
    super.key,
    required this.currentIndex,
    required this.onItemSelected,
    required this.destinations,
  });

  @override
  Widget build(BuildContext context) {
    if (destinations.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 68,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(34),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1.2,
        ),
        boxShadow: const [
          // Soft ambient drop shadow
          BoxShadow(
            color: Color(0x140F172A), // 8% slate
            blurRadius: 20,
            offset: Offset(0, 6),
            spreadRadius: 0,
          ),
          // Subtle sharp surface grounding
          BoxShadow(
            color: Color(0x0A0F172A),
            blurRadius: 4,
            offset: Offset(0, 1),
            spreadRadius: 0,
          ),
        ],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final totalWidth = constraints.maxWidth;
          final count = destinations.length;
          final itemWidth = totalWidth / count;
          final safeIndex = (currentIndex >= 0 && currentIndex < count) ? currentIndex : 0;

          return Stack(
            clipBehavior: Clip.none,
            children: [
              // 1. Sliding Diagonal Capsule Active Backdrop
              AnimatedPositioned(
                duration: const Duration(milliseconds: 240),
                curve: Curves.easeOutCubic,
                left: safeIndex * itemWidth + 4,
                top: 5,
                width: itemWidth - 8,
                height: 58,
                child: const _DiagonalActiveBackdrop(),
              ),

              // 2. Navigation Destination Items Row
              Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: destinations.map((destination) {
                  final isSelected = destination.index == safeIndex;

                  return Expanded(
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () {
                          if (destination.index != safeIndex) {
                            HapticFeedback.selectionClick();
                            onItemSelected(destination.index);
                          }
                        },
                        borderRadius: BorderRadius.circular(30),
                        splashColor: AppTheme.primary.withValues(alpha: 0.12),
                        highlightColor: AppTheme.primary.withValues(alpha: 0.06),
                        child: _DockItemContent(
                          destination: destination,
                          isSelected: isSelected,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// The diagonal-inspired active backdrop indicator with asymmetric capsule curvature
/// and a subtle aerodynamic diagonal accent.
class _DiagonalActiveBackdrop extends StatelessWidget {
  const _DiagonalActiveBackdrop();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF), // Soft primary blue tint
        // Asymmetric diagonal capsule geometry:
        // Steeper curve along top-left to bottom-right axis creates a dynamic diagonal visual flow
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(22),
          bottomRight: Radius.circular(22),
          topRight: Radius.circular(10),
          bottomLeft: Radius.circular(10),
        ),
        border: Border.all(
          color: const Color(0xFFBFDBFE).withValues(alpha: 0.7),
          width: 1.0,
        ),
      ),
      child: Stack(
        children: [
          // Subtle diagonal micro-accent dot/bar at the top corner
          Positioned(
            top: 4,
            right: 8,
            child: Transform.rotate(
              angle: -0.35, // ~20 degrees diagonal slant
              child: Container(
                width: 10,
                height: 2.5,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Internal item content rendering the icon container, badge, and label.
class _DockItemContent extends StatelessWidget {
  final NavDestination destination;
  final bool isSelected;

  const _DockItemContent({
    required this.destination,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Circular Floating Icon Container with Badge Stack
          Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              // Circular Container
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutCubic,
                width: isSelected ? 34 : 30,
                height: isSelected ? 34 : 30,
                transform: Matrix4.translationValues(0, isSelected ? -2.0 : 0.0, 0),
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.primary : Colors.transparent,
                  shape: BoxShape.circle,
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: AppTheme.primary.withValues(alpha: 0.30),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : const [
                          BoxShadow(
                            color: Colors.transparent,
                            blurRadius: 0,
                            offset: Offset.zero,
                          ),
                        ],
                ),
                child: Center(
                  child: Icon(
                    isSelected ? destination.selectedIcon : destination.icon,
                    size: isSelected ? 18 : 20,
                    color: isSelected ? Colors.white : const Color(0xFF64748B),
                  ),
                ),
              ),

              // Numbered Notification Badge (e.g. Unread notifications/tickets)
              if (destination.badgeCount != null && destination.badgeCount! > 0)
                Positioned(
                  right: -4,
                  top: isSelected ? -5 : -3,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.error,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white, width: 1.5),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x33000000),
                          blurRadius: 3,
                          offset: Offset(0, 1),
                        ),
                      ],
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      destination.badgeCount! > 9 ? '9+' : '${destination.badgeCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                        height: 1.0,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                )
              // Indicator Dot (e.g. Attention/Pending Tickets)
              else if (destination.hasIndicatorDot)
                Positioned(
                  right: -1,
                  top: isSelected ? -2 : 0,
                  child: Container(
                    width: 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B), // Warm amber indicator
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 1.2),
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 2),

          // Label
          AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 180),
            style: TextStyle(
              fontSize: isSelected ? 10.0 : 9.5,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? AppTheme.primary : const Color(0xFF64748B),
              letterSpacing: 0.1,
              fontFamily: 'Inter',
            ),
            child: Text(
              destination.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
