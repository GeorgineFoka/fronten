import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LogOut, RefreshCw, Home, Building, Users, Briefcase, 
  Menu, X, ChevronRight, Settings, Bell, User, Calendar,
FileText, HelpCircle, ChevronDown, ChevronLeft, MessageSquare, Send
} from 'lucide-react';

// Assurez-vous que ces chemins d'importation sont corrects dans votre structure de fichiers
import Salle from './salle';
import Filiere from './filiere';
import Bureau from './bureau';
import StatusBadge from './StatusBadge';
import Alert from './Alert';
import LoadingSpinner from './LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const API_URL = process.env.REACT_APP_API_URL;


// --- Utilitaires ---
const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// --- Composant ChatWindow (Rendu responsive) ---
function ChatWindow({ partner, messages, sendMessage, currentUserId, isLoading }) {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const isFirstLoad = useRef(true);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

   useEffect(() => {
    if (isFirstLoad.current) {
        scrollToBottom();
        isFirstLoad.current = false;
    }
}, [messages]);


   const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
        sendMessage(partner.id, newMessage.trim());
        setNewMessage(''); // ✅ vide immédiatement l’input
    }
};


    if (!partner) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 sm:p-8">
                <MessageSquare size={48} className="mb-4 text-blue-400" />
                <h3 className="text-lg font-semibold text-center">Sélectionnez une conversation</h3>
                <p className="text-sm text-center mt-1 max-w-sm">
                    Les utilisateurs peuvent écrire aux Chefs de Département. Les Chefs peuvent répondre aux utilisateurs.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-md border border-gray-100">
            {/* Header du Chat */}
            <div className="p-4 border-b flex items-center bg-gray-50 rounded-t-lg">
                <div className="p-2 bg-blue-100 rounded-full mr-3">
                    <User size={20} className="text-blue-600" />
                </div>
                <div className="truncate"> {/* Ajout de truncate pour gérer les longs noms */}
                    <h4 className="font-semibold text-gray-900 truncate">{partner.nom} {partner.prenom}</h4>
                    <p className="text-sm text-gray-500">
                        <StatusBadge status={partner.statut} />
                    </p>
                </div>
            </div>

            {/* Corps du Chat (Messages) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {/* Affiche le spinner seulement si c'est le tout premier chargement de la conversation */}
                {isLoading && messages.length === 0 ? (
                    <LoadingSpinner />
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                        <MessageSquare size={32} className="mb-2 text-gray-400" />
                        <p className="text-sm font-medium">Démarrez la conversation !</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div 
                            key={index} 
                            className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                        >
                            <div 
                                className={`max-w-[80%] sm:max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl text-white shadow-md ${
                                    msg.sender_id === currentUserId 
                                        ? 'bg-blue-600 rounded-br-none' 
                                        : 'bg-gray-700 rounded-tl-none text-gray-50'
                                }`}
                            >
                                <p className="text-sm break-words">{msg.message}</p> {/* Ajout de break-words */}
                                <div className={`mt-1 text-xs ${msg.sender_id === currentUserId ? 'text-blue-200' : 'text-gray-300'} text-right whitespace-nowrap`}>
                                    {formatTime(msg.sent_at)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Formulaire d'envoi */}
            <form onSubmit={handleSend} className="p-4 border-t bg-white">
                <div className="flex items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrire un message..."
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 mr-3 text-sm"
                        disabled={!partner}
                    />

                    <button
                        type="submit"
                        disabled={!partner || !newMessage.trim()}
                        className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full transition duration-150 disabled:opacity-50 flex-shrink-0"
                        title="Envoyer"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
}

// --- Composant DiscussionSidebar (Rendu responsive) ---
function DiscussionSidebar({ conversations, setActiveChatPartner, activeChatPartnerId, currentUserId }) {
    
    // Trier par le message le plus récent
    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => 
            new Date(b.lastMessageSentAt) - new Date(a.lastMessageSentAt)
        );
    }, [conversations]);

    return (
        // Utilise w-full sur mobile et lg:w-80 sur grand écran
        <div className="w-full lg:w-80 border-r bg-white h-full overflow-y-auto flex-shrink-0"> 
            <h3 className="text-lg font-semibold p-4 border-b text-gray-800 flex items-center">
                <MessageSquare size={20} className="mr-2 text-blue-600" /> 
                Discussions
            </h3>
            {sortedConversations.length === 0 ? (
                 <p className="text-sm text-gray-500 p-4">
                     {currentUserId.statut === 'chef_departement' 
                        ? 'Aucune discussion avec les utilisateurs.'
                        : 'Aucune discussion initiée. Contactez un chef de département via l\'annuaire.'
                     }
                 </p>
            ) : (
                sortedConversations.map(conv => (
                    <button
                        key={conv.id}
                        onClick={() => setActiveChatPartner(conv)}
                        className={`w-full text-left p-4 flex items-center justify-between border-b hover:bg-gray-50 transition ${
                            conv.id === activeChatPartnerId ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                    >
                        <div className="flex items-center min-w-0"> {/* Ajout de min-w-0 */}
                            <div className="p-2 bg-gray-100 rounded-full mr-3 relative flex-shrink-0">
                                <User size={16} className="text-gray-600" />
                                {conv.unreadCount > 0 && (
                                     <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                                         {/* Simplifié pour ne pas afficher le nombre s'il est > 9 */}
                                     </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-sm text-gray-800 truncate">{conv.nom} {conv.prenom}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-full"> {/* Limite la taille sur mobile */}
                                    {conv.lastMessage || 'Nouvelle conversation'}
                                </p>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {conv.lastMessageSentAt ? formatTime(conv.lastMessageSentAt) : ''}
                        </div>
                    </button>
                ))
            )}
        </div>
    );
}

// --- Composant ChatContainer (Rendu responsive) ---
function ChatContainer({ user, getAuthHeaders, handleAuthError, setGlobalError, setGlobalSuccess, activeChatPartner, setActiveChatPartner }) {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false); 

    const fetchConversations = useCallback(async () => {
        setLoadingConversations(true);
        try {
            const response = await fetch(`${API_URL}/discussions`, {
                headers: getAuthHeaders(),
            });
            if (handleAuthError(response)) return;
            const data = await response.json();
            setConversations(data);
        } catch (err) {
            setGlobalError('Erreur lors du chargement des conversations.');
        } finally {
            setLoadingConversations(false);
        }
    }, [getAuthHeaders, handleAuthError, setGlobalError]);

    const fetchMessages = useCallback(async (partnerId) => {
        setLoadingMessages(true);
        try {
            const response = await fetch(`${API_URL}/discussions/${partnerId}`, {
                headers: getAuthHeaders(),
            });
            if (handleAuthError(response)) return;
            const data = await response.json();
            setMessages(data);
            fetchConversations();
        } catch (err) {
            setGlobalError('Erreur lors du chargement des messages.');
        } finally {
             // Mettre fin au chargement ici
            setLoadingMessages(false);
        }
    }, [getAuthHeaders, handleAuthError, setGlobalError, fetchConversations]);

    const sendMessage = async (receiverId, message) => {
        // Optionnellement, mettre en isLoading = true ici si on veut désactiver la saisie pendant l'envoi
        // setLoadingMessages(true); 
        try {
            const response = await fetch(`${API_URL}/discussions/send`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ receiverId, message }),
            });

            if (handleAuthError(response)) {
                // setLoadingMessages(false); // Réactiver si erreur
                return;
            }
            const result = await response.json();

            if (response.ok) {
                const tempMessage = {
                    message,
                    sender_id: user.id,
                    receiver_id: receiverId,
                    sent_at: result.sent_at,
                    read_status: 0
                };
                setMessages(prev => [...prev, tempMessage]);
                
                // Forcer la mise à jour de la liste des conversations (pour le dernier message)
                fetchConversations(); 
            } else {
                 setGlobalError(result.error || 'Erreur lors de l\'envoi du message.');
            }
        } catch (err) {
            setGlobalError('Erreur de connexion pour l\'envoi du message.');
        } // finally { setLoadingMessages(false); } // Désactiver si on l'a activé au début
    };

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // LOGIQUE DE CHARGEMENT AMÉLIORÉE POUR ÉVITER LE PLANTAGE DE LA SOURIS
    useEffect(() => {
        if (activeChatPartner) {
            const conversationExists = conversations.some(c => c.id === activeChatPartner.id);

            if (conversationExists) {
                 // Conversation existante: on la charge
                fetchMessages(activeChatPartner.id);
            } else {
                 // Nouvelle conversation: on vide les messages et on s'assure que le chargement est à FALSE
                setMessages([]);
                setLoadingMessages(false);
            }
        } else {
            setMessages([]);
            setLoadingMessages(false);
        }
    }, [activeChatPartner, fetchMessages, conversations]);

    if (loadingConversations && conversations.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        // Utilise flex-col sur mobile et flex sur grand écran pour la disposition côte à côte
        <div className="flex flex-col lg:flex-row h-[calc(100vh-14rem)] bg-white rounded-xl shadow-lg overflow-hidden">
             {/* Cache le sidebar sur mobile si un partenaire est sélectionné, sinon affiche tout */}
            <div className={`flex-shrink-0 w-full lg:w-80 ${activeChatPartner ? 'hidden lg:block' : 'block'}`}> 
                <DiscussionSidebar 
                    conversations={conversations} 
                    setActiveChatPartner={setActiveChatPartner}
                    activeChatPartnerId={activeChatPartner?.id}
                    currentUserId={user}
                />
            </div>
             {/* Affiche le chat window sur mobile si un partenaire est sélectionné, sinon occupe tout l'espace sur desktop */}
            <div className={`flex-1 ${activeChatPartner ? 'block' : 'hidden lg:block'}`}>
                {/* Bouton de retour uniquement sur mobile */}
                {activeChatPartner && (
                    <button 
                        onClick={() => setActiveChatPartner(null)} 
                        className="lg:hidden p-2 text-blue-600 hover:text-blue-800 bg-gray-100 w-full flex items-center border-b"
                    >
                        <ChevronLeft size={20} />
                        Retour aux discussions
                    </button>
                )}
                <ChatWindow 
                    partner={activeChatPartner}
                    messages={messages}
                    sendMessage={sendMessage}
                    currentUserId={user.id}
                    isLoading={loadingMessages}
                />
            </div>
        </div>
    );
}

// Composant pour afficher la liste des Chefs de Département (Rendu responsive)
function ChefsDepartementList({ chefs, setActiveTab, setActiveChatPartner }) {
    
    const handleStartChat = (chef) => {
        // Définir le chef comme partenaire de chat actif
        setActiveChatPartner(chef);
        // Changer l'onglet pour passer à la vue de discussion
        setActiveTab('discussion');
    };
    
    return (
        <div className="space-y-4 p-4 sm:p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Liste des Chefs de Département</h3>
            <p className="text-sm text-gray-600">
                Cliquez sur un chef pour initier une discussion.
            </p>
            {chefs.length === 0 ? (
                <p className="text-gray-500">Aucun Chef de Département trouvé.</p>
            ) : (
                // Utilise une grille responsive: 1 col sur mobile, 2 sur md, 3 sur lg
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chefs.map(chef => (
                        <div key={chef.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
                            <div className="flex items-start gap-4 mb-3">
                                <div className="p-3 bg-blue-100 rounded-full flex-shrink-0">
                                    <User size={20} className="text-blue-600" />
                                </div>
                                <div className='truncate'>
                                    <p className="text-base font-semibold text-gray-900 truncate">{chef.nom} {chef.prenom}</p>
                                    <p className="text-sm text-gray-600 truncate">{chef.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleStartChat(chef)}
                                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
                            >
                                <MessageSquare size={16} />
                                Démarrer la Discussion
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


export function Dashboard() {
  const [salles, setSalles] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [bureaux, setBureaux] = useState([]);
  const [chefsDepartement, setChefsDepartement] = useState([]);
  const [activeChatPartner, setActiveChatPartner] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Dans le Dashboard component, avant le return
const chartData = useMemo(() => [
  { name: 'Salles', value: salles.length },
  { name: 'Filières', value: filieres.length },
  { name: 'Bureaux', value: bureaux.length },
  { name: 'Chefs Dept', value: chefsDepartement.length },
], [salles, filieres, bureaux, chefsDepartement]);


  // 🔑 LOGIQUE D'AUTHENTIFICATION ET DE RÔLE
  const user = useMemo(() => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error("Erreur parsing userData", e);
      return null;
    }
  }, []);

  const userToken = useMemo(() => localStorage.getItem('userToken'), []);

  const isChefDepartement = user?.statut === 'chef_departement';
  const isAdmin = user?.statut === 'admin';
  
  const getAuthHeaders = useCallback((contentType = 'application/json') => ({
    'Content-Type': contentType,
    'Authorization': `Bearer ${userToken}`,
  }), [userToken]);

  useEffect(() => {
    if (!userToken || !user) {
      handleLogout();
      return;
    }
    fetchAllData();
  }, [userToken, user]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    window.location.href = '/';
  };

  const handleAuthError = (response) => {
    if (response.status === 401) {
      setError('Session expirée. Veuillez vous reconnecter.');
      setTimeout(() => handleLogout(), 2000);
      return true;
    }
    if (response.status === 403) {
      if (activeTab !== 'discussion') {
          setError('Accès non autorisé pour cette action.');
      }
      return true;
    }
    return false;
  };

  const fetchSalles = async () => { 
    try {
      const response = await fetch(`${API_URL}/salles`, { 
        headers: getAuthHeaders(''),
      });
      if (handleAuthError(response)) return;
      const data = await response.json();
      setSalles(data);
    } catch (err) {
      throw err;
    }
  };

  const fetchFilieres = async () => { 
    try {
      const response = await fetch(`${API_URL}/filieres`, {
        headers: getAuthHeaders(''),
      });
      if (handleAuthError(response)) return;
      const data = await response.json();
      setFilieres(data);
    } catch (err) {
      throw err;
    }
  };

  const fetchBureaux = async () => { 
    try {
      const response = await fetch(`${API_URL}/bureaux`, {
        headers: getAuthHeaders(''),
      });
      if (handleAuthError(response)) return;
      const data = await response.json();
      setBureaux(data);
    } catch (err) {
      throw err;
    }
  };

  const fetchChefsDepartement = async () => { 
    try {
      const response = await fetch(`${API_URL}/users/chef-departement`, {
        headers: getAuthHeaders(''),
      });
      if (handleAuthError(response)) return;
      const data = await response.json();
      setChefsDepartement(data);
    } catch (err) {
      throw err;
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSalles(), fetchFilieres(), fetchBureaux(), fetchChefsDepartement()]);
    } catch (error) {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const setGlobalError = (message) => setError(message);
  const setGlobalSuccess = (message) => setSuccess(message);

  // Gestion des messages d'alerte
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (!user) {
     return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
        <div className="text-blue-600 text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentification requise</h2>
        <p className="text-gray-600 mb-4">Redirection en cours...</p>
      </div>
    </div>;
  }



const sidebarItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'salles', label: 'Gestion des Salles', icon: Building },
    { id: 'filieres', label: 'Gestion des Filières', icon: Users },
    { id: 'bureaux', label: 'Gestion des Bureaux', icon: Briefcase },
    { id: 'chefs', label: 'Chefs de Département', icon: User }, 
    { id: 'discussion', label: 'Discussion', icon: MessageSquare },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'rapports', label: 'Rapports', icon: BarChart },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  const getPageTitle = () => {
    switch(activeTab) {
      case 'salles': return 'Gestion des Salles';
      case 'filieres': return 'Gestion des Filières';
      case 'bureaux': return 'Gestion des Bureaux';
      case 'chefs': return 'Annuaire des Chefs de Département';
      case 'discussion': return 'Messagerie Privée'; 
      default: return 'Tableau de Bord';
    }
  };

  const getPageDescription = () => {
    switch(activeTab) {
      case 'salles': return 'Gérez les salles de classe, amphithéâtres et laboratoires';
      case 'filieres': return 'Gérez les filières et départements de l\'établissement';
      case 'bureaux': return 'Gérez les bureaux administratifs et de direction';
      case 'chefs': return 'Consultez la liste des responsables de département de l\'établissement.';
      case 'discussion': return 'Discutez avec les Chefs de Département.'; 
      default: return `Bienvenue, ${user.prenom} ! Tableau de bord principal.`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar (Rendu responsive) */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8"> {/* Padding ajusté */}
          <div className="flex justify-between items-center h-16">
            {/* Left side: Logo and menu button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition lg:hidden" // Affiche uniquement sur mobile/tablet
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl flex-shrink-0">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">LOCALIS</h1>
                  <p className="text-xs text-gray-400 font-medium hidden sm:block">Polytechnique de Douala</p> {/* Cache le sous-titre sur petit mobile */}
                </div>
              </div>
            </div>

            {/* Right side: User info and actions */}
            <div className="flex items-center gap-2 sm:gap-3"> {/* Espacement ajusté sur mobile */}
              {/* Notifications */}
              <button className="p-2 sm:p-2.5 text-gray-300 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition relative">
                <Bell size={20} className='sm:h-6 sm:w-6'/>
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Settings */}
              <button className="p-2 sm:p-2.5 text-gray-300 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition hidden sm:block"> {/* Cache sur très petit écran */}
                <Settings size={20} className='sm:h-6 sm:w-6'/>
              </button>
              
              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 sm:p-2.5 text-gray-300 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition"
                >
                  <User size={20} className='sm:h-6 sm:w-6'/>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"> {/* Largeur ajustée */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.nom} {user.prenom}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
                      <div className="mt-2">
                        <StatusBadge status={user.statut} />
                      </div>
                    </div>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition">
                      <Settings size={18} />
                      Paramètres
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition">
                      <HelpCircle size={18} />
                      Aide & Support
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-gray-100 mt-1 transition"
                    >
                      <LogOut size={18} />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex">
        {/* Sidebar - Desktop (Rendu responsive) */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:block bg-gray-800 border-r border-gray-700 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto transition-all duration-300 flex-shrink-0`}>
          <div className="p-4">
            {/* Navigation header with toggle button */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                {sidebarOpen && (
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Navigation
                  </h3>
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-2 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white ${!sidebarOpen ? 'mx-auto' : 'ml-auto'}`}
                  title={sidebarOpen ? 'Réduire la sidebar' : 'Étendre la sidebar'}
                >
                  {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
              </div>
              
              <ul className="space-y-1">
                {sidebarItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        // Mise à jour pour inclure l'onglet 'discussion'
                        if (['salles', 'filieres', 'bureaux', 'chefs', 'discussion', 'dashboard'].includes(item.id)) {
                          setActiveTab(item.id);
                        }
                      }}
                      className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition ${
                        activeTab === item.id
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <item.icon size={18} className={sidebarOpen ? "mr-3" : "mx-auto"} />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {activeTab === item.id && (
                            <ChevronRight size={16} className="ml-auto" />
                          )}
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {sidebarOpen && (
              <>
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Statistiques
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Salles</span>
                        <span className="text-lg font-bold text-blue-400">{salles.length}</span>
                      </div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Filières</span>
                        <span className="text-lg font-bold text-green-400">{filieres.length}</span>
                      </div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Bureaux</span>
                        <span className="text-lg font-bold text-purple-400">{bureaux.length}</span>
                      </div>
                    </div>
                    {/* Stat des Chefs de Département */}
                    <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Chefs Dept</span>
                        <span className="text-lg font-bold text-yellow-400">{chefsDepartement.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <h4 className="text-sm font-medium text-white mb-2">Besoin d'aide ?</h4>
                  <p className="text-xs text-gray-300 mb-3">
                    Consultez notre documentation ou contactez le support.
                  </p>
                  <button className="w-full text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center justify-center gap-2">
                    <HelpCircle size={16} />
                    Centre d'aide
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Sidebar - Mobile (Rendu responsive) */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
            <div className="fixed inset-y-0 left-0 w-64 bg-gray-800 shadow-lg overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">Menu</h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <ul className="space-y-1">
                  {sidebarItems.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition ${
                          activeTab === item.id
                            ? 'bg-blue-600 text-white font-medium'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <item.icon size={18} className="mr-3" />
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
                {/* Stats et Aide Mobile (Dupliqué de la version Desktop pour l'affichage mobile) */}
                <div className="mt-8 border-t border-gray-700 pt-6">
                   <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Statistiques</h3>
                   <div className="space-y-3">
                      <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 flex justify-between items-center">
                        <span className="text-sm text-gray-300">Salles</span>
                        <span className="text-lg font-bold text-blue-400">{salles.length}</span>
                      </div>
                      <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 flex justify-between items-center">
                        <span className="text-sm text-gray-300">Filières</span>
                        <span className="text-lg font-bold text-green-400">{filieres.length}</span>
                      </div>
                      <div className="bg-gray-700 p-3 rounded-lg border border-gray-600 flex justify-between items-center">
                        <span className="text-sm text-gray-300">Bureaux</span>
                        <span className="text-lg font-bold text-purple-400">{bureaux.length}</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content area (Rendu responsive) */}
        <main className={`flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 overflow-x-hidden`}>
          <div className="max-w-7xl mx-auto">
            {/* Page header (Rendu responsive) */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    {getPageTitle()}
                  </h2>
                  <p className="text-gray-600 mt-2 truncate">
                    {getPageDescription()}
                  </p>
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* ... Vos boutons d'action ici ... */}
                </div>
              </div>
            </div>

            {/* Messages d'alerte */}
            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm overflow-x-auto lg:overflow-x-hidden"> {/* Ajout de overflow-x-auto pour gérer le contenu large */}
              <div className="p-4 sm:p-6"> {/* Padding ajusté sur mobile */}
                {loading && activeTab !== 'discussion' ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    {activeTab === 'salles' && (
                      <Salle
                        salles={salles}
                        filieres={filieres}
                        bureaux={bureaux}
                        isChefDepartement={isChefDepartement}
                        isAdmin={isAdmin}
                        fetchSalles={fetchSalles}
                        getAuthHeaders={getAuthHeaders}
                        handleAuthError={handleAuthError}
                        setError={setGlobalError}
                        setSuccess={setGlobalSuccess}
                      />
                    )}
                    
                    {activeTab === 'filieres' && (
                      <Filiere
                        filieres={filieres}
                        salles={salles}
                        isChefDepartement={isChefDepartement}
                        isAdmin={isAdmin}
                        fetchFilieres={fetchFilieres}
                        getAuthHeaders={getAuthHeaders}
                        handleAuthError={handleAuthError}
                        setError={setGlobalError}
                        setSuccess={setGlobalSuccess}
                        user={user}
                      />
                    )}
                    
                    {activeTab === 'bureaux' && (
                      <Bureau
                        bureaux={bureaux}
                        salles={salles}
                        isChefDepartement={isChefDepartement}
                        isAdmin={isAdmin}
                        fetchBureaux={fetchBureaux}
                        getAuthHeaders={getAuthHeaders}
                        handleAuthError={handleAuthError}
                        setError={setGlobalError}
                        setSuccess={setGlobalSuccess}
                        user={user}
                      />
                    )}

                    {/* Affichage des Chefs de Département (avec possibilité de Démarrer le Chat) */}
                    {activeTab === 'chefs' && (
                      <ChefsDepartementList 
                        chefs={chefsDepartement} 
                        setActiveTab={setActiveTab}
                        setActiveChatPartner={setActiveChatPartner}
                      />
                    )}
                    
                    {/* Messagerie / Discussion */}
                    {activeTab === 'discussion' && (
                      <ChatContainer
                        user={user}
                        getAuthHeaders={getAuthHeaders}
                        handleAuthError={handleAuthError}
                        setGlobalError={setGlobalError}
                        setGlobalSuccess={setGlobalSuccess}
                        activeChatPartner={activeChatPartner}
                        setActiveChatPartner={setActiveChatPartner}
                      />
                    )}
                    
                  {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                      {/* Cartes (Rendu responsive) */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"> {/* 2 colonnes sur mobile, 4 sur desktop */}
                        <div className="bg-white shadow rounded-lg p-3 sm:p-5 flex items-center gap-2 sm:gap-4 border border-gray-200">
                          <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
                            <Building className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">Salles</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">{salles.length}</p>
                          </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-3 sm:p-5 flex items-center gap-2 sm:gap-4 border border-gray-200">
                          <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
                            <Users className="text-green-600" size={20} />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">Filières</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">{filieres.length}</p>
                          </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-3 sm:p-5 flex items-center gap-2 sm:gap-4 border border-gray-200">
                          <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
                            <Briefcase className="text-purple-600" size={20} />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">Bureaux</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">{bureaux.length}</p>
                          </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-3 sm:p-5 flex items-center gap-2 sm:gap-4 border border-gray-200">
                          <div className="p-2 sm:p-3 bg-yellow-100 rounded-full flex-shrink-0">
                            <User className="text-yellow-600" size={20} />
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs sm:text-sm">Chefs Dept</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-800">{chefsDepartement.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* Graphe en bas */}
                      <div className="bg-white shadow rounded-lg p-4 sm:p-6 border border-gray-200">
                      
                        <ResponsiveContainer width="100%" height={300} minHeight={250}> {/* minHeight pour éviter les problèmes de rendu */}
                          <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" >
                              <Cell fill="#1D4ED8" /> {/* Salles */}
                              <Cell fill="#10B981" /> {/* Filières */}
                              <Cell fill="#8B5CF6" /> {/* Bureaux */}
                              <Cell fill="#FBBF24" /> {/* Chefs */}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}


                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Close user menu when clicking outside */}
      {userMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
}