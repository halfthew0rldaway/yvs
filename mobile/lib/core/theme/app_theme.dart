import 'package:flutter/material.dart';

class AppTheme {
  // Solid color palette matching Serv.io Web Design System
  static const Color primary = Color(0xFF0F172A); // slate-900
  static const Color primaryDark = Color(0xFF020617); // slate-950
  static const Color accent = Color(0xFF2563EB); // blue-600
  static const Color surface = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF8FAFC); // slate-50
  static const Color border = Color(0xFFE2E8F0); // slate-200
  static const Color borderLight = Color(0xFFF1F5F9); // slate-100
  static const Color textPrimary = Color(0xFF0F172A); // slate-900
  static const Color textSecondary = Color(0xFF64748B); // slate-500
  static const Color textMuted = Color(0xFF94A3B8); // slate-400

  // Status solid colors & backgrounds
  static const Color success = Color(0xFF10B981); // emerald-500
  static const Color successBg = Color(0xFFECFDF5); // emerald-50
  static const Color successBorder = Color(0xFFA7F3D0); // emerald-200
  static const Color successText = Color(0xFF047857); // emerald-700

  static const Color warning = Color(0xFFF59E0B); // amber-500
  static const Color warningBg = Color(0xFFFFFBEB); // amber-50
  static const Color warningBorder = Color(0xFFFDE68A); // amber-200
  static const Color warningText = Color(0xFFB45309); // amber-700

  static const Color error = Color(0xFFEF4444); // red-500
  static const Color errorBg = Color(0xFFFEF2F2); // red-50
  static const Color errorBorder = Color(0xFFFECACA); // red-200
  static const Color errorText = Color(0xFFB91C1C); // red-700

  static const Color info = Color(0xFF3B82F6); // blue-500
  static const Color infoBg = Color(0xFFEFF6FF); // blue-50
  static const Color infoBorder = Color(0xFFBFDBFE); // blue-200
  static const Color infoText = Color(0xFF1D4ED8); // blue-700

  static const Color purple = Color(0xFF8B5CF6);
  static const Color purpleBg = Color(0xFFF5F3FF);
  static const Color purpleBorder = Color(0xFFDDD6FE);
  static const Color purpleText = Color(0xFF6D28D9);

  static const Color indigo = Color(0xFF6366F1);
  static const Color indigoBg = Color(0xFFEEF2FF);
  static const Color indigoBorder = Color(0xFFC7D2FE);
  static const Color indigoText = Color(0xFF4338CA);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: accent,
        surface: surface,
        error: error,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: surface,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
        titleTextStyle: TextStyle(
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
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textPrimary,
          minimumSize: const Size.fromHeight(48),
          side: const BorderSide(color: border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
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
          borderSide: const BorderSide(color: accent, width: 1.5),
        ),
        hintStyle: const TextStyle(color: textMuted, fontSize: 14),
      ),
    );
  }
}
