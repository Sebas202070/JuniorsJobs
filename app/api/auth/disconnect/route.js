// app/api/auth/linkedin/disconnect/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/app/models/User';
// Importa tu función para obtener la sesión del usuario
// import { getServerSession } from 'next-auth'; // Ejemplo para next-auth

async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Database connected for disconnect!');
    } catch (error) {
        console.error('Database connection error (disconnect):', error);
        return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
}

export async function POST(request) {
    await connectDatabase();

    try {
        // Obtener el userId del usuario autenticado
        // Esto dependerá de tu sistema de autenticación
        // Ejemplo con next-auth:
        // const session = await getServerSession();
        // const userId = session?.user?.id;
        // ¡REEMPLAZA CON TU LÓGICA REAL PARA OBTENER EL USER ID!
        const userId = "680a87f6b41b2c83e7323f23"; // ¡RECUERDA HACER ESTO DINÁMICO!

        if (!userId) {
            console.error('Usuario no autenticado para desconectar LinkedIn.');
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const user = await User.findById(userId);

        if (!user) {
            console.error('Usuario no encontrado para desconectar LinkedIn:', userId);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        user.linkedinAccessToken = undefined;
        user.linkedinRefreshToken = undefined;
        await user.save();

        console.log('Token de acceso de LinkedIn eliminado para el usuario:', userId);
        return NextResponse.json({ message: 'LinkedIn disconnected successfully' }, { status: 200 });

    } catch (error) {
        console.error('Error al desconectar LinkedIn:', error);
        return NextResponse.json({ error: 'Failed to disconnect LinkedIn' }, { status: 500 });
    }
}