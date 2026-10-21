import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Precision Workshop Ergonomics Design System (Matches Serv.io Web App & UI/UX Example)
  // Primary brand: Royal / Cobalt Blue 600
  static const Color primary = Color(0xFF2563EB); // blue-600
  static const Color primaryDark = Color(0xFF1D4ED8); // blue-700
  static const Color primaryLight = Color(0xFFEFF6FF); // blue-50
  static const Color primaryBorder = Color(0xFFBFDBFE); // blue-200
  static const Color accent = Color(0xFF2563EB); // alias for backwards compatibility

  // Canvas & Surfaces
  static const Color background = Color(0xFFFAF8FF); // soft clean canvas
  static const Color surface = Color(0xFFFFFFFF); // pure white cards
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF2F4FF);
  static const Color surfaceContainer = Color(0xFFEAEDFF);
  static const Color surfaceContainerHigh = Color(0xFFE2E7FF);

  // Borders & Outlines
  static const Color border = Color(0xFFE2E8F0); // slate-200
  static const Color borderLight = Color(0xFFF1F5F9); // slate-100
  static const Color outline = Color(0xFFC3C6D7);
  static const Color outlineVariant = Color(0xFFE2E8F0);

  // Typography Colors
  static const Color textPrimary = Color(0xFF131B2E); // deep slate/navy 900
  static const Color textSecondary = Color(0xFF434655); // slate-600
  static const Color textMuted = Color(0xFF737686); // slate-400

  // Status Solid Colors & Backgrounds
  // Success / On Duty / QC Passed (Tertiary Emerald)
  static const Color success = Color(0xFF007D55); // emerald-600
  static const Color successBg = Color(0xFFECFDF5); // emerald-50
  static const Color successBorder = Color(0xFFA7F3D0); // emerald-200
  static const Color successText = Color(0xFF006242); // emerald-800
  static const Color tertiary = Color(0xFF007D55);
  static const Color tertiaryBg = Color(0xFFECFDF5);
  static const Color tertiaryText = Color(0xFF006242);

  // Warning / Menunggu ACC / Priority Express (Amber)
  static const Color warning = Color(0xFFF59E0B); // amber-500
  static const Color warningBg = Color(0xFFFFFBEB); // amber-50
  static const Color warningBorder = Color(0xFFFDE68A); // amber-200
  static const Color warningText = Color(0xFFB45309); // amber-700

  // Error / Overdue SLA / Danger (Red)
  static const Color error = Color(0xFFBA1A1A); // red-600
  static const Color errorBg = Color(0xFFFEF2F2); // red-50
  static const Color errorBorder = Color(0xFFFECACA); // red-200
  static const Color errorText = Color(0xFF93000A); // red-800

  // Info / Diagnosis (Sky / Blue)
  static const Color info = Color(0xFF2563EB); // blue-600
  static const Color infoBg = Color(0xFFEFF6FF); // blue-50
  static const Color infoBorder = Color(0xFFBFDBFE); // blue-200
  static const Color infoText = Color(0xFF1D4ED8); // blue-700

  // Secondary / In Progress / Repair (Indigo)
  static const Color indigo = Color(0xFF4648D4);
  static const Color indigoBg = Color(0xFFEEF2FF);
  static const Color indigoBorder = Color(0xFFC7D2FE);
  static const Color indigoText = Color(0xFF312E81);
  static const Color secondary = Color(0xFF4648D4);
  static const Color secondaryBg = Color(0xFFEEF2FF);

  // Purple / Diagnosis investigation
  static const Color purple = Color(0xFF7C3AED);
  static const Color purpleBg = Color(0xFFF5F3FF);
  static const Color purpleBorder = Color(0xFFDDD6FE);
  static const Color purpleText = Color(0xFF5B21B6);

  // Typography Helpers
  static TextStyle get headlineLarge => GoogleFonts.plusJakartaSans(
    fontSize: 26,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    letterSpacing: -0.5,
  );

  static TextStyle get headlineMedium => GoogleFonts.plusJakartaSans(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    letterSpacing: -0.3,
  );

  static TextStyle get headlineSmall => GoogleFonts.plusJakartaSans(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: textPrimary,
    letterSpacing: -0.2,
  );

  static TextStyle get bodyLarge => GoogleFonts.inter(
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: textPrimary,
  );

  static TextStyle get bodyMedium => GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: textSecondary,
  );

  static TextStyle get bodySmall => GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: textSecondary,
  );

  static TextStyle get labelMedium => GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );

  static TextStyle get labelSmall => GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.3,
  );

  static TextStyle get codeMedium => GoogleFonts.jetBrainsMono(
    fontSize: 13,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.01,
  );

  static TextStyle get codeSmall => GoogleFonts.jetBrainsMono(
    fontSize: 11,
    fontWeight: FontWeight.w500,
  );

  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.interTextTheme();
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: accent,
        surface: surface,
        error: error,
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: headlineLarge,
        displayMedium: headlineMedium,
        displaySmall: headlineSmall,
        headlineLarge: headlineLarge,
        headlineMedium: headlineMedium,
        headlineSmall: headlineSmall,
        titleLarge: headlineSmall,
        titleMedium: labelMedium,
        titleSmall: labelSmall,
        bodyLarge: bodyLarge,
        bodyMedium: bodyMedium,
        bodySmall: bodySmall,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          color: textPrimary,
          fontSize: 17,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: border, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          minimumSize: const Size.fromHeight(48),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          minimumSize: const Size.fromHeight(48),
          side: const BorderSide(color: border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        hintStyle: GoogleFonts.inter(color: textMuted, fontSize: 13),
      ),
      dividerTheme: const DividerThemeData(
        color: border,
        thickness: 1,
        space: 1,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 64,
        backgroundColor: surface,
        indicatorColor: primaryLight,
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w600, color: primary);
          }
          return GoogleFonts.inter(fontSize: 11.5, fontWeight: FontWeight.w500, color: textSecondary);
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: primary, size: 22);
          }
          return const IconThemeData(color: textSecondary, size: 22);
        }),
      ),
    );
  }
}
