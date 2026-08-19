-- ============================================================
-- JeevanSetu — Demo Seed Data
-- ============================================================

-- Demo Hospitals (Delhi NCR area)
INSERT INTO hospitals (name, address, latitude, longitude, phone, emergency_available, trauma_available, cardiology_available, maternity_available, pediatric_available, burns_available, open_24x7, verified, status) VALUES
('AIIMS Delhi', 'Sri Aurobindo Marg, Ansari Nagar, New Delhi', 28.5672, 77.2100, '+91-11-26588500', true, true, true, true, true, true, true, true, 'ACTIVE'),
('Safdarjung Hospital', 'Ansari Nagar West, New Delhi', 28.5685, 77.2065, '+91-11-26707437', true, true, true, true, true, false, true, true, 'ACTIVE'),
('Max Super Specialty Hospital', 'Press Enclave Road, Saket, New Delhi', 28.5275, 77.2137, '+91-11-26515050', true, true, true, true, true, true, true, true, 'ACTIVE'),
('Apollo Hospital', 'Mathura Road, Jasola, New Delhi', 28.5355, 77.2824, '+91-11-71791090', true, true, true, true, true, true, true, true, 'ACTIVE'),
('Fortis Hospital', 'Sector B, Pocket 1, Vasant Kunj, New Delhi', 28.5187, 77.1565, '+91-11-42776222', true, true, true, false, true, false, true, true, 'ACTIVE'),
('GTB Hospital', 'Dilshad Garden, Delhi', 28.6869, 77.3125, '+91-11-22586262', true, true, false, true, true, false, true, true, 'ACTIVE'),
('Sir Ganga Ram Hospital', 'Old Rajinder Nagar, New Delhi', 28.6387, 77.1887, '+91-11-25861253', true, true, true, true, true, true, true, true, 'ACTIVE'),
('Lok Nayak Hospital', 'Jawaharlal Nehru Marg, New Delhi', 28.6358, 77.2398, '+91-11-23232400', true, true, false, true, true, false, true, true, 'ACTIVE'),
('Ram Manohar Lohia Hospital', 'Baba Kharak Singh Marg, New Delhi', 28.6265, 77.2089, '+91-11-23365525', true, true, true, true, false, false, true, true, 'ACTIVE'),
('Medanta Hospital', 'CH Baktawar Singh Rd, Sector 38, Gurugram', 28.4395, 77.0422, '+91-124-4141414', true, true, true, true, true, true, true, true, 'ACTIVE');

-- Default platform credential issuer
INSERT INTO credential_issuers (name, did_identifier, issuer_type, verified) VALUES
('JeevanSetu Platform', 'did:jeevansetu:issuer:platform-001', 'PLATFORM', true);
