import { NextResponse } from 'next/server';

const LINKEDIN_CLIENT_ID_ENV = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_REDIRECT_URI_ENV = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`;
const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';

console.log('Valor de LINKEDIN_CLIENT_ID desde .env:', LINKEDIN_CLIENT_ID_ENV);
console.log('Valor de NEXT_PUBLIC_APP_URL desde .env:', process.env.NEXT_PUBLIC_APP_URL);
console.log('Valor de LINKEDIN_REDIRECT_URI construido:', LINKEDIN_REDIRECT_URI_ENV);

export async function GET(request) {
  const authURL = `${LINKEDIN_AUTH_URL}?response_type=code&client_id=${LINKEDIN_CLIENT_ID_ENV}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI_ENV)}&scope=openid%20profile%20email%20w_member_social`;
  console.log('URL de autorización de LinkedIn generada:', authURL);
  return NextResponse.redirect(authURL);
}