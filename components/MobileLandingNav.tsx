import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { ViewState } from '../lib/appShared';

const NAV_ITEMS: { label: string; view: ViewState }[] = [
  { label: '🎥 Veo Studio', view: 'veo-studio' },
  { label: '📝 Title Scorer', view: 'title-scorer' },
  { label: '✅ Upload Auditor', view: 'upload-auditor' },
  { label: '🧪 Title Tracker', view: 'title-tracker' },
  { label: '🪝 Hook Library', view: 'hook-library' },
  { label: '🖼️ Thumbnail Checker', view: 'thumbnail-checker' },
  { label: '🎓 Free Muse Course', view: 'muse-course' },
  { label: '🎬 Promofinder Suite', view: 'free-tools' },
  { label: '☄️ Perplexity AI', view: 'perplexity' },
];

export default function MobileLandingNav({ onNavigate }: { onNavigate: (view: ViewState) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden px-3 py-2 text-slate-300 hover:text-white transition-colors"
        aria-label="Menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-md border-b border-white/10 shadow-xl">
          <nav className="px-4 py-2 flex flex-col">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.view}
                onClick={() => { onNavigate(item.view); setOpen(false); }}
                className="text-left px-3 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium border-b border-white/5 last:border-0"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
