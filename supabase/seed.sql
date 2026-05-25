-- Seed technicians (skip if already exist)
INSERT INTO technicians (name, phone, specialty, is_active) VALUES
  ('אלכס ולנסי', '052-3737905', 'כל ציוד', true),
  ('אלירן', '052-2790434', 'כיול ו תחזוקה מכשירים', true),
  ('ברטי', '053-3737912', 'כל ציוד', true),
  ('ישראל', '052-3737908', 'הכל', true),
  ('אולג', '054-3361205', 'תחזוקה כללית', true)
ON CONFLICT DO NOTHING;

-- Seed stations
WITH inserted_stations AS (
  INSERT INTO stations (name, status) VALUES
    ('מתקן שורק 1', 'active'),
    ('מתקן שורק 2', 'active'),
    ('מתקן התפלה פלמחים (Via Maris)', 'active'),
    ('מתקן התפלה אשדוד', 'active'),
    ('מתקן התפלה אשקלון (אדום)', 'active'),
    ('מתקן התפלה חדרה (אומיס)', 'active')
  ON CONFLICT DO NOTHING
  RETURNING id, name
)
-- Seed analyzers using subqueries for station IDs
INSERT INTO analyzers (name, station_id, model, type, status, maintenance_interval_days, chemical_renewal_interval_days)
SELECT a.name, s.id, a.model, a.type, a.status, a.mid, a.cid
FROM (VALUES
  ('BORON',        'מתקן שורק 2',                     'Systea',       'boron',       'operational', 7,    15),
  ('conductivity', 'מתקן שורק 2',                     'HACH',         'conductivity','operational', NULL, NULL),
  ('מד pH',        'מתקן שורק 2',                     'HACH',         'pH',          'operational', 15,   NULL),
  ('Alkalinity',   'מתקן התפלה חדרה (אומיס)',         'Hach',         'alkalinity',  'operational', NULL, NULL),
  ('Boron',        'מתקן התפלה חדרה (אומיס)',         'Systea',       'boron',       'operational', NULL, NULL),
  ('Sampler',      'מתקן התפלה חדרה (אומיס)',         'Isco',         'sampler',     'operational', NULL, NULL),
  ('Hardness',     'מתקן התפלה פלמחים (Via Maris)',   'Heyl testomat','other',       'operational', NULL, NULL),
  ('Conductivity', 'מתקן התפלה פלמחים (Via Maris)',   'Hach',         'conductivity','operational', NULL, NULL),
  ('pH',           'מתקן התפלה פלמחים (Via Maris)',   'Hach',         'pH',          'operational', NULL, NULL),
  ('Turbidity',    'מתקן התפלה פלמחים (Via Maris)',   'Hach',         'other',       'operational', NULL, NULL),
  ('Alkalinity',   'מתקן התפלה פלמחים (Via Maris)',   'Hach',         'alkalinity',  'operational', NULL, NULL),
  ('Boron OLD',    'מתקן התפלה פלמחים (Via Maris)',   'Systea',       'boron',       'operational', NULL, NULL),
  ('Sampler',      'מתקן התפלה פלמחים (Via Maris)',   'Isco',         'sampler',     'operational', NULL, NULL)
) AS a(name, station_name, model, type, status, mid, cid)
JOIN stations s ON s.name = a.station_name
ON CONFLICT DO NOTHING;
