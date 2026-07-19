// =============================================================
//  Awareness / Education Screen — multilingual safety tips
// =============================================================
import 'package:flutter/material.dart';
import '../theme.dart';

class AwarenessScreen extends StatefulWidget {
  const AwarenessScreen({super.key});
  @override
  State<AwarenessScreen> createState() => _AwarenessScreenState();
}

class _AwarenessScreenState extends State<AwarenessScreen> {
  String _lang = 'en';

  static const _content = {
    'en': [
      {
        'icon': '🎣',
        'title': 'Phishing & Malicious Links',
        'tips': [
          'Never click links from unknown senders.',
          'Check the URL carefully — fake sites use look-alike domains.',
          'Genuine banks never ask for OTP on a link.',
          'Use Kanad S.H.I.E.L.D. to scan suspicious links before clicking.',
        ],
      },
      {
        'icon': '👤',
        'title': 'Fake Profile Warning Signs',
        'tips': [
          'Profile created recently (< 3 months).',
          'Very few posts but many followers.',
          'Profile photo found on other names via reverse image search.',
          'Asks for money or personal information quickly.',
        ],
      },
      {
        'icon': '🔒',
        'title': 'Protect Your Privacy',
        'tips': [
          'Set your social media to private.',
          'Do not post your phone number, address, or workplace publicly.',
          'Enable two-factor authentication on all accounts.',
          'Regularly review who can see your posts.',
        ],
      },
      {
        'icon': '🖼️',
        'title': 'Deepfake Awareness',
        'tips': [
          'AI can now create convincing fake videos and images.',
          'If a video looks unusual, check for unnatural blinking or lip sync.',
          'Do not share intimate images with anyone online.',
          'Report AI-generated fake content immediately.',
        ],
      },
      {
        'icon': '💰',
        'title': 'Online Fraud Prevention',
        'tips': [
          'No legitimate employer asks for a security deposit.',
          'UPI fraud: never share your UPI PIN — only use to receive money.',
          'Lottery/prize fraud: if you did not enter, you did not win.',
          'Report fraud to cybercrime.gov.in immediately.',
        ],
      },
      {
        'icon': '🆘',
        'title': 'How to Report Cybercrime',
        'tips': [
          'Use Kanad S.H.I.E.L.D. → Report tab to file your complaint.',
          'Collect screenshots and URLs before reporting.',
          'Include any phone numbers, UPI IDs, or email IDs you received.',
          'Visit cybercrime.gov.in for the national portal.',
        ],
      },
    ],
    'hi': [
      {
        'icon': '🎣',
        'title': 'फ़िशिंग और दुर्भावनापूर्ण लिंक',
        'tips': [
          'अज्ञात प्रेषकों के लिंक पर कभी क्लिक न करें।',
          'URL को ध्यान से जांचें — नकली साइटें मिलती-जुलती डोमेन का उपयोग करती हैं।',
          'असली बैंक कभी लिंक पर OTP नहीं मांगते।',
          'क्लिक करने से पहले Kanad S.H.I.E.L.D. से संदिग्ध लिंक स्कैन करें।',
        ],
      },
      {
        'icon': '🔒',
        'title': 'अपनी गोपनीयता सुरक्षित करें',
        'tips': [
          'अपने सोशल मीडिया को प्राइवेट करें।',
          'सार्वजनिक रूप से अपना फ़ोन नंबर, पता या कार्यस्थल पोस्ट न करें।',
          'सभी खातों पर दो-चरणीय प्रमाणीकरण सक्षम करें।',
        ],
      },
      {
        'icon': '🆘',
        'title': 'साइबर अपराध की रिपोर्ट करें',
        'tips': [
          'Kanad S.H.I.E.L.D. → रिपोर्ट टैब का उपयोग करें।',
          'रिपोर्ट करने से पहले स्क्रीनशॉट और URL एकत्र करें।',
          'राष्ट्रीय पोर्टल के लिए cybercrime.gov.in पर जाएं।',
        ],
      },
    ],
    'gu': [
      {
        'icon': '🎣',
        'title': 'ફ઼િશિંગ અને દુર્ભાવનાપૂર્ણ લિંક',
        'tips': [
          'અજ્ઞાત મોકલનારા તરફથી આવેલ લિંક પર ક્લિક ન કરો।',
          'URL ધ્યાનથી તપાસો — નકલી સાઇટ્સ સમાન ડોમેઇન વાપરે છે।',
          'ખરા બૅન્ક ક્યારેય OTP માટે લિંક ન મોકલે।',
          'Kanad S.H.I.E.L.D.ˈ ઉpayog karī sandehāspad linka scan karo।',
        ],
      },
      {
        'icon': '🔒',
        'title': 'તમારી ગોપનીયતા સુરક્ષિત કરો',
        'tips': [
          'સોશ઼ ̔ ̈ ̄ ̈ ̃ ̌ ̃ ̓ ̉ ̀ ̰ ̄ ̈ ̃ ̌ ̃ ̓ ̉ ̀ ̰',
          'ĝenerale: social media ne private rakho।',
          'sarva khātāon par two-factor saksham karo।',
        ],
      },
      {
        'icon': '🆘',
        'title': 'Cyber Apradhni Report Karo',
        'tips': [
          'Kanad S.H.I.E.L.D. → Report tab vaparo।',
          'Screenshots ane URLs ekatrit karo।',
          'cybercrime.gov.in par jao।',
        ],
      },
    ],
  };

  @override
  Widget build(BuildContext context) {
    final modules = _content[_lang] ?? _content['en']!;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cyber Safety Awareness'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: DropdownButton<String>(
              value: _lang,
              dropdownColor: AppTheme.bgCard,
              underline: const SizedBox(),
              icon: const Icon(Icons.language, color: AppTheme.cyan, size: 20),
              items: const [
                DropdownMenuItem(value: 'en', child: Text('EN', style: TextStyle(color: AppTheme.textPrimary, fontSize: 13))),
                DropdownMenuItem(value: 'hi', child: Text('हि', style: TextStyle(color: AppTheme.textPrimary, fontSize: 13))),
                DropdownMenuItem(value: 'gu', child: Text('gu', style: TextStyle(color: AppTheme.textPrimary, fontSize: 13))),
              ],
              onChanged: (v) => setState(() => _lang = v!),
            ),
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: modules.length,
        itemBuilder: (context, i) {
          final mod = modules[i];
          final tips = (mod['tips'] as List).cast<String>();
          return Card(
            margin: const EdgeInsets.only(bottom: 14),
            child: ExpansionTile(
              leading: Text(mod['icon'] as String, style: const TextStyle(fontSize: 24)),
              title: Text(mod['title'] as String,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              iconColor: AppTheme.cyan,
              collapsedIconColor: AppTheme.textMuted,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Column(
                    children: tips.map((tip) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('✅ ', style: TextStyle(fontSize: 12, color: AppTheme.green)),
                          Expanded(child: Text(tip, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary))),
                        ],
                      ),
                    )).toList(),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
