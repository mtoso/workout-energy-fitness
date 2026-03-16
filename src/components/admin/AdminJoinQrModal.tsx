import { Copy, QrCode, X } from 'lucide-react';

interface AdminJoinQrModalProps {
  isOpen: boolean;
  joinUrl: string;
  onClose: () => void;
}

const buildQrImageUrl = (joinUrl: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(joinUrl)}`;

export const AdminJoinQrModal = ({
  isOpen,
  joinUrl,
  onClose,
}: AdminJoinQrModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-zinc-200 p-6 md:p-7">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3">
              <QrCode size={14} /> Registrazione palestra
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">QR iscrizione clienti</h2>
            <p className="text-zinc-500 mt-1">
              Il QR apre la registrazione pubblica per nuovi clienti senza coach assegnato.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 flex items-center justify-center"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] p-5 flex flex-col items-center gap-4">
          <img
            src={buildQrImageUrl(joinUrl)}
            alt="QR registrazione palestra"
            className="w-64 h-64 rounded-2xl border border-zinc-200 bg-white"
          />
          <p className="text-sm text-zinc-500 text-center break-all">{joinUrl}</p>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl font-semibold text-zinc-600 hover:bg-zinc-100 w-full sm:w-auto"
          >
            Chiudi
          </button>
          <button
            onClick={() => void navigator.clipboard.writeText(joinUrl)}
            className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold inline-flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Copy size={16} /> Copia link
          </button>
        </div>
      </div>
    </div>
  );
};
