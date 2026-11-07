import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import '../../data/providers/auth_provider.dart';
import '../navigation/main_navigation_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text;

    if (username.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Username dan password wajib diisi'),
          backgroundColor: AppTheme.warning,
        ),
      );
      return;
    }

    final success = await ref.read(authProvider.notifier).login(username, password);

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
      );
    } else if (mounted) {
      final errorMsg = ref.read(authProvider).errorMessage ?? 'Gagal masuk. Periksa username atau password.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMsg),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header Logo Yangversa
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Column(
                    children: [
                      Image(
                        image: AssetImage('assets/icons/logo_yangversa.png'),
                        height: 56,
                        width: 56,
                        fit: BoxFit.contain,
                      ),
                      SizedBox(height: 10),
                      Text(
                        'YANGVERSA',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Companion Operasional Workshop',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Form Container
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Masuk Akun Workshop',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Akses meja kerja Teknisi atau operasional Frontman',
                        style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 20),

                      const Text('Username', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _usernameController,
                        keyboardType: TextInputType.text,
                        autocorrect: false,
                        enableSuggestions: false,
                        decoration: const InputDecoration(
                          hintText: 'admin, owner, atau teknisi1',
                          prefixIcon: Icon(Icons.person_outline, size: 20),
                        ),
                      ),
                      const SizedBox(height: 16),

                      const Text('Password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        decoration: InputDecoration(
                          hintText: '••••••••',
                          prefixIcon: const Icon(Icons.lock_outline, size: 20),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                              size: 20,
                              color: AppTheme.textMuted,
                            ),
                            onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      ElevatedButton(
                        onPressed: authState.isLoading ? null : _handleLogin,
                        child: authState.isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text('Masuk ke Sistem'),
                      ),

                      const SizedBox(height: 16),
                      const Divider(height: 1, color: Color(0xFFE2E8F0)),
                      const SizedBox(height: 12),
                      const Text(
                        'Akun Cepat (Testing / Demo):',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                side: const BorderSide(color: Color(0xFFCBD5E1)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                setState(() {
                                  _usernameController.text = 'arni';
                                  _passwordController.text = 'ownerArni2026!';
                                });
                              },
                              child: const Column(
                                children: [
                                  Text('Owner Arni', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Color(0xFF0D9488))),
                                  Text('arni', style: TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                side: const BorderSide(color: Color(0xFFCBD5E1)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                setState(() {
                                  _usernameController.text = 'vivero';
                                  _passwordController.text = 'ownerVivero2026!';
                                });
                              },
                              child: const Column(
                                children: [
                                  Text('Owner Vivero', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Color(0xFF0D9488))),
                                  Text('vivero', style: TextStyle(fontSize: 9, color: AppTheme.textSecondary)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                side: const BorderSide(color: Color(0xFFCBD5E1)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                setState(() {
                                  _usernameController.text = 'teknisi1';
                                  _passwordController.text = 'password123';
                                });
                              },
                              child: const Column(
                                children: [
                                  Text('Teknisi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primary)),
                                  Text('teknisi1', style: TextStyle(fontSize: 9.5, color: AppTheme.textSecondary)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                side: const BorderSide(color: Color(0xFFCBD5E1)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                setState(() {
                                  _usernameController.text = 'siti';
                                  _passwordController.text = 'password123';
                                });
                              },
                              child: const Column(
                                children: [
                                  Text('Frontman', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFD97706))),
                                  Text('siti', style: TextStyle(fontSize: 9.5, color: AppTheme.textSecondary)),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                                side: const BorderSide(color: Color(0xFFCBD5E1)),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                setState(() {
                                  _usernameController.text = 'admin';
                                  _passwordController.text = 'password123';
                                });
                              },
                              child: const Column(
                                children: [
                                  Text('Admin', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5))),
                                  Text('admin', style: TextStyle(fontSize: 9.5, color: AppTheme.textSecondary)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                const Center(
                  child: Text(
                    'Serv.io Workshop Management System',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
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
