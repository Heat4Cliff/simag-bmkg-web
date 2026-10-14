"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, CheckCircle2, ShieldAlert, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NotificationPromptModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Jalankan pemeriksaan di client side
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const currentPermission = Notification.permission;
    setPermissionState(currentPermission);

    // Jika notifikasi belum "granted", selalu tampilkan pop-up saat user masuk ke web
    if (currentPermission !== "granted") {
      // Delay sedikit agar tidak bertabrakan dengan load awal halaman
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnableNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser tidak mendukung Web Push Notification.");
      return;
    }

    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === "granted") {
        toast.success("Notifikasi berhasil diaktifkan!");

        // Daftarkan Service Worker & Subscribe Push
        if ("serviceWorker" in navigator && "PushManager" in window) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const res = await fetch("/api/push/vapidPublic");
            const data = await res.json();

            if (data.publicKey) {
              const urlBase64ToUint8Array = (base64String: string) => {
                const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
                const base64 = (base64String + padding)
                  .replace(/-/g, "+")
                  .replace(/_/g, "/");
                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; ++i) {
                  outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
              };

              let subscription = await registration.pushManager.getSubscription();
              if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(data.publicKey),
                });
              }

              if (subscription) {
                await fetch("/api/push/subscribe", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(subscription),
                });
              }
            }
          } catch (swErr) {
            console.warn("Push subscription warning:", swErr);
          }
        }

        setIsOpen(false);
      } else if (permission === "denied") {
        toast.error("Izin notifikasi diblokir di browser.");
      }
    } catch (err) {
      console.error("Gagal meminta izin notifikasi:", err);
      toast.error("Gagal mengaktifkan notifikasi.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative text-center">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1E8A3C] rounded-t-3xl" />

        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Bell Icon with badge */}
        <div className="relative w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#1E8A3C]">
          <BellRing className="w-8 h-8 animate-bounce" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full" />
        </div>

        {/* Title */}
        <h2 className="text-base font-bold text-gray-900">
          Aktifkan Notifikasi SIMAG
        </h2>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
          Dapatkan info real-time untuk status absensi, persetujuan laporan harian & modul dari pembimbing, serta pengumuman BMKG.
        </p>

        {/* Jika sebelumnya diblokir (denied) di browser */}
        {permissionState === "denied" ? (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-left text-xs text-red-800">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">Notifikasi Diblokir di Browser</p>
                <p className="mt-1 text-[11px] text-gray-600">
                  Untuk mengaktifkannya kembali:
                </p>
                <ol className="list-decimal list-inside text-[11px] text-gray-600 mt-1 space-y-0.5">
                  <li>Klik ikon <b>Setelan / Gembok</b> di kiri bilah URL.</li>
                  <li>Ubah izin <b>Notifikasi</b> menjadi <b>Izinkan (Allow)</b>.</li>
                  <li>Muat ulang halaman ini.</li>
                </ol>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2.5 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded-lg text-xs transition"
            >
              Saya Sudah Mengizinkan (Refresh)
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={handleEnableNotification}
              disabled={loading}
              className="w-full bg-[#1E8A3C] hover:bg-[#197532] text-white py-2.5 rounded-xl font-bold text-xs shadow-md shadow-[#1E8A3C]/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Izin...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Nyalakan Notifikasi Sekarang</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
            >
              Nanti Saja
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
