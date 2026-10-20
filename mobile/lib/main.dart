import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'data/providers/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/navigation/main_navigation_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
