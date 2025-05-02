// src/app/page.js
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from './components/Navbar';
import { FiSearch } from 'react-icons/fi';
import './styles.css';
import { differenceInDays } from 'date-fns';

const platforms = [
    { name: 'LinkedIn', authUrl: '/api/auth/linkedin', connected: false },
    { name: 'GetOnBoard', authUrl: '/api/auth/getonboard', connected: false },
    { name: 'Adzuna Jobs', connected: false },
];

function HomePage() {
    const [linkedinToken, setLinkedinToken] = useState(() => (typeof window !== 'undefined' ? sessionStorage.getItem('linkedinToken') || null : null));
    const [connectedPlatforms, setConnectedPlatforms] = useState(() => (typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('connectedPlatforms')) || platforms.reduce((acc, p) => ({ ...acc, [p.name]: false }), {}) : platforms.reduce((acc, p) => ({ ...acc, [p.name]: false }), {})));
    const [searching, setSearching] = useState(false);
    const [allVacancies, setAllVacancies] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedVacancies = sessionStorage.getItem('allVacancies');
            return storedVacancies ? JSON.parse(storedVacancies) : [];
        }
        return [];
    });
    const [visibleVacancies, setVisibleVacancies] = useState(() => {
        if (typeof window !== 'undefined' && sessionStorage.getItem('allVacancies')) {
            const storedVacancies = JSON.parse(sessionStorage.getItem('allVacancies'));
            const storedToShow = sessionStorage.getItem('vacanciesToShow');
            const initialToShow = storedToShow ? parseInt(storedToShow, 10) : 20;
            return storedVacancies.slice(0, initialToShow);
        }
        return [];
    });
    const [vacanciesToShow, setVacanciesToShow] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedToShow = sessionStorage.getItem('vacanciesToShow');
            return storedToShow ? parseInt(storedToShow, 10) : 20;
        }
        return 20;
    });
    const [seenVacancies, setSeenVacancies] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedSeenVacancies = sessionStorage.getItem('seenVacancies');
            if (storedSeenVacancies) {
                try {
                    return new Set(JSON.parse(storedSeenVacancies));
                } catch (error) {
                    console.error("Error parsing seenVacancies from sessionStorage:", error);
                    return new Set();
                }
            }
            return new Set();
        }
        return new Set();
    });
    const router = useRouter();
    const searchParams = useSearchParams();
    const resultsRef = useRef(null);
    const [searchMessage, setSearchMessage] = useState(() => (typeof window !== 'undefined' ? sessionStorage.getItem('searchMessage') || '' : ''));
    const [resultsVisible, setResultsVisible] = useState(() => (typeof window !== 'undefined' ? sessionStorage.getItem('resultsVisible') === 'true' : false));
    const [linkedinVacanciesCount, setLinkedinVacanciesCount] = useState(() => (typeof window !== 'undefined' ? parseInt(sessionStorage.getItem('linkedinVacanciesCount') || '0', 10) : 0));
    const [getOnBoardVacanciesCount, setGetOnBoardVacanciesCount] = useState(() => (typeof window !== 'undefined' ? parseInt(sessionStorage.getItem('getOnBoardVacanciesCount') || '0', 10) : 0));
    const [adzunaJobsVacanciesCount, setAdzunaJobsVacanciesCount] = useState(() => (typeof window !== 'undefined' ? parseInt(sessionStorage.getItem('adzunaJobsVacanciesCount') || '0', 10) : 0));
    const [searchCompleted, setSearchCompleted] = useState(() => (typeof window !== 'undefined' ? sessionStorage.getItem('searchCompleted') === 'true' : false));
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [hasLoadedSessionStorage, setHasLoadedSessionStorage] = useState(false);

    const isAnyPlatformConnected = Object.values(connectedPlatforms).some(connected => connected);
    const hasMoreVacancies = visibleVacancies.length < allVacancies.length;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedConnectedPlatforms = sessionStorage.getItem('connectedPlatforms');
            if (storedConnectedPlatforms) {
                setConnectedPlatforms(JSON.parse(storedConnectedPlatforms));
            }
            const storedAllVacancies = sessionStorage.getItem('allVacancies');
            if (storedAllVacancies) {
                setAllVacancies(JSON.parse(storedAllVacancies));
            }
            const storedSeenVacancies = sessionStorage.getItem('seenVacancies');
            if (storedSeenVacancies) {
                try {
                    setSeenVacancies(new Set(JSON.parse(storedSeenVacancies)));
                } catch (error) {
                    console.error("Error parsing seenVacancies from sessionStorage:", error);
                }
            }
            const storedVacanciesToShow = sessionStorage.getItem('vacanciesToShow');
            if (storedVacanciesToShow) {
                setVacanciesToShow(parseInt(storedVacanciesToShow, 10));
            }
            const storedSearchMessage = sessionStorage.getItem('searchMessage');
            if (storedSearchMessage) {
                setSearchMessage(storedSearchMessage);
            }
            const storedResultsVisible = sessionStorage.getItem('resultsVisible');
            if (storedResultsVisible) {
                setResultsVisible(storedResultsVisible === 'true');
            }
            const storedLinkedinVacanciesCount = sessionStorage.getItem('linkedinVacanciesCount');
            if (storedLinkedinVacanciesCount) {
                setLinkedinVacanciesCount(parseInt(storedLinkedinVacanciesCount, 10));
            }
            const storedGetOnBoardVacanciesCount = sessionStorage.getItem('getOnBoardVacanciesCount');
            if (storedGetOnBoardVacanciesCount) {
                setGetOnBoardVacanciesCount(parseInt(storedGetOnBoardVacanciesCount, 10));
            }
            const storedAdzunaJobsVacanciesCount = sessionStorage.getItem('adzunaJobsVacanciesCount');
            if (storedAdzunaJobsVacanciesCount) {
                setAdzunaJobsVacanciesCount(parseInt(storedAdzunaJobsVacanciesCount, 10));
            }
            const storedSearchCompleted = sessionStorage.getItem('searchCompleted');
            if (storedSearchCompleted) {
                setSearchCompleted(storedSearchCompleted === 'true');
            }
            setHasLoadedSessionStorage(true);
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('connectedPlatforms', JSON.stringify(connectedPlatforms));
            sessionStorage.setItem('allVacancies', JSON.stringify(allVacancies));
            sessionStorage.setItem('visibleVacancies', JSON.stringify(visibleVacancies));
            sessionStorage.setItem('seenVacancies', JSON.stringify(Array.from(seenVacancies)));
            sessionStorage.setItem('vacanciesToShow', vacanciesToShow.toString());
            sessionStorage.setItem('searchMessage', searchMessage);
            sessionStorage.setItem('resultsVisible', resultsVisible.toString());
            sessionStorage.setItem('linkedinVacanciesCount', linkedinVacanciesCount.toString());
            sessionStorage.setItem('getOnBoardVacanciesCount', getOnBoardVacanciesCount.toString());
            sessionStorage.setItem('adzunaJobsVacanciesCount', adzunaJobsVacanciesCount.toString());
            sessionStorage.setItem('searchCompleted', searchCompleted.toString());
            sessionStorage.setItem('linkedinToken', linkedinToken || '');
        }
    }, [connectedPlatforms, allVacancies, visibleVacancies, seenVacancies, vacanciesToShow, searchMessage, resultsVisible, linkedinVacanciesCount, getOnBoardVacanciesCount, adzunaJobsVacanciesCount, searchCompleted, linkedinToken]);

    const handleConnectPlatform = async (platformName, authUrl) => {
        console.log('handleConnectPlatform llamada:', { platformName, authUrl, currentConnectedPlatforms: connectedPlatforms });
        if (platformName === 'LinkedIn') {
            if (connectedPlatforms['LinkedIn']) {
                setConnectedPlatforms(prev => ({ ...prev, [platformName]: false }));
                setLinkedinToken(null);
                sessionStorage.removeItem('linkedinToken');
                console.log('LinkedIn desconectado exitosamente (solo frontend).');
            } else {
                window.location.href = authUrl;
            }
        } else if (platformName === 'GetOnBoard') {
            setConnectedPlatforms(prev => ({ ...prev, [platformName]: !prev[platformName] }));
        } else if (platformName === 'Adzuna Jobs') {
            setConnectedPlatforms(prev => ({ ...prev, [platformName]: !prev[platformName] }));
        }
    };

    useEffect(() => {
        const linkedinCode = searchParams.get('code');
        const accessTokenFromCallback = searchParams.get('access_token');
        const getonboardConnectedParam = searchParams.get('getonboard_connected');

        console.log('useEffect de conexión activado:', { linkedinCode, accessTokenFromCallback, getonboardConnectedParam });
        console.log('Estado de connectedPlatforms antes de la actualización:', connectedPlatforms);

        if (accessTokenFromCallback) {
            setLinkedinToken(accessTokenFromCallback);
            sessionStorage.setItem('linkedinToken', accessTokenFromCallback);
            setConnectedPlatforms(prev => ({ ...prev, LinkedIn: true }));
            console.log('LinkedIn conectado y token guardado desde la URL.');
            router.replace('/'); // Limpiar los parámetros de la URL
        } else if (linkedinCode) {
            fetch('/api/auth/linkedin/callback', {
                method: 'GET',
            })
            .then(response => {
                if (response.redirected) {
                    return;
                }
                return response.json();
            })
            .then(data => {
                if (data && data.error) {
                    console.error('Error durante el callback de LinkedIn:', data.error);
                    setAlertMessage('Error al autenticar con LinkedIn.');
                    setShowAlert(true);
                    setTimeout(() => setShowAlert(false), 3000);
                }
            })
            .catch(error => {
                console.error('Error al comunicarse con el backend para el callback de LinkedIn:', error);
                setAlertMessage('Error al conectar con LinkedIn.');
                setShowAlert(true);
                setTimeout(() => setShowAlert(false), 3000);
            });
        }

        if (getonboardConnectedParam === 'true') {
            setConnectedPlatforms(prev => ({ ...prev, GetOnBoard: true }));
            console.log('GetOnBoard conectado por parámetro URL.');
            router.replace('/'); // Limpiar los parámetros de la URL
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, router]);


    const searchAdzunaJobs = useCallback(async (keywords, location) => {
        let url = `/api/jobs?keywords=${encodeURIComponent(keywords)}`;
        if (location) {
            url += `&location=${encodeURIComponent(location)}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al buscar vacantes en Adzuna Jobs');
            }
            const data = await response.json();
            console.log('Respuesta de Adzuna Jobs (estructura completa):', data);
            return data?.map(job => ({ // <-- data es ahora el array directamente
                id: job.id,
                title: job.title,
                company: job?.company?.display_name,
                url: job.redirect_url,
                source: 'Adzuna Jobs',
                published_at: job.created,
                daysAgo: job.created ? differenceInDays(new Date(), new Date(job.created)) : null,
            })) || [];
        } catch (error) {
            console.error("Error fetching Adzuna Jobs:", error);
            return [];
        }
    }, []);
    const fetchGetOnBoardVacancies = useCallback(async () => {
        const perPage = 100; // Mantenemos la variable por si luego se soluciona el problema
        let page = 1;
        let allVacancies = [];

        while (true) {
            const url = `https://www.getonbrd.com/api/v0/search/jobs?query=junior&country_code=AR&expand=["company"]&per_page=5&page=${page}`; // Hardcodeamos per_page a 5
            try {
                console.log(`Fetching GetOnBoard URL (page ${page}):`, url);
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                console.log(`GetOnBoard Response Status (page ${page}):`, response.status);
                const responseText = await response.text();
                console.log(`GetOnBoard Response Text (page ${page}):`, responseText);

                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = JSON.parse(responseText);
                    } catch (e) {
                        errorData = responseText;
                    }
                    console.error(`Error al buscar vacantes en GetOnBoard (página ${page}):`, errorData);
                    break;
                }

                const data = JSON.parse(responseText);
                console.log('Respuesta de GetOnBoard (estructura completa):', data);
                const onboardVacanciesData = data?.data || [];
                console.log('onboardVacanciesData:', onboardVacanciesData);
                if (onboardVacanciesData.length === 0) {
                    break;
                }
                onboardVacanciesData.forEach(job => {
                    console.log('Objeto job de GetOnBoard:', job);
                });
                allVacancies = allVacancies.concat(onboardVacanciesData.map(job => ({
                    id: job.id,
                    title: job.attributes.title,
                    company: job.attributes.company?.data?.attributes?.name || 'Nombre de empresa no disponible',
                    url: `https://www.getonbrd.com/jobs/${job.id}`,
                    source: 'GetOnBoard',
                    published_at: job.attributes.published_at,
                })));
                page++;
                // if (page > 10) break;
            } catch (error) {
                console.error('Error al buscar vacantes en GetOnBoard (catch):', error);
                return [];
            }
        }
        setGetOnBoardVacanciesCount(allVacancies.length);
        return allVacancies;
    }, []);
    const fetchLinkedInVacancies = useCallback(async () => {
        try {
            const response = await fetch('/api/search/linkedin-jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${linkedinToken}`,
                },
                body: JSON.stringify({ location: "Argentina" }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al buscar vacantes en LinkedIn');
            }
            const data = await response.json();
            const linkedinVacancies = data?.vacancies || [];
            setLinkedinVacanciesCount(linkedinVacancies.length);
            return linkedinVacancies.map(vacancy => ({
                ...vacancy,
                source: 'LinkedIn',
                published_at: vacancy.published_at,
                daysAgo: vacancy.published_at ? differenceInDays(new Date(), new Date(vacancy.published_at)) : null,
            }));
        } catch (error) {
            console.error('Error al buscar vacantes en LinkedIn:', error);
            return [];
        }
    }, [linkedinToken]);

    const handleSearchVacancies = useCallback(async () => {
        console.log('handleSearchVacancies llamada');
        if (!isAnyPlatformConnected && !searching) {
            setAlertMessage('¡Ups! Conecta al menos una plataforma para buscar empleos.');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        if (connectedPlatforms['LinkedIn'] && !linkedinToken) {
            setAlertMessage('¡Ups! Autentícate con LinkedIn para buscar empleos.');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 3000);
            return;
        }

        console.log('Botón de Buscar Vacantes clickeado');
        setSearchMessage('Buscando vacantes...');
        setSearching(true);
        setAllVacancies([]);
        setVisibleVacancies([]);
        setVacanciesToShow(20);
        setResultsVisible(false);
        setLinkedinVacanciesCount(0);
        setGetOnBoardVacanciesCount(0);
        setAdzunaJobsVacanciesCount(0);
        setSearchCompleted(false);
        setSeenVacancies(new Set());

        const searchPromises = [];

        if (connectedPlatforms['LinkedIn'] && linkedinToken) {
            console.log('LinkedIn está conectado, llamando a la API...');
            const linkedinPromise = fetchLinkedInVacancies();
            searchPromises.push(linkedinPromise);
        }

        if (connectedPlatforms['GetOnBoard']) {
            console.log('GetOnBoard está "conectado", llamando a la API pública...');
            const getOnBoardPromise = fetchGetOnBoardVacancies();
            searchPromises.push(getOnBoardPromise);
        }

        if (connectedPlatforms['Adzuna Jobs']) {
            console.log('Adzuna Jobs está "conectado", llamando a su API...');
            const adzunaJobsPromise = searchAdzunaJobs("junior developer", "")
                .then(data => {
                    console.log('Datos de vacantes de Adzuna Jobs recibidos:', data);
                    setAdzunaJobsVacanciesCount(data.length);
                    return data;
                })
                .catch(error => {
                    console.error('Error al buscar vacantes en Adzuna Jobs:', error);
                    return [];
                });
            searchPromises.push(adzunaJobsPromise);
        }

        console.log('Promesas a resolver:', searchPromises);

        try {
            const allResults = await Promise.all(searchPromises);
            const flattenedResults = allResults.flat();
            console.log('Vacantes combinadas inicialmente:', flattenedResults); // Ya tenías este log
            console.log('Contenido de allResults:', allResults); // Nuevo log
            console.log('Contenido de flattenedResults justo antes del slice:', flattenedResults); // Nuevo log
            setAllVacancies(flattenedResults);
            setVisibleVacancies(flattenedResults.slice(0, vacanciesToShow));
            setResultsVisible(true);


            if (flattenedResults.length > 0) {
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
            setAllVacancies([]);
            setVisibleVacancies([]);
            setLinkedinVacanciesCount(0);
            setGetOnBoardVacanciesCount(0);
            setAdzunaJobsVacanciesCount(0);
            setSearchCompleted(false);
            setSearchMessage('');
        } finally {
            setSearching(false);
            console.log('Búsqueda finalizada');
            setSearchCompleted(true);
        }
    }, [connectedPlatforms, linkedinToken, fetchLinkedInVacancies, fetchGetOnBoardVacancies, searchAdzunaJobs, vacanciesToShow]);

    const loadMoreVacancies = useCallback(() => {
        const nextToShow = vacanciesToShow + 20;
        setVisibleVacancies(allVacancies.slice(0, nextToShow));
        setVacanciesToShow(nextToShow);
    }, [allVacancies, vacanciesToShow]);

    const markVacancyAsSeen = useCallback((id) => {setSeenVacancies(prev => new Set(prev).add(id));
    }, []);

    const handleViewDetails = useCallback((url, id) => {
        markVacancyAsSeen(id);
        window.open(url, '_blank');
    }, [markVacancyAsSeen]);

    const handleClearSearch = useCallback(() => {
        setAllVacancies([]);
        setVisibleVacancies([]);
        setSearchMessage('');
        setResultsVisible(false);
        setLinkedinVacanciesCount(0);
        setGetOnBoardVacanciesCount(0);
        setAdzunaJobsVacanciesCount(0);
        setSearchCompleted(false);
        setSeenVacancies(new Set());
        setVacanciesToShow(20);
    }, []);

    useEffect(() => {
        const linkedinConnected = searchParams.get('linkedin_connected');

        const accessTokenFromCallback = searchParams.get('access_token');
        const getonboardConnectedParam = searchParams.get('getonboard_connected');


        console.log('useEffect de conexión activado:', { linkedinConnected, accessTokenFromCallback, getonboardConnectedParam });
        console.log('Estado de connectedPlatforms antes de la actualización:', connectedPlatforms);

        if (accessTokenFromCallback) {
            setLinkedinToken(accessTokenFromCallback);
            sessionStorage.setItem('linkedinToken', accessTokenFromCallback);
            setConnectedPlatforms(prev => ({ ...prev, LinkedIn: true }));
            console.log('LinkedIn conectado y token guardado desde la URL.');
            router.replace('/'); // Limpiar los parámetros de la URL
        } else if (linkedinConnected === 'true') {
            setConnectedPlatforms(prev => ({ ...prev, LinkedIn: true }));
            console.log('LinkedIn marcado como conectado por parámetro URL (sin token).');
            // No necesitamos el token aquí, solo marcamos como conectado para la UI.
            // La búsqueda fallará si no hay token en sessionStorage.
        }

        if (getonboardConnectedParam === 'true') {
            setConnectedPlatforms(prev => ({ ...prev, GetOnBoard: true }));
            console.log('GetOnBoard conectado por parámetro URL.');
            router.replace('/'); // Limpiar los parámetros de la URL
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, router]);

    useEffect(() => {
        if (searchCompleted) {
            let message = '';
            if (linkedinVacanciesCount > 0 || getOnBoardVacanciesCount > 0 || adzunaJobsVacanciesCount > 0) {
                const linkedinMessage = linkedinVacanciesCount > 0 ? `LinkedIn(${linkedinVacanciesCount})` : '';
                const getOnBoardMessage = getOnBoardVacanciesCount > 0 ? `GetOnBoard(${getOnBoardVacanciesCount})` : '';
                const adzunaJobsMessage = adzunaJobsVacanciesCount > 0 ? `Adzuna Jobs(${adzunaJobsVacanciesCount})` : '';
                const conjunction1 = linkedinVacanciesCount > 0 && (getOnBoardVacanciesCount > 0 || adzunaJobsVacanciesCount > 0) ? ' , ' : '';
                const conjunction2 = getOnBoardVacanciesCount > 0 && adzunaJobsVacanciesCount > 0 ? ' , ' : '';
                message = `${linkedinMessage}${conjunction1}${getOnBoardMessage}${conjunction2}${adzunaJobsMessage}`;
            } else if (isAnyPlatformConnected) {
                message = 'No se encontraron ofertas de empleo para juniors con los criterios actuales.';
            } else {
                message = 'Por favor, conecta al menos una plataforma antes de buscar.';
            }
            setSearchMessage(message);
        }
    }, [searchCompleted, linkedinVacanciesCount, getOnBoardVacanciesCount, adzunaJobsVacanciesCount, connectedPlatforms, isAnyPlatformConnected]);

    console.log('connectedPlatforms al renderizar:', connectedPlatforms);
    console.log('isAnyPlatformConnected al renderizar:', isAnyPlatformConnected);
    console.log('linkedinToken al renderizar:', linkedinToken);

    const vacancyList = visibleVacancies.map((vacancy) => (
        <li key={vacancy.id} className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition duration-300">
            <h3 className="text-xl font-semibold text-blue-700 mb-2">{vacancy.title}</h3>
            <p className="text-gray-700 mb-2"><span className="font-semibold">Empresa:</span> {vacancy.company}</p>
            <p className="text-gray-700 mb-2"><span className="font-semibold">Fuente:</span> {vacancy.source}</p>
            {vacancy.published_at && vacancy.source === 'LinkedIn' && (
                <p className="text-gray-700 mb-2">
                    <span className="font-semibold">Publicado hace:</span> {vacancy.daysAgo !== null ? `${vacancy.daysAgo} día${vacancy.daysAgo !== 1 ? 's' : ''}` : 'Fecha no disponible'}
                </p>
            )}
            {vacancy.published_at && vacancy.source === 'GetOnBoard' && (
                <p className="text-gray-700 mb-2">
                    <span className="font-semibold">Publicado en:</span> {new Date(vacancy.published_at).toLocaleDateString()}
                </p>
            )}
            {vacancy.published_at && vacancy.source === 'Adzuna Jobs' && (
                <p className="text-gray-700 mb-2">
                    <span className="font-semibold">Publicado en:</span> {new Date(vacancy.published_at).toLocaleDateString()}
                </p>
            )}
            <div className="flex items-center justify-between mt-4">
                <button onClick={() => handleViewDetails(vacancy.url, vacancy.id)} className="text-blue-500 hover:underline font-semibold focus:outline-none">
                    Ver detalles <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </button>

                {seenVacancies.has(vacancy.id) && <span className="text-green-500 font-semibold">Visto</span>}
            </div>
        </li>
    ));

    console.log('visibleVacancies al renderizar:', visibleVacancies); // LOG #3

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
                                {!connectedPlatforms[platform.name] && platform.name === 'LinkedIn' && (
                                    <span className="text-xs font-normal mt-1">(Requiere autenticación)</span>
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
                            <div
                                className={`sm:absolute sm:top-full sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:mt-2 sm:max-w-md bg-red-500 text-white px-6 rounded-md shadow-lg z-50 text-center sm:py-3
                                    fixed bottom-6 left-0 w-full rounded-t-md py-2 ${alertMessage.length > 0 ? 'min-h-[60px] sm:min-h-0' : ''}
                                `}
                                style={{ minHeight: alertMessage.length > 0 && window.innerWidth >= 640 ? '60px' : undefined }}
                            >
                                {alertMessage}
                            </div>
                        )}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-indigo-900 to-transparent z-0" />
            </header>

            {hasLoadedSessionStorage && resultsVisible && (
                <div ref={resultsRef} className="py-12" style={{ background: 'linear-gradient(to bottom right, #0d47a1, #3f51b5)' }}>
                    <div className="container mx-auto">
                        <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                            Ofertas de Empleo para Juniors
                            {searchMessage && <span className="ml-2 font-normal">({searchMessage})</span>}
                        </h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {vacancyList}
                        </ul>
                        {hasMoreVacancies && (
                            <div className="flex justify-center mt-8">
                                <button onClick={loadMoreVacancies} className="bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-8 rounded-full transition duration-300 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400" disabled={searching}>
                                    Ver más ofertas ({allVacancies.length - visibleVacancies.length} restantes)
                                </button>
                            </div>
                        )}
                        {allVacancies.length > 0 && (
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={handleClearSearch}
                                    className="bg-red-500 hover:bg-red-600 text-white py-3 px-8 rounded-full transition duration-300 font-semibold focus:outline-none focus:ring-2 focus:ring-red-400"
                                    disabled={searching}
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