'use client';

import dynamic from 'next/dynamic';

const DynamicAuthErrorPage = dynamic(() => import('./auth-error-content'), {
  ssr: false,
  loading: () => <p>Cargando error de autenticación...</p>,
});

export default DynamicAuthErrorPage;