import { KEYS, setList } from './storage';

export function seedIfNeeded() {
  if (localStorage.getItem('agua_seeded') === 'true') return;

  // --- Technicians ---
  const technicians = [
    {
      id: crypto.randomUUID(),
      name: 'אלכס ולנסי',
      phone: '052-3737905',
      specialty: 'כל ציוד',
      is_active: true,
    },
    {
      id: crypto.randomUUID(),
      name: 'אלירן',
      phone: '052-2790434',
      specialty: 'כיול ו תחזוקה מכשירים',
      is_active: true,
    },
    {
      id: crypto.randomUUID(),
      name: 'ברטי',
      phone: '053-3737912',
      specialty: 'כל ציוד',
      is_active: true,
    },
    {
      id: crypto.randomUUID(),
      name: 'ישראל',
      phone: '052-3737908',
      specialty: 'הכל',
      is_active: true,
    },
    {
      id: crypto.randomUUID(),
      name: 'אולג',
      phone: '054-3361205',
      specialty: 'תחזוקה כללית',
      is_active: true,
    },
  ];

  // --- Stations ---
  const shorekId1 = crypto.randomUUID();
  const shorekId2 = crypto.randomUUID();
  const palmachimId = crypto.randomUUID();
  const ashdodId = crypto.randomUUID();
  const ashkelonId = crypto.randomUUID();
  const haderaId = crypto.randomUUID();

  const stations = [
    { id: shorekId1, name: 'מתקן שורק 1', status: 'active' },
    { id: shorekId2, name: 'מתקן שורק 2', status: 'active' },
    { id: palmachimId, name: 'מתקן התפלה פלמחים (Via Maris)', status: 'active' },
    { id: ashdodId, name: 'מתקן התפלה אשדוד', status: 'active' },
    { id: ashkelonId, name: 'מתקן התפלה אשקלון (אדום)', status: 'active' },
    { id: haderaId, name: 'מתקן התפלה חדרה (אומיס)', status: 'active' },
  ];

  // --- Analyzers ---
  const analyzers = [
    // שורק 2
    {
      id: crypto.randomUUID(),
      station_id: shorekId2,
      name: 'BORON',
      model: 'Systea',
      type: 'boron',
      status: 'operational',
      maintenance_interval_days: 7,
      chemical_renewal_interval_days: 15,
    },
    {
      id: crypto.randomUUID(),
      station_id: shorekId2,
      name: 'conductivity',
      model: 'HACH',
      type: 'conductivity',
      status: 'operational',
    },
    {
      id: crypto.randomUUID(),
      station_id: shorekId2,
      name: 'מד pH',
      model: 'HACH',
      type: 'pH',
      status: 'operational',
      maintenance_interval_days: 15,
    },

    // חדרה
    {
      id: crypto.randomUUID(),
      station_id: haderaId,
      name: 'Alkalinity',
      model: 'Hach',
      type: 'alkalinity',
      status: 'operational',
    },
    {
      id: crypto.randomUUID(),
      station_id: haderaId,
      name: 'Boron',
      model: 'Systea',
      type: 'boron',
      status: 'operational',
    },
    {
      id: crypto.randomUUID(),
      station_id: haderaId,
      name: 'Sampler',
      model: 'Isco',
      type: 'sampler',
      status: 'operational',
    },

    // פלמחים
    {
      id: crypto.randomUUID(),
      station_id: palmachimId,
      name: 'Hardness',
      model: 'Heyl testomat',
      type: 'other',
      status: 'operational',
    },
    {
      id: crypto.randomUUID(),
      station_id: palmachimId,
      name: 'Conductivity',
      model: 'Hach',
      type: 'conductivity',
      status: 'operational',
    },
    {
      id: crypto.randomUUID(),
      station_id: palmachimId,
      name: 'pH',
      model: 'Hach',
      type: 'pH',
      status: 'operational',
    },
    {
      id: crypto.randomUUID(),
      station_id: palmachimId,
      name: 'Turbidity',
      model: 'Hach',
      type: 'other',
      status: 'operational',
    },
    {
      id: crypto.randomUUID(),
      station_id: palmachimId,
      name: 'Alkalinity',
      model: 'Hach',
      type: 'alkalinity',
      status: 'operational',
    },
    {
      id: crypto.randomUUID(),
      station_id: palmachimId,
      name: 'Boron OLD',
      model: 'Systea',
      type: 'boron',
      status: 'operational',
    },
    {
      id: crypto.randomUUID(),
      station_id: palmachimId,
      name: 'Sampler',
      model: 'Isco',
      type: 'sampler',
      status: 'operational',
    },
  ];

  setList(KEYS.TECHNICIANS, technicians);
  setList(KEYS.STATIONS, stations);
  setList(KEYS.ANALYZERS, analyzers);

  localStorage.setItem('agua_seeded', 'true');
}
