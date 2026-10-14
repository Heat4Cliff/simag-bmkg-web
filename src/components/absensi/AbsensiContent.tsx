"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { KOORDINAT_KANTOR, RADIUS_ABSENSI_METER, hitungJarakMeter, formatTanggal, formatWaktu } from "@/lib/utils";
import {
  getPreciseCoordinates,
  getLastKnownLocation,
  GeoCoordinate,
  GeoErrorDetail,
} from "@/lib/geo";

type GeoStatus = "idle" | "loading" | "success" | "error";
type AbsenTipe = "MASUK" | "PULANG";

interface AbsensiHariIni {
  jamMasuk?: string;
  jamPulang?: string;
  status?: string;
  lokasiValid?: boolean;
}

export default function AbsensiContent() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [koordinat, setKoordinat] = useState<{ lat: number; lon: number } | null>(null);
  const [jarak, setJarak] = useState<number | null>(null);
  const [errorDetail, setErrorDetail] = useState<GeoErrorDetail | null>(null);
  const [kantorInfo, setKantorInfo] = useState({
    nama: "Kantor BMKG",
    alamat: "",
    latitude: KOORDINAT_KANTOR.latitude,
    longitude: KOORDINAT_KANTOR.longitude,
    radius: RADIUS_ABSENSI_METER,
  });

  const [kameraAktif, setKameraAktif] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [tipe, setTipe] = useState<AbsenTipe>("MASUK");
  const [loading, setLoading] = useState(false);
  const [absensiHariIni, setAbsensiHariIni] = useState<AbsensiHariIni | null>(null);

  const [jenisAbsensi, setJenisAbsensi] = useState<"HADIR" | "IZIN" | "SAKIT">("HADIR");
  const [keterangan, setKeterangan] = useState("");
  const [lampiranBase64, setLampiranBase64] = useState<string | null>(null);
  const [lampiranExt, setLampiranExt] = useState<string | null>(null);
  const [isLibur, setIsLibur] = useState(false);
  const [keteranganLibur, setKeteranganLibur] = useState("");

  const now = new Date();
  const jamString = formatWaktu(now);
  const tanggalString = formatTanggal(now);

  const ambilLokasi = useCallback(async () => {
    setGeoStatus("loading");
    setErrorDetail(null);

    try {
      const coord = await getPreciseCoordinates();
      setKoordinat({ lat: coord.lat, lon: coord.lon });
      setGeoStatus("success");
      setErrorDetail(null);
    } catch (err: any) {
      console.warn("Geolocation error in absensi:", err);
      setGeoStatus("error");
      setErrorDetail(err);
      if (err.type === "POSITION_UNAVAILABLE") {
        toast.error("Layanan Lokasi (GPS) di HP Anda nonaktif. Harap nyalakan GPS di HP.");
      } else if (err.type === "PERMISSION_DENIED") {
        toast.error("Izin akses lokasi ditolak oleh browser.");
      } else {
        toast.error(err.message || "Gagal mendeteksi lokasi GPS.");
      }
    }
  }, []);

  // Hitung ulang jarak setiap kali koordinat atau kantorInfo berubah
  useEffect(() => {
    if (koordinat && koordinat.lat !== 0 && koordinat.lon !== 0) {
      const d = hitungJarakMeter(
        koordinat.lat,
        koordinat.lon,
        kantorInfo.latitude,
        kantorInfo.longitude
      );
      setJarak(d);
    }
  }, [koordinat, kantorInfo]);

  // Pasangkan stream ke video element saat kamera aktif
  useEffect(() => {
    if (kameraAktif && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.warn("Auto-play prevented", e));
    }
  }, [kameraAktif]);

  // Bersihkan stream kamera HANYA saat komponen unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // 1. Fetch status absensi hari ini & info kantor
    fetch("/api/absensi", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.absensi) {
          setAbsensiHariIni(data.absensi);
          if (data.absensi.jamMasuk && !data.absensi.jamPulang && data.absensi.status !== "IZIN" && data.absensi.status !== "SAKIT") {
            setTipe("PULANG");
          }
        }
        if (data.isLibur) {
          setIsLibur(true);
          setKeteranganLibur(data.keteranganLibur);
        }
        if (data.kantor) {
          setKantorInfo(data.kantor);
        }
      })
      .catch(() => {});

    // 2. Cek apakah sudah ada lokasi cached dari modal
    const cached = getLastKnownLocation();
    if (cached) {
      setKoordinat({ lat: cached.lat, lon: cached.lon });
      setGeoStatus("success");
    } else {
      ambilLokasi();
    }

    // 3. Listener event simag:location-updated dari modal
    const handleLocationEvent = (e: any) => {
      const detail: GeoCoordinate = e.detail;
      if (detail?.lat && detail?.lon) {
        setKoordinat({ lat: detail.lat, lon: detail.lon });
        setGeoStatus("success");
        setErrorDetail(null);
      }
    };
    window.addEventListener("simag:location-updated", handleLocationEvent);

    // 4. Pasang continuous watchPosition agar auto-update saat user menyalakan GPS di HP
    let watchId: number | null = null;
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setKoordinat({ lat, lon });
          setGeoStatus("success");
          setErrorDetail(null);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }

    return () => {
      window.removeEventListener("simag:location-updated", handleLocationEvent);
      if (watchId !== null && typeof window !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [ambilLokasi]);

  const mulaiKamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setKameraAktif(true);
      setFoto(null);
    } catch (err) {
      console.warn("Kamera error:", err);
      toast.error("Kamera tidak dapat diakses. Pastikan izin kamera aktif pada browser.");
      setKameraAktif(false);
      setFoto(null);
    }
  };

  const ambilFoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setFoto(dataUrl);
    stopKamera();
  };

  const stopKamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setKameraAktif(false);
  };

  const handleAbsen = async () => {
    if (jenisAbsensi === "HADIR") {
      if (!foto) {
        toast.error("Harap ambil foto selfie terlebih dahulu.");
        return;
      }
      if (!koordinat || koordinat.lat === 0 || koordinat.lon === 0) {
        toast.error("Koordinat GPS belum terdeteksi. Silakan nyalakan GPS di HP dan klik 'Perbarui Lokasi'.");
        return;
      }
    }
    if ((jenisAbsensi === "IZIN" || jenisAbsensi === "SAKIT") && !keterangan && !lampiranBase64) {
      toast.error("Keterangan atau surat lampiran wajib disertakan.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenisAbsensi,
          tipe,
          latitude: koordinat?.lat || 0,
          longitude: koordinat?.lon || 0,
          foto,
          keterangan,
          lampiranBase64,
          lampiranExt,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Terjadi kesalahan.");
      } else {
        if (data.lokasiValid) {
          toast.success(data.pesan || "Absensi berhasil dicatat!");
        } else {
          toast.warning(data.pesan || "Absensi dicatat di luar radius.");
        }
        // Refresh status
        const res2 = await fetch("/api/absensi");
        const data2 = await res2.json();
        setAbsensiHariIni(data2.absensi);
        setFoto(null);
        setKoordinat(null);
        setJarak(null);
        setGeoStatus("idle");
      }
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const lokasiValid = true; // radius dinonaktifkan
  const sudahMasuk = !!absensiHariIni?.jamMasuk;
  const sudahPulang = !!absensiHariIni?.jamPulang;
  const sudahSelesaiAbsenHadir = sudahMasuk && sudahPulang;
  const sudahIzinAtauSakit = absensiHariIni?.status === "IZIN" || absensiHariIni?.status === "SAKIT";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span>
        <span>/</span>
        <span className="text-[#1E8A3C] font-medium">Absensi</span>
      </div>

      <h1 className="text-xl font-bold text-gray-800 mb-1">Absensi Harian</h1>
      <p suppressHydrationWarning className="text-sm text-gray-500 mb-5">{tanggalString} • {jamString}</p>

      {/* Status Absensi Hari Ini */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Status Hari Ini</h3>
        
        {sudahIzinAtauSakit ? (
           <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50 text-center">
             <p className="text-lg font-bold text-green-700 mb-1">
               Status: {absensiHariIni?.status}
             </p>
             <p className="text-sm text-green-600">
               {absensiHariIni?.keterangan}
             </p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border-2 ${sudahMasuk ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
              <p className="text-xs text-gray-500 mb-1">Jam Masuk</p>
              {sudahMasuk ? (
                <>
                  <p className="text-lg font-bold text-green-700">
                    {formatWaktu(new Date(absensiHariIni!.jamMasuk!))}
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Tercatat
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Belum absen
                </p>
              )}
            </div>
            <div className={`p-3 rounded-xl border-2 ${sudahPulang ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
              <p className="text-xs text-gray-500 mb-1">Jam Pulang</p>
              {sudahPulang ? (
                <>
                  <p className="text-lg font-bold text-green-700">
                    {formatWaktu(new Date(absensiHariIni!.jamPulang!))}
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Tercatat
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Belum absen
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form Absensi */}
      {isLibur ? (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center py-10">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🏖️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Hari Ini Libur</h2>
          <p className="text-sm text-gray-500 text-center px-4">
            {keteranganLibur || "Anda tidak perlu melakukan absensi hari ini."}
          </p>
        </div>
      ) : !sudahSelesaiAbsenHadir && !sudahIzinAtauSakit && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          
          {/* Pilih Jenis Absensi */}
          {!sudahMasuk && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Pilih Keterangan</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(["HADIR", "IZIN", "SAKIT"] as const).map((j) => (
                  <button
                    key={j}
                    onClick={() => {
                      setJenisAbsensi(j);
                      if (j !== "HADIR") stopKamera();
                    }}
                    className={`py-2 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      jenisAbsensi === j
                        ? "border-[#1E8A3C] bg-[#1E8A3C] text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {j === "HADIR" ? "Hadir" : j === "IZIN" ? "Izin" : "Sakit"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {jenisAbsensi === "HADIR" ? (
            <>
              {/* Pilih Tipe Masuk/Pulang */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Tipe Absensi</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(["MASUK", "PULANG"] as AbsenTipe[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipe(t)}
                      disabled={t === "MASUK" && sudahMasuk}
                      className={`py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                        tipe === t
                          ? "border-[#1E8A3C] bg-[#1E8A3C] text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                      }`}
                    >
                      Absen {t === "MASUK" ? "Masuk" : "Pulang"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 1: Foto */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">1. Ambil Foto</p>
                <canvas ref={canvasRef} className="hidden" />

                {foto ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={foto} alt="Foto absensi" className="w-full rounded-xl object-cover max-h-48" />
                    <button
                      onClick={() => { setFoto(null); mulaiKamera(); }}
                      className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow text-gray-600 hover:text-gray-800"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Foto siap
                    </div>
                  </div>
                ) : kameraAktif ? (
                  <div>
                    <video
                      ref={videoRef}
                      className="w-full rounded-xl bg-black max-h-48 object-cover"
                      muted
                      autoPlay
                      playsInline
                    />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={stopKamera}
                        className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Tutup Kamera
                      </button>
                      <button
                        type="button"
                        onClick={ambilFoto}
                        className="w-full bg-[#1E8A3C] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#166c2f] transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" /> Ambil Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={mulaiKamera}
                    className="w-full flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-[#1E8A3C]" />
                    Buka Kamera
                  </button>
                )}

                {/* Step 2: Lokasi GPS */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">2. Lokasi GPS Presisi</p>
                      <p className="text-[11px] text-gray-500">Target Presensi: {kantorInfo.nama}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => ambilLokasi()}
                      disabled={geoStatus === "loading"}
                      className="text-xs text-[#1E8A3C] hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${geoStatus === "loading" ? "animate-spin" : ""}`} />
                      Perbarui Lokasi
                    </button>
                  </div>

                  <div className={`p-4 rounded-xl border-2 transition-all ${
                    geoStatus === "success"
                      ? jarak !== null && jarak <= kantorInfo.radius
                        ? "border-green-200 bg-green-50/50"
                        : "border-amber-200 bg-amber-50/50"
                      : geoStatus === "error"
                      ? "border-red-200 bg-red-50/50"
                      : "border-gray-100 bg-gray-50"
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        geoStatus === "success"
                          ? jarak !== null && jarak <= kantorInfo.radius
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                          : geoStatus === "error"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-sm">
                        {geoStatus === "loading" && (
                          <div className="flex items-center gap-2 text-gray-600 py-1">
                            <Loader2 className="w-4 h-4 animate-spin text-[#1E8A3C]" />
                            <span>Mencari koordinat satelit GPS & sinyal seluler...</span>
                          </div>
                        )}
                        {geoStatus === "success" && koordinat && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-gray-800">
                                {koordinat.lat.toFixed(6)}, {koordinat.lon.toFixed(6)}
                              </span>
                              <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3 text-green-600" /> GPS Terkunci
                              </span>
                            </div>
                            {jarak !== null && (
                              <p className={`text-xs font-semibold ${jarak <= kantorInfo.radius ? "text-green-700" : "text-amber-700"}`}>
                                Jarak ke {kantorInfo.nama}: ~{Math.round(jarak)} meter (Maks: {kantorInfo.radius}m)
                              </p>
                            )}
                          </div>
                        )}
                        {geoStatus === "error" && (
                          <div className="space-y-1.5">
                            <p className="font-bold text-red-600">
                              {errorDetail?.message || "Gagal Mendapatkan Lokasi"}
                            </p>
                            <p className="text-xs text-gray-600">
                              {errorDetail?.suggestion || "Pastikan izin akses lokasi diaktifkan pada browser dan GPS di HP Anda menyala."}
                            </p>
                            <button
                              type="button"
                              onClick={() => ambilLokasi()}
                              className="mt-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Coba Deteksi Ulang
                            </button>
                          </div>
                        )}
                        {geoStatus === "idle" && (
                          <div>
                            <p className="font-medium text-gray-600">Lokasi belum terdeteksi</p>
                            <button
                              type="button"
                              onClick={() => ambilLokasi()}
                              className="mt-1.5 text-xs bg-[#1E8A3C] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#197532] transition-colors"
                            >
                              Deteksi Lokasi GPS
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Form Izin / Sakit
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Unggah Surat Izin / Sakit (Opsional)</p>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Ukuran file maksimal 2MB");
                        e.target.value = "";
                        return;
                      }
                      const ext = file.name.split('.').pop()?.toLowerCase() || '';
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setLampiranBase64(reader.result as string);
                        setLampiranExt(ext);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setLampiranBase64(null);
                      setLampiranExt(null);
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#1E8A3C]/10 file:text-[#1E8A3C] hover:file:bg-[#1E8A3C]/20"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Keterangan Tambahan</p>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Berikan alasan secara detail..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E8A3C]/30 focus:border-[#1E8A3C] text-sm"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Tombol Submit */}
          <button
            onClick={handleAbsen}
            disabled={loading || (jenisAbsensi === "HADIR" && (!foto || !koordinat)) || ((jenisAbsensi === "IZIN" || jenisAbsensi === "SAKIT") && !keterangan && !lampiranBase64)}
            className="w-full bg-[#1E8A3C] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-[#1E8A3C]/20 hover:bg-[#197532] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {jenisAbsensi === "HADIR" ? `Kirim Absensi ${tipe === "MASUK" ? "Masuk" : "Pulang"}` : `Kirim Status ${jenisAbsensi === "IZIN" ? "Izin" : "Sakit"}`}
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            Absensi dilakukan secara digital dan tercatat otomatis oleh sistem.
          </p>
        </div>
      )}

      {sudahSelesaiAbsenHadir && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />

          <h3 className="text-base font-bold text-green-800 mb-1">
            Absensi Hari Ini Lengkap!
          </h3>
          <p className="text-sm text-green-600">
            Selamat, Anda sudah absen masuk dan pulang hari ini.
          </p>
        </div>
      )}
    </div>
  );
}
