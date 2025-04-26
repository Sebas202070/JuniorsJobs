'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function AuthErrorPage() {
  const [platform, setPlatform] = useState(null);
  const [error, setError] = useState(null);
  const [description, setDescription] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    setPlatform(searchParams.get('platform'));
    setError(searchParams.get('error'));
    setDescription(searchParams.get('description'));
  }, [searchParams]);

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