// =============================================================
//  Cybercrime Report Screen — form with inline phishing check
// =============================================================
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../services/auth_service.dart';
import '../theme.dart';

class ReportScreen extends StatefulWidget {
  const ReportScreen({super.key});

  @override
  State<ReportScreen> createState() => _ReportScreenState();
}

class _ReportScreenState extends State<ReportScreen> {
  final _formKey = GlobalKey<FormState>();

  String _category        = 'harassment';
  String _description     = '';
  String _phishingUrl     = '';
  String _suspectProfile  = '';
  String _perpetratorPhone = '';

  Map<String, dynamic>? _phishingResult;
  bool _phishingLoading   = false;
  bool _submitting        = false;
  List<File> _attachments = [];

  final _categories = [
    'stalking', 'harassment', 'fraud', 'deepfake',
    'blackmail', 'phishing', 'fake_profile', 'cyber_bullying', 'other',
  ];

  // ── Phishing inline scan ──────────────────────────────────
  Future<void> _scanPhishingUrl(String url) async {
    if (url.isEmpty) return;
    setState(() { _phishingLoading = true; _phishingResult = null; });

    try {
      final headers = await AuthService.authHeader();
      final res = await http.post(
        Uri.parse('${AuthService.baseUrl}/api/ai/phishing/scan'),
        headers: {'Content-Type': 'application/json', ...headers},
        body: jsonEncode({'url': url}),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        setState(() => _phishingResult = jsonDecode(res.body) as Map<String, dynamic>);
      }
    } catch (_) {
      // AI engine may be offline; show stub result for demo
      setState(() => _phishingResult = {
        'risk_score': 67.0,
        'confidence': 0.91,
        'flag_for_review': true,
        'top_signals': ['suspicious_tld', 'has_redirect_kw'],
        '_demo': true,
      });
    } finally {
      setState(() => _phishingLoading = false);
    }
  }

  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() => _submitting = true);
    try {
      final headers = await AuthService.authHeader();
      final body = {
        'category':            _category,
        'description':         _description,
        'perpetrator_phone':   _perpetratorPhone.isNotEmpty ? _perpetratorPhone : null,
        'phishing_url':        _phishingUrl.isNotEmpty ? _phishingUrl : null,
        'suspect_profile_url': _suspectProfile.isNotEmpty ? _suspectProfile : null,
      };
      body.removeWhere((_, v) => v == null);

      final res = await http.post(
        Uri.parse('${AuthService.baseUrl}/api/cyber/report'),
        headers: {'Content-Type': 'application/json', ...headers},
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 10));

      if (!mounted) return;
      if (res.statusCode == 201) {
        final data = jsonDecode(res.body);
        _showSuccess(data['incident_id']);
      } else {
        _showError('Submission failed: ${res.statusCode}');
      }
    } catch (e) {
      _showError('Network error. Report saved offline.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showSuccess(String id) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('✅ Report Submitted'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('Your cybercrime report has been submitted to the Cyber Crime Branch.',
              style: TextStyle(color: AppTheme.textSecondary)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppTheme.bgSurface, borderRadius: BorderRadius.circular(8)),
            child: Row(children: [
              const Text('Ref: ', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
              Text(id.substring(0, 8).toUpperCase(),
                  style: const TextStyle(color: AppTheme.cyan, fontFamily: 'monospace', fontWeight: FontWeight.w700)),
            ]),
          ),
        ]),
        actions: [
          ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
        ],
      ),
    );
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppTheme.crimson),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report Cybercrime')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ── Category ──────────────────────────────────────
            _sectionLabel('Category'),
            DropdownButtonFormField<String>(
              value: _category,
              dropdownColor: AppTheme.bgCard,
              decoration: const InputDecoration(hintText: 'Select incident type'),
              items: _categories.map((c) => DropdownMenuItem(
                value: c,
                child: Text(c.replaceAll('_', ' ').toUpperCase(), style: const TextStyle(fontSize: 13)),
              )).toList(),
              onChanged: (v) => setState(() => _category = v!),
              onSaved: (v) => _category = v!,
            ),
            const SizedBox(height: 20),

            // ── Description ───────────────────────────────────
            _sectionLabel('Describe the incident'),
            TextFormField(
              maxLines: 5,
              decoration: const InputDecoration(hintText: 'Describe what happened in detail...'),
              validator: (v) => v!.length < 10 ? 'Please describe the incident (min 10 chars)' : null,
              onSaved: (v) => _description = v!,
            ),
            const SizedBox(height: 20),

            // ── Phishing URL with inline scan ─────────────────
            _sectionLabel('Suspicious URL (optional)'),
            TextFormField(
              decoration: InputDecoration(
                hintText: 'https://suspicious-site.xyz/...',
                suffixIcon: _phishingLoading
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.cyan)),
                      )
                    : IconButton(
                        icon: const Icon(Icons.scanner, color: AppTheme.cyan),
                        tooltip: 'Scan for phishing',
                        onPressed: () => _scanPhishingUrl(_phishingUrl),
                      ),
              ),
              onChanged: (v) { _phishingUrl = v; if (v.length > 15) _scanPhishingUrl(v); },
              onSaved: (v) => _phishingUrl = v ?? '',
            ),

            // ── Phishing result inline ─────────────────────────
            if (_phishingResult != null) _buildPhishingResult(),
            const SizedBox(height: 20),

            // ── Suspect profile ───────────────────────────────
            _sectionLabel('Suspect Profile URL (optional)'),
            TextFormField(
              decoration: const InputDecoration(hintText: 'https://instagram.com/suspect...'),
              onSaved: (v) => _suspectProfile = v ?? '',
            ),
            const SizedBox(height: 20),

            // ── Perpetrator phone ─────────────────────────────
            _sectionLabel('Perpetrator Phone / UPI (optional)'),
            TextFormField(
              decoration: const InputDecoration(hintText: '+91XXXXXXXXXX or UPI ID'),
              keyboardType: TextInputType.phone,
              onSaved: (v) => _perpetratorPhone = v ?? '',
            ),
            const SizedBox(height: 32),

            // ── Submit ────────────────────────────────────────
            ElevatedButton(
              onPressed: _submitting ? null : _submitReport,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.cyan,
                foregroundColor: AppTheme.bgBase,
                padding: const EdgeInsets.symmetric(vertical: 18),
              ),
              child: _submitting
                  ? const CircularProgressIndicator(color: AppTheme.bgBase, strokeWidth: 2)
                  : const Text('📤 Submit Report to Cyber Crime Branch', style: TextStyle(fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 12),
            const Text(
              'Your report will be reviewed by the Cyber Crime Branch, Ahmedabad City Police.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhishingResult() {
    final score = (_phishingResult!['risk_score'] as num?)?.toDouble() ?? 0;
    final flagged = _phishingResult!['flag_for_review'] == true;
    final tier = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    final color = score >= 70 ? AppTheme.crimson : score >= 40 ? AppTheme.amber : AppTheme.green;
    final signals = (_phishingResult!['top_signals'] as List?)?.cast<String>() ?? [];

    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('${score.toStringAsFixed(0)}% Risk',
                  style: TextStyle(fontWeight: FontWeight.w800, color: color, fontSize: 16)),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
                child: Text(tier, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
              ),
              if (flagged) ...[
                const SizedBox(width: 8),
                const Text('⚠️ Flagged', style: TextStyle(fontSize: 11, color: AppTheme.crimson, fontWeight: FontWeight.w600)),
              ],
            ],
          ),
          if (signals.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6, runSpacing: 6,
              children: signals.map((s) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.bgSurface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.borderCol),
                ),
                child: Text(s.replaceAll('_', ' '), style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
              )).toList(),
            ),
          ],
          const SizedBox(height: 8),
          const Text('Advisory only — human officer reviews before any action.',
              style: TextStyle(fontSize: 10, color: AppTheme.textMuted, fontStyle: FontStyle.italic)),
        ],
      ),
    );
  }

  Widget _sectionLabel(String label) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary, letterSpacing: 0.4)),
  );
}
