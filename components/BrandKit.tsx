import React, { useState, useEffect, useRef } from 'react';
import { BrandKit as BrandKitType, LogoPosition } from '../types';
import { 
  Palette, Upload, Type, Layout, Save, Trash2, Plus, Check, 
  ChevronDown, X, Sparkles, Image, Link2
} from 'lucide-react';

interface BrandKitProps {
  onSelect: (kit: BrandKitType) => void;
  onClose: () => void;
  currentKit?: BrandKitType | null;
}

const LOGO_POSITIONS: { value: LogoPosition; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

const FONT_STYLES = [
  { value: 'modern', label: 'Modern', font: 'Inter' },
  { value: 'classic', label: 'Classic', font: 'Georgia' },
  { value: 'bold', label: 'Bold', font: 'Montserrat' },
  { value: 'playful', label: 'Playful', font: 'Comic Sans MS' },
];

const generateId = () => `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function loadBrandKits(): BrandKitType[] {
  try {
    const stored = localStorage.getItem('promo_brand_kits');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveBrandKits(kits: BrandKitType[]) {
  localStorage.setItem('promo_brand_kits', JSON.stringify(kits));
}

export function getActiveBrandKit(): BrandKitType | null {
  try {
    const activeId = localStorage.getItem('promo_active_brand_kit');
    if (!activeId) return null;
    const kits = loadBrandKits();
    return kits.find(k => k.id === activeId) || null;
  } catch {
    return null;
  }
}

export function setActiveBrandKit(id: string | null) {
  if (id) {
    localStorage.setItem('promo_active_brand_kit', id);
  } else {
    localStorage.removeItem('promo_active_brand_kit');
  }
}

const BrandKit: React.FC<BrandKitProps> = ({ onSelect, onClose, currentKit }) => {
  const [kits, setKits] = useState<BrandKitType[]>([]);
  const [editing, setEditing] = useState<BrandKitType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('top-center');
  const [logoSize, setLogoSize] = useState(30);
  const [displayUrl, setDisplayUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6');
  const [secondaryColor, setSecondaryColor] = useState('#EC4899');
  const [fontStyle, setFontStyle] = useState<'modern' | 'classic' | 'bold' | 'playful'>('modern');

  useEffect(() => {
    setKits(loadBrandKits());
  }, []);

  const resetForm = () => {
    setName('');
    setLogo(null);
    setLogoPosition('top-center');
    setLogoSize(30);
    setDisplayUrl('');
    setPrimaryColor('#8B5CF6');
    setSecondaryColor('#EC4899');
    setFontStyle('modern');
  };

  const loadKitToForm = (kit: BrandKitType) => {
    setName(kit.name);
    setLogo(kit.logo);
    setLogoPosition(kit.logoPosition);
    setLogoSize(kit.logoSize);
    setDisplayUrl(kit.displayUrl);
    setPrimaryColor(kit.primaryColor);
    setSecondaryColor(kit.secondaryColor);
    setFontStyle(kit.fontStyle);
    setEditing(kit);
    setIsCreating(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogo(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const now = new Date().toISOString();
    const kit: BrandKitType = {
      id: editing?.id || generateId(),
      name: name.trim(),
      logo,
      logoPosition,
      logoSize,
      displayUrl,
      primaryColor,
      secondaryColor,
      fontStyle,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
    };

    let updatedKits: BrandKitType[];
    if (editing) {
      updatedKits = kits.map(k => k.id === editing.id ? kit : k);
    } else {
      updatedKits = [...kits, kit];
    }

    saveBrandKits(updatedKits);
    setKits(updatedKits);
    setEditing(null);
    setIsCreating(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    const updatedKits = kits.filter(k => k.id !== id);
    saveBrandKits(updatedKits);
    setKits(updatedKits);
    
    // Clear active if deleted
    const activeId = localStorage.getItem('promo_active_brand_kit');
    if (activeId === id) {
      setActiveBrandKit(null);
    }
  };

  const handleSelectKit = (kit: BrandKitType) => {
    setActiveBrandKit(kit.id);
    onSelect(kit);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Brand Kit</h2>
              <p className="text-sm text-slate-400">Save your branding for instant reuse</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          {!isCreating ? (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Create New Button */}
              <button
                onClick={() => { resetForm(); setIsCreating(true); }}
                className="w-full p-4 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-purple-400 transition-all group"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Create New Brand Kit</span>
              </button>

              {/* Saved Kits */}
              {kits.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Your Brand Kits</h3>
                  {kits.map(kit => (
                    <div
                      key={kit.id}
                      className="p-4 bg-slate-700/50 rounded-xl border border-slate-600 hover:border-purple-500/50 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Logo Preview */}
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${kit.primaryColor}, ${kit.secondaryColor})` }}
                          >
                            {kit.logo ? (
                              <img src={kit.logo} alt="" className="w-full h-full object-contain p-1" />
                            ) : (
                              <Image className="w-6 h-6 text-white/70" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-white truncate">{kit.name}</h4>
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                              {kit.displayUrl && <><Link2 className="w-3 h-3" />{kit.displayUrl}</>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => loadKitToForm(kit)}
                            className="p-2 hover:bg-slate-600 rounded-lg transition-colors text-slate-400 hover:text-white"
                          >
                            <Type className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(kit.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSelectKit(kit)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            Use
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No brand kits yet. Create one to save time!</p>
                </div>
              )}
            </div>
          ) : (
            /* Create/Edit Form */
            <div className="p-4 sm:p-6 space-y-6">
              <button
                onClick={() => { setIsCreating(false); setEditing(null); resetForm(); }}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
              >
                ← Back to list
              </button>

              {/* Kit Name */}
              <div>
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Brand"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-purple-500 outline-none transition-all"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Logo
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div 
                    className="w-20 h-20 rounded-xl bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-600"
                    style={logo ? {} : { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-white/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
                    >
                      Upload Logo
                    </button>
                    {logo && (
                      <button
                        onClick={() => setLogo(null)}
                        className="ml-2 px-4 py-2 text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo Position & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Logo Position
                  </label>
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value as LogoPosition)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-purple-500 outline-none"
                  >
                    {LOGO_POSITIONS.map(pos => (
                      <option key={pos.value} value={pos.value}>{pos.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Logo Size: {logoSize}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    value={logoSize}
                    onChange={(e) => setLogoSize(parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>

              {/* Display URL */}
              <div>
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Display URL
                </label>
                <input
                  type="text"
                  value={displayUrl}
                  onChange={(e) => setDisplayUrl(e.target.value)}
                  placeholder="yourbrand.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-purple-500 outline-none transition-all"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-purple-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 focus:border-purple-500 outline-none font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Font Style */}
              <div>
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Font Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FONT_STYLES.map(style => (
                    <button
                      key={style.value}
                      onClick={() => setFontStyle(style.value as any)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        fontStyle === style.value 
                          ? 'border-purple-500 bg-purple-500/20' 
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                      style={{ fontFamily: style.font }}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Preview
                </label>
                <div 
                  className="aspect-[9/16] max-w-[200px] rounded-xl overflow-hidden mx-auto"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    {logo && (
                      <img src={logo} alt="" className="w-1/3 mb-2 object-contain" />
                    )}
                    <div className="text-white text-center text-sm font-bold">Sample Text</div>
                    {displayUrl && (
                      <div className="text-white/70 text-xs mt-1">{displayUrl}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={!name.trim()}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {editing ? 'Update Brand Kit' : 'Save Brand Kit'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandKit;
