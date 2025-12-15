import React from 'react';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
    </div>
    <p className="mt-4 text-gray-600">Chargement des données...</p>
  </div>
);

export default LoadingSpinner;