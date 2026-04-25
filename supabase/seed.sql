-- ================================================================
-- QUARTERS · Seed Data
-- Run AFTER 001_initial_schema.sql
-- ================================================================

-- Zones (9 rooms — matches HTML prototype geometry)
INSERT INTO zones (id, name, short_name, code, area, geometry) VALUES
  ('bedroom_small',  'Спальня Маленькая',        'Спальня M', 'BR-01', 11.5,
   '{"type":"rect","x":20,"y":20,"w":140,"h":380}'),
  ('bedroom_medium', 'Спальня Средняя',           'Спальня S', 'BR-02', 14.0,
   '{"type":"rect","x":170,"y":20,"w":290,"h":280}'),
  ('wardrobe',       'Гардероб',                  'Гардероб',  'WD-01',  3.0,
   '{"type":"rect","x":470,"y":20,"w":110,"h":280}'),
  ('entry',          'Прихожая',                  'Прихожая',  'EN-01',  4.5,
   '{"type":"rect","x":470,"y":310,"w":110,"h":140}'),
  ('bath',           'Ванная',                    'Ванная',    'BT-01',  2.6,
   '{"type":"rect","x":20,"y":410,"w":140,"h":95}'),
  ('wc',             'Туалет',                    'Туалет',    'WC-01',  1.2,
   '{"type":"rect","x":20,"y":515,"w":140,"h":75}'),
  ('corridor',       'Коридор / Холл',            'Коридор',   'CR-01',  8.5,
   '{"type":"polygon","points":"170,310 460,310 460,450 210,450 210,600 170,600"}'),
  ('kitchen',        'Кухня',                     'Кухня',     'KT-01', 10.2,
   '{"type":"rect","x":20,"y":600,"w":180,"h":180}'),
  ('living',         'Гостиная / Спальня Большая','Гостиная',  'LR-01', 20.5,
   '{"type":"rect","x":220,"y":460,"w":360,"h":320}')
ON CONFLICT (id) DO NOTHING;

-- Operation types
INSERT INTO operation_types (code, label, sub_label) VALUES
  ('MTN-01', 'Поддерживающая уборка', 'Maintenance Pass'),
  ('DEP-01', 'Глубокая уборка',       'Deep Cleaning Cycle'),
  ('WET-01', 'Влажная обработка',     'Wet Surface Treatment'),
  ('DRY-01', 'Сухая очистка',         'Dry Particle Extraction'),
  ('KIT-01', 'Кухонный цикл',         'Kitchen Operations'),
  ('FUL-01', 'Полный цикл',           'Full Scope Cycle')
ON CONFLICT (code) DO NOTHING;

-- Initialize zone states (all idle)
INSERT INTO zone_states (zone_id, status)
SELECT id, 'idle' FROM zones
ON CONFLICT (zone_id) DO NOTHING;
