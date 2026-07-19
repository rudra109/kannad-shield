// =============================================================
//  Auth Service — JWT storage in Flutter Secure Storage + Hive
// =============================================================
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _jwtKey  = 'jwt_access';
  static const _userKey = 'user_info';

  static String baseUrl = const String.fromEnvironment(
    'API_BASE',
    defaultValue: 'http://10.0.2.2:4000', // Android emulator → localhost
  );

  // ── Login ─────────────────────────────────────────────────
  static Future<Map<String, dynamic>> login(String phone, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'password': password, 'role': 'user'}),
    ).timeout(const Duration(seconds: 10));

    if (res.statusCode != 200) {
      final body = jsonDecode(res.body);
      throw Exception(body['error'] ?? 'Login failed');
    }

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    await _storage.write(key: _jwtKey, value: data['access_token']);
    await _storage.write(key: 'jwt_refresh', value: data['refresh_token']);
    return data;
  }

  // ── Register ─────────────────────────────────────────────
  static Future<Map<String, dynamic>> register({
    required String phone,
    required String password,
    required String fullName,
    String preferredLanguage = 'en',
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'phone': phone,
        'password': password,
        'full_name': fullName,
        'preferred_language': preferredLanguage,
      }),
    ).timeout(const Duration(seconds: 10));

    if (res.statusCode != 201) {
      final body = jsonDecode(res.body);
      throw Exception(body['error'] ?? 'Registration failed');
    }
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  // ── Token helpers ─────────────────────────────────────────
  static Future<String?> getToken()       => _storage.read(key: _jwtKey);
  static Future<bool>    isLoggedIn()     async => (await _storage.read(key: _jwtKey)) != null;

  static Future<void> logout() async {
    await _storage.deleteAll();
  }

  static Future<Map<String, String>> authHeader() async {
    final token = await getToken();
    return token != null ? {'Authorization': 'Bearer $token'} : {};
  }
}
