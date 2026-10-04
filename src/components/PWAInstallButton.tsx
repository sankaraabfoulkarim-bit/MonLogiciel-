import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed and running standalone, suppress prompt
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Application installée avec succès sur cet appareil.</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // In case browser does not support beforeinstallprompt yet or was already dismissed
      setShowIOSGuide(true);
    }
  };

  if (installSuccess) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Installée
      </span>
    );
  }

  // Header compact variant
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          title="Installer ASF Prépa comme une application sur votre téléphone ou ordinateur"
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/80 rounded-lg transition-all shadow-2xs hover:shadow-xs active:scale-95 whitespace-nowrap ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden sm:inline">Installer l'application</span>
          <span className="sm:hidden">Installer</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                    ASF
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    Installer sur votre appareil
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-sm text-slate-700">
                <p className="text-xs text-slate-500 leading-relaxed">
                  L'application s'installe directement depuis le navigateur sans passer par l'App Store ou Google Play, et fonctionne hors-ligne.
                </p>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {isIOS ? 'Touchez le bouton Partager' : 'Ouvrez le menu du navigateur'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        {isIOS ? (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                            Icône de partage en bas de l'écran dans Safari
                          </>
                        ) : (
                          'Menu ⋮ ou bouton d’installation dans la barre d’adresse'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        Sélectionnez « Sur l'écran d'accueil »
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <PlusSquare className="w-3.5 h-3.5 text-emerald-600 inline" />
                        (ou « Installer l'application »)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        Confirmez « Ajouter »
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        L'icône ASF Prépa apparaîtra sur votre écran comme une application native.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                J'ai compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Card or settings variant
  return (
    <div className={`p-4 rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50/70 to-emerald-100/30 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-400 flex items-center justify-center font-bold text-sm shadow-sm">
            ASF
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Installer l'application ASF Prépa
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Accès instantané depuis votre écran d'accueil, plein écran sans barre d'adresse et révisions hors-ligne.
            </p>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Installer</span>
        </button>
      </div>

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                  ASF
                </div>
                <h3 className="text-base font-bold text-slate-900 font-serif">
                  Guide d'installation
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <p>
                Pour installer l'application sur votre appareil :
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 font-medium text-slate-800">
                <li>Ouvrez le menu de partage ou le menu du navigateur (⋮).</li>
                <li>Appuyez sur <strong>« Sur l'écran d'accueil »</strong> ou <strong>« Installer l'application »</strong>.</li>
                <li>Confirmez pour lancer l'application en plein écran à tout moment.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
