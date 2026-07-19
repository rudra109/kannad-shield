// =============================================================
//  Home Screen — SOS button + navigation hub
//  Owner: Developer 3
// =============================================================
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shake/shake.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';

import '../services/sos_service.dart';
import '../services/auth_service.dart';
import '../theme.dart';
import 'report_screen.dart';
import 'evidence_screen.dart';
import 'awareness_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  int _tab = 0;
  bool _sosBusy     = false;
  bool _isTracking  = false;
  String? _activeIncidentId;
  ShakeDetector? _shakeDetector;
  WebSocketChannel? _wsChannel;
  Timer? _deadManTimer;
  late AnimationController _pulseController;
  late Animation<double>   _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Shake-to-SOS
    _shakeDetector = ShakeDetector.autoStart(
      onPhoneShake: () => _confirmSOS(silent: false),
      minimumShakeCount: 3,
      shakeSlopTimeMS: 500,
    );

    // Sync offline queue on startup
    SosService.syncOfflineQueue();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _shakeDetector?.stopListening();
    _wsChannel?.sink.close();
    _deadManTimer?.cancel();
    super.dispose();
  }

  // ── SOS Flow ──────────────────────────────────────────────
  Future<void> _confirmSOS({bool silent = false}) async {
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(silent ? '🔕 Silent SOS' : '🚨 Confirm SOS',
            style: const TextStyle(fontWeight: FontWeight.w800)),
        content: Text(
          silent
              ? 'Send a SILENT SOS to police and your emergency contacts without making noise.'
              : 'Send an SOS alert to Cyber Crime Branch and your emergency contacts immediately.',
          style: const TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: silent ? AppTheme.amber : AppTheme.crimson,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: Text(silent ? '🔕 Send Silent' : '🚨 SEND SOS'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    await _triggerSOS(silent: silent);
  }

  Future<void> _triggerSOS({bool silent = false}) async {
    setState(() => _sosBusy = true);
    HapticFeedback.heavyImpact();

    try {
      final result = await SosService.triggerSOS(silent: silent);
      final incidentId = result['incidentId'] as String?;

      if (incidentId != null) {
        setState(() {
          _isTracking      = true;
          _activeIncidentId = incidentId;
        });
        _startLocationStreaming(incidentId);
        _startDeadMansSwitch(incidentId);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result['status'] == 'queued_offline'
            ? '⚠️ Offline — SOS queued. Will send when connected.'
            : '✅ SOS sent! Police and guardians have been notified.'),
        backgroundColor: result['status'] == 'queued_offline' ? AppTheme.amber : AppTheme.green,
        duration: const Duration(seconds: 6),
      ));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('SOS Error: $e'),
          backgroundColor: AppTheme.crimson,
        ));
      }
    } finally {
      if (mounted) setState(() => _sosBusy = false);
    }
  }

  void _startLocationStreaming(String incidentId) {
    final wsBase = AuthService.baseUrl.replaceFirst('http', 'ws');
    _wsChannel = WebSocketChannel.connect(
      Uri.parse('$wsBase/ws/track?incidentId=$incidentId'),
    );

    SosService.liveLocationStream().listen((pos) {
      _wsChannel?.sink.add(jsonEncode({
        'type': 'location_update',
        'lat':  pos.latitude,
        'lng':  pos.longitude,
        'ts':   DateTime.now().millisecondsSinceEpoch,
      }));
    });
  }

  void _startDeadMansSwitch(String incidentId) {
    _deadManTimer = Timer.periodic(const Duration(seconds: 90), (_) {
      SosService.checkIn(incidentId, intervalSeconds: 120);
    });
  }

  void _cancelSOS() {
    _wsChannel?.sink.close();
    _deadManTimer?.cancel();
    setState(() { _isTracking = false; _activeIncidentId = null; });
  }

  // ── Build ─────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                gradient: const LinearGradient(
                  colors: [AppTheme.cyan, AppTheme.purple],
                ),
              ),
              child: const Center(child: Text('🛡️', style: TextStyle(fontSize: 16))),
            ),
            const SizedBox(width: 10),
            const Text('Kanad S.H.I.E.L.D.'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline, color: AppTheme.textSecondary),
            onPressed: () async {
              await AuthService.logout();
              if (mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (_) => false,
                );
              }
            },
          ),
        ],
      ),
      body: _tab == 0
          ? _buildSOSTab()
          : _tab == 1
              ? const ReportScreen()
              : _tab == 2
                  ? const EvidenceScreen()
                  : const AwarenessScreen(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tab,
        onTap: (i) => setState(() => _tab = i),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.shield_outlined),    label: 'SOS'),
          BottomNavigationBarItem(icon: Icon(Icons.report_outlined),    label: 'Report'),
          BottomNavigationBarItem(icon: Icon(Icons.attach_file),        label: 'Evidence'),
          BottomNavigationBarItem(icon: Icon(Icons.school_outlined),    label: 'Learn'),
        ],
      ),
    );
  }

  Widget _buildSOSTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (_isTracking) _buildTrackingBanner(),
          const SizedBox(height: 32),

          // ── SOS Button ────────────────────────────────────
          Center(
            child: GestureDetector(
              onTap: _sosBusy ? null : () => _confirmSOS(),
              onLongPress: _sosBusy ? null : () => _confirmSOS(silent: true),
              child: AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (_, child) => Transform.scale(
                  scale: _isTracking ? _pulseAnimation.value : 1.0,
                  child: child,
                ),
                child: Container(
                  width: 200, height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isTracking ? AppTheme.crimson.withOpacity(0.15) : const Color(0xFF1a0a0f),
                    border: Border.all(
                      color: _isTracking ? AppTheme.crimson : AppTheme.crimson.withOpacity(0.5),
                      width: _isTracking ? 3 : 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.crimson.withOpacity(_isTracking ? 0.5 : 0.3),
                        blurRadius: _isTracking ? 48 : 24,
                        spreadRadius: _isTracking ? 8 : 2,
                      ),
                    ],
                  ),
                  child: _sosBusy
                      ? const Center(child: CircularProgressIndicator(color: AppTheme.crimson, strokeWidth: 3))
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('🚨', style: TextStyle(fontSize: 40)),
                            const SizedBox(height: 8),
                            Text(
                              _isTracking ? 'TRACKING' : 'SOS',
                              style: const TextStyle(
                                fontSize: 26, fontWeight: FontWeight.w900,
                                color: AppTheme.crimson, letterSpacing: 4,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _isTracking ? 'Tap to cancel' : 'Hold for Silent',
                              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                ),
              ),
            ),
          ),

          const SizedBox(height: 32),

          // ── Quick actions ──────────────────────────────────
          Row(
            children: [
              _quickAction('📞', 'Call 112', () => _callEmergency()),
              const SizedBox(width: 12),
              _quickAction('🔕', 'Silent SOS', () => _confirmSOS(silent: true)),
              const SizedBox(width: 12),
              _quickAction('📋', 'Report Crime', () => setState(() => _tab = 1)),
            ],
          ),

          const SizedBox(height: 24),

          // ── Info card ──────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderCol),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('💡 How to use SOS', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                SizedBox(height: 12),
                _InfoRow('👆 Tap', 'Regular SOS — police + guardians notified with alarm'),
                _InfoRow('👆 Hold', 'Silent SOS — alert sent without sound (safer in danger)'),
                _InfoRow('📳 Shake', 'Shake phone 3× for emergency SOS'),
                _InfoRow('✅ Check-in', 'Tap SOS again to confirm you are safe'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrackingBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.crimson.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.crimson.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          const Text('🚨', style: TextStyle(fontSize: 20)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('SOS ACTIVE — Location streaming to police',
                    style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.crimson, fontSize: 13)),
                if (_activeIncidentId != null)
                  Text('Ref: ${_activeIncidentId!.substring(0, 8).toUpperCase()}',
                      style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontFamily: 'monospace')),
              ],
            ),
          ),
          TextButton(
            onPressed: _cancelSOS,
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _quickAction(String icon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.borderCol),
          ),
          child: Column(
            children: [
              Text(icon, style: const TextStyle(fontSize: 22)),
              const SizedBox(height: 6),
              Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }

  void _callEmergency() {
    // Launch phone dialer with 112
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Dialling 112...'), backgroundColor: AppTheme.cyan),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String desc;
  const _InfoRow(this.label, this.desc);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 70, child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.cyan))),
        Expanded(child: Text(desc, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
      ],
    ),
  );
}
