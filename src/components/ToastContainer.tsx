import { useAuth, ToastMessage } from '../context/AuthContext';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div id="toast-container" className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast: ToastMessage) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 animate-slide-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-zinc-900/95 dark:border-zinc-800 dark:text-zinc-200'
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-charcha-purple" />}
          </div>
          <div className="flex-grow text-sm font-medium leading-relaxed">
            {toast.text}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
