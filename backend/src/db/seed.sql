-- Sample seed data for local testing.
-- Password for ALL seeded users is: Passw0rd!
-- (hash below is a bcrypt hash of "Passw0rd!", generated with 10 rounds)

INSERT INTO users (name, email, password_hash, role, department) VALUES
('Ava Kumar',      'admin@example.com',  '$2b$10$xd1U2h1qkC9j5m0G0f6ZOe2sT0eYQ2iF1G0Z8n4l6rV3f4Q1r7s9y', 'admin',  'Program Office'),
('Ravi Sharma',    'mentor1@example.com','$2b$10$xd1U2h1qkC9j5m0G0f6ZOe2sT0eYQ2iF1G0Z8n4l6rV3f4Q1r7s9y', 'mentor', 'Engineering'),
('Priya Nair',     'mentor2@example.com','$2b$10$xd1U2h1qkC9j5m0G0f6ZOe2sT0eYQ2iF1G0Z8n4l6rV3f4Q1r7s9y', 'mentor', 'Design');

-- Interns linked to mentors (mentor_id references the mentor rows above — adjust IDs after insert if needed)
INSERT INTO users (name, email, password_hash, role, department, mentor_id) VALUES
('Sara Iyer',   'sara@example.com',   '$2b$10$xd1U2h1qkC9j5m0G0f6ZOe2sT0eYQ2iF1G0Z8n4l6rV3f4Q1r7s9y', 'intern', 'Engineering', 2),
('Karan Mehta', 'karan@example.com',  '$2b$10$xd1U2h1qkC9j5m0G0f6ZOe2sT0eYQ2iF1G0Z8n4l6rV3f4Q1r7s9y', 'intern', 'Engineering', 2),
('Neha Joshi',  'neha@example.com',   '$2b$10$xd1U2h1qkC9j5m0G0f6ZOe2sT0eYQ2iF1G0Z8n4l6rV3f4Q1r7s9y', 'intern', 'Design',      3);

-- A few days of sample attendance
INSERT INTO attendance (user_id, date, check_in, check_out, status) VALUES
(4, CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '09:05', (CURRENT_DATE - 1) + TIME '17:50', 'present'),
(4, CURRENT_DATE,     CURRENT_DATE + TIME '09:12', NULL, 'present'),
(5, CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '10:30', (CURRENT_DATE - 1) + TIME '14:00', 'half_day'),
(5, CURRENT_DATE - 2, NULL, NULL, 'absent'),
(6, CURRENT_DATE - 1, (CURRENT_DATE - 1) + TIME '09:00', (CURRENT_DATE - 1) + TIME '18:00', 'present');
