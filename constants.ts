import type { Service, Stylist } from './types';

export const INITIAL_SERVICES: Service[] = [
  { id: 1, name: 'Corte de Dama', price: 250, commissionRate: 0.3 },
  { id: 2, name: 'Corte de Caballero', price: 150, commissionRate: 0.3 },
  { id: 3, name: 'Tinte Completo', price: 800, commissionRate: 0.4 },
  { id: 4, name: 'Mechas', price: 1200, commissionRate: 0.4 },
  { id: 5, name: 'Peinado', price: 300, commissionRate: 0.3 },
  { id: 6, name: 'Manicura', price: 200, commissionRate: 0.3 },
  { id: 7, name: 'Pedicura', price: 250, commissionRate: 0.3 },
  { id: 8, name: 'Tratamiento Capilar', price: 500, commissionRate: 0.4 },
];

export const INITIAL_STYLISTS: Stylist[] = [
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Carlos' },
  { id: 3, 'name': 'Sofía' },
  { id: 4, name: 'Javier' },
];