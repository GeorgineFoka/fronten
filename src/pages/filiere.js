import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Lock, Search, BookOpen, Download } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;


const Filiere = ({ 
  filieres = [], 
  salles = [],
  isChefDepartement = false, 
  isAdmin = false, 
  fetchFilieres = () => {}, 
  getAuthHeaders = () => ({ 'Content-Type': 'application/json' }), 
  handleAuthError = () => false,
  setError = () => {},
  setSuccess = () => {},
  user = null
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentFiliere, setCurrentFiliere] = useState({ id: null, nom: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const createFiliere = async (nom) => {
    if (!nom.trim()) {
      setError('Le nom de la filière est requis');
      return false;
    }
    try {
      const response = await fetch(`${API_URL}/filieres`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nom })
      });
      
      if (handleAuthError(response)) return false;
      
      if (response.ok) {
        setSuccess('Filière créée avec succès');
        await fetchFilieres();
        return true;
      } else {
        const errData = await response.json();
        setError(errData.error || 'Cette filière existe déjà');
        return false;
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      return false;
    }
  };

  const updateFiliere = async (id, nom) => {
    if (!nom.trim()) {
      setError('Le nom de la filière est requis');
      return false;
    }
    try {
      const response = await fetch(`${API_URL}/filieres/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nom })
      });
      
      if (handleAuthError(response)) return false;
      
      if (response.ok) {
        setSuccess('Filière mise à jour avec succès');
        await fetchFilieres();
        return true;
      } else {
        const errData = await response.json();
        setError(errData.error || 'Erreur lors de la mise à jour');
        return false;
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      return false;
    }
  };

  const deleteFiliere = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette filière ?')) return;
    
    try {
      // Correction : Assurer que getAuthHeaders() est appelé sans argument si non requis
      const response = await fetch(`${API_URL}/filieres/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      
      if (handleAuthError(response)) return;
      
      if (response.ok) {
        setSuccess('Filière supprimée avec succès');
        await fetchFilieres();
      } else {
        const errData = await response.json();
        setError(errData.error || 'Erreur de suppression');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const resetForm = () => {
    setCurrentFiliere({ id: null, nom: '' });
    setEditMode(false);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!isChefDepartement && !isAdmin) {
      setError("Action non autorisée.");
      return;
    }

    let success;
    if (editMode) {
      success = await updateFiliere(currentFiliere.id, currentFiliere.nom);
    } else {
      success = await createFiliere(currentFiliere.nom);
    }

    if (success) {
      setShowForm(false);
      resetForm();
    }
  };

  const handleEdit = (filiere) => {
    if (!isChefDepartement && !isAdmin) {
      setError("Action non autorisée.");
      return;
    }
    setCurrentFiliere({ id: filiere.id, nom: filiere.nom });
    setEditMode(true);
    setShowForm(true);
  };

  const filteredFilieres = filieres.filter(filiere => 
    filiere.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour télécharger la liste des filières en CSV
  const downloadFilieresCSV = () => {
    const headers = ['Nom de la Filière', 'Salles Assignées'];
    
    const rows = filteredFilieres.map(filiere => {
      const sallesFiliere = salles.filter(s => s.filiere_id === filiere.id);
      const nomsSalles = sallesFiliere.map(s => s.nom).join(', ') || 'Aucune';
      return [filiere.nom, nomsSalles];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `filieres_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour télécharger la liste des filières en PDF
  const downloadFilieresPDF = () => {
    const totalSalles = salles.filter(s => s.filiere_id).length;
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Liste des Filières</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2563eb; text-align: center; margin-bottom: 10px; }
          .date { text-align: center; color: #666; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #2563eb; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f5f5f5; }
          .stats { display: flex; justify-content: space-around; margin-bottom: 30px; }
          .stat-box { text-align: center; padding: 15px; background: #f0f9ff; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .stat-label { color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>📚 Liste des Filières - SalleManager</h1>
        <div class="date">Généré le ${new Date().toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
        
        <div class="stats">
          <div class="stat-box">
            <div class="stat-value">${filieres.length}</div>
            <div class="stat-label">Filières</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${totalSalles}</div>
            <div class="stat-label">Salles assignées</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Filière</th>
              <th>Salles Assignées</th>
            </tr>
          </thead>
          <tbody>
            ${filteredFilieres.map(filiere => {
              const sallesFiliere = salles.filter(s => s.filiere_id === filiere.id);
              const nomsSalles = sallesFiliere.map(s => s.nom).join(', ') || 'Aucune';
              return `
                <tr>
                  <td><strong>${filiere.nom}</strong></td>
                  <td>${nomsSalles}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestion des Filières</h2>
          <p className="text-gray-600 text-sm mt-1">
            {filieres.length} filière(s) configurée(s)
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Champ de recherche */}
          <div className="relative flex-1 sm:max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une filière..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Menu de téléchargement (Utilise w-full sm:w-48 pour la responsivité) */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setOpenMenuId(openMenuId === 'download' ? null : 'download')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 whitespace-nowrap"
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
                <div className="absolute right-0 mt-2 w-full sm:w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      downloadFilieresCSV();
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download size={16} />
                    Télécharger CSV
                  </button>
                  <button
                    onClick={() => {
                      downloadFilieresPDF();
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
          
          {/* Bouton Nouvelle Filière / Lecture seule */}
          {isChefDepartement || isAdmin ? (
            <button
              onClick={() => {
                setShowForm(true);
                setEditMode(false);
                resetForm();
              }}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              Nouvelle Filière
            </button>
          ) : (
            <div className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center gap-2">
              <Lock size={18} />
              <span className="text-sm">Lecture seule</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup Formulaire Filière */}
      {showForm && (isChefDepartement || isAdmin) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full"> {/* max-w-md w-full pour la responsivité */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">
                    {editMode ? 'Modifier la Filière' : 'Nouvelle Filière'}
                  </h3>
                  <p className="text-blue-100 text-xs mt-0.5">
                    Veuillez remplir le champ
                  </p>
                </div>
                <button 
                  onClick={closeForm}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <input
                type="text"
                value={currentFiliere.nom}
                onChange={(e) => setCurrentFiliere({...currentFiliere, nom: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                placeholder="Nom de la filière *"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={closeForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  {editMode ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tableau des Filières */}
      <div className="overflow-hidden border border-gray-200 rounded-xl">
        {/* Assurer le défilement horizontal pour les petits écrans */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Filière
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Salles Assignées
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFilieres.map((filiere) => {
                const sallesFiliere = salles.filter(s => s.filiere_id === filiere.id);
                const nomsSalles = sallesFiliere.map(s => s.nom).join(', ');
                return (
                  <tr key={filiere.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <BookOpen size={20} />
                        </div>
                        <span className="font-medium text-gray-900">{filiere.nom}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-normal min-w-[200px] text-wrap">
                      {nomsSalles ? (
                        <span className="text-gray-700">{nomsSalles}</span>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Aucune salle assignée</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {(isChefDepartement || isAdmin) ? (
                          <>
                            <button
                              onClick={() => handleEdit(filiere)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteFiliere(filiere.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 p-2" title="Lecture seule">
                            <Lock size={18} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredFilieres.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {searchTerm ? 'Aucune filière ne correspond à votre recherche' : 'Aucune filière disponible'}
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
};

export default Filiere;