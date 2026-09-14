import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'warning' | 'info';
interface Toast { id: number; kind: ToastKind; title: string; detail?: string }

interface ToastCtx { toast: (kind: ToastKind, title: string, detail?: string) => void }

const Ctx = createContext<ToastCtx | undefined>(undefined);
let seq = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);

  const toast = useCallback((kind: ToastKind, title: string, detail?: string) => {
    const id = seq++;
    setToasts(t => [...t, { id, kind, title, detail }].slice(-4));
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`animate-in flex items-start gap-3 rounded-xl border bg-white p-3 shadow-lg ${
              t.kind === 'success' ? 'border-green-200' : t.kind === 'warning' ? 'border-orange-200' : 'border-blue-200'
            }`}
          >
            {t.kind === 'success' ? <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" /> :
             t.kind === 'warning' ? <AlertTriangle size={18} className="text-orange-500 mt-0.5 flex-shrink-0" /> :
             <Info size={18} className="text-unicef-blue mt-0.5 flex-shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800">{t.title}</p>
              {t.detail && <p className="text-xs text-gray-500 mt-0.5">{t.detail}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be used within ToastProvider');
  return c;
}
