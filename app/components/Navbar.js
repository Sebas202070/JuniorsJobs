// src/components/Navbar.js
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiSearch } from 'react-icons/fi'; // Importa el icono de lupa de React Icons

const Navbar = ({ logoSrc }) => {
  return (
    <nav className="bg-gradient-to-r from-gray-900 to-blue-900 text-white py-4 shadow-md sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link href="/" className="flex items-center font-semibold text-xl tracking-tight">
          {logoSrc && (
            <Image src={logoSrc} alt="Logo de JuniorsJobs" width={40} height={40} className="mr-2 rounded-md overflow-hidden" />
          )}
          <span className="text-blue-300">Juniors</span>
          <span className="text-white flex items-center">
            Jobs <FiSearch className="ml-1 text-blue-300" size={20} /> {/* Agregamos el icono de lupa */}
          </span>
        </Link>
        <div className="space-x-6">
          <Link href="/" className="hover:text-blue-300 transition duration-300">
            Inicio
          </Link>
          <Link href="/search" className="hover:text-blue-300 transition duration-300">
            Buscar
          </Link>
          {/* Agrega aquí más enlaces de navegación si los tienes */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;