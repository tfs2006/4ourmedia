import React, { useState, useEffect } from 'react';
import { HistoryItem, ProductAnalysis } from '../types';
import { 
  Clock, Trash2, Edit3, Download, ExternalLink, X, 
  ChevronRight, Image, Search, Calendar, Sparkles, Loader2
} from 'lucide-react';
import { getPromoHistory, deletePromoFromHistory } from '../services/supabase';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPromo: (item: HistoryItem) => void;
  userId?: string; // If provided, load from Supabase
}

const generateId = () => `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Storage functions
export function loadHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem('promo_history');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: HistoryItem[]) {
  // Keep only last 50 items to prevent localStorage bloat
  const trimmed = history.slice(0, 50);
  localStorage.setItem('promo_history', JSON.stringify(trimmed));
}

export function addToHistory(
  url: string,
  analysis: ProductAnalysis,
  backgroundImage: string,
  finalImage: string,
  brandKitId?: string
): HistoryItem {
  const history = loadHistory();
  
  // Create thumbnail (smaller version)
  const thumbnail = finalImage; // In production, you'd resize this
  
  const item: HistoryItem = {
    id: generateId(),
    url,
    analysis,
    backgroundImage,
    finalImage,
    brandKitId,
    createdAt: new Date().toISOString(),
    thumbnail,
  };
  
  // Add to beginning (newest first)
  const updated = [item, ...history];
  saveHistory(updated);
  
  return item;
}

export function deleteFromHistory(id: string) {
  const history = loadHistory();
  const updated = history.filter(item => item.id !== id);
  saveHistory(updated);
}

export function clearHistory() {
  localStorage.removeItem('promo_history');
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose, onLoadPromo, userId }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistoryData();
    }
  }, [isOpen, userId]);

  const loadHistoryData = async () => {
    setIsLoading(true);
    try {
      if (userId) {
        // Load from Supabase for authenticated users
        const supabaseHistory = await getPromoHistory(userId);
        // Transform Supabase data to HistoryItem format
        const transformedHistory: HistoryItem[] = supabaseHistory.map(item => ({
          id: item.id,
          url: item.url,
          analysis: item.analysis,
          backgroundImage: item.background_image,
          finalImage: item.final_image,
          brandKitId: item.brand_kit_id,
          createdAt: item.created_at,
          thumbnail: item.final_image,
        }));
        setHistory(transformedHistory);
      } else {
        // Load from localStorage for guests
        setHistory(loadHistory());
      }
    } catch (err) {
      console.error('Error loading history:', err);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userId) {
      // Delete from Supabase
      await deletePromoFromHistory(userId, id);
      loadHistoryData();
    } else {
      // Delete from localStorage
      deleteFromHistory(id);
      setHistory(loadHistory());
    }
  };

  const handleClearAll = async () => {
    if (confirm('Delete all history? This cannot be undone.')) {
      if (userId) {
        // Clear all from Supabase (delete one by one)
        for (const item of history) {
          await deletePromoFromHistory(userId, item.id);
        }
        setHistory([]);
      } else {
        clearHistory();
        setHistory([]);
      }
    }
  };

  const filteredHistory = history.filter(item => 
    item.analysis.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.analysis.headline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between flex-shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Promo History</h2>
              <p className="text-sm text-slate-400">{history.length} saved promos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Search */}
        {history.length > 0 && (
          <div className="p-4 border-b border-slate-700 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by product name, URL, or headline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-12 h-12 mb-4 animate-spin" />
              <p>Loading your history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Sparkles className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No promos yet</h3>
              <p className="text-sm">Your generated promos will appear here</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No results</h3>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredHistory.map(item => (
                <div
                  key={item.id}
                  className="group bg-slate-700/50 rounded-xl overflow-hidden border border-slate-600 hover:border-blue-500/50 transition-all cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[9/16] relative overflow-hidden bg-slate-800">
                    {item.finalImage ? (
                      <img 
                        src={item.finalImage} 
                        alt={item.analysis.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-12 h-12 text-slate-600" />
                      </div>
                    )}
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLoadPromo(item);
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(item.finalImage, `${item.analysis.productName}-promo.png`);
                          }}
                          className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-white truncate">{item.analysis.productName}</h3>
                    <p className="text-xs text-slate-400 truncate">{item.analysis.headline}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedItem && (
          <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-bold text-white">{selectedItem.analysis.productName}</h3>
                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-700 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-4 flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <img 
                    src={selectedItem.finalImage} 
                    alt="" 
                    className="w-full rounded-xl"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 uppercase">Headline</label>
                    <p className="text-white font-semibold">{selectedItem.analysis.headline}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase">Subheadline</label>
                    <p className="text-slate-300">{selectedItem.analysis.subheadline}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase">CTA</label>
                    <p className="text-slate-300">{selectedItem.analysis.callToAction}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase">Source URL</label>
                    <a 
                      href={selectedItem.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 truncate"
                    >
                      {selectedItem.url}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    <button
                      onClick={() => {
                        onLoadPromo(selectedItem);
                        onClose();
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit This Promo
                    </button>
                    <button
                      onClick={() => downloadImage(selectedItem.finalImage, `${selectedItem.analysis.productName}-promo.png`)}
                      className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
