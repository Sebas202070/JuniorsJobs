// src/app/page.js
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from './components/Navbar';
import { FiSearch } from 'react-icons/fi';
import './styles.css';
import { differenceInDays } from 'date-fns';

const platforms = [
  { name: 'LinkedIn', authUrl: '/api/auth/linkedin', connected: false },
  { name: 'GetOnBoard', authUrl: '/api/auth/getonboard', connected: false },
  // { name: 'Google Jobs', authUrl: '/api/auth/google', connected: false },
];

function HomePage() {
  const [connectedPlatforms, setConnectedPlatforms] = useState(() => (
    platforms.reduce((acc, platform) => ({ ...acc, [platform.name]: platform.connected }), {})
  ));
  const [searching, setSearching] = useState(false);
  const [vacancies, setVacancies] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedVacancies = localStorage.getItem('vacancies');
      return storedVacancies ? JSON.parse(storedVacancies) : [];
    }
    return [];
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultsRef = useRef(null);
  const [searchMessage, setSearchMessage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('searchMessage') || '';
    }
    return '';
  });
  const [resultsVisible, setResultsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('resultsVisible') === 'true';
    }
    return false;
  });
  const [linkedinVacanciesCount, setLinkedinVacanciesCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedCount = localStorage.getItem('linkedinVacanciesCount');
      return storedCount ? parseInt(storedCount, 10) : 0;
    }
    return 0;
  });
  const [getOnBoardVacanciesCount, setGetOnBoardVacanciesCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedCount = localStorage.getItem('getOnBoardVacanciesCount');
      return storedCount ? parseInt(storedCount, 10) : 0;
    }
    return 0;
  });
  const [searchCompleted, setSearchCompleted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('searchCompleted') === 'true';
    }
    return false;
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [hasLoadedLocalStorage, setHasLoadedLocalStorage] = useState(false);

  const isAnyPlatformConnected = Object.values(connectedPlatforms).some(connected => connected);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedConnectedPlatforms = localStorage.getItem('connectedPlatforms');
      if (storedConnectedPlatforms) {
        setConnectedPlatforms(JSON.parse(storedConnectedPlatforms));
      }
      setHasLoadedLocalStorage(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('connectedPlatforms', JSON.stringify(connectedPlatforms));
    }
  }, [connectedPlatforms]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('resultsVisible', JSON.stringify(resultsVisible));
    }
  }, [resultsVisible]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vacancies', JSON.stringify(vacancies));
    }
  }, [vacancies]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchMessage', searchMessage);
    }
  }, [searchMessage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('linkedinVacanciesCount', linkedinVacanciesCount.toString());
    }
  }, [linkedinVacanciesCount]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('getOnBoardVacanciesCount', getOnBoardVacanciesCount.toString());
    }
  }, [getOnBoardVacanciesCount]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchCompleted', searchCompleted.toString());
    }
  }, [searchCompleted]);

  const handleConnectPlatform = (platformName, authUrl) => {
    console.log('handleConnectPlatform llamada:', { platformName, authUrl, currentConnectedPlatforms: connectedPlatforms });
    setConnectedPlatforms(prev => {
      const isCurrentlyConnected = prev[platformName];
      const newState = { ...prev };
      newState[platformName] = !isCurrentlyConnected;
      return newState;
    });
  };

  const handleSearchVacancies = async () => {
    console.log('handleSearchVacancies llamada');
    if (!isAnyPlatformConnected && !searching) {
      setAlertMessage('¡Ups! Conecta al menos una plataforma para buscar empleos.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    console.log('Botón de Buscar Vacantes clickeado');
    setSearchMessage('Buscando vacantes...');
    setSearching(true);
    setVacancies([]);
    setResultsVisible(false);
    setLinkedinVacanciesCount(0);
    setGetOnBoardVacanciesCount(0);
    setSearchCompleted(false);
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
          setLinkedinVacanciesCount(linkedinVacancies.length);
          return linkedinVacancies.map(vacancy => ({
            ...vacancy,
            source: 'LinkedIn',
            published_at: vacancy.published_at,
            daysAgo: vacancy.published_at ? differenceInDays(new Date(), new Date(vacancy.published_at)) : null,
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
          setGetOnBoardVacanciesCount(onboardVacanciesData.length);
          return onboardVacanciesData.map(job => ({
            id: job.id,
            title: job.attributes.title,
            company: job.attributes.company?.data?.attributes?.name || 'Nombre de empresa no disponible',
            url: `https://www.getonbrd.com/jobs/${job.id}`,
            source: 'GetOnBoard',
            published_at: job.attributes.published_at,
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
      setResultsVisible(true);

      if (flattenedVacancies.length > 0) {
        setTimeout(() => {
          if (resultsRef.current) {
            resultsRef.current.classList.add('animate-fade-in');
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
              resultsRef.current.classList.remove('animate-fade-in');
            }, 1000);
          }
        }, 500);
      }

    } catch (error) {
      setSearchMessage('Error al buscar vacantes.');
      console.error('Error al resolver las promesas:', error);
      setAlertMessage(error.message);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      setResultsVisible(false);
      setVacancies([]);
      setLinkedinVacanciesCount(0);
      setGetOnBoardVacanciesCount(0);
      setSearchCompleted(false);
      setSearchMessage('');
    } finally {
      setSearching(false);
      console.log('Búsqueda finalizada');
      setSearchCompleted(true);
    }
  };

  const handleClearSearch = () => {
    setVacancies([]);
    setSearchMessage('');
    setResultsVisible(false);
    setLinkedinVacanciesCount(0);
    setGetOnBoardVacanciesCount(0);
    setSearchCompleted(false);
    setConnectedPlatforms(prev => ({
      ...prev,
      LinkedIn: false,
      GetOnBoard: false,
    }));
    localStorage.removeItem('vacancies');
    localStorage.removeItem('searchMessage');
    localStorage.removeItem('resultsVisible');
    localStorage.removeItem('linkedinVacanciesCount');
    localStorage.removeItem('getOnBoardVacanciesCount');
    localStorage.removeItem('searchCompleted');
    localStorage.removeItem('connectedPlatforms'); // También limpiamos el estado de conexión
  };

  useEffect(() => {
    const linkedinConnected = searchParams.get('linkedin_connected');
    const getonboardConnected = searchParams.get('getonboard_connected');

    console.log('useEffect de conexión activado:', { linkedinConnected, getonboardConnected });
    console.log('Estado de connectedPlatforms antes de la actualización:', connectedPlatforms);

    if (linkedinConnected === 'true') {
      setConnectedPlatforms(prev => {
        const newState = { ...prev, LinkedIn: true };
        return newState;
      });
    }

    if (getonboardConnected === 'true') {
      setConnectedPlatforms(prev => {
        const newState = { ...prev, GetOnBoard: true };
        return newState;
      });
    }

    if (linkedinConnected === 'true' || getonboardConnected === 'true') {
      console.log('Limpiando parámetros de la URL.');
      router.replace('/'); // Limpiar los parámetros de la URL
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router]);

  useEffect(() => {
    if (searchCompleted) {
      let message = '';
      if (linkedinVacanciesCount > 0 || getOnBoardVacanciesCount > 0) {
        const linkedinMessage = linkedinVacanciesCount > 0 ? `LinkedIn(${linkedinVacanciesCount})` : '';
        const getOnBoardMessage = getOnBoardVacanciesCount > 0 ? `GetOnBoard(${getOnBoardVacanciesCount})` : '';
        const conjunction = linkedinVacanciesCount > 0 && getOnBoardVacanciesCount > 0 ? ' ,  ' : '';
        message = `${linkedinMessage}${conjunction}${getOnBoardMessage}`;
      } else if (isAnyPlatformConnected) {
        message = 'No se encontraron ofertas de empleo para juniors con los criterios actuales.';
      } else {
        message = 'Por favor, conecta al menos una plataforma antes de buscar.';
      }
      setSearchMessage(message);
    }
  }, [searchCompleted, linkedinVacanciesCount, getOnBoardVacanciesCount, connectedPlatforms, isAnyPlatformConnected]);

  console.log('connectedPlatforms al renderizar:', connectedPlatforms);
  console.log('isAnyPlatformConnected al renderizar:', isAnyPlatformConnected);

  return (
    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 min-h-screen text-white">
      <Navbar />
      <header className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 opacity-70 z-0" />
        <div className="container -mt-10 mx-auto text-center relative z-10 px-4 md:px-8">
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
                className={`bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-full transition duration-300 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 flex flex-col items-center justify-center ${
                  connectedPlatforms[platform.name] ? 'bg-green-500 hover:bg-green-600 focus:ring-green-400' : ''
                }`}
                disabled={searching}
                style={{ minHeight: '80px' }}
              >
                <span className="flex items-center justify-center">
                  {connectedPlatforms[platform.name] ? <><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Conectado a {platform.name}</> : `Conectar con ${platform.name}`}
                </span>
                {connectedPlatforms[platform.name] && (
                  <span className="text-xs font-normal mt-1">(Haz click para desconectar)</span>
                )}
              </button>
            ))}
          </div>
          <div className="relative mt-4">
            <button
              onClick={handleSearchVacancies}
              className="bg-green-500 hover:bg-green-600 text-white py-3 px-8 rounded-full transition duration-300 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
              disabled={searching}
            >
              {searching ? <span className="flex items-center"><svg className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full" viewBox="0 0 24 24"></svg>Buscando...</span> : 'Buscar Empleos'}
            </button>
            {showAlert && (
  <div className="fixed bottom-0 left-0 w-full bg-red-500 text-white py-3 px-6 rounded-t-md shadow-md z-50 text-center mt-12 sm:absolute sm:top-full sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:mt-2 sm:max-w-md">
    {alertMessage}
  </div>
)}
          </div></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-indigo-900 to-transparent z-0" />
      </header>

      {hasLoadedLocalStorage && resultsVisible && (
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
                  <p className="text-gray-700 mb-2"><span className="font-semibold">Fuente:</span> {vacancy.source}</p>
                  {vacancy.published_at && vacancy.source === 'LinkedIn' && (
                    <p className="text-gray-700 mb-2">
                      <span className="font-semibold">Publicado hace:</span> {vacancy.daysAgo !== null ? `${vacancy.daysAgo} día${vacancy.daysAgo !== 1 ? 's' : ''}` : 'Fecha no disponible'}
                    </p>
                  )}
                  <a href={vacancy.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-semibold">
                    Ver detalles <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </a>
                </li>
              ))}
            </ul>
            {vacancies.length > 0 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleClearSearch}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 px-8 rounded-full transition duration-300 font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  Limpiar Búsqueda
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;