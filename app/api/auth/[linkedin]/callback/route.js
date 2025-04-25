// app/api/auth/[linkedin]/callback/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/app/models/User';


const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`;
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/me';

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI); // Asegúrate de tener MONGODB_URI en tu .env
    console.log('Database connected!');
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

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

        // Conectar a la base de datos
        await connectDatabase();

        const userId = "680a87f6b41b2c83e7323f23"; // ¡REEMPLAZA CON EL ID REAL DEL USUARIO!

        try {
          const user = await User.findById(userId);

          if (user) {
            user.linkedinAccessToken = tokenData.access_token;
            if (tokenData.refresh_token) {
              user.linkedinRefreshToken = tokenData.refresh_token;
            }

            // Opcional: Obtener el ID de LinkedIn del usuario y guardarlo
            const profileResponse = await fetch(LINKEDIN_PROFILE_URL, {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
              },
            });
            const profileData = await profileResponse.json();
            user.linkedinUserId = profileData.id;

            await user.save();
            console.log('Token de acceso de LinkedIn guardado para el usuario:', userId);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?linkedin_connected=true`);
          } else {
            console.error('Usuario no encontrado:', userId);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/error?platform=linkedin&error=user_not_found`);
          }
        } catch (databaseError) {
          console.error('Error al interactuar con la base de datos:', databaseError);
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/error?platform=linkedin&error=database_error`);
        }
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