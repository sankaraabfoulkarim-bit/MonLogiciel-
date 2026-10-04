import React, { useState, useMemo } from 'react';
import {
  UploadCloud,
  FileText,
  Search,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Eye,
  Layers,
  ArrowRight,
  Filter,
  List,
  Grid,
  FileCheck2,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
  HardDrive,
  CornerDownRight,
  GripVertical,
  MoveRight,
  ArrowDownToDot,
} from 'lucide-react';
import { DocumentSummary, Subject } from '../types';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';

interface DocumentsViewProps {
  documents: DocumentSummary[];
  subjects: Subject[];
  onAddDocument: (doc: DocumentSummary) => void;
  onUpdateDocument?: (doc: DocumentSummary) => void;
  onDeleteDocument: (docId: string) => void;
  onGenerateQcmForDoc: (doc: DocumentSummary) => void;
  onGenerateFlashcardForDoc: (doc: DocumentSummary) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  subjects,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onGenerateQcmForDoc,
  onGenerateFlashcardForDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hierarchical Folder Navigation State
  // selectedFolderId can be 'all' (root) or a subjectId
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  
  // Expanded folders state (subjectId -> boolean)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = { all: true };
    // Expand the first 4 subjects by default
    subjects.slice(0, 4).forEach((s) => {
      initial[s.id] = true;
    });
    return initial;
  });

  // Drag and drop states
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected document for detailed side panel
  const [selectedDoc, setSelectedDoc] = useState<DocumentSummary | null>(null);

  // View presentation mode: 'tree' | 'grid'
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadSubjectId, setUploadSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');

  // Group documents by subject folder
  const documentsBySubject = useMemo(() => {
    const map = new Map<string, DocumentSummary[]>();
    subjects.forEach((s) => map.set(s.id, []));

    documents.forEach((doc) => {
      const list = map.get(doc.subjectId);
      if (list) {
        list.push(doc);
      } else {
        map.set(doc.subjectId, [doc]);
      }
    });
    return map;
  }, [documents, subjects]);

  // Active folder subject
  const currentFolderSubject = subjects.find((s) => s.id === selectedFolderId);

  // Filtered documents based on active folder & search query
  const displayedDocuments = useMemo(() => {
    let list: DocumentSummary[] = [];

    if (selectedFolderId === 'all') {
      list = documents;
    } else {
      list = documentsBySubject.get(selectedFolderId) || [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          d.subjectName.toLowerCase().includes(q) ||
          d.keyConcepts?.some((k) => k.toLowerCase().includes(q))
      );
    }

    return list;
  }, [selectedFolderId, documents, documentsBySubject, searchQuery]);

  // Toggle folder expansion
  const toggleFolderExpand = (folderId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const expandAllFolders = () => {
    const updated: Record<string, boolean> = { all: true };
    subjects.forEach((s) => {
      updated[s.id] = true;
    });
    setExpandedFolders(updated);
  };

  const collapseAllFolders = () => {
    setExpandedFolders({ all: true });
  };

  // Drag and drop handler: move document to target subject folder
  const handleDropDocOnSubject = (docId: string, targetSubject: Subject) => {
    setDragOverFolderId(null);
    setDraggedDocId(null);

    const docToMove = documents.find((d) => d.id === docId);
    if (!docToMove) return;

    // Check if already in this folder
    if (docToMove.subjectId === targetSubject.id) {
      return;
    }

    // Automatically update subjectId and subjectName in the background
    const updatedDoc: DocumentSummary = {
      ...docToMove,
      subjectId: targetSubject.id,
      subjectName: targetSubject.name,
    };

    // Persist changes in StorageService
    StorageService.updateDocument(updatedDoc);

    // Persist in Cloud SQL PostgreSQL backend
    ApiService.updateDocumentSubject(docId, targetSubject.id, targetSubject.name);

    // Notify parent component if provided
    if (onUpdateDocument) {
      onUpdateDocument(updatedDoc);
    }

    // If currently previewing this document, update inspector state
    if (selectedDoc?.id === docId) {
      setSelectedDoc(updatedDoc);
    }

    // Ensure the destination folder is expanded so user sees the moved file
    setExpandedFolders((prev) => ({
      ...prev,
      [targetSubject.id]: true,
    }));

    // Toast notification
    setToastMessage(`Document « ${docToMove.name} » déplacé vers le dossier « ${targetSubject.name} »`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Open upload modal with target folder pre-selected
  const handleOpenUploadForFolder = (subjectId?: string) => {
    if (subjectId && subjectId !== 'all') {
      setUploadSubjectId(subjectId);
    } else if (selectedFolderId !== 'all') {
      setUploadSubjectId(selectedFolderId);
    } else {
      setUploadSubjectId(subjects[0]?.id || '');
    }
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Run upload and AI analysis
  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(15);
    setAnalysisStatus('Lecture du fichier et préparation de l’extraction...');

    try {
      const targetSubject = subjects.find((s) => s.id === uploadSubjectId) || subjects[0];
      const base64Data = await fileToBase64(selectedFile);

      setUploadProgress(40);
      setAnalysisStatus('Numérisation OCR & Identification des chapitres par l’IA...');

      let textSample = '';
      if (selectedFile.type.includes('text') || selectedFile.name.endsWith('.txt')) {
        textSample = await selectedFile.text();
      }

      setUploadProgress(65);
      setAnalysisStatus('Extraction des articles de lois, décrets, chiffres et concepts clés...');

      const analysis = await ApiService.analyzeDocument({
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileData: base64Data,
        textContent: textSample,
        subjectName: targetSubject.name,
      });

      setUploadProgress(90);
      setAnalysisStatus('Construction de la base de connaissances et indexation...');

      const newDoc: DocumentSummary = {
        id: `doc-${Date.now()}`,
        name: selectedFile.name,
        subjectId: targetSubject.id,
        subjectName: targetSubject.name,
        fileType: selectedFile.type || 'application/pdf',
        fileSize: selectedFile.size,
        uploadDate: new Date().toISOString().split('T')[0],
        pagesCount: analysis.pagesEstimated || Math.max(1, Math.round(selectedFile.size / 45000)),
        status: 'ready',
        questionsGeneratedCount: 0,
        flashcardsCount: 0,
        summary: analysis.summary || `Document de cours : ${selectedFile.name}`,
        chapters: analysis.chapters || [
          {
            title: 'Chapitre 1 : Dispositions générales',
            pageStart: 1,
            pageEnd: 15,
            topics: ['Principes fondamentaux', 'Réglementation'],
          },
        ],
        keyConcepts: analysis.keyConcepts || ['Régularité financière', 'Conformité UEMOA'],
        keyArticles: analysis.keyArticles || ['Directives UEMOA'],
        chunks: analysis.chunks || [],
      };

      setUploadProgress(100);
      setAnalysisStatus('Document classé et indexé avec succès !');

      setTimeout(() => {
        onAddDocument(newDoc);
        setIsUploading(false);
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setSelectedDoc(newDoc);
        // Automatically switch to the folder where the document was added
        setSelectedFolderId(targetSubject.id);
        setExpandedFolders((prev) => ({ ...prev, [targetSubject.id]: true }));
      }, 500);
    } catch (err) {
      console.error('Upload error:', err);
      setIsUploading(false);
      setAnalysisStatus('Une erreur est survenue lors de l’analyse.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  // Folder metrics
  const totalPagesInFolder = displayedDocuments.reduce((acc, d) => acc + (d.pagesCount || 0), 0);
  const totalQcmInFolder = displayedDocuments.reduce((acc, d) => acc + (d.questionsGeneratedCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification for Drag & Drop movements */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-800 hover:text-emerald-950 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 uppercase tracking-wide">
            <FolderTree className="w-4 h-4 text-emerald-700" />
            <span>Gestion Documentaire & Glisser-Déposer</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 mt-0.5">
            Bibliothèque de Cours par Matière
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Classez vos documents par matière. Glissez-déposez n'importe quel fichier sur un dossier pour modifier sa matière instantanément.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => handleOpenUploadForFolder(selectedFolderId)}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Déposer dans ce dossier</span>
          </button>
        </div>
      </div>

      {/* Main Explorer Workspace (Sidebar Tree + Content Area + Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hierarchical Folder Directory (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden sticky top-20">
          {/* Tree Explorer Header */}
          <div className="px-4 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 font-serif">
              <FolderTree className="w-4 h-4 text-emerald-800" />
              <span>Dossiers (Cibles de dépôt)</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <button
                onClick={expandAllFolders}
                className="px-1.5 py-0.5 rounded hover:bg-slate-200 transition-colors"
                title="Tout déplier"
              >
                Déplier
              </button>
              <span>·</span>
              <button
                onClick={collapseAllFolders}
                className="px-1.5 py-0.5 rounded hover:bg-slate-200 transition-colors"
                title="Tout replier"
              >
                Replier
              </button>
            </div>
          </div>

          {/* Drag instruction notice when dragging is active */}
          {draggedDocId && (
            <div className="p-2.5 bg-emerald-50/90 border-b border-emerald-200 text-xs text-emerald-950 font-medium flex items-center gap-2 animate-pulse">
              <ArrowDownToDot className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Relâchez sur un dossier pour le déplacer</span>
            </div>
          )}

          {/* Root & Folders Tree List */}
          <div
            className={`p-2 space-y-1 max-h-[calc(100vh-14rem)] overflow-y-auto transition-colors ${
              draggedDocId ? 'bg-slate-50/50 ring-1 ring-emerald-300 ring-inset rounded-xl' : ''
            }`}
          >
            {/* Root Node: Tous les documents */}
            <button
              onClick={() => setSelectedFolderId('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                selectedFolderId === 'all'
                  ? 'bg-emerald-900 text-white font-semibold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <HardDrive className={`w-4 h-4 shrink-0 ${selectedFolderId === 'all' ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="truncate">Bibliothèque générale</span>
              </div>
              <span
                className={`font-mono text-[11px] px-2 py-0.5 rounded-full tabular-nums ${
                  selectedFolderId === 'all'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {documents.length}
              </span>
            </button>

            <div className="pt-1.5 pb-1 px-3 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Dossiers par matière ({subjects.length})</span>
              <span className="text-[9px] text-slate-400 normal-case font-sans">Glisser-déposer actif</span>
            </div>

            {/* Subject Folders List with Drag and Drop target */}
            {subjects.map((sub) => {
              const docsInSub = documentsBySubject.get(sub.id) || [];
              const isSelected = selectedFolderId === sub.id;
              const isExpanded = !!expandedFolders[sub.id];
              const isDragOver = dragOverFolderId === sub.id;

              return (
                <div key={sub.id} className="space-y-0.5">
                  <div
                    onClick={() => setSelectedFolderId(sub.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverFolderId !== sub.id) {
                        setDragOverFolderId(sub.id);
                      }
                    }}
                    onDragLeave={(e) => {
                      // Avoid flickering when hovering over children
                      const rect = e.currentTarget.getBoundingClientRect();
                      if (
                        e.clientX < rect.left ||
                        e.clientX >= rect.right ||
                        e.clientY < rect.top ||
                        e.clientY >= rect.bottom
                      ) {
                        setDragOverFolderId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const droppedId = e.dataTransfer.getData('text/plain') || draggedDocId;
                      if (droppedId) {
                        handleDropDocOnSubject(droppedId, sub);
                      }
                    }}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isDragOver
                        ? 'bg-emerald-100 border-2 border-emerald-600 ring-2 ring-emerald-500/30 text-emerald-950 font-bold scale-[1.02] shadow-sm'
                        : isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200 shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {/* Collapse / Expand Arrow */}
                      <button
                        type="button"
                        onClick={(e) => toggleFolderExpand(sub.id, e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Folder Icon with dynamic open/closed state */}
                      {isExpanded || isSelected || isDragOver ? (
                        <FolderOpen
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isDragOver ? 'text-emerald-700 scale-110' : 'text-amber-500'
                          }`}
                        />
                      ) : (
                        <Folder
                          className="w-4 h-4 shrink-0 text-amber-500"
                        />
                      )}

                      <span className="truncate">{sub.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDragOver ? (
                        <span className="text-[10px] bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded shadow-2xs animate-pulse">
                          Déposer ici
                        </span>
                      ) : (
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded tabular-nums ${
                            isSelected
                              ? 'bg-emerald-200 text-emerald-900 font-bold'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {docsInSub.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sub-tree: Documents inside this subject when expanded */}
                  {isExpanded && docsInSub.length > 0 && (
                    <div className="pl-6 pr-1 space-y-0.5 animate-in fade-in duration-150">
                      {docsInSub.map((doc) => {
                        const isDocSelected = selectedDoc?.id === doc.id;
                        const isBeingDragged = draggedDocId === doc.id;

                        return (
                          <div
                            key={doc.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', doc.id);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggedDocId(doc.id);
                            }}
                            onDragEnd={() => {
                              setDraggedDocId(null);
                              setDragOverFolderId(null);
                            }}
                            onClick={() => {
                              setSelectedDoc(doc);
                              setSelectedFolderId(sub.id);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] cursor-grab active:cursor-grabbing transition-all ${
                              isBeingDragged
                                ? 'opacity-40 border border-dashed border-emerald-600 bg-emerald-50'
                                : isDocSelected
                                ? 'bg-slate-900 text-white font-medium'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                            title="Glissez-déposez sur un autre dossier pour changer de matière"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <GripVertical className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100 shrink-0" />
                              <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{doc.name}</span>
                            </div>
                            <span className="font-mono text-[10px] opacity-75 shrink-0 ml-1">
                              {doc.pagesCount}p
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* If folder is expanded but empty */}
                  {isExpanded && docsInSub.length === 0 && (
                    <div className="pl-7 py-1 text-[11px] text-slate-400 italic">
                      Dossier vide (0 document)
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Folder Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span className="font-mono text-[11px]">{documents.length} fichiers au total</span>
            <button
              onClick={() => handleOpenUploadForFolder()}
              className="text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1 text-[11px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau cours</span>
            </button>
          </div>
        </div>

        {/* Center / Right Column: Content Explorer Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Breadcrumb Bar & View Mode Switcher */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Breadcrumb trail */}
            <div className="flex items-center gap-1.5 text-slate-500 overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setSelectedFolderId('all')}
                className="hover:text-slate-900 flex items-center gap-1"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Bibliothèque</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900">
                {currentFolderSubject ? currentFolderSubject.name : 'Tous les documents'}
              </span>
              {selectedDoc && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-emerald-800 truncate max-w-[200px]">
                    {selectedDoc.name}
                  </span>
                </>
              )}
            </div>

            {/* View Mode controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'tree' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Vue détaillée"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Vue grille"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>

              {selectedFolderId !== 'all' && (
                <button
                  onClick={() => handleOpenUploadForFolder(selectedFolderId)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter ici</span>
                </button>
              )}
            </div>
          </div>

          {/* Search within current folder & stats summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  selectedFolderId === 'all'
                    ? 'Rechercher parmi tous les documents...'
                    : `Rechercher dans "${currentFolderSubject?.name}"...`
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            {/* Folder statistics line (Zero-Pill discipline) */}
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono shrink-0">
              <span>{displayedDocuments.length} document(s)</span>
              <span aria-hidden="true">·</span>
              <span>{totalPagesInFolder} pages</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-800 font-semibold">{totalQcmInFolder} QCM générés</span>
            </div>
          </div>

          {/* Hint tip for Drag and Drop */}
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5 text-slate-400" />
              <span>Astuce : Attrapez un document par sa poignée pour le glisser vers un dossier de l'arborescence à gauche.</span>
            </span>
          </div>

          {/* Main Documents Rendering Area */}
          {displayedDocuments.length === 0 ? (
            /* Empty folder state */
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 font-serif">
                {selectedFolderId === 'all'
                  ? 'Aucun document trouvé pour cette recherche'
                  : `Le dossier « ${currentFolderSubject?.name} » est actuellement vide`}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Déposez des cours ou glissez-y des documents depuis un autre dossier pour réorganiser votre préparation.
              </p>
              <button
                onClick={() => handleOpenUploadForFolder(selectedFolderId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Déposer un document dans ce dossier</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedDocuments.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const isBeingDragged = draggedDocId === doc.id;

                return (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', doc.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedDocId(doc.id);
                    }}
                    onDragEnd={() => {
                      setDraggedDocId(null);
                      setDragOverFolderId(null);
                    }}
                    onClick={() => setSelectedDoc(doc)}
                    className={`bg-white border rounded-xl p-4 transition-all shadow-xs cursor-grab active:cursor-grabbing flex flex-col justify-between space-y-3 ${
                      isBeingDragged
                        ? 'opacity-40 border-dashed border-emerald-500 bg-emerald-50/50 scale-[0.98]'
                        : isSelected
                        ? 'border-emerald-700 ring-1 ring-emerald-700 bg-emerald-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-slate-400 opacity-60 hover:opacity-100 shrink-0 cursor-grab" />
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                            {doc.fileType.includes('image') ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>
                          <div className="truncate">
                            <h4 className="font-serif font-bold text-xs text-slate-900 truncate">
                              {doc.name}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono">
                              📁 {doc.subjectName}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDocument(doc.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {doc.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{doc.pagesCount} p. · {formatFileSize(doc.fileSize)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateQcmForDoc(doc);
                        }}
                        className="text-emerald-800 font-bold hover:underline"
                      >
                        Générer QCM →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Detailed List View (with Draggable Cards) */
            <div className="space-y-3">
              {displayedDocuments.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                const isBeingDragged = draggedDocId === doc.id;

                return (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', doc.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedDocId(doc.id);
                    }}
                    onDragEnd={() => {
                      setDraggedDocId(null);
                      setDragOverFolderId(null);
                    }}
                    className={`bg-white border rounded-xl p-5 transition-all shadow-xs cursor-grab active:cursor-grabbing ${
                      isBeingDragged
                        ? 'opacity-40 border-dashed border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                        : isSelected
                        ? 'border-emerald-700 ring-1 ring-emerald-700 bg-emerald-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {/* Drag Handle */}
                        <div className="pt-2 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center shrink-0">
                          {doc.fileType.includes('image') ? (
                            <ImageIcon className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="text-left font-serif font-bold text-sm text-slate-900 hover:text-emerald-800 transition-colors block"
                          >
                            {doc.name}
                          </button>

                          {/* Zero-Pill metadata formatting */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="text-slate-800 font-medium">📁 {doc.subjectName}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{doc.pagesCount} pages</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{formatFileSize(doc.fileSize)}</span>
                            <span aria-hidden="true">·</span>
                            <span>Ajouté le {doc.uploadDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                          title="Consulter l'analyse"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteDocument(doc.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Supprimer le document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Summary preview */}
                    <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {doc.summary}
                    </p>

                    {/* Chapters mini-badges if available */}
                    {doc.chapters && doc.chapters.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {doc.chapters.slice(0, 3).map((ch, i) => (
                          <span
                            key={i}
                            className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[240px]"
                          >
                            {ch.title}
                          </span>
                        ))}
                        {doc.chapters.length > 3 && (
                          <span className="text-[11px] text-slate-400 font-mono self-center">
                            +{doc.chapters.length - 3} chapitres
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 text-slate-500 font-mono">
                        <span>{doc.questionsGeneratedCount} QCM générés</span>
                        <span aria-hidden="true">·</span>
                        <span>{doc.flashcardsCount} fiches créées</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onGenerateFlashcardForDoc(doc)}
                          className="px-3 py-1.5 font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                          <span>Fiches mémo</span>
                        </button>

                        <button
                          onClick={() => onGenerateQcmForDoc(doc)}
                          className="px-3 py-1.5 font-medium text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Générer QCM</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Document Inspector Drawer (shown when a document is clicked) */}
          {selectedDoc && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 animate-in fade-in duration-200 mt-6">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>Dossier : 📁 {selectedDoc.subjectName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedDoc.pagesCount} pages</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 font-serif leading-snug mt-1">
                    {selectedDoc.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onGenerateQcmForDoc(selectedDoc)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Créer des QCM</span>
                  </button>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                    title="Fermer l'aperçu"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-1">
                  Résumé analytique de l'IA :
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedDoc.summary}
                </p>
              </div>

              {/* Chapters list */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2">
                  Chapitres et thèmes indexés ({selectedDoc.chapters.length}) :
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {selectedDoc.chapters.map((ch, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                      <div className="font-semibold text-slate-800">
                        {ch.title}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ch.topics.map((t, ti) => (
                          <span key={ti} className="text-[11px] text-slate-500">
                            {t}{ti < ch.topics.length - 1 ? ' · ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Articles identified */}
              {selectedDoc.keyArticles && selectedDoc.keyArticles.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-1.5">
                    Articles & Textes réglementaires de référence :
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                    {selectedDoc.keyArticles.map((art, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 bg-slate-50 p-1.5 rounded">
                        <span className="text-emerald-700 font-bold shrink-0">§</span>
                        <span className="truncate">{art}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal (With Folder Selection) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-800" />
                <h3 className="text-base font-bold text-slate-900">
                  Déposer un document de cours
                </h3>
              </div>
              <button
                onClick={() => !isUploading && setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Folder / Subject picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dossier de destination (Matière) :
              </label>
              <select
                value={uploadSubjectId}
                onChange={(e) => setUploadSubjectId(e.target.value)}
                disabled={isUploading}
                className="w-full text-xs border border-slate-300 rounded-lg py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    📁 {sub.name} (Pondération {sub.weight})
                  </option>
                ))}
              </select>
            </div>

            {/* File dropzone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fichier (PDF, DOC/DOCX, PPT, Images/Scans, TXT) :
              </label>
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-emerald-50/20">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-medium text-slate-700 text-center">
                  {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un document ou scan'}
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  PDF, DOCX, JPG/PNG scannés jusqu'à 50 Mo
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>

            {/* Progress Bar when uploading/analyzing */}
            {isUploading && (
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{analysisStatus}</span>
                  <span className="font-mono text-emerald-800">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleStartUpload}
                disabled={!selectedFile || isUploading}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Lancer l'analyse et classer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
