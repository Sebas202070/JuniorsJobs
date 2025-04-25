// app/api/search/linkedin-jobs/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/app/models/User';
const { parse } = require('node-html-parser'); // Importa node-html-parser
const LINKEDIN_JOBS_API_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

async function connectDatabase() {
  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Database connected for job search!');
    } else {
      console.log('Database already connected for job search!');
    }
    return mongoose.connection;
  } catch (error) {
    console.error('Database connection error during job search:', error);
    return null;
  }
}

export async function POST(request) {
  const { location } = await request.json();
  console.log('Búsqueda de empleos iniciada con ubicación:', location);

  const userId = "680a87f6b41b2c83e7323f23";
  console.log('Buscando token para el usuario ID:', userId);

  try {
    const connection = await connectDatabase();
    if (!connection) {
      console.error('Error: No se pudo obtener la conexión a la base de datos para la búsqueda de empleos.');
      return NextResponse.json({ error: 'Failed to connect to database' }, { status: 500 });
    }

    const user = await User.findById(userId);
    console.log('Usuario encontrado:', user);

    if (!user || !user.linkedinAccessToken) {
      console.error('Error: Cuenta de LinkedIn no conectada o falta el token de acceso para el usuario:', userId);
      return NextResponse.json({ error: 'LinkedIn account not connected or access token missing' }, { status: 401 });
    }

    const accessToken = user.linkedinAccessToken;
    const keywords = 'junior developer';
    const encodedLocation = encodeURIComponent(location || 'Argentina');
    const count = 10;
    const start = 0;

    const apiUrl = `${LINKEDIN_JOBS_API_URL}?keywords=${encodeURIComponent(keywords)}&location=${encodedLocation}&start=${start}&count=${count}`;
    console.log('URL de la API de LinkedIn Jobs:', apiUrl);
    console.log('Token de acceso utilizado:', accessToken ? '********' + accessToken.slice(-5) : 'No token');

    const response = await fetch(apiUrl, {
      headers: {
        // Authorization: `Bearer ${accessToken}`, // Likely not needed for this guest endpoint
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    console.log('Respuesta de la API de LinkedIn Jobs (status):', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching jobs from LinkedIn API:', errorText);
      return NextResponse.json({ error: 'Failed to fetch jobs from LinkedIn API', details: errorText }, { status: response.status });
    }

    const html = await response.text();
    console.log('HTML recibido de la API:', html)
    const root = parse(html); // Usa node-html-parser para parsear el HTML
    console.log('Tipo de root:', typeof root);
    console.log('Propiedades de root (algunas):', Object.keys(root).slice(0, 20)); // Muestra las primeras 20 propiedades
    const vacancies = [];
    const allLiElements = root.querySelectorAll('li');
    console.log('Número total de elementos li encontrados:', allLiElements.length);
    const jobCardListItems = root.querySelectorAll('div.base-card.base-search-card.base-search-card--link.job-search-card');
    console.log('Número de elementos div.base-card.base-search-card... encontrados:', jobCardListItems.length);

    jobCardListItems.forEach((item, index) => {
      console.log(`--- Procesando elemento div (${index + 1}) ---`);
      console.log('Contenido HTML del item:', item.outerHTML.substring(0, 200)); // Mostrar los primeros 200 caracteres del HTML del item

      const cardLinkElement = item.querySelector('a.base-card__full-link');
      console.log('cardLinkElement:', cardLinkElement ? 'Encontrado' : 'No encontrado');
      const url = cardLinkElement ? cardLinkElement.getAttribute('href') : null;
      console.log('URL:', url);

      const titleElement = item.querySelector('h3.base-search-card__title');
      console.log('titleElement:', titleElement ? 'Encontrado' : 'No encontrado');
      const title = titleElement ? titleElement.textContent.trim() : 'No Title';
      console.log('Título:', title);

      const companyElement = item.querySelector('h4.base-search-card__subtitle a.hidden-nested-link');
      console.log('companyElement:', companyElement ? 'Encontrado' : 'No encontrado');
      const company = companyElement ? companyElement.textContent.trim() : 'No Company';
      console.log('Empresa:', company);

      const locationElement = item.querySelector('span.job-search-card__location');
      console.log('locationElement:', locationElement ? 'Encontrado' : 'No encontrado');
      const location = locationElement ? locationElement.textContent.trim() : 'No Location';
      console.log('Ubicación:', location);

      if (url) {
        const jobIdMatch = url.match(/\/jobs\/view\/(\d+)/);
        const jobId = jobIdMatch ? jobIdMatch[1] : `guest-${vacancies.length}`;
        vacancies.push({
          id: jobId,
          title,
          company,
          location,
          url: url.split('?')[0],
          source: 'LinkedIn',
        });
        console.log('Vacante agregada al array:', vacancies[vacancies.length - 1]);
      } else {
        console.log('No se encontró URL para esta vacante.');
      }
    });

    console.log('Vacantes procesadas (con node-html-parser):', vacancies);
    return NextResponse.json({ vacancies });

  } catch (error) {
    console.error('Error durante la búsqueda de empleos en LinkedIn:', error);
    return NextResponse.json({ error: 'Internal server error during LinkedIn job search', details: error.message }, { status: 500 });
  }
}