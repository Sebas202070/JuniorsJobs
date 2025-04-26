import { Suspense } from 'react';

export default function AuthErrorLayout({ children }) {
  return (
    <Suspense fallback={<p>Cargando error de autenticación...</p>}>
      {children}
    </Suspense>
  );
}