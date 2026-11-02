import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global & Component-level Error Boundary (Rule 134).
 * Menangkap galat rendering/runtime React, mencegah layar blank putih (unmounted React root),
 * dan menampilkan fallback UI solid-filled yang rapi, informatif, dan audit-compliant.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleNavigateHome = (): void => {
    window.location.href = '/proyek';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 text-center select-none">
          {/* Logo Resmi PT Patak Abadi Jaya */}
          <img
            src="/icons/pt-logo.png"
            alt="Logo PT Patak Abadi Jaya"
            className="w-16 h-16 rounded-[14px] mx-auto mb-6 shadow-xs object-cover"
          />

          {/* Judul & Keterangan */}
          <h1 className="text-xl md:text-2xl font-bold text-[#111111] mb-2 tracking-tight">
            Terjadi Kendala Memuat Tampilan
          </h1>
          <p className="text-xs md:text-sm text-[#666666] max-w-md mx-auto mb-6 leading-relaxed">
            Sistem mendeteksi galat saat memuat komponen ini. Data pembukuan Anda tetap aman di Firestore.
          </p>

          {/* Kotak Error Message (Solid Filled, Zero Stroke) */}
          {this.state.error && (
            <div className="bg-[#f5f5f5] rounded-[8px] px-4 py-3 max-w-md w-full mx-auto mb-6 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block mb-1">
                Detail Galat:
              </span>
              <p className="font-mono text-xs text-[#cf1124] break-words">
                {this.state.error.message || String(this.state.error)}
              </p>
            </div>
          )}

          {/* Tombol Aksi Solid Filled */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs md:text-sm font-semibold text-white bg-[#111111] hover:bg-[#2b2b2b] rounded-[10px] transition-colors cursor-pointer border-none shadow-xs whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4 flex-shrink-0" />
              <span>Muat Ulang Halaman</span>
            </button>
            <button
              type="button"
              onClick={this.handleNavigateHome}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs md:text-sm font-semibold text-[#111111] bg-[#f0f0f0] hover:bg-[#e4e4e4] rounded-[10px] transition-colors cursor-pointer border-none whitespace-nowrap"
            >
              <Home className="w-4 h-4 flex-shrink-0" />
              <span>Kembali ke Proyek</span>
            </button>
          </div>

          {/* Brand Footer */}
          <div className="mt-12 text-[11px] text-[#999999] tracking-wider uppercase">
            PT Patak Abadi Jaya • Sistem Logistik Terpadu
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
