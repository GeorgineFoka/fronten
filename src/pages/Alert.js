import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const Alert = ({ type, message, onClose }) => {
  const getAlertStyles = (alertType) => {
    switch(alertType) {
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  
  const getAlertIcon = (alertType) => {
    switch(alertType) {
      case 'error': return <AlertCircle className="text-red-500" size={20} />;
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };
  
  return (
    <div className={`border rounded-lg p-4 mb-6 ${getAlertStyles(type)} flex items-start justify-between`}>
      <div className="flex items-start gap-3">
        {getAlertIcon(type)}
        <div>
          <p className="font-medium">{type === 'error' ? 'Erreur' : type === 'success' ? 'Succès' : 'Information'}</p>
          <p className="text-sm mt-1">{message}</p>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 ml-4">
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default Alert;