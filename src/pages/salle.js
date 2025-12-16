import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Building, Users, Briefcase, Search, Lock, MoreVertical, Eye, Download, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;


// Composant StatCard (Rendu responsive)
const StatCard = ({ icon: Icon, title, value, color, bgColor }) => (
  <div className={`${bgColor} rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200`}> {/* Padding ajusté */}
    <div className="flex items-start justify-between"> {/* Alignement ajusté */}
      <div>
        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</p>
      </div>
      <div className={`${color} p-2 sm:p-3 rounded-lg flex-shrink-0`}> {/* Taille du cercle ajustée */}
        <Icon size={20} className='sm:h-6 sm:w-6' />
      </div>
    </div>
  </div>
);

export default function Salle({ 
  salles = [], 
  filieres = [], 
  bureaux = [], 
  isChefDepartement = false, 
  isAdmin = false, 
  fetchSalles = () => {}, 
  getAuthHeaders = () => ({ 'Content-Type': 'application/json' }), 
  handleAuthError = () => false,
  setError = () => {},
  setSuccess = () => {}
}) {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSalle, setCurrentSalle] = useState({
    id: null,
    nom: '',
    capacite: '',
    batiment: '',
    description: '',
    assignationType: 'filiere',
    filiere_id: '',
    bureau_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedSalle, setSelectedSalle] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Nouveaux états pour les erreurs de champs
  const [fieldErrors, setFieldErrors] = useState({
    nom: '',
    capacite: '',
    batiment: '',
    filiere_id: '',
    bureau_id: ''
  });

  const createSalle = async (salle) => {
    try {
      const response = await fetch(`${API_URL}/salles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(salle)
      });
      if (handleAuthError(response)) return false;

      if (response.ok) {
        setSuccess('Salle créée avec succès');
        await fetchSalles();
        return true;
      }
      const errData = await response.json();
      handleServerError(errData.error);
      return false;
    } catch (err) {
      setError('Erreur de connexion au serveur');
      return false;
    }
  };

  const updateSalle = async (id, salle) => {
    try {
      const response = await fetch(`${API_URL}/salles/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(salle)
      });
      if (handleAuthError(response)) return false;

      if (response.ok) {
        setSuccess('Salle mise à jour avec succès');
        await fetchSalles();
        return true;
      }
      const errData = await response.json();
      handleServerError(errData.error);
      return false;
    } catch (err) {
      setError('Erreur de connexion au serveur');
      return false;
    }
  };

  const deleteSalle = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) return;
    
    try {
      const response = await fetch(`${API_URL}/salles/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(''),
      });
      if (handleAuthError(response)) return;

      if (response.ok) {
        setSuccess('Salle supprimée avec succès');
        await fetchSalles();
      } else {
        const errData = await response.json();
        setError(errData.error || 'Erreur de suppression');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  // Fonction pour gérer les erreurs du serveur et les afficher dans les champs appropriés
  const handleServerError = (errorMessage) => {
    const newErrors = {
      nom: '',
      capacite: '',
      batiment: '',
      filiere_id: '',
      bureau_id: ''
    };

    // Vérifier les différents types d'erreurs
    if (errorMessage.includes('Nom') || errorMessage.includes('nom') || errorMessage.includes('UNIQUE constraint failed: salles.nom')) {
      newErrors.nom = errorMessage.includes('UNIQUE') ? 'Une salle avec ce nom existe déjà' : errorMessage;
    } else if (errorMessage.includes('capacité')) {
      newErrors.capacite = errorMessage;
    } else if (errorMessage.includes('bâtiment')) {
      newErrors.batiment = errorMessage;
    } else if (errorMessage.includes('filière')) {
      newErrors.filiere_id = errorMessage;
    } else if (errorMessage.includes('bureau')) {
      newErrors.bureau_id = errorMessage;
    } else if (errorMessage.includes('assignée')) {
      // Si c'est une erreur d'assignation, afficher dans le champ approprié
      if (currentSalle.assignationType === 'filiere') {
        newErrors.filiere_id = errorMessage;
      } else {
        newErrors.bureau_id = errorMessage;
      }
    } else {
      // Erreur générale
      setError(errorMessage);
    }

    setFieldErrors(newErrors);
  };

  const resetForm = () => {
    setCurrentSalle({
      id: null,
      nom: '',
      capacite: '',
      batiment: '',
      description: '',
      assignationType: 'filiere',
      filiere_id: '',
      bureau_id: ''
    });
    setEditMode(false);
    setFieldErrors({
      nom: '',
      capacite: '',
      batiment: '',
      filiere_id: '',
      bureau_id: ''
    });
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  // Validation locale avant soumission
  const validateForm = () => {
    const newErrors = {
      nom: '',
      capacite: '',
      batiment: '',
      filiere_id: '',
      bureau_id: ''
    };
    
    let isValid = true;

    if (!currentSalle.nom.trim()) {
      newErrors.nom = 'Le nom de la salle est requis';
      isValid = false;
    }

    if (!currentSalle.capacite || currentSalle.capacite <= 0) {
      newErrors.capacite = 'La capacité doit être supérieure à 0';
      isValid = false;
    }

    if (!currentSalle.batiment.trim()) {
      newErrors.batiment = 'Le bâtiment est requis';
      isValid = false;
    }

    const hasFiliere = currentSalle.assignationType === 'filiere' && currentSalle.filiere_id;
    const hasBureau = currentSalle.assignationType === 'bureau' && currentSalle.bureau_id;
    
    if (!hasFiliere && !hasBureau) {
      if (currentSalle.assignationType === 'filiere') {
        newErrors.filiere_id = 'Veuillez sélectionner une filière';
      } else {
        newErrors.bureau_id = 'Veuillez sélectionner un bureau';
      }
      isValid = false;
    }

    setFieldErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!isChefDepartement && !isAdmin) {
      setError("Action non autorisée. Seul le Chef de Département ou l'Admin peut modifier les salles.");
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    const salleData = {
      nom: currentSalle.nom.trim(),
      capacite: parseInt(currentSalle.capacite),
      batiment: currentSalle.batiment.trim(),
      description: currentSalle.description.trim() || null,
      filiere_id: currentSalle.assignationType === 'filiere' ? parseInt(currentSalle.filiere_id) : null,
      bureau_id: currentSalle.assignationType === 'bureau' ? parseInt(currentSalle.bureau_id) : null
    };

    let success;
    if (editMode) {
      success = await updateSalle(currentSalle.id, salleData);
    } else {
      success = await createSalle(salleData);
    }
    
    if (success) {
      setShowForm(false);
      resetForm();
    }
  };

  const handleEdit = (salle) => {
    if (!isChefDepartement && !isAdmin) {
      setError("Action non autorisée. Seul le Chef de Département ou l'Admin peut modifier.");
      return;
    }
    setCurrentSalle({
      id: salle.id,
      nom: salle.nom,
      capacite: salle.capacite,
      batiment: salle.batiment,
      description: salle.description || '',
      assignationType: salle.filiere_id ? 'filiere' : 'bureau',
      filiere_id: salle.filiere_id || '',
      bureau_id: salle.bureau_id || ''
    });
    setEditMode(true);
    setShowForm(true);
    setOpenMenuId(null);
    setFieldErrors({
      nom: '',
      capacite: '',
      batiment: '',
      filiere_id: '',
      bureau_id: ''
    });
  };

  const handleViewDescription = (salle) => {
    setSelectedSalle(salle);
    setShowDescriptionModal(true);
    setOpenMenuId(null);
  };

  // --- Fonctions de téléchargement (Non modifiées, seulement pour l'inclusion) ---
  const downloadSallesCSV = () => {
    const headers = ['Nom', 'Capacité', 'Bâtiment', 'Description', 'Assignation', 'Type'];
    const rows = filteredSalles.map(salle => [
      salle.nom,
      salle.capacite,
      salle.batiment,
      salle.description || 'N/A',
      salle.filiere_nom || salle.bureau_nom || 'Non assignée',
      salle.filiere_nom ? 'Filière' : salle.bureau_nom ? 'Bureau' : 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `salles_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Remplacer la fonction downloadSallesPDF par cette version améliorée
const downloadSallesPDF = () => {
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Liste des Salles</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: 20px; 
          margin: 0;
          background: white;
        }
        h1 { 
          color: #2563eb; 
          text-align: center; 
          margin-bottom: 10px;
          font-size: 24px;
        }
        .date { 
          text-align: center; 
          color: #666; 
          margin-bottom: 30px;
          font-size: 14px;
        }
        .stats { 
          display: flex; 
          flex-wrap: wrap;
          justify-content: center;
          gap: 15px;
          margin-bottom: 30px; 
        }
        .stat-box { 
          text-align: center; 
          padding: 15px; 
          background: #f0f9ff; 
          border-radius: 8px;
          min-width: 120px;
          flex: 1;
        }
        .stat-value { 
          font-size: 24px; 
          font-weight: bold; 
          color: #2563eb; 
        }
        .stat-label { 
          color: #666; 
          font-size: 12px; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
          font-size: 12px;
        }
        th { 
          background-color: #2563eb; 
          color: white; 
          padding: 10px; 
          text-align: left; 
          font-size: 12px;
        }
        td { 
          padding: 8px; 
          border-bottom: 1px solid #ddd; 
          font-size: 11px;
        }
        @media print {
          body { padding: 10px; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <h1>📚 Liste des Salles</h1>
      <div class="date">Généré le ${new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</div>
      
      <div class="stats">
        <div class="stat-box">
          <div class="stat-value">${salles.length}</div>
          <div class="stat-label">Salles</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${totalCapacity}</div>
          <div class="stat-label">Capacité totale</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${uniqueBuildings}</div>
          <div class="stat-label">Bâtiments</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Salle</th>
            <th>Capacité</th>
            <th>Bâtiment</th>
            <th>Assignation</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          ${filteredSalles.map(salle => `
            <tr>
              <td><strong>${salle.nom}</strong></td>
              <td>${salle.capacite} places</td>
              <td>${salle.batiment}</td>
              <td>${salle.filiere_nom || salle.bureau_nom || 'Non assignée'}</td>
              <td>${salle.filiere_nom ? 'Filière' : salle.bureau_nom ? 'Bureau' : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="no-print" style="margin-top: 40px; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee;">
        <p>Pour imprimer, utilisez le menu d'impression de votre navigateur</p>
        <p style="margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Imprimer / Sauvegarder en PDF
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
            Fermer
          </button>
        </p>
      </div>
    </body>
    </html>
  `;
  
  // Vérifier si c'est un mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Pour mobile : créer un blob et télécharger directement
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salles_${new Date().toISOString().split('T')[0]}.html`;
    
    // Ajouter temporairement au DOM et cliquer
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Libérer l'URL après un délai
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    // Afficher une instruction
    setSuccess('Fichier téléchargé. Ouvrez-le et utilisez "Partager > Imprimer" pour créer un PDF.');
  } else {
    // Pour desktop : ouvrir dans une nouvelle fenêtre avec print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Attendre le chargement avant d'imprimer
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Ne pas fermer automatiquement, laisser l'utilisateur choisir
      }, 500);
    };
  }
  
  setOpenMenuId(null);
};
  // --------------------------------------------------------------------------

  const filteredSalles = salles.filter(salle => 
    salle.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    salle.batiment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (salle.filiere_nom && salle.filiere_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (salle.bureau_nom && salle.bureau_nom.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalCapacity = salles.reduce((sum, salle) => sum + (salle.capacite || 0), 0);
  const uniqueBuildings = [...new Set(salles.map(salle => salle.batiment))].length;

  return (
    <>
      {showStats && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Aperçu</h2>
            <button 
              onClick={() => setShowStats(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Masquer
            </button>
          </div>
          {/* Grille responsive: 1 col sur mobile, 3 sur desktop/tablet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard 
              icon={Building}
              title="Total des Salles"
              value={salles.length}
              color="bg-blue-100 text-blue-600"
              bgColor="bg-white"
            />
            <StatCard 
              icon={Users}
              title="Capacité Totale"
              value={totalCapacity}
              color="bg-green-100 text-green-600"
              bgColor="bg-white"
            />
            <StatCard 
              icon={Briefcase}
              title="Bâtiments"
              value={uniqueBuildings}
              color="bg-purple-100 text-purple-600"
              bgColor="bg-white"
            />
          </div>
        </div>
      )}

      {/* Barre d'action (Rendue responsive) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="w-full md:w-auto">
          <h2 className="text-xl font-bold text-gray-900">Gestion des Salles</h2>
          <p className="text-gray-600 text-sm mt-1">
            {!showStats && `${salles.length} salles, ${totalCapacity} places totales`}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Barre de recherche responsive */}
          <div className="relative flex-1 sm:max-w-xs w-full"> 
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une salle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Bouton Télécharger (Menu déroulant responsive) */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setOpenMenuId(openMenuId === 'download' ? null : 'download')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
            >
              <Download size={20} />
              Télécharger
            </button>
            
            {openMenuId === 'download' && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setOpenMenuId(null)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      downloadSallesCSV();
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download size={16} />
                    Télécharger CSV
                  </button>
                  <button
                    onClick={() => {
                      downloadSallesPDF();
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download size={16} />
                    Télécharger PDF
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Bouton Nouvelle Salle / Lecture seule */}
          {isChefDepartement || isAdmin ? (
            <button
              onClick={() => {
                setShowForm(true);
                setEditMode(false);
                resetForm();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto flex-shrink-0"
            >
              <Plus size={20} />
              Nouvelle Salle
            </button>
          ) : (
            <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0">
              <Lock size={18} />
              <span className="text-sm">Lecture seule</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal / Formulaire (Rendu responsive) */}
      {showForm && (isChefDepartement || isAdmin) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"> {/* Ajout de p-4 pour le mobile */}
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto"> {/* Max-w-lg pour le formulaire */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div className='min-w-0'>
                  <h3 className="text-lg font-bold truncate">
                    {editMode ? 'Modifier la Salle' : 'Nouvelle Salle'}
                  </h3>
                  <p className="text-blue-100 text-xs mt-0.5">
                    Tous les champs sont obligatoires
                  </p>
                </div>
                <button 
                  onClick={closeForm}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-3">
                {/* Nom de la salle */}
                <div>
                  <input
                    type="text"
                    value={currentSalle.nom}
                    onChange={(e) => {
                      setCurrentSalle({...currentSalle, nom: e.target.value});
                      if (fieldErrors.nom) setFieldErrors({...fieldErrors, nom: ''});
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition text-sm ${
                      fieldErrors.nom ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Nom de la Salle *"
                  />
                  {fieldErrors.nom && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.nom}</span>
                    </div>
                  )}
                </div>
                
                {/* Capacité */}
                <div>
                  <input
                    type="number"
                    min="1"
                    value={currentSalle.capacite}
                    onChange={(e) => {
                      setCurrentSalle({...currentSalle, capacite: e.target.value});
                      if (fieldErrors.capacite) setFieldErrors({...fieldErrors, capacite: ''});
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition text-sm ${
                      fieldErrors.capacite ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Capacité (nombre de places) *"
                  />
                  {fieldErrors.capacite && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.capacite}</span>
                    </div>
                  )}
                </div>
                
                {/* Bâtiment */}
                <div>
                  <input
                    type="text"
                    value={currentSalle.batiment}
                    onChange={(e) => {
                      setCurrentSalle({...currentSalle, batiment: e.target.value});
                      if (fieldErrors.batiment) setFieldErrors({...fieldErrors, batiment: ''});
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition text-sm ${
                      fieldErrors.batiment ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Bâtiment *"
                  />
                  {fieldErrors.batiment && (
                    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                      <AlertCircle size={12} />
                      <span>{fieldErrors.batiment}</span>
                    </div>
                  )}
                </div>
                
                {/* Description */}
                <textarea
                  value={currentSalle.description}
                  onChange={(e) => setCurrentSalle({...currentSalle, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm resize-none"
                  placeholder="Description (optionnelle)"
                  rows="2"
                />
                
                <div className="border-t pt-3 mt-1">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Type d'assignation *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3"> {/* Rendu responsive */}
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="assignationType"
                        value="filiere"
                        checked={currentSalle.assignationType === 'filiere'}
                        onChange={(e) => {
                          setCurrentSalle({
                            ...currentSalle, 
                            assignationType: e.target.value,
                            bureau_id: ''
                          });
                          setFieldErrors({...fieldErrors, bureau_id: '', filiere_id: ''});
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Filière</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="assignationType"
                        value="bureau"
                        checked={currentSalle.assignationType === 'bureau'}
                        onChange={(e) => {
                          setCurrentSalle({
                            ...currentSalle, 
                            assignationType: e.target.value,
                            filiere_id: ''
                          });
                          setFieldErrors({...fieldErrors, filiere_id: '', bureau_id: ''});
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Bureau</span>
                    </label>
                  </div>
                </div>
                
               {/* Select Filière ou Bureau */}
{currentSalle.assignationType === 'filiere' ? (
  <div>
    <select
      value={currentSalle.filiere_id}
      onChange={(e) => {
        setCurrentSalle({...currentSalle, filiere_id: e.target.value});
        if (fieldErrors.filiere_id) setFieldErrors({...fieldErrors, filiere_id: ''});
      }}
      className={`w-full px-2 sm:px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition text-gray-700 text-xs sm:text-sm ${
        fieldErrors.filiere_id ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
      }`}
    >
      <option value="">Sélectionner une filière *</option>
      {filieres.map((f) => (
        <option key={f.id} value={f.id}>{f.nom}</option>
      ))}
    </select>
    {fieldErrors.filiere_id && (
      <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
        <AlertCircle size={12} />
        <span>{fieldErrors.filiere_id}</span>
      </div>
    )}
  </div>
) : (
  <div>
    <select
      value={currentSalle.bureau_id}
      onChange={(e) => {
        setCurrentSalle({...currentSalle, bureau_id: e.target.value});
        if (fieldErrors.bureau_id) setFieldErrors({...fieldErrors, bureau_id: ''});
      }}
      className={`w-full px-2 sm:px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition text-gray-700 text-xs sm:text-sm ${
        fieldErrors.bureau_id ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
      }`}
    >
      <option value="">Sélectionner un bureau *</option>
      {bureaux.map((b) => (
        <option key={b.id} value={b.id}>{b.nom}</option>
      ))}
    </select>
    {fieldErrors.bureau_id && (
      <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
        <AlertCircle size={12} />
        <span>{fieldErrors.bureau_id}</span>
      </div>
    )}
  </div>
)}
</div>

<div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-200">
  <button
    onClick={closeForm}
    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-xs sm:text-sm font-medium"
  >
    Annuler
  </button>
  <button
    onClick={handleSubmit}
    className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
  >
    <Save size={16} />
    {editMode ? 'Mettre à jour' : 'Enregistrer'}
  </button>
</div>
</div>
</div>
</div>
)}

{/* Modal Description */}
{showDescriptionModal && selectedSalle && (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
  <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 sm:p-4 rounded-t-2xl sticky top-0">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base sm:text-lg font-bold">{selectedSalle.nom}</h3>
          <p className="text-blue-100 text-xs sm:text-sm mt-0.5">Détails de la salle</p>
        </div>
        <button 
          onClick={() => setShowDescriptionModal(false)}
          className="p-1.5 hover:bg-white/20 rounded-lg transition"
        >
          <X size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
    
    <div className="p-4 sm:p-6">
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b">
          <Building className="text-blue-600 flex-shrink-0" size={18} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Bâtiment</p>
            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{selectedSalle.batiment}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 pb-3 border-b">
          <Users className="text-green-600 flex-shrink-0" size={18} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Capacité</p>
            <p className="font-medium text-gray-900 text-sm sm:text-base">{selectedSalle.capacite} places</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 pb-3 border-b">
          <Briefcase className="text-purple-600 flex-shrink-0" size={18} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500">Assignation</p>
            <p className="font-medium text-gray-900 text-sm sm:text-base break-words">
              {selectedSalle.filiere_nom ? `📚 ${selectedSalle.filiere_nom}` : 
               selectedSalle.bureau_nom ? `💼 ${selectedSalle.bureau_nom}` : 
               'Non assignée'}
            </p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-gray-500 mb-2">Description</p>
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
            <p className="text-gray-700 text-xs sm:text-sm break-words">
              {selectedSalle.description || 'Aucune description disponible'}
            </p>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => setShowDescriptionModal(false)}
        className="w-full mt-4 sm:mt-6 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm font-medium"
      >
        Fermer
      </button>
    </div>
  </div>
</div>
)}

{/* Tableau des Salles */}
<div className="overflow-hidden border border-gray-200 rounded-xl">
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px]">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200">
          <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Salle
          </th>
          <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Capacité
          </th>
          <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
            Bâtiment
          </th>
          <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
            Assignation
          </th>
          <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {filteredSalles.map((salle) => (
          <tr key={salle.id} className="hover:bg-gray-50 transition">
            <td className="px-3 sm:px-6 py-3 sm:py-4">
              <div>
                <span className="font-medium text-gray-900 text-xs sm:text-sm">{salle.nom}</span>
                <div className="md:hidden text-xs text-gray-500 mt-1">{salle.batiment}</div>
              </div>
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4">
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-800">
                {salle.capacite}
              </span>
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 text-xs sm:text-sm hidden md:table-cell">{salle.batiment}</td>
            <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
              {salle.filiere_nom ? (
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-800">
                  📚 {salle.filiere_nom}
                </span>
              ) : salle.bureau_nom ? (
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-800">
                  💼 {salle.bureau_nom}
                </span>
              ) : (
                <span className="text-gray-400 text-xs sm:text-sm">Non assignée</span>
              )}
            </td>
            <td className="px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-1 sm:gap-2">
                {(isChefDepartement || isAdmin) ? (
                  <>
                    <button
                      onClick={() => handleEdit(salle)}
                      className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Modifier"
                    >
                      <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={() => deleteSalle(salle.id)}
                      className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === salle.id ? null : salle.id)}
                        className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Plus d'options"
                      >
                        <MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                      
                      {openMenuId === salle.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                              onClick={() => handleViewDescription(salle)}
                              className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye size={14} className="sm:w-4 sm:h-4" />
                              Voir détails
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400" title="Lecture seule">
                    <Lock size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </span>
                )}
              </div>
            </td>
          </tr>
        ))}
        {filteredSalles.length === 0 && (
          <tr>
            <td colSpan="5" className="px-3 sm:px-6 py-8 sm:py-12 text-center">
              <div className="text-gray-500 text-xs sm:text-sm">
                {searchTerm ? 'Aucune salle ne correspond à votre recherche' : 'Aucune salle disponible'}
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
</>
);
}