// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-blue-700">404</h1>
      <p className="text-gray-600 mb-6 text-lg">Oops! Page not found.</p>
      
      <Link 
        to="/" 
        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Go Back Home
      </Link>
    </div>
  );
}

export default NotFound;
