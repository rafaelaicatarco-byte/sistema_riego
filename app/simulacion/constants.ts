export interface Pump {
  name: string;
  flow: number;  // L/min
  power: number; // W
}

export interface Plant {
  name: string;
  cat: string;
  lm2: number;
  low: number;
  high: number;
}

export interface Irrigation {
  name: string;
  efficiency: number;
  flowFactor: number;
}

export interface Soil {
  name: string;
  evapMult: number;
  efficiency: number;
}

export const PUMPS: Record<string, Pump> = {
  p1: { name: 'Periférica 0.5HP', flow: 40, power: 370 },
  p2: { name: 'Centrífuga 1HP', flow: 80, power: 750 },
  p3: { name: 'Sumergible 1.5HP', flow: 120, power: 1100 },
  p4: { name: 'Alta presión 2HP', flow: 150, power: 1500 },
};

export const PLANTS: Record<string, Plant> = {
  fresa:     { name: 'Fresa',     cat: 'Fruta',     lm2: 6.0, low: 35, high: 70 },
  sandia:    { name: 'Sandía',    cat: 'Fruta',     lm2: 8.0, low: 30, high: 65 },
  melon:     { name: 'Melón',     cat: 'Fruta',     lm2: 7.0, low: 30, high: 65 },
  frijol:    { name: 'Frijol',    cat: 'Legumbre',  lm2: 5.0, low: 30, high: 65 },
  lenteja:   { name: 'Lenteja',   cat: 'Legumbre',  lm2: 4.0, low: 25, high: 60 },
  arveja:    { name: 'Arveja',    cat: 'Legumbre',  lm2: 4.5, low: 28, high: 62 },
  lechuga:   { name: 'Lechuga',   cat: 'Vegetal',   lm2: 5.0, low: 40, high: 75 },
  zanahoria: { name: 'Zanahoria', cat: 'Vegetal',   lm2: 4.5, low: 35, high: 70 },
  pimiento:  { name: 'Pimiento',  cat: 'Vegetal',   lm2: 6.0, low: 32, high: 68 },
  cebolla:   { name: 'Cebolla',   cat: 'Vegetal',   lm2: 4.0, low: 30, high: 65 },
};

export const IRRIGATION: Record<string, Irrigation> = {
  goteo:          { name: 'Goteo',             efficiency: 0.95, flowFactor: 0.6 },
  microaspersion: { name: 'Microaspersión',    efficiency: 0.85, flowFactor: 0.8 },
  aspersion:      { name: 'Aspersión',         efficiency: 0.75, flowFactor: 1.0 },
  gravedad:       { name: 'Gravedad / surco',  efficiency: 0.55, flowFactor: 1.0 },
};

export const SOILS: Record<string, Soil> = {
  arenoso:  { name: 'Arenosa',   evapMult: 1.8, efficiency: 0.75 },
  franco:   { name: 'Franca',    evapMult: 1.0, efficiency: 1.0 },
  arcillosa:{ name: 'Arcillosa', evapMult: 0.5, efficiency: 1.25 },
};

export const TANK_CAPACITY = 20000; // L
export const AREA = 4000;           // m²
export const FILL_RATE = 350;       // L/min (electroválvula)
export const VALVE_OPEN_PCT = 0.20;
export const VALVE_CLOSE_PCT = 0.98;
