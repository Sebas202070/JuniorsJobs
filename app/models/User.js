// src/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // Otros campos de tu modelo de usuario (por ejemplo, nombre, email, etc.)
  linkedinAccessToken: String,
  linkedinRefreshToken: String, // Si LinkedIn proporciona un refresh token (lo verificaremos)
  linkedinUserId: String,       // ID del usuario en LinkedIn (opcional, para referencia)
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;