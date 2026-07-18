import type { Metadata } from 'next';
import SimulacionClient from './SimulacionClient';

export const metadata: Metadata = {
  title: 'Simulación · Sistema de Riego Automatizado — ESP32',
  description:
    'Simulación web interactiva de un sistema de riego agrícola automatizado basado en ESP32. Replica la lógica de sensores capacitivos de humedad, relés, bombas y electroválvulas en tiempo real.',
};

export default function SimulacionPage() {
  return <SimulacionClient />;
}
