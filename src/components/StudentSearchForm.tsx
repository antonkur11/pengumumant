import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface StudentSearchFormProps {
  onSearch: (nisn: string) => Promise<void>;
  isLoading: boolean;
  disabled?: boolean;
}

export const StudentSearchForm: React.FC<StudentSearchFormProps> = ({
  onSearch,
  isLoading,
  disabled = false,
}) => {
  const [nisn, setNisn] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numbers and max 10 digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setNisn(val);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nisn.trim();

    if (!clean) {
      setErrorMessage('NISN wajib diisi.');
      return;
    }

    if (clean.length !== 10) {
      setErrorMessage(`NISN harus terdiri dari tepat 10 digit angka (saat ini ${clean.length} digit).`);
      return;
    }

    setErrorMessage(null);
    await onSearch(clean);
  };

  const handleDemoClick = (demoNisn: string) => {
    setNisn(demoNisn);
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto -mt-8 relative z-20 px-4">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200/90 p-5 sm:p-7 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="nisn-input" className="block text-sm font-bold text-slate-800">
                Nomor Induk Siswa Nasional (NISN)
              </label>
              <span
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-md ${
                  nisn.length === 10
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {nisn.length} / 10 Digit
              </span>
            </div>

            <div className="relative">
              <input
                id="nisn-input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                disabled={disabled || isLoading}
                placeholder="Masukkan NISN Anda"
                value={nisn}
                onChange={handleInputChange}
                className={`w-full px-4 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-mono tracking-wider font-semibold text-slate-900 bg-slate-50/70 border-2 transition-all outline-hidden ${
                  errorMessage
                    ? 'border-red-400 focus:border-red-600 bg-red-50/30'
                    : 'border-slate-200 hover:border-blue-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100'
                } disabled:bg-slate-100 disabled:text-slate-400`}
              />
              {nisn.length > 0 && !isLoading && (
                <button
                  type="button"
                  onClick={() => setNisn('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {errorMessage && (
              <div className="mt-2.5 flex items-center space-x-1.5 text-xs sm:text-sm text-red-600 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={disabled || isLoading}
            className="w-full inline-flex items-center justify-center space-x-2 py-3.5 sm:py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 active:scale-[0.99] transition-all shadow-md shadow-blue-950/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-base sm:text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>MEMVERIFIKASI NISN...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>CEK KELULUSAN</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Fill Tags for Tester convenience */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium text-slate-600">Uji Coba Cepat:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoClick('0012345678')}
              className="px-2 py-1 rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 font-mono text-[11px] font-semibold transition-colors"
              title="Siswa Lulus: Budi Santoso"
            >
              0012345678 (Lulus)
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('0012345687')}
              className="px-2 py-1 rounded-md bg-red-50 text-red-800 hover:bg-red-100 font-mono text-[11px] font-semibold transition-colors"
              title="Siswa Tidak Lulus: Doni Setiawan"
            >
              0012345687 (Tidak Lulus)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
