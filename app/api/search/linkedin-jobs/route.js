// app/api/search/linkedin-jobs/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/app/models/User';
const { parse } = require('node-html-parser');

const LINKEDIN_JOBS_API_URL = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';
const MAX_LINKEDIN_RESULTS = 100; // Límite máximo de resultados a obtener

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
    console.log('Búsqueda de empleos en LinkedIn iniciada sin límite (hasta ${MAX_LINKEDIN_RESULTS}) en ubicación:', location);

    const userId = "680a87f6b41b2c83e7323f23";
    console.log('Buscando token para el usuario ID:', userId);

    try {
        const connection = await connectDatabase();
        if (!connection) {
            console.error('Error: No se pudo obtener la conexión a la base de datos para la búsqueda de empleos en LinkedIn.');
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
        const count = 100;
        let start = 0;
        let allVacancies = [];

        while (allVacancies.length < MAX_LINKEDIN_RESULTS) {
            const apiUrl = `${LINKEDIN_JOBS_API_URL}?keywords=${encodeURIComponent(keywords)}&location=${encodedLocation}&start=${start}&count=${count}`;
            console.log('URL de la API de LinkedIn Jobs (página ${start / count + 1}):', apiUrl);

            const response = await fetch(apiUrl, {
                headers: {
                    'X-Restli-Protocol-Version': '2.0.0',
                },
            });

            console.log('Respuesta de la API de LinkedIn Jobs (status):', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error fetching jobs from LinkedIn API (página ${start / count + 1}):', errorText);
                break; // Detener en caso de error
            }

            const html = await response.text();
            const root = parse(html);
            const jobCardListItems = root.querySelectorAll('div.base-card.base-search-card.base-search-card--link.job-search-card');
            console.log('Número de elementos div.base-card... encontrados en la página ${start / count + 1}:', jobCardListItems.length);

            if (jobCardListItems.length === 0) {
                console.log('No se encontraron más vacantes en LinkedIn.');
                break; // Detener si no hay más resultados
            }

            jobCardListItems.forEach(item => {
                const cardLinkElement = item.querySelector('a.base-card__full-link');
                const url = cardLinkElement ? cardLinkElement.getAttribute('href') : null;
                const titleElement = item.querySelector('h3.base-search-card__title');
                const title = titleElement ? titleElement.textContent.trim() : 'No Title';
                const companyElement = item.querySelector('h4.base-search-card__subtitle a.hidden-nested-link');
                const company = companyElement ? companyElement.textContent.trim() : 'No Company';
                const locationElement = item.querySelector('span.job-search-card__location');
                const location = locationElement ? locationElement.textContent.trim() : 'No Location';

                if (url) {
                    const jobIdMatch = url.match(/\/jobs\/view\/(\d+)/);
                    const jobId = jobIdMatch ? jobIdMatch[1] : `guest-${allVacancies.length}`;
                    allVacancies.push({
                        id: jobId,
                        title,
                        company,
                        location,
                        url: url.split('?')[0],
                        source: 'LinkedIn',
                    });
                }
            });

            start += count;

            // Opcional: agregar un pequeño retraso entre peticiones para no sobrecargar la API
            // await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Vacantes totales procesadas de LinkedIn:', allVacancies.length);
        return NextResponse.json({ vacancies: allVacancies });

    } catch (error) {
        console.error('Error durante la búsqueda de empleos en LinkedIn (sin límite):', error);
        return NextResponse.json({ error: 'Internal server error during LinkedIn job search', details: error.message }, { status: 500 });
    }
}