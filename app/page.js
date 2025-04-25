// src/app/page.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from './components/Navbar';
import { FiSearch } from 'react-icons/fi';
import './styles.css'; // Importa un archivo CSS para la animación

const platforms = [
  { name: 'LinkedIn', authUrl: '/api/auth/linkedin', connected: false },
  { name: 'GetOnBoard', authUrl: '/api/auth/getonboard', connected: false },
  // { name: 'Google Jobs', authUrl: '/api/auth/google', connected: false },
];

function HomePage() {
  const [connectedPlatforms, setConnectedPlatforms] = useState(
    platforms.reduce((acc, platform) => ({ ...acc, [platform.name]: platform.connected }), {})
  );
  const [searching, setSearching] = useState(false);
  const [vacancies, setVacancies] = useState([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultsRef = useRef(null);
  const [searchMessage, setSearchMessage] = useState('');
  const [resultsVisible, setResultsVisible] = useState(false); // Nuevo estado para controlar la visibilidad

  const handleConnectPlatform = (platformName, authUrl) => {
    window.location.href = authUrl;
  };

  const handleSearchVacancies = async () => {
    console.log('Botón de Buscar Vacantes clickeado');
    setSearchMessage('Buscando vacantes...');
    setSearching(true);
    setVacancies([]);
    setResultsVisible(false); // Oculta los resultados al iniciar una nueva búsqueda
    try {
      if (connectedPlatforms['LinkedIn']) {
        console.log('LinkedIn está conectado, llamando a la API...');
        const response = await fetch('/api/search/linkedin-jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ location: "Argentina" }),
        });
        console.log('Respuesta de la API recibida:', response);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al buscar vacantes en LinkedIn');
        }
        const data = await response.json();
        console.log('Datos de vacantes recibidos:', data);
        setVacancies(data.vacancies);
        if (data?.vacancies?.length > 0) {
          setSearchMessage(`Se encontraron ${data.vacancies.length} vacantes.`);
          setResultsVisible(true); // Muestra los resultados
          setTimeout(() => {
            if (resultsRef.current) {
              resultsRef.current.classList.add('animate-fade-in'); // Agrega la clase de animación
              resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => {
                resultsRef.current.classList.remove('animate-fade-in'); // Remueve la clase después de un tiempo
              }, 1000); // Duración de la animación
            }
          }, 500);
        } else if (Object.values(connectedPlatforms).some(connected => connected)) {
          setSearchMessage('No se encontraron vacantes con los criterios actuales.');
        }
      } else {
        setSearchMessage('Por favor, conecta al menos una plataforma antes de buscar.');
      }
    } catch (error) {
      setSearchMessage('Error al buscar vacantes.');
      console.error('Error searching vacancies:', error);
      alert(error.message);
    } finally {
      setSearching(false);
      console.log('Búsqueda finalizada');
    }
  };

  useEffect(() => {
    const linkedinConnected = searchParams.get('linkedin_connected');
    if (linkedinConnected === 'true') {
      setConnectedPlatforms(prev => ({ ...prev, LinkedIn: true }));
      router.replace('/');
    }
    // Aquí iría la lógica para verificar si ya hay cuentas conectadas
  }, [searchParams, router]);

  return (
    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 min-h-screen text-white">
      <Navbar />
      <header className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 opacity-70 z-0" />
        <div className="container -mt-8 mx-auto text-center relative z-10">
          <h1 className="text-6xl font-bold tracking-tight mb-2 text-blue-300">Juniors</h1>
          <h1 className="text-6xl font-bold tracking-tight mb-4 text-white flex items-center justify-center">
            Jobs <FiSearch className="ml-2 text-blue-300" size={40} />
          </h1>
          <p className="text-lg opacity-80 mb-6">Impulsando tu primer empleo</p>
          <p className="text-lg opacity-80 mb-8">Conecta plataformas, descubre oportunidades y da el salto a tu carrera.</p>
          <div className="flex justify-center space-x-4">
            {platforms.map((platform) => (
              <button
                key={platform.name}
                onClick={() => handleConnectPlatform(platform.name, platform.authUrl)}
                className={`bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-full transition duration-300 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  connectedPlatforms[platform.name] ? 'bg-green-500 hover:bg-green-600 focus:ring-green-400' : ''
                }`}
                disabled={connectedPlatforms[platform.name]}
              >
                {connectedPlatforms[platform.name] ? <span className="flex items-center"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Conectado a {platform.name}</span> : `Conectar con ${platform.name}`}
              </button>
            ))}
          </div>
          <button
            onClick={handleSearchVacancies}
            className="mt-6 bg-green-500 hover:bg-green-600 text-white py-3 px-8 rounded-full transition duration-300 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
            disabled={searching || Object.values(connectedPlatforms).every(connected => !connected)}
          >
            {searching ? <span className="flex items-center"><svg className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full" viewBox="0 0 24 24"></svg>Buscando...</span> : 'Buscar Empleos'}
          </button>
          {searchMessage && <p className="mt-2 text-sm opacity-80">{searchMessage}</p>}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-indigo-900 to-transparent z-0" />
      </header>

      {resultsVisible && ( // Renderiza la sección solo si resultsVisible es true
        <div ref={resultsRef} className="py-12" style={{ background: 'linear-gradient(to bottom right, #0d47a1, #3f51b5)' }}>
          <div className="container mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">Ofertas de Empleo para Juniors</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vacancies.map((vacancy) => (
                <li key={vacancy.id} className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300">
                  <h3 className="text-xl font-semibold text-blue-700 mb-2">{vacancy.title}</h3>
                  <p className="text-gray-700 mb-2"><span className="font-semibold">Empresa:</span> {vacancy.company}</p>
                  <p className="text-gray-700 mb-2"><span className="font-semibold">Fuente:</span> {vacancy.source}</p>
                  <a href={vacancy.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-semibold">
                    Ver detalles <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;