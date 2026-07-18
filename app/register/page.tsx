import type { Metadata } from 'next';
import RegisterForm from './RegisterForm';

export const metadata: Metadata = {
  title: 'Registro · Sistema de Riego',
  description: 'Crea una cuenta para acceder al sistema de riego automatizado',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
