// =============================================================
//  Evidence Upload Screen — file upload + hash-chain viewer
// =============================================================
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import '../services/auth_service.dart';
import '../theme.dart';

class EvidenceScreen extends StatefulWidget {
  const EvidenceScreen({super.key});

  @override
  State<EvidenceScreen> createState() => _EvidenceScreenState();
}

class _EvidenceScreenState extends State<EvidenceScreen> {
  final _incidentIdCtrl = TextEditingController();
  List<Map<String, dynamic>> _evidenceList = [];
  Map<String, dynamic>? _verifyResult;
  bool _loading    = false;
  bool _uploading  = false;
  bool _verifying  = false;
  String _error    = '';

  Future<void> _loadEvidence() async {
    final id = _incidentIdCtrl.text.trim();
    if (id.isEmpty) return;
    setState(() { _loading = true; _error = ''; });

    try {
      final headers = await AuthService.authHeader();
      final res = await http.get(
        Uri.parse('${AuthService.baseUrl}/api/evidence/$id'),
        headers: headers,
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final list = jsonDecode(res.body) as List;
        setState(() => _evidenceList = list.cast<Map<String, dynamic>>());
      } else {
        setState(() => _error = 'Not found or access denied.');
      }
    } catch (e) {
      setState(() => _error = 'Network error: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _uploadEvidence() async {
    final id = _incidentIdCtrl.text.trim();
    if (id.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter an Incident ID first'), backgroundColor: AppTheme.amber),
      );
      return;
    }

    final result = await FilePicker.platform.pickFiles(
      allowMultiple: false,
      type: FileType.any,
    );
    if (result == null || result.files.isEmpty) return;

    setState(() => _uploading = true);
    try {
      final headers = await AuthService.authHeader();
      final file    = result.files.first;
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('${AuthService.baseUrl}/api/evidence/$id'),
      )
        ..headers.addAll(headers)
        ..files.add(await http.MultipartFile.fromPath('file', file.path!));

      final streamed = await request.send().timeout(const Duration(seconds: 30));
      final res      = await http.Response.fromStream(streamed);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        setState(() => _evidenceList.add(data));
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('✅ Evidence uploaded and hash recorded.'), backgroundColor: AppTheme.green),
          );
        }
      } else {
        setState(() => _error = 'Upload failed: ${res.statusCode}');
      }
    } catch (e) {
      setState(() => _error = 'Upload error: $e');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _verifyChain() async {
    final id = _incidentIdCtrl.text.trim();
    if (id.isEmpty) return;
    setState(() => _verifying = true);

    try {
      final headers = await AuthService.authHeader();
      final res     = await http.get(
        Uri.parse('${AuthService.baseUrl}/api/evidence/$id/verify'),
        headers: headers,
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        setState(() => _verifyResult = jsonDecode(res.body) as Map<String, dynamic>);
      }
    } catch (_) {} finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  String _truncHash(String? h) {
    if (h == null || h.length < 16) return h ?? '—';
    return '${h.substring(0, 8)}…${h.substring(h.length - 8)}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Evidence Chain of Custody')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // ── Incident ID input ──────────────────────────────
          TextField(
            controller: _incidentIdCtrl,
            decoration: InputDecoration(
              hintText: 'Incident ID (UUID)',
              suffixIcon: IconButton(
                icon: const Icon(Icons.search, color: AppTheme.cyan),
                onPressed: _loadEvidence,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // ── Actions ───────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: _uploading
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.cyan))
                      : const Icon(Icons.attach_file, color: AppTheme.cyan, size: 18),
                  label: const Text('Upload Evidence', style: TextStyle(color: AppTheme.cyan)),
                  onPressed: _uploading ? null : _uploadEvidence,
                  style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.cyan)),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  icon: _verifying
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.green))
                      : const Icon(Icons.verified, color: AppTheme.green, size: 18),
                  label: const Text('Verify Chain', style: TextStyle(color: AppTheme.green)),
                  onPressed: _verifying ? null : _verifyChain,
                  style: OutlinedButton.styleFrom(side: const BorderSide(color: AppTheme.green)),
                ),
              ),
            ],
          ),

          if (_error.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.crimson.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.crimson.withOpacity(0.3)),
              ),
              child: Text(_error, style: const TextStyle(color: AppTheme.crimson, fontSize: 13)),
            ),
          ],

          // ── Verify result ─────────────────────────────────
          if (_verifyResult != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: (_verifyResult!['valid'] == true ? AppTheme.green : AppTheme.crimson).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: (_verifyResult!['valid'] == true ? AppTheme.green : AppTheme.crimson).withOpacity(0.4),
                ),
              ),
              child: Text(
                _verifyResult!['valid'] == true
                    ? '✅ Chain intact — ${_verifyResult!['records_checked']} records verified.'
                    : '🚨 TAMPER DETECTED at ${_verifyResult!['tampered_at']}',
                style: TextStyle(
                  color: _verifyResult!['valid'] == true ? AppTheme.green : AppTheme.crimson,
                  fontWeight: FontWeight.w700, fontSize: 13,
                ),
              ),
            ),
          ],

          const SizedBox(height: 20),

          if (_loading) const Center(child: CircularProgressIndicator(color: AppTheme.cyan)),

          // ── Chain entries ─────────────────────────────────
          ..._evidenceList.asMap().entries.map((entry) {
            final i = entry.key;
            final e = entry.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Timeline dot + line
                    Column(
                      children: [
                        Container(
                          width: 28, height: 28,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.cyan.withOpacity(0.1),
                            border: Border.all(color: AppTheme.cyan),
                          ),
                          child: Center(child: Text('${i + 1}', style: const TextStyle(color: AppTheme.cyan, fontSize: 11, fontWeight: FontWeight.w700))),
                        ),
                        if (i < _evidenceList.length - 1)
                          Expanded(child: Container(width: 2, color: AppTheme.borderCol)),
                      ],
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.bgCard,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.borderCol),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              e['file_ref']?.toString().split('/').last ?? 'Evidence ${i + 1}',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                            const SizedBox(height: 6),
                            _hashRow('file_hash', e['file_hash']),
                            _hashRow('prev_hash', e['prev_hash'] ?? '0' * 16),
                            _hashRow('chain_hash', e['chain_hash'], highlight: true),
                            const SizedBox(height: 4),
                            Text(
                              'NTP: ${e['ntp_timestamp'] ?? e['timestamp'] ?? '—'}',
                              style: const TextStyle(fontSize: 10, color: AppTheme.textMuted, fontFamily: 'monospace'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),

          if (_evidenceList.isEmpty && !_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Column(children: [
                  Text('📁', style: TextStyle(fontSize: 40)),
                  SizedBox(height: 12),
                  Text('Enter an Incident ID and load evidence', style: TextStyle(color: AppTheme.textMuted)),
                ]),
              ),
            ),
        ],
      ),
    );
  }

  Widget _hashRow(String label, String? value, {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(fontSize: 10, fontFamily: 'monospace'),
          children: [
            TextSpan(text: '$label: ', style: const TextStyle(color: AppTheme.textMuted)),
            TextSpan(
              text: _truncHash(value),
              style: TextStyle(color: highlight ? AppTheme.cyan : AppTheme.textSecondary, fontWeight: highlight ? FontWeight.w700 : FontWeight.normal),
            ),
          ],
        ),
      ),
    );
  }
}
