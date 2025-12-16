
import React, { useState } from 'react';
import douleImage from '../assets/images/doule.jpeg'; 

// URL de base de votre API (serveur Express)
const API_URL = process.env.REACT_APP_API_URL + '/auth';
 // correspond à /api/auth/register et /api/auth/login

// Icône Eye pour mot de passe
const EyeIcon = ({ onClick, isVisible }) => (
    <button 
        type="button" 
        onClick={onClick}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
        aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
    >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isVisible ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.523-2.923m13.435 3.535A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a10.05 10.05 0 0115.01-4.225M9 12a3 3 0 11-6 0 3 3 0 016 0zm7.5 0a3 3 0 10-6 0 3 3 0 006 0zM19 19L5 5" />
            )}
        </svg>
    </button>
);

// Modal (Rendu responsive avec max-w-md et mx-4)
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto transform transition-all duration-300 scale-100" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition duration-150">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};

// ===============================================
// REGISTER FORM (Utilise w-full partout, déjà responsive)
// ===============================================
const RegisterForm = ({ onClose }) => { 
    const [formData, setFormData] = useState({
        nom: '', prenom: '', statut: 'etudiant', email: '', password: '', confirmPassword: '', securityCode: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password !== formData.confirmPassword) return setError('Les mots de passe ne correspondent pas.');
        if (formData.statut === 'chef_departement' && !formData.securityCode) return setError('Le code de sécurité est requis pour le statut Chef de Département.');

        const dataToSend = {
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            statut: formData.statut,
            password: formData.password,
            ...(formData.statut === 'chef_departement' && { securityCode: formData.securityCode })
        };

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            const result = await response.json();
            if (!response.ok) return setError(result.error || 'Erreur lors de l\'inscription.');

            setSuccess('Inscription réussie! Veuillez vous connecter.');
            setTimeout(onClose, 1500);
        } catch {
            setError('Une erreur réseau est survenue.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm rounded-md">{error}</div>}
            {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 text-sm rounded-md">{success}</div>}

            <input type="text" name="nom" value={formData.nom} onChange={handleChange} placeholder="Nom" required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"/>
            <input type="text" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Prénom" required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"/>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Adresse Email" required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"/>
            <select name="statut" value={formData.statut} onChange={handleChange} required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="etudiant">Étudiant</option>
                <option value="enseignant">Enseignant</option>
                <option value="chef_departement">Chef de Département</option>
            </select>
            {formData.statut === 'chef_departement' && (
                <input type="password" name="securityCode" value={formData.securityCode} onChange={handleChange} placeholder="Code Unique Chef de Département" required className="w-full p-3 border border-red-500 rounded-md focus:ring-2 focus:ring-red-500"/>
            )}
            <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Mot de Passe" required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 pr-10"/>
                <EyeIcon onClick={() => setShowPassword(!showPassword)} isVisible={showPassword} />
            </div>
            <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirmer Mot de Passe" required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 pr-10"/>
                <EyeIcon onClick={() => setShowConfirmPassword(!showConfirmPassword)} isVisible={showConfirmPassword} />
            </div>
            <button type="submit" disabled={!!success} className="w-full py-3 px-4 rounded-md text-white font-semibold bg-[#E74C3C] hover:bg-[#C0392B] shadow-md disabled:bg-gray-400">S'INSCRIRE</button>
        </form>
    );
};

// ===============================================
// LOGIN FORM (Utilise w-full partout, déjà responsive)
// ===============================================
const LoginForm = ({ onClose, onSuccess }) => { 
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            if (!response.ok) return setError(result.error || 'Email ou mot de passe incorrect.');

            setSuccess('Connexion réussie! Redirection...');
            setTimeout(() => {
                onClose();
                if (onSuccess) onSuccess(result.token, result.user);
            }, 1000);
        } catch {
            setError('Une erreur réseau est survenue.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm rounded-md">{error}</div>}
            {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 text-sm rounded-md">{success}</div>}

            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Adresse Email" required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"/>
            <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Mot de Passe" required className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 pr-10"/>
                <EyeIcon onClick={() => setShowPassword(!showPassword)} isVisible={showPassword} />
            </div>
            <button type="submit" disabled={!!success} className="w-full py-3 px-4 rounded-md text-white font-semibold bg-[#2ECC71] hover:bg-[#27AE60] shadow-md disabled:bg-gray-400">SE CONNECTER</button>
        </form>
    );
};

// ===============================================
// HOME PAGE (Rendu responsive)
// ===============================================
export function HomePage({ onSuccess }) {
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Arrière-plan avec image */}
            <div className="absolute inset-0 z-0">
                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${douleImage})` }}>
                    <div className="h-full w-full bg-black opacity-50"></div>
                </div>
            </div>
            
            <div className="relative z-10 flex flex-col min-h-screen">
                {/* En-tête : Menu responsive */}
                <header className="py-4 px-6 md:px-12 text-white flex justify-between items-center">
                    <div className="text-xl font-bold tracking-wider">ENSPD</div>
                    <nav className="hidden md:flex space-x-6 items-center text-sm"> {/* Cache le menu sur mobile, affiche sur md+ */}
                        <a href="#" className="hover:text-gray-300">Accueil</a>
                        <a href="#" className="hover:text-gray-300">Solution</a>
                        <a href="#" className="hover:text-gray-300">Ressources</a>
                        <a href="#" className="hover:text-gray-300">Prix</a>
                        <a href="#" className="hover:text-gray-300">Contact</a>
                    </nav>
                    {/* Pour un menu mobile, vous ajouteriez ici un bouton Hamburger et un composant de navigation mobile */}
                </header>
                
                {/* Contenu principal */}
                <main className="flex-grow flex items-center justify-center p-4">
                    <div className="text-center p-4 max-w-4xl mx-auto w-full"> {/* Ajout de w-full pour centrage */}
                        {/* Titre responsive */}
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-10 uppercase tracking-wide drop-shadow-lg">
                            PLANNING DES SALLES DE CLASSES
                        </h1>
                        
                        {/* Boutons d'action : colonne sur mobile, ligne sur sm+ */}
                        <div className="flex flex-col sm:flex-row justify-center items-center space-y-5 sm:space-y-0 sm:space-x-8">
                            <button onClick={() => setIsRegisterModalOpen(true)} className="w-full sm:w-auto py-3 px-10 rounded-md text-white font-semibold bg-[#E74C3C] hover:bg-[#C0392B] shadow-lg">
                                CRÉER UN COMPTE
                            </button>
                            <button onClick={() => setIsLoginModalOpen(true)} className="w-full sm:w-auto py-3 px-10 rounded-md text-white font-semibold bg-[#2ECC71] hover:bg-[#27AE60] shadow-lg">
                                CONNEXION
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            <Modal isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} title="Créer un Compte">
                <RegisterForm onClose={() => setIsRegisterModalOpen(false)} />
            </Modal>

            <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title="Connexion">
                <LoginForm onClose={() => setIsLoginModalOpen(false)} onSuccess={onSuccess} />
            </Modal>
        </div>
    );
}