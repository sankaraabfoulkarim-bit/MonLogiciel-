import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Save,
} from 'lucide-react';
import { Subject } from '../types';
import { StorageService } from '../services/storage';
import { PWAInstallButton } from './PWAInstallButton';

interface ParametresViewProps {
  subjects: Subject[];
  onAddSubject: (subject: Omit<Subject, 'id'>) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onDataReset: () => void;
}

export const ParametresView: React.FC<ParametresViewProps> = ({
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onDataReset,
}) => {
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New subject state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newWeight, setNewWeight] = useState(3);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddSubject({
      name: newName.trim(),
      code: newCode.trim().toUpperCase() || 'MOD',
      description: newDescription.trim() || 'Matière au programme',
      color: '#0284C7',
      iconName: 'BookOpen',
      isActive: true,
      weight: newWeight,
    });

    setNewName('');
    setNewCode('');
    setNewDescription('');
    setNewWeight(3);
    setIsAddModalOpen(false);
    showNotification('Matière ajoutée au programme avec succès !');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      onUpdateSubject(editingSubject);
      setEditingSubject(null);
      showNotification('Matière mise à jour.');
    }
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const jsonStr = StorageService.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ASF_Prepa_Faso_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Sauvegarde JSON téléchargée.');
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importBackup(content);
      if (success) {
        showNotification('Données restaurées avec succès ! Rechargez la page.');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert('Le fichier de sauvegarde est invalide.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold font-serif text-slate-900">
          Paramètres & Gestion des Matières
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Administrez la liste des épreuves et matières du concours ASF, effectuez des sauvegardes et gérez votre profil de candidat.
        </p>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{notification}</span>
        </div>
      )}

      {/* Section 1: Subjects Administration (Matières administrables) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Matières du Concours ({subjects.length})
            </h2>
            <p className="text-xs text-slate-500">
              Vous pouvez ajouter de nouvelles matières, modifier leurs coefficients ou désactiver temporairement un module.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une matière</span>
          </button>
        </div>

        {/* Subjects list */}
        <div className="space-y-2.5">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 font-serif text-sm">
                    {sub.name}
                  </span>
                  <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                    {sub.code}
                  </span>
                  <span className="font-mono text-emerald-800 font-semibold">
                    Coeff. {sub.weight}
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-1">{sub.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditingSubject(sub)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Modifier</span>
                </button>

                <button
                  onClick={() => onDeleteSubject(sub.id)}
                  disabled={subjects.length <= 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30"
                  title="Supprimer la matière"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: PWA Application Installation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-serif">
            Application Mobile & Ordinateur (PWA)
          </h2>
          <p className="text-xs text-slate-500">
            Installez ASF Prépa Faso sur votre smartphone (Android / iOS) ou votre ordinateur (Windows, Mac, Linux) pour un accès direct hors connexion.
          </p>
        </div>

        <PWAInstallButton variant="card" />
      </div>

      {/* Section 3: Data Backup & Security */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 font-serif">
            Sauvegarde & Confidentialité des Données
          </h2>
          <p className="text-xs text-slate-500">
            Toutes vos données (documents analysés, questions générées, fiches et historique) restent strictement privées.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-emerald-800" />
              <span>Exporter une sauvegarde intégrale</span>
            </h4>
            <p className="text-slate-600">
              Téléchargez l'intégralité de vos cours, banque de QCM et statistiques au format JSON sécurisé.
            </p>
            <button
              onClick={handleExportBackup}
              className="mt-2 px-4 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Télécharger ma sauvegarde JSON
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-blue-700" />
              <span>Restaurer une sauvegarde</span>
            </h4>
            <p className="text-slate-600">
              Restaurez vos données antérieures sur cet appareil en chargeant votre fichier JSON.
            </p>
            <label className="mt-2 inline-block px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
              <span>Importer un fichier JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Reset button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Rétablir les matières et documents officiels initiaux du Burkina Faso :
          </span>
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous réinitialiser toutes les données aux valeurs de référence initiales ?')) {
                StorageService.resetToInitialData();
                onDataReset();
                showNotification('Données réinitialisées.');
              }
            }}
            className="text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser les données</span>
          </button>
        </div>
      </div>

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateSubject}
            className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Ajouter une matière au concours
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intitulé de la matière :
              </label>
              <input
                type="text"
                required
                placeholder="Ex : Gestion de la dette publique..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Code court :
                </label>
                <input
                  type="text"
                  placeholder="Ex : GDP"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 uppercase font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coefficient / Poids :
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newWeight}
                  onChange={(e) => setNewWeight(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Thèmes couverts :
              </label>
              <textarea
                rows={2}
                placeholder="Précisez les grands axes du programme..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg"
              >
                Enregistrer la matière
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Modifier la matière
              </h3>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intitulé :
              </label>
              <input
                type="text"
                required
                value={editingSubject.name}
                onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Code :
                </label>
                <input
                  type="text"
                  value={editingSubject.code}
                  onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value.toUpperCase() })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coefficient :
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editingSubject.weight}
                  onChange={(e) => setEditingSubject({ ...editingSubject, weight: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description :
              </label>
              <textarea
                rows={2}
                value={editingSubject.description}
                onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
