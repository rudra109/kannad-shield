// =============================================================
//  App Theme — matches the web console dark design system
// =============================================================
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand colors
  static const Color bgBase    = Color(0xFF0a0a0f);
  static const Color bgSurface = Color(0xFF0f0f1a);
  static const Color bgCard    = Color(0xFF13131f);
  static const Color borderCol = Color(0x12ffffff);

  static const Color cyan      = Color(0xFF00d4ff);
  static const Color crimson   = Color(0xFFff3d71);
  static const Color amber     = Color(0xFFffb800);
  static const Color green     = Color(0xFF00e096);
  static const Color purple    = Color(0xFF7c3aed);

  static const Color textPrimary   = Color(0xFFf0f0ff);
  static const Color textSecondary = Color(0xFF8888aa);
  static const Color textMuted     = Color(0xFF55556a);

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: bgBase,
    colorScheme: const ColorScheme.dark(
      primary:   cyan,
      secondary: purple,
      error:     crimson,
      surface:   bgSurface,
    ),
    textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
      headlineLarge:  const TextStyle(color: textPrimary, fontWeight: FontWeight.w800, letterSpacing: -0.5),
      headlineMedium: const TextStyle(color: textPrimary, fontWeight: FontWeight.w700),
      titleLarge:     const TextStyle(color: textPrimary, fontWeight: FontWeight.w700),
      titleMedium:    const TextStyle(color: textPrimary, fontWeight: FontWeight.w600),
      bodyLarge:      const TextStyle(color: textSecondary),
      bodyMedium:     const TextStyle(color: textSecondary, fontSize: 14),
      bodySmall:      const TextStyle(color: textMuted, fontSize: 12),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor:  bgSurface,
      foregroundColor:  textPrimary,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.inter(
        fontSize: 18, fontWeight: FontWeight.w700, color: textPrimary,
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor:     bgSurface,
      selectedItemColor:   cyan,
      unselectedItemColor: textMuted,
    ),
    cardTheme: CardThemeData(
      color: bgCard,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: borderCol),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: bgSurface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderCol),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: borderCol),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: cyan, width: 1.5),
      ),
      hintStyle: const TextStyle(color: textMuted, fontSize: 14),
      labelStyle: const TextStyle(color: textSecondary),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: cyan,
        foregroundColor: bgBase,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15),
        elevation: 0,
      ),
    ),
    dividerTheme: const DividerThemeData(color: borderCol, thickness: 1),
    iconTheme: const IconThemeData(color: textSecondary),
  );
}
