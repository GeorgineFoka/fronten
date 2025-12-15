import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusColor = (stat) => {
    switch(stat) {
      case 'chef_departement': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (stat) => {
    switch(stat) {
      case 'chef_departement': return 'Chef de Département';
      case 'admin': return 'Administrateur';
      default: return 'Utilisateur';
    }
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
};

export default StatusBadge;