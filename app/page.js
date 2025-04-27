// src/app/page.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from './components/Navbar';
import { FiSearch } from 'react-icons/fi';
import './styles.css'; // Importa un archivo CSS para la animación
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const [searchMessage, setSearchMessage] = useState(''); // Inicializar con cadena vacía
  const [resultsVisible, setResultsVisible] = useState(false);
  const [linkedinVacanciesCount, setLinkedinVacanciesCount] = useState(0);
  const [getOnBoardVacanciesCount, setGetOnBoardVacanciesCount] = useState(0);
  const [searchCompleted, setSearchCompleted] = useState(false); // Nuevo estado para indicar que la búsqueda terminó

  const isAnyPlatformConnected = Object.values(connectedPlatforms).some(connected => connected);

  const handleConnectPlatform = (platformName, authUrl) => {
    if (platformName === 'GetOnBoard') {
      setConnectedPlatforms(prev => ({ ...prev, [platformName]: true }));
    } else {
      window.location.href = authUrl;
    }
  };

  const handleSearchVacancies = async () => {
    console.log('Botón de Buscar Vacantes clickeado');
    setSearchMessage('Buscando vacantes...'); // Establecer el mensaje al inicio
    setSearching(true);
    setVacancies([]);
    setResultsVisible(false);
    setLinkedinVacanciesCount(0);
    setGetOnBoardVacanciesCount(0);
    setSearchCompleted(false); // Resetear el estado de finalización
    const searchPromises = [];

    if (connectedPlatforms['LinkedIn']) {
      console.log('LinkedIn está conectado, llamando a la API...');
      const linkedinPromise = fetch('/api/search/linkedin-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location: "Argentina" }),
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(errorData => {
              throw new Error(errorData.message || 'Error al buscar vacantes en LinkedIn');
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Datos de vacantes de LinkedIn recibidos:', data);
          const linkedinVacancies = data?.vacancies || [];
          setLinkedinVacanciesCount(linkedinVacancies.length); // Actualizar el contador aquí
          return linkedinVacancies.map(vacancy => ({
            ...vacancy,
            source: 'LinkedIn',
          }));
        })
        .catch(error => {
          console.error('Error al buscar vacantes en LinkedIn:', error);
          return [];
        });
      searchPromises.push(linkedinPromise);
    }

    if (connectedPlatforms['GetOnBoard']) {
      console.log('GetOnBoard está "conectado", llamando a la API pública...');
      const getOnBoardPromise = fetch(`https://www.getonbrd.com/api/v0/search/jobs?query=junior&country_code=AR&expand=["company"]&per_page=5`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then(response => {
          console.log('Respuesta de GetOnBoard recibida:', response);
          if (!response.ok) {
            return response.json().then(errorData => {
              throw new Error(errorData.message || 'Error al buscar vacantes en GetOnBoard');
            });
          }
          return response.json();
        })
        .then(data => {
          console.log('Datos de vacantes de GetOnBoard recibidos:', data);
          console.log('Estructura de datos de GetOnBoard:', data);
          const onboardVacanciesData = data?.data || [];
          setGetOnBoardVacanciesCount(onboardVacanciesData.length); // Actualizar el contador aquí
          return onboardVacanciesData.map(job => ({
            id: job.id,
            title: job.attributes.title,
            company: job.attributes.company?.data?.attributes?.name || 'Nombre de empresa no disponible',
            url: `https://www.getonbrd.com/jobs/${job.id}`,
            source: 'GetOnBoard',
            published_at: job.attributes.published_at, // Asegúrate de tener published_at si lo usas
          }));
        })
        .catch(error => {
          console.error('Error al buscar vacantes en GetOnBoard:', error);
          return [];
        });
      searchPromises.push(getOnBoardPromise);
    }

    console.log('Promesas a resolver:', searchPromises);

    try {
      const allVacancies = await Promise.all(searchPromises);
      console.log('Resultados de todas las promesas:', allVacancies);
      const flattenedVacancies = allVacancies.flat();
      console.log('Vacantes combinadas:', flattenedVacancies);
      setVacancies(flattenedVacancies);
      setSearchCompleted(true); // Indicar que la búsqueda ha terminado

      if (flattenedVacancies.length > 0) {
        setResultsVisible(true);
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.classList.add('animate-fade-in');
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
              resultsRef.current.classList.remove('animate-fade-in');
            }, 1000);
          }
        }, 500);
      } else {
        setResultsVisible(false);
      }

    } catch (error) {
      setSearchMessage('Error al buscar vacantes.');
      console.error('Error al resolver las promesas:', error);
      alert(error.message);
      setSearchCompleted(true); // Indicar finalización incluso en caso de error
      setResultsVisible(false);
    } finally {
      setSearching(false);
      console.log('Búsqueda finalizada');
    }
  };

  useEffect(() => {
    if (searchCompleted) {
      let message = '';
      if (linkedinVacanciesCount > 0 || getOnBoardVacanciesCount > 0) {
        const linkedinMessage = linkedinVacanciesCount > 0 ? `${linkedinVacanciesCount} de LinkedIn` : '';
        const getOnBoardMessage = getOnBoardVacanciesCount > 0 ? `${getOnBoardVacanciesCount} de GetOnBoard` : '';
        const conjunction = linkedinVacanciesCount > 0 && getOnBoardVacanciesCount > 0 ? ' y ' : '';
        message = `Se encontraron ${linkedinMessage}${conjunction}${getOnBoardMessage} ofertas de empleo para juniors.`;
      } else if (isAnyPlatformConnected) {
        message = 'No se encontraron ofertas de empleo para juniors con los criterios actuales.';
      } else {
        message = 'Por favor, conecta al menos una plataforma antes de buscar.';
      }
      setSearchMessage(message);
    }
  }, [searchCompleted, linkedinVacanciesCount, getOnBoardVacanciesCount, connectedPlatforms, isAnyPlatformConnected]);

  useEffect(() => {
    const linkedinConnected = searchParams.get('linkedin_connected');
    const getonboardConnected = searchParams.get('getonboard_connected'); // Nuevo parámetro

    if (linkedinConnected === 'true') {
      setConnectedPlatforms(prev => ({ ...prev, LinkedIn: true }));
      router.replace('/');
    }

    if (getonboardConnected === 'true') {
      setConnectedPlatforms(prev => ({ ...prev, GetOnBoard: true }));
      router.replace('/');
    }
    // Aquí iría la lógica para verificar si ya hay cuentas conectadas
  }, [searchParams, router]);

  return (
    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 min-h-screen text-white">
      <Navbar />
      <header className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 opacity-70 z-0" />
        <div className="container -mt-8 mx-auto text-center relative z-10 px-4 md:px-8">
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
            disabled={searching || !isAnyPlatformConnected} // Deshabilitar si no hay plataformas conectadas
            title={!isAnyPlatformConnected ? 'Por favor, conecta al menos una plataforma para buscar vacantes.' : ''} // Mensaje al hacer hover
          >
            {searching ? <span className="flex items-center"><svg className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full" viewBox="0 0 24 24"></svg>Buscando...</span> : 'Buscar Empleos'}
          </button>
          {/* El mensaje de la búsqueda ahora está en el encabezado de resultados */}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-indigo-900 to-transparent z-0" />
      </header>

      {resultsVisible && (
        <div ref={resultsRef} className="py-12" style={{ background: 'linear-gradient(to bottom right, #0d47a1, #3f51b5)' }}>
          <div className="container mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
              Ofertas de Empleo para Juniors
              {searchMessage && <span className="ml-2 font-normal">({searchMessage})</span>}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vacancies.map((vacancy) => (
                <li key={vacancy.id} className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300">
                  <h3 className="text-xl font-semibold text-blue-700 mb-2">{vacancy.title}</h3>
                  <p className="text-gray-700 mb-2"><span className="font-semibold">Empresa:</span> {vacancy.company}</p>
                  {vacancy.location && <p className="text-gray-700 mb-2"><span className="font-semibold">Ubicación:</span> {vacancy.location}</p>}
                  <p className="text-gray-700 mb-2"><span className="font-semibold">Fuente:</span> {vacancy.source}</p>
                  {vacancy.published_at && (
                    <p className="text-gray-700 mb-2">
                      <span className="font-semibold">Publicado hace:</span>{' '}
                      {formatDistanceToNow(new Date(vacancy.published_at), {
                        locale: es,
                        addSuffix: true,
                      })}
                    </p>
                  )}
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