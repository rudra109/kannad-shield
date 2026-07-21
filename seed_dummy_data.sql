INSERT INTO incidents (incident_type, category, status, severity, lat, lng, description, is_silent)
VALUES 
-- Cluster 1: Vastrapur Area (High Crime Hotspot)
('physical', 'sos', 'open', 85, 23.0350, 72.5293, 'Emergency reported near Vastrapur Lake', false),
('cyber', 'fraud', 'open', 60, 23.0360, 72.5300, 'UPI scam reported', false),
('physical', 'harassment', 'open', 70, 23.0345, 72.5285, 'Harassment complaint', false),
('physical', 'stalking', 'open', 75, 23.0370, 72.5310, 'Stalking at mall', false),
('cyber', 'phishing', 'open', 40, 23.0355, 72.5290, 'Phishing link clicked', false),

-- Cluster 2: SG Highway (Moderate Crime Hotspot)
('physical', 'sos', 'open', 90, 23.0060, 72.5020, 'Accident/SOS near SG Highway', false),
('cyber', 'fake_profile', 'open', 50, 23.0075, 72.5035, 'Fake profile created', false),
('physical', 'sos', 'open', 80, 23.0050, 72.5010, 'SOS near ISKCON crossroads', false),
('cyber', 'fraud', 'open', 65, 23.0065, 72.5025, 'Credit card fraud', false),

-- Cluster 3: Navrangpura (Low/Scattered Hotspot)
('cyber', 'blackmail', 'open', 65, 23.0380, 72.5530, 'Extortion attempt online', false),
('physical', 'harassment', 'open', 55, 23.0395, 72.5545, 'Public harassment complaint', false),
('physical', 'sos', 'open', 88, 23.0375, 72.5520, 'Immediate assistance required', false);
