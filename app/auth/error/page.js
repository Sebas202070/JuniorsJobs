
'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

function AuthErrorPage() {
  const searchParams = useSearchParams();
  const platform = searchParams.get('platform');
  const error = searchParams.get('error');
  const description = searchParams.get('description');

  return (
    <div>
      <h1>Error de Autenticación</h1>
      {platform && <p>Plataforma: {platform}</p>}
      {error && <p>Error: {error}</p>}
      {description && <p>Descripción: {description}</p>}
      {!error && !description && (
        <p>Ocurrió un error durante la autenticación. Por favor, intenta de nuevo.</p>
      )}
      <button onClick={() => window.location.href = '/'}>Volver a la página principal</button>
    </div>
  );
}

export default AuthErrorPage;