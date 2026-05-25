CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  specialty TEXT,
  is_active BOOLEAN DEFAULT true,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyzers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
  type TEXT,
  model TEXT,
  serial_number TEXT,
  status TEXT DEFAULT 'operational',
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_interval_days INTEGER,
  chemical_renewal_interval_days INTEGER,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE CASCADE,
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
  technician_name TEXT NOT NULL,
  maintenance_type TEXT,
  description TEXT,
  parts_replaced TEXT,
  date DATE NOT NULL,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'completed',
  is_recurring BOOLEAN DEFAULT false,
  renewal_interval_days INTEGER,
  image_url TEXT,
  needs_followup BOOLEAN DEFAULT false,
  followup_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chemical_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analyzer_id UUID REFERENCES analyzers(id) ON DELETE CASCADE,
  station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
  technician_name TEXT,
  chemical_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT,
  date DATE NOT NULL,
  renewal_interval_days INTEGER,
  lot_number TEXT,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chemical_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chemical_name TEXT NOT NULL,
  unit TEXT,
  current_stock NUMERIC DEFAULT 0,
  minimum_threshold NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_name TEXT NOT NULL,
  action_type TEXT,
  description TEXT NOT NULL,
  station_name TEXT,
  analyzer_name TEXT,
  old_value TEXT,
  new_value TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyzers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon and authenticated roles (no auth needed for this app)
CREATE POLICY "Allow all for anon" ON technicians FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON stations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON analyzers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON maintenance_logs FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON chemical_consumptions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON chemical_inventory FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON activity_log FOR ALL TO anon USING (true) WITH CHECK (true);
