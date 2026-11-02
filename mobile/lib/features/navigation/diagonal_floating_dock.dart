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

/// A modern scooped floating dock navigation bar with an elevated center action button,
/// designed for the Serv.io Workshop Companion application.
///
/// Visual Highlights:
/// - Continuous smooth scooped cradle notch in the center using cubic bezier curves.
/// - Elevated circular center action button (QR Scanner) with vibrant sky-to-primary blue gradient and ambient glow.
/// - Dark obsidian pill active state for selected tabs with white icon and typography.
/// - Muted slate inactive states with clear touch targets.
/// - Soft layered drop shadows and crisp outer border.
class ScoopedFloatingDock extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onItemSelected;
  final List<NavDestination> destinations;
  final VoidCallback? onCenterAction;
  final IconData centerIcon;
  final String centerTooltip;

  const ScoopedFloatingDock({
    super.key,
    required this.currentIndex,
    required this.onItemSelected,
    required this.destinations,
    this.onCenterAction,
    this.centerIcon = Icons.qr_code_scanner_rounded,
    this.centerTooltip = 'Scan QR Tiket',
  });

  @override
  Widget build(BuildContext context) {
    if (destinations.isEmpty) return const SizedBox.shrink();

    // Split destinations evenly around the center button
    final int splitIndex = destinations.length ~/ 2;
    final leftDestinations = destinations.sublist(0, splitIndex);
    final rightDestinations = destinations.sublist(splitIndex);

    const double dockHeight = 64.0;
    const double buttonSize = 52.0;
    const double stackHeight = 80.0;
    const double dockTop = stackHeight - dockHeight; // 16.0
    const double notchDepth = 36.0;
    const double notchHalfWidth = 38.0;

    return SizedBox(
      height: stackHeight,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final totalWidth = constraints.maxWidth;
          final centerX = totalWidth / 2;

          return Stack(
            clipBehavior: Clip.none,
            children: [
              // 1. Scooped Dock Background with Drop Shadows and Border
              const Positioned(
                left: 0,
                right: 0,
                top: dockTop,
                height: dockHeight,
                child: CustomPaint(
                  painter: _ScoopedDockPainter(
                    backgroundColor: Colors.white,
                    borderColor: Color(0xFFE2E8F0),
                    borderWidth: 1.2,
                    notchDepth: notchDepth,
                    notchHalfWidth: notchHalfWidth,
                    cornerRadius: 32.0,
                  ),
                ),
              ),

              // 2. Left Destinations Row
              Positioned(
                left: 6,
                top: dockTop,
                width: centerX - notchHalfWidth - 2,
                height: dockHeight,
                child: Row(
                  children: leftDestinations.map((destination) {
                    final isSelected = destination.index == currentIndex;
                    return Expanded(
                      child: _DockItem(
                        destination: destination,
                        isSelected: isSelected,
                        onTap: () => onItemSelected(destination.index),
                      ),
                    );
                  }).toList(),
                ),
              ),

              // 3. Right Destinations Row
              Positioned(
                left: centerX + notchHalfWidth + 2,
                right: 6,
                top: dockTop,
                height: dockHeight,
                child: Row(
                  children: rightDestinations.map((destination) {
                    final isSelected = destination.index == currentIndex;
                    return Expanded(
                      child: _DockItem(
                        destination: destination,
                        isSelected: isSelected,
                        onTap: () => onItemSelected(destination.index),
                      ),
                    );
                  }).toList(),
                ),
              ),

              // 4. Center Elevated Circular Action Button (QR Scanner)
              Positioned(
                left: centerX - (buttonSize / 2),
                top: 2.0, // Protrudes 14px above the dock top
                width: buttonSize,
                height: buttonSize,
                child: _CenterActionButton(
                  icon: centerIcon,
                  tooltip: centerTooltip,
                  onPressed: onCenterAction,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Backwards compatibility alias for existing usages
typedef DiagonalFloatingDock = ScoopedFloatingDock;

/// Custom painter for the continuous scooped floating dock surface.
class _ScoopedDockPainter extends CustomPainter {
  final Color backgroundColor;
  final Color borderColor;
  final double borderWidth;
  final double notchDepth;
  final double notchHalfWidth;
  final double cornerRadius;

  const _ScoopedDockPainter({
    required this.backgroundColor,
    required this.borderColor,
    this.borderWidth = 1.2,
    this.notchDepth = 36.0,
    this.notchHalfWidth = 38.0,
    this.cornerRadius = 32.0,
  });

  Path _buildPath(Size size) {
    final w = size.width;
    final h = size.height;
    final cx = w / 2;
    final r = cornerRadius.clamp(0.0, h / 2);
    final nw = notchHalfWidth;
    final nd = notchDepth;

    final path = Path();
    // Start at top left just after corner
    path.moveTo(r, 0);

    // Straight top edge leading to the scoop
    path.lineTo(cx - nw, 0);

    // Smooth cubic bezier curve down into the center cradle
    path.cubicTo(
      cx - nw * 0.55, 0,
      cx - nw * 0.45, nd,
      cx, nd,
    );

    // Smooth cubic bezier curve back up to the flat top edge
    path.cubicTo(
      cx + nw * 0.45, nd,
      cx + nw * 0.55, 0,
      cx + nw, 0,
    );

    // Straight top edge to top-right corner
    path.lineTo(w - r, 0);

    // Top-right corner arc
    path.arcToPoint(Offset(w, r), radius: Radius.circular(r));

    // Right edge
    path.lineTo(w, h - r);

    // Bottom-right corner arc
    path.arcToPoint(Offset(w - r, h), radius: Radius.circular(r));

    // Bottom edge
    path.lineTo(r, h);

    // Bottom-left corner arc
    path.arcToPoint(Offset(0, h - r), radius: Radius.circular(r));

    // Left edge
    path.lineTo(0, r);

    // Top-left corner arc
    path.arcToPoint(Offset(r, 0), radius: Radius.circular(r));

    path.close();
    return path;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final path = _buildPath(size);

    // 1. Layered Ambient Drop Shadows
    final shadowPaint1 = Paint()
      ..color = const Color(0x180F172A)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 16);
    canvas.drawPath(path.shift(const Offset(0, 6)), shadowPaint1);

    final shadowPaint2 = Paint()
      ..color = const Color(0x0A0F172A)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
    canvas.drawPath(path.shift(const Offset(0, 2)), shadowPaint2);

    // 2. Fill Background
    final fillPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.fill;
    canvas.drawPath(path, fillPaint);

    // 3. Crisp Outline Border
    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;
    canvas.drawPath(path, borderPaint);
  }

  @override
  bool shouldRepaint(covariant _ScoopedDockPainter oldDelegate) {
    return oldDelegate.backgroundColor != backgroundColor ||
        oldDelegate.borderColor != borderColor ||
        oldDelegate.borderWidth != borderWidth ||
        oldDelegate.notchDepth != notchDepth ||
        oldDelegate.notchHalfWidth != notchHalfWidth ||
        oldDelegate.cornerRadius != cornerRadius;
  }
}

/// Navigation Tab Item inside the dock.
class _DockItem extends StatelessWidget {
  final NavDestination destination;
  final bool isSelected;
  final VoidCallback onTap;

  const _DockItem({
    required this.destination,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: BorderRadius.circular(24),
        splashColor: AppTheme.primary.withValues(alpha: 0.12),
        highlightColor: AppTheme.primary.withValues(alpha: 0.06),
        child: Center(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            padding: EdgeInsets.symmetric(
              horizontal: isSelected ? 12 : 8,
              vertical: isSelected ? 6 : 4,
            ),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFF0F172A) : Colors.transparent,
              borderRadius: BorderRadius.circular(20),
              boxShadow: isSelected
                  ? const [
                      BoxShadow(
                        color: Color(0x200F172A),
                        blurRadius: 8,
                        offset: Offset(0, 3),
                      ),
                    ]
                  : null,
            ),
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      isSelected ? destination.selectedIcon : destination.icon,
                      size: isSelected ? 19 : 20,
                      color: isSelected ? Colors.white : const Color(0xFF64748B),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      destination.label,
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                        color: isSelected ? Colors.white : const Color(0xFF64748B),
                        letterSpacing: -0.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),

                // Unread Badge Indicator
                if (destination.badgeCount != null && destination.badgeCount! > 0)
                  Positioned(
                    top: -4,
                    right: -10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF0F172A) : Colors.white,
                          width: 1.2,
                        ),
                      ),
                      constraints: const BoxConstraints(minWidth: 15, minHeight: 15),
                      child: Text(
                        '${destination.badgeCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8.5,
                          fontWeight: FontWeight.w700,
                          height: 1,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),

                // Indicator Dot
                if (destination.hasIndicatorDot && (destination.badgeCount == null || destination.badgeCount == 0))
                  Positioned(
                    top: -2,
                    right: -4,
                    child: Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: Color(0xFF38BDF8),
                        shape: BoxShape.circle,
                      ),
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

/// Elevated Circular Center Action Button (QR Scanner)
class _CenterActionButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  const _CenterActionButton({
    required this.icon,
    required this.tooltip,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const LinearGradient(
          colors: [
            Color(0xFF38BDF8), // Sky Blue (Reference match)
            Color(0xFF2563EB), // Serv.io Primary Blue
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0284C7).withValues(alpha: 0.42),
            blurRadius: 14,
            offset: const Offset(0, 6),
            spreadRadius: 0,
          ),
          BoxShadow(
            color: const Color(0xFF2563EB).withValues(alpha: 0.25),
            blurRadius: 4,
            offset: const Offset(0, 2),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        shape: const CircleBorder(),
        child: Tooltip(
          message: tooltip,
          child: InkWell(
            customBorder: const CircleBorder(),
            splashColor: Colors.white.withValues(alpha: 0.25),
            highlightColor: Colors.white.withValues(alpha: 0.12),
            onTap: () {
              HapticFeedback.mediumImpact();
              onPressed?.call();
            },
            child: Center(
              child: Icon(
                icon,
                color: Colors.white,
                size: 26,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
