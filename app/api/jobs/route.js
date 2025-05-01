
// app/api/jobs/route.js
import { NextResponse } from 'next/server';

const appId = process.env.ADZUNA_APP_ID;
const appKey = process.env.ADZUNA_APP_KEY;
const countryCode = 'us';
const defaultLocationUS = 'United States'; // Definimos el valor por defecto

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords') || 'junior developer';
    const location = searchParams.get('location');
    const maxResults = 50;

    if (!appId || !appKey) {
        console.error('ADZUNA_APP_ID or ADZUNA_APP_KEY are not set in environment variables.');
        return NextResponse.json({ error: 'API credentials not configured' }, { status: 500 });
    }

    let url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?app_id=${appId}&app_key=${appKey}&what=${encodeURIComponent(keywords)}&content-type=application/json&results_per_page=${maxResults}`;

    if (location && location !== defaultLocationUS && location !== '') { // Añadir 'where' solo si es diferente del valor por defecto y no está vacío
        url += `&where=${encodeURIComponent(location)}`;
    }

    console.log('Fetching from Adzuna Jobs API:', url);
    console.log('Adzuna API Request Parameters:', { countryCode, keywords, location, maxResults });

    try {
        const response = await fetch(url);
        console.log('Adzuna API Response Status:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Adzuna Jobs API Error (Text):', errorText);
            return NextResponse.json({ error: `Adzuna API Error: ${response.status} - ${errorText.substring(0, 200)}...` }, { status: response.status });
        }
        const data = await response.json();
        console.log('Adzuna API Raw Response Data:', data);
        return NextResponse.json(data.results || []);
    } catch (error) {
        console.error("Error fetching from Adzuna Jobs API:", error);
        return NextResponse.json({ error: 'Failed to fetch from Adzuna Jobs API' }, { status: 500 });
    }
}