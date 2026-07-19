// =============================================================
//  Login Screen — phone + password + register flow
// =============================================================
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../theme.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isRegistering = false;
  bool _loading = false;
  String _error = '';

  final _phoneCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _nameCtrl     = TextEditingController();
  String _lang        = 'en';

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = ''; });

    try {
      if (_isRegistering) {
        await AuthService.register(
          phone: _phoneCtrl.text.trim(),
          password: _passwordCtrl.text,
          fullName: _nameCtrl.text.trim(),
          preferredLanguage: _lang,
        );
      }
      await AuthService.login(_phoneCtrl.text.trim(), _passwordCtrl.text);
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
        (_) => false,
      );
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgBase,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 48),
              // Logo
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: const LinearGradient(colors: [AppTheme.cyan, AppTheme.purple]),
                  boxShadow: [BoxShadow(color: AppTheme.cyan.withOpacity(0.4), blurRadius: 24)],
                ),
                child: const Center(child: Text('🛡️', style: TextStyle(fontSize: 36))),
              ),
              const SizedBox(height: 20),
              ShaderMask(
                shaderCallback: (b) => const LinearGradient(colors: [AppTheme.cyan, Color(0xFFa78bfa)]).createShader(b),
                child: const Text('Kanad S.H.I.E.L.D.',
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.5)),
              ),
              const SizedBox(height: 6),
              const Text('Cyber-Physical Safety Platform',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
              const SizedBox(height: 48),

              // Form
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    if (_isRegistering) ...[
                      TextFormField(
                        controller: _nameCtrl,
                        decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline)),
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Mobile Number', prefixIcon: Icon(Icons.phone_outlined), hintText: '+91XXXXXXXXXX'),
                      validator: (v) => v!.length < 10 ? 'Enter valid phone number' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _passwordCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline)),
                      validator: (v) => v!.length < 6 ? 'Password too short' : null,
                    ),
                    if (_isRegistering) ...[
                      const SizedBox(height: 16),
                      DropdownButtonFormField<String>(
                        value: _lang,
                        dropdownColor: AppTheme.bgCard,
                        decoration: const InputDecoration(labelText: 'Preferred Language'),
                        items: const [
                          DropdownMenuItem(value: 'en', child: Text('English')),
                          DropdownMenuItem(value: 'hi', child: Text('हिंदी (Hindi)')),
                          DropdownMenuItem(value: 'gu', child: Text('ગુજરાતી (Gujarati)')),
                        ],
                        onChanged: (v) => setState(() => _lang = v!),
                      ),
                    ],
                    const SizedBox(height: 8),
                    if (_error.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: AppTheme.crimson.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppTheme.crimson.withOpacity(0.3))),
                        child: Text(_error, style: const TextStyle(color: AppTheme.crimson, fontSize: 13)),
                      ),
                    ],
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                            ? const CircularProgressIndicator(color: AppTheme.bgBase, strokeWidth: 2)
                            : Text(_isRegistering ? '📱 Create Account' : '🔐 Sign In'),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => setState(() { _isRegistering = !_isRegistering; _error = ''; }),
                      child: Text(
                        _isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register",
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
