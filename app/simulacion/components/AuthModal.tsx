'use client';

interface AuthModalProps {
  visible: boolean;
  ok: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function AuthModal({ visible, ok, title, message, onClose }: AuthModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-[rgba(4,12,8,0.55)] backdrop-blur-[3px]">
      <div
        className="w-full max-w-sm bg-[#152019] border border-white/14 rounded-2xl p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-[modalPop_0.18s_ease]"
      >
        <div
          className={`mx-auto mb-3.5 w-12 h-12 rounded-full flex items-center justify-center ${
            ok ? 'bg-green-500/18 text-[#59C36A]' : 'bg-red-500/18 text-[#E2574C]'
          }`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {ok
              ? <path d="M20 6 9 17l-5-5" />
              : <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
            }
          </svg>
        </div>
        <h3 className="font-['Space_Grotesk'] text-base text-[#F1FBF4] m-0 mb-1.5">{title}</h3>
        <p className="text-sm text-[#A9C2B4] m-0 mb-4.5 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-lg border-none bg-[#2C3B33] text-[#F1FBF4] font-['Space_Grotesk'] font-semibold text-sm cursor-pointer hover:brightness-110 transition-all"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
