// =============================================================
//  SOS Service — trigger, Dead-Man's Switch, offline fallback
// =============================================================
import 'dart:convert';
import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:hive/hive.dart';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class SosService {
  static final _baseUrl = AuthService.baseUrl;

  // ── Location ─────────────────────────────────────────────
  static Future<Position> _getLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) throw Exception('Location services disabled');

    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }
    if (perm == LocationPermission.deniedForever) {
      throw Exception('Location permission permanently denied');
    }

    return Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
      timeLimit: const Duration(seconds: 8),
    );
  }

  // ── Trigger SOS ──────────────────────────────────────────
  static Future<Map<String, dynamic>> triggerSOS({bool silent = false, String description = ''}) async {
    late Position pos;
    try {
      pos = await _getLocation();
    } catch (_) {
      pos = Position(
        latitude: 0.0, longitude: 0.0,
        timestamp: DateTime.now(),
        accuracy: 0, altitude: 0, heading: 0,
        speed: 0, speedAccuracy: 0, altitudeAccuracy: 0,
        headingAccuracy: 0,
      );
    }

    final payload = {
      'lat': pos.latitude,
      'lng': pos.longitude,
      'silent': silent,
      'description': description,
    };

    try {
      final headers = await AuthService.authHeader();
      final res = await http.post(
        Uri.parse('$_baseUrl/api/sos/trigger'),
        headers: {'Content-Type': 'application/json', ...headers},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 201) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
      throw Exception('SOS API error: ${res.statusCode}');
    } catch (_) {
      // ── Offline fallback: queue locally ───────────────────
      final box = Hive.box('pending_sos');
      await box.add({...payload, 'ts': DateTime.now().toIso8601String(), 'queued': true});

      // Try SMS fallback (platform channel implementation omitted — see comment below)
      // SmsFallback.send(payload); // implement via platform channel if needed

      return {
        'status':  'queued_offline',
        'message': 'Network unavailable. SOS queued locally and will be sent when connectivity returns.',
        'lat': pos.latitude,
        'lng': pos.longitude,
      };
    }
  }

  // ── Dead-Man's Switch check-in ────────────────────────────
  static Future<void> checkIn(String incidentId, {int intervalSeconds = 120}) async {
    try {
      final headers = await AuthService.authHeader();
      await http.post(
        Uri.parse('$_baseUrl/api/sos/checkin/$incidentId'),
        headers: {'Content-Type': 'application/json', ...headers},
        body: jsonEncode({'intervalSeconds': intervalSeconds}),
      ).timeout(const Duration(seconds: 5));
    } catch (_) {
      // silently ignore — Dead-Man's Switch backend will escalate if no check-in received
    }
  }

  // ── Location streaming (WebSocket) ────────────────────────
  // Use web_socket_channel to stream live position to police console.
  // Integration in home_screen.dart to avoid circular import.
  static Stream<Position> liveLocationStream() {
    return Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // metres
      ),
    );
  }

  // ── Sync offline queue ────────────────────────────────────
  static Future<void> syncOfflineQueue() async {
    final box = Hive.box('pending_sos');
    if (box.isEmpty) return;

    final headers = await AuthService.authHeader();
    for (int i = 0; i < box.length; i++) {
      final entry = box.getAt(i) as Map?;
      if (entry == null) continue;
      try {
        final res = await http.post(
          Uri.parse('$_baseUrl/api/sos/trigger'),
          headers: {'Content-Type': 'application/json', ...headers},
          body: jsonEncode(entry),
        ).timeout(const Duration(seconds: 5));
        if (res.statusCode == 201) await box.deleteAt(i);
      } catch (_) {
        break; // still offline, stop trying
      }
    }
  }
}
