import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Lock, Search, Briefcase, Download } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;


const Bureau = ({ 
  bureaux = [], 
  salles = [],
  isChefDepartement = false, 
  isAdmin = false, 
  fetchBureaux = () => {}, 
  getAuthHeaders = () => ({ 'Content-Type': 'application/json' }), 
  handleAuthError = () => false,
  setError = () => {},
  setSuccess = () => {},
  user = null
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBureau, setCurrentBureau] = useState({ id: null, nom: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  const createBureau = async (nom) => {
    if (!nom.trim()) {
      setError('Le nom du bureau est requis');
      return false;
    }
    try {
      const response = await fetch(`${API_URL}/bureaux`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nom })
      });
      if (handleAuthError(response)) return false;
      
      if (response.ok) {
        setSuccess('Bureau créé avec succès');
        await fetchBureaux();
        return true;
      } else {
        const errData = await response.json();
        setError(errData.error || 'Ce bureau existe déjà');
        return false;
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      return false;
    }
  };

  const updateBureau = async (id, nom) => {
    if (!nom.trim()) {
      setError('Le nom du bureau est requis');
      return false;
    }
    try {
      const response = await fetch(`${API_URL}/bureaux/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ nom })
      });
      if (handleAuthError(response)) return false;
      
      if (response.ok) {
        setSuccess('Bureau mis à jour avec succès');
        await fetchBureaux();
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

  const deleteBureau = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bureau ?')) return;
    
    try {
      const response = await fetch(`${API_URL}/bureaux/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders(''),
      });
      if (handleAuthError(response)) return;
      
      if (response.ok) {
        setSuccess('Bureau supprimé avec succès');
        await fetchBureaux();
      } else {
        const errData = await response.json();
        setError(errData.error || 'Erreur de suppression');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const resetForm = () => {
    setCurrentBureau({ id: null, nom: '' });
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
      success = await updateBureau(currentBureau.id, currentBureau.nom);
    } else {
      success = await createBureau(currentBureau.nom);
    }

    if (success) {
      setShowForm(false);
      resetForm();
    }
  };

  const handleEdit = (bureau) => {
    if (!isChefDepartement && !isAdmin) {
      setError("Action non autorisée.");
      return;
    }
    setCurrentBureau({ id: bureau.id, nom: bureau.nom });
    setEditMode(true);
    setShowForm(true);
  };

  const filteredBureaux = bureaux.filter(bureau => 
    bureau.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fonction pour télécharger la liste des bureaux en CSV
  const downloadBureauxCSV = () => {
    const headers = ['Nom du Bureau', 'Salles Assignées'];
    
    const rows = filteredBureaux.map(bureau => {
      const sallesBureau = salles.filter(s => s.bureau_id === bureau.id);
      const nomsSalles = sallesBureau.map(s => s.nom).join(', ') || 'Aucune';
      return [bureau.nom, nomsSalles];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bureaux_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour télécharger la liste des bureaux en PDF
 const downloadBureauxPDF = () => {
  const totalSalles = salles.filter(s => s.bureau_id).length;
  
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Liste des Bureaux</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: 20px; 
          margin: 0;
          background: white;
          font-size: 14px;
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
          word-break: break-word;
        }
        th { 
          background-color: #2563eb; 
          color: white; 
          padding: 10px; 
          text-align: left; 
          font-size: 12px;
          font-weight: bold;
        }
        td { 
          padding: 8px; 
          border-bottom: 1px solid #ddd; 
          font-size: 11px;
          vertical-align: top;
        }
        .mobile-info {
          display: none;
          background: #f8f9fa;
          border-left: 4px solid #2563eb;
          padding: 10px;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 12px;
        }
        @media screen and (max-width: 768px) {
          body { padding: 10px; }
          table { font-size: 11px; }
          .mobile-info { display: block; }
        }
        @media print {
          body { padding: 10px; }
          .no-print { display: none !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      </style>
    </head>
    <body>
      <h1>💼 Liste des Bureaux Administratifs</h1>
      <div class="date">Généré le ${new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</div>
      
      <div class="mobile-info">
        <strong>📱 Pour mobile :</strong> Utilisez le menu "Partager" de votre navigateur et sélectionnez "Imprimer" pour générer un PDF.
      </div>
      
      <div class="stats">
        <div class="stat-box">
          <div class="stat-value">${bureaux.length}</div>
          <div class="stat-label">Bureaux</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${totalSalles}</div>
          <div class="stat-label">Salles assignées</div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">Bureau</th>
            <th style="width: 20%;">Nombre de Salles</th>
            <th style="width: 50%;">Salles Assignées</th>
          </tr>
        </thead>
        <tbody>
          ${filteredBureaux.map(bureau => {
            const sallesBureau = salles.filter(s => s.bureau_id === bureau.id);
            const nbSalles = sallesBureau.length;
            const nomsSalles = sallesBureau.map(s => s.nom).join(', ') || 'Aucune salle assignée';
            return `
              <tr>
                <td><strong>${bureau.nom}</strong></td>
                <td>${nbSalles} salle${nbSalles > 1 ? 's' : ''}</td>
                <td>${nomsSalles}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div class="no-print" style="margin-top: 40px; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee;">
        <p><strong>Instructions :</strong></p>
        <p style="margin: 10px 0;">Pour sauvegarder en PDF, utilisez le menu d'impression de votre navigateur</p>
        <p style="margin: 20px 0;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; font-size: 14px;">
            📄 Ouvrir l'impression
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            ✕ Fermer
          </button>
        </p>
        <p style="font-size: 11px; color: #888; margin-top: 15px;">
          Sur mobile : Partage → Imprimer → Enregistrer en PDF<br>
          Sur ordinateur : Fichier → Imprimer → Choisir "Enregistrer au format PDF"
        </p>
      </div>
    </body>
    </html>
  `;
  
  // Détection du type d'appareil
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Solution mobile : télécharger un fichier HTML
    try {
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `bureaux_${new Date().toISOString().split('T')[0]}.html`;
      
      // Ajouter temporairement au DOM
      document.body.appendChild(link);
      
      // Télécharger le fichier
      link.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Message d'information pour l'utilisateur mobile
      setSuccess('Fichier téléchargé. Ouvrez-le et utilisez "Partager → Imprimer" pour générer un PDF.');
      
    } catch (error) {
      console.error('Erreur lors du téléchargement mobile:', error);
      // Fallback : ouvrir dans une nouvelle fenêtre
      const printWindow = window.open('', '_blank');
      printWindow.document.write(content);
      printWindow.document.close();
      setSuccess('Ouvrez le menu "Partager" pour imprimer ou sauvegarder en PDF.');
    }
  } else {
    // Solution desktop : ouvrir dans une nouvelle fenêtre
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      setError('Veuillez autoriser les pop-ups pour ce site');
      return;
    }
    
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Focus sur la fenêtre
    printWindow.focus();
    
    // Laisser l'utilisateur choisir quand imprimer
    // Pour auto-imprimer, décommentez les lignes suivantes :
    // setTimeout(() => {
    //   printWindow.print();
    // }, 1000);
  }
  
  setOpenMenuId(null);
};
  return (
    <>
      {/* En-tête et Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestion des Bureaux</h2>
          <p className="text-gray-600 text-sm mt-1">
            {bureaux.length} bureau(x) administratif(s)
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Champ de recherche */}
          <div className="relative flex-1 sm:max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher un bureau..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Menu de téléchargement (Utilise le positionnement absolu pour le menu) */}
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
                      downloadBureauxCSV();
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download size={16} />
                    Télécharger CSV
                  </button>
                  <button
                    onClick={() => {
                      downloadBureauxPDF();
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
          
          {/* Bouton Nouveau Bureau / Lecture seule */}
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
              Nouveau Bureau
            </button>
          ) : (
            <div className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center gap-2">
              <Lock size={18} />
              <span className="text-sm">Lecture seule</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup Formulaire Bureau */}
      {showForm && (isChefDepartement || isAdmin) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full"> {/* max-w-md w-full pour la responsivité */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">
                    {editMode ? 'Modifier le Bureau' : 'Nouveau Bureau'}
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
                value={currentBureau.nom}
                onChange={(e) => setCurrentBureau({...currentBureau, nom: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                placeholder="Nom du bureau *"
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

      {/* Tableau des Bureaux */}
      <div className="overflow-hidden border border-gray-200 rounded-xl">
        {/* Assurer le défilement horizontal pour les petits écrans */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Bureau
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
              {filteredBureaux.map((bureau) => {
                const sallesBureau = salles.filter(s => s.bureau_id === bureau.id);
                const nomsSalles = sallesBureau.map(s => s.nom).join(', ');
                return (
                  <tr key={bureau.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                          <Briefcase size={20} />
                        </div>
                        <span className="font-medium text-gray-900">{bureau.nom}</span>
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
                              onClick={() => handleEdit(bureau)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Modifier"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteBureau(bureau.id)}
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
              {filteredBureaux.length === 0 && (
                <tr>
                  {/* Utilisation de colSpan basé sur le nombre de colonnes */}
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {searchTerm ? 'Aucun bureau ne correspond à votre recherche' : 'Aucun bureau disponible'}
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

export default Bureau;