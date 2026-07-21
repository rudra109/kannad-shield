DELETE FROM incidents WHERE incident_type IN ('physical', 'cyber');

INSERT INTO incidents (incident_type, category, status, severity, lat, lng, description, is_silent)
VALUES 
-- Cluster 1: University Area (Eve-teasing & Stalking)
('physical', 'harassment', 'open', 85, 23.0380, 72.5450, 'Group of men harassing female students near university gate', false),
('physical', 'stalking', 'open', 75, 23.0370, 72.5460, 'Man following a woman for the past 3 blocks', false),
('physical', 'harassment', 'open', 70, 23.0390, 72.5440, 'Verbal abuse and eve-teasing at bus stop', false),

-- Cluster 2: IT Park / Corporate Road (Cyber & Blackmail)
('cyber', 'blackmail', 'open', 90, 23.0120, 72.5020, 'Colleague threatening to release private photos', true),
('cyber', 'fake_profile', 'open', 60, 23.0110, 72.5030, 'Fake Instagram profile using my pictures with derogatory captions', false),
('cyber', 'deepfake', 'open', 95, 23.0130, 72.5010, 'Deepfake video being circulated in office WhatsApp group', false),
('physical', 'stalking', 'open', 80, 23.0125, 72.5015, 'Ex-partner waiting aggressively outside office building', false),

-- Cluster 3: Residential Zone (Domestic Violence & SOS)
('physical', 'sos', 'open', 100, 23.0500, 72.5800, 'Domestic violence - Immediate police assistance required', true),
('physical', 'sos', 'open', 95, 23.0510, 72.5790, 'Trapped in room, partner is breaking the door', true),
('cyber', 'blackmail', 'open', 85, 23.0490, 72.5810, 'Husbands family demanding dowry and blackmailing', false);
