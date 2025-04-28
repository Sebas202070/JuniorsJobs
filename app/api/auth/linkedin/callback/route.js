// app/api/auth/[linkedin]/callback/route.js
import { NextResponse } from 'next/server';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`;
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (code) {
        console.log('Código de autorización recibido de LinkedIn:', code);

        try {
            const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code,
                    client_id: LINKEDIN_CLIENT_ID,
                    client_secret: LINKEDIN_CLIENT_SECRET,
                    redirect_uri: LINKEDIN_REDIRECT_URI,
                }),
            });

            const tokenData = await tokenResponse.json();
            console.log('Respuesta del intercambio de tokens de LinkedIn:', tokenData);

            if (tokenData.access_token) {
                console.log('¡Token de acceso de LinkedIn obtenido exitosamente!', tokenData.access_token);
                // Redirigir de vuelta al frontend con el access_token como parámetro
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?linkedin_connected=true&access_token=${tokenData.access_token}`);
            } else {
                console.error('Error al obtener el token de acceso de LinkedIn:', tokenData);
                return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/error?platform=linkedin&error=token_exchange_failed`);
            }
        } catch (error) {
            console.error('Error durante el callback de LinkedIn:', error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/error?platform=linkedin&error=callback_error`);
        }
    } else {
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        console.error('Error de autorización de LinkedIn:', error, errorDescription);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/error?platform=linkedin&error=${error}&description=${errorDescription}`);
    }
}