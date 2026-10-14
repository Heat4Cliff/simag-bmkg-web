"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Smartphone,
  Compass,
  RefreshCw,
  X,
} from "lucide-react";
import {
  getPreciseCoordinates,
  getLastKnownLocation,
  GeoCoordinate,
  GeoErrorDetail,
} from "@/lib/geo";

interface Props {
  role?: string;
}

export default function LocationEnforcerModal({ role }: Props) {
  // Hanya berlaku untuk role MAHASISWA
  const isMahasiswa = role === "MAHASISWA";

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<GeoCoordinate | null>(null);
  const [errorDetail, setErrorDetail] = useState<GeoErrorDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"android" | "ios" | "browser">("android");
  const [isSuccess, setIsSuccess] = useState(false);

  const checkLocation = useCallback(async (isUserInitiated = false) => {
    // Cek cache dulu jika bukan inisiasi manual tombol
    if (!isUserInitiated) {
      const cached = getLastKnownLocation();
      if (cached) {
        setCoords(cached);
        setIsOpen(false);
        return;
      }
    }

    setLoading(true);
    setErrorDetail(null);

    try {
      const result = await getPreciseCoordinates();
      setCoords(result);
      setIsSuccess(true);
      setErrorDetail(null);

      // Emit event agar komponen absensi atau lainnya bisa langsung tahu
      window.dispatchEvent(
        new CustomEvent("simag:location-updated", { detail: result })
      );

      // Tutup otomatis setelah sukses
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
      }, 1500);
    } catch (err: any) {
      console.warn("Location check failed:", err);
      setErrorDetail(err);
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMahasiswa) return;

    // Coba deteksi awal secara halus
    checkLocation(false);

    // Pasang listener jika tab kembali aktif (misal user baru balik dari Settings HP)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const cached = getLastKnownLocation();
        if (!cached) {
          checkLocation(false);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isMahasiswa, checkLocation]);

  if (!isMahasiswa) return null;

  return (
    <>
      {/* Sticky warning banner jika lokasi belum aktif dan modal sedang tertutup */}
      {!coords && !isOpen && errorDetail && (
        <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between sticky top-16 z-40 shadow-sm transition-all">
          <div className="flex items-center gap-2 max-w-[85%]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-white animate-pulse" />
            <span className="truncate">
              Akses Lokasi / GPS di HP Anda belum aktif. Wajib menyalakan GPS untuk presensi BMKG.
            </span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-white text-amber-900 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-50 transition shrink-0 ml-2 shadow"
          >
            Nyalakan GPS
          </button>
        </div>
      )}

      {/* Enforcement Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative overflow-hidden">
            {/* Header / Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-[#1E8A3C]" />

            {/* Close button (jika user ingin melihat dashboard dulu) */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
              title="Tutup sementara"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon & Title */}
            <div className="text-center mt-2">
              <div
                className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-all ${
                  isSuccess
                    ? "bg-green-100 text-green-600"
                    : errorDetail?.type === "POSITION_UNAVAILABLE"
                    ? "bg-amber-100 text-amber-600 animate-bounce"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-9 h-9" />
                ) : (
                  <MapPin className="w-9 h-9" />
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-900">
                {isSuccess
                  ? "Lokasi GPS Berhasil Terverifikasi!"
                  : "Wajib Aktifkan Lokasi (GPS)"}
              </h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {isSuccess
                  ? `Koordinat presisi Anda telah tersimpan dan siap digunakan untuk absensi.`
                  : `Sebagai peserta magang BMKG, sistem mewajibkan koordinat lokasi aktif untuk verifikasi presensi dan validasi radius kantor.`}
              </p>
            </div>

            {/* Status Card */}
            {isSuccess ? (
              <div className="mt-4 p-3.5 bg-green-50 border border-green-200 rounded-xl text-center">
                <p className="text-xs font-bold text-green-800">
                  Koordinat: {coords?.lat.toFixed(6)}, {coords?.lon.toFixed(6)}
                </p>
                <p className="text-[11px] text-green-600 mt-0.5">
                  Akurasi: ~{Math.round(coords?.accuracy || 0)} meter
                </p>
              </div>
            ) : errorDetail ? (
              <div
                className={`mt-4 p-3.5 rounded-xl border text-xs ${
                  errorDetail.type === "POSITION_UNAVAILABLE"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{errorDetail.message}</p>
                    <p className="mt-0.5 text-gray-600 text-[11px]">
                      {errorDetail.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Step-by-step Tabs if not success */}
            {!isSuccess && (
              <div className="mt-4">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Panduan Menyalakan Lokasi:
                </p>

                {/* Tabs */}
                <div className="flex rounded-xl bg-gray-100 p-1 mb-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("android")}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      activeTab === "android"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    📱 Android
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("ios")}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      activeTab === "ios"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    🍏 iPhone (iOS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("browser")}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      activeTab === "browser"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    💻 Laptop / PC
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
                  {activeTab === "android" && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Tarik bilah atas layar HP (Quick Settings).</li>
                      <li>Ketuk ikon <b>Lokasi / GPS</b> hingga menyala biru.</li>
                      <li>
                        Jika browser meminta izin pop-up, pilih <b>Izinkan saat menggunakan app</b>.
                      </li>
                      <li>Klik tombol <b>Deteksi Lokasi Sekarang</b> di bawah.</li>
                    </ol>
                  )}

                  {activeTab === "ios" && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        Buka <b>Pengaturan (Settings)</b> di iPhone.
                      </li>
                      <li>
                        Pilih <b>Privasi & Keamanan</b> → <b>Layanan Lokasi (Aktifkan)</b>.
                      </li>
                      <li>
                        Pilih <b>Safari / Chrome</b> → Ubah ke <b>Saat Menggunakan App</b>.
                      </li>
                      <li>Kembali ke sini lalu klik tombol di bawah.</li>
                    </ol>
                  )}

                  {activeTab === "browser" && (
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        Klik ikon <b>Setelan / Gembok</b> di bilah alamat URL (kiri atas).
                      </li>
                      <li>
                        Cari pengaturan <b>Lokasi (Location)</b> dan ubah ke <b>Izinkan (Allow)</b>.
                      </li>
                      <li>Klik tombol di bawah atau muat ulang halaman.</li>
                    </ol>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-5 space-y-2">
              {!isSuccess && (
                <button
                  type="button"
                  onClick={() => checkLocation(true)}
                  disabled={loading}
                  className="w-full bg-[#1E8A3C] hover:bg-[#197532] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#1E8A3C]/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mencari Koordinat GPS Presisi...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      <span>Aktifkan & Deteksi Lokasi Sekarang</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition text-center"
              >
                {isSuccess ? "Selesai" : "Tutup Sementara"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
