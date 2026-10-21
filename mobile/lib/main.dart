import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'core/theme/app_theme.dart';
import 'data/providers/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/navigation/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await initializeDateFormatting('id_ID', null);
  } catch (_) {}

  runApp(
    const ProviderScope(
      child: ServioTechnicianApp(),
    ),
  );
}

class ServioTechnicianApp extends ConsumerWidget {
  const ServioTechnicianApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp(
      title: 'Serv.io Technician',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: authState.isAuthenticated ? const MainNavigationScreen() : const LoginScreen(),
    );
  }
}
