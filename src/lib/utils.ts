import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Hitung jarak antara dua titik koordinat menggunakan Haversine formula
 * @returns Jarak dalam meter
 */
export function hitungJarakMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // radius bumi dalam meter
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Koordinat kantor UNUGHA Cilacap
export const KOORDINAT_KANTOR = {
  latitude: -7.7186515,
  longitude: 109.0118975,
};
export const RADIUS_ABSENSI_METER = 500;

/**
 * Format tanggal ke format Indonesia panjang
 */
export function formatTanggal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Jakarta"
  });
}

/**
 * Format tanggal ke format compact DD/MM/YYYY
 */
export function formatTanggalCompact(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  });
}

/**
 * Format waktu ke HH:MM
 */
export function formatWaktu(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta"
  });
}

/**
 * Badge color berdasarkan status laporan
 */
export function getStatusLaporanColor(status: string) {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    TERKIRIM: "bg-green-100 text-green-700",
    DIREVIEW: "bg-yellow-100 text-yellow-700",
    DISETUJUI: "bg-green-100 text-green-700",
    REVISI: "bg-orange-100 text-orange-700",
    DITOLAK: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

/**
 * Badge color berdasarkan status absensi
 */
export function getStatusAbsensiColor(status: string) {
  const map: Record<string, string> = {
    HADIR: "bg-green-100 text-green-700",
    TELAT: "bg-yellow-100 text-yellow-700",
    IZIN: "bg-green-100 text-green-700",
    SAKIT: "bg-purple-100 text-purple-700",
    ALPA: "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "Draft",
    TERKIRIM: "Terkirim",
    DIREVIEW: "Direview",
    DISETUJUI: "Disetujui",
    REVISI: "Perlu Revisi",
    DITOLAK: "Ditolak",
    HADIR: "Hadir",
    TELAT: "Telat",
    IZIN: "Izin",
    SAKIT: "Sakit",
    ALPA: "Alpa",
  };
  return map[status] ?? status;
}

/**
 * Mendapatkan string YYYY-MM-DD hari ini berdasarkan zona waktu Asia/Jakarta
 */
export function getJakartaDate(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" });
  return formatter.format(new Date()); // "YYYY-MM-DD"
}

/**
 * Mendapatkan objek Date untuk hari ini (midnight UTC) berdasarkan tanggal di Jakarta
 */
export function getJakartaDateISO(): Date {
  return new Date(`${getJakartaDate()}T00:00:00.000Z`);
}

/**
 * Mendapatkan objek Date untuk awal bulan ini berdasarkan tanggal di Jakarta
 */
export function getJakartaMonthStartISO(): Date {
  const yyyy_mm = getJakartaDate().slice(0, 7);
  return new Date(`${yyyy_mm}-01T00:00:00.000Z`);
}

/**
 * Mendapatkan objek Date untuk akhir bulan ini berdasarkan tanggal di Jakarta
 */
export function getJakartaMonthEndISO(): Date {
  const dateStr = getJakartaDate();
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(5, 7));
  const lastDay = new Date(year, month, 0).getDate();
  const lastDayStr = String(lastDay).padStart(2, '0');
  return new Date(`${year}-${String(month).padStart(2, '0')}-${lastDayStr}T23:59:59.999Z`);
}
