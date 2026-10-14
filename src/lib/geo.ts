/**
 * Helper utilitas Geolocation presisi tinggi dengan sistem dual-stage fallback
 * Mengatasi kendala GPS timeout atau indoors pada perangkat mobile (Android & iOS).
 */

export interface GeoCoordinate {
  lat: number;
  lon: number;
  accuracy: number;
  timestamp: number;
}

export type GeoErrorType =
  | "UNSUPPORTED"
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "UNKNOWN";

export interface GeoErrorDetail {
  type: GeoErrorType;
  code: number;
  message: string;
  suggestion: string;
}

const STORAGE_KEY = "simag_last_known_geo";

export function saveLastKnownLocation(geo: GeoCoordinate) {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(geo));
    } catch {}
  }
}

export function getLastKnownLocation(): GeoCoordinate | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Hanya berlaku jika kurang dari 10 menit
    if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
      return parsed;
    }
  } catch {}
  return null;
}

/**
 * Mendapatkan lokasi presisi dengan strategi Two-Stage:
 * Stage 1: Coba GPS Satelit (High Accuracy) selama 8 detik.
 * Stage 2: Jika timeout atau sinyal satelit lemah (code 2 / 3), otomatis fallback ke
 *          jaringan seluler / WiFi positioning (Low Accuracy) yang instan.
 */
export function getPreciseCoordinates(): Promise<GeoCoordinate> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return reject({
        type: "UNSUPPORTED",
        code: 0,
        message: "Browser atau perangkat Anda tidak mendukung fitur Geolocation.",
        suggestion: "Gunakan browser modern seperti Google Chrome atau Safari.",
      } as GeoErrorDetail);
    }

    const stage1Options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
    };

    const stage2Options: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 60000,
    };

    const handleSuccess = (pos: GeolocationPosition) => {
      const coord: GeoCoordinate = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy || 0,
        timestamp: pos.timestamp || Date.now(),
      };
      saveLastKnownLocation(coord);
      resolve(coord);
    };

    const mapError = (err: GeolocationPositionError): GeoErrorDetail => {
      switch (err.code) {
        case 1: // PERMISSION_DENIED
          return {
            type: "PERMISSION_DENIED",
            code: 1,
            message: "Izin akses lokasi diblokir oleh browser.",
            suggestion:
              "Buka izin lokasi di setelan browser atau ikon gembok bilah URL.",
          };
        case 2: // POSITION_UNAVAILABLE
          return {
            type: "POSITION_UNAVAILABLE",
            code: 2,
            message: "Layanan Lokasi (GPS) pada perangkat Anda tidak aktif atau sinyal hilang.",
            suggestion:
              "Tarik bilah status HP Anda ke bawah, lalu aktifkan ikon 'Lokasi / GPS'.",
          };
        case 3: // TIMEOUT
          return {
            type: "TIMEOUT",
            code: 3,
            message: "Waktu pencarian lokasi GPS habis.",
            suggestion:
              "Pastikan GPS aktif dan berada di lokasi dengan jangkauan sinyal yang cukup.",
          };
        default:
          return {
            type: "UNKNOWN",
            code: err.code || 0,
            message: err.message || "Gagal memperoleh lokasi.",
            suggestion: "Coba muat ulang halaman atau periksa GPS perangkat.",
          };
      }
    };

    // Stage 1: High Accuracy GPS
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (stage1Err) => {
        // Jika ditolak izinnya, tidak perlu fallback, langsung tolak
        if (stage1Err.code === 1) {
          return reject(mapError(stage1Err));
        }

        // Stage 2: Fallback ke Network / Cell Tower Positioning
        console.warn(
          "GPS High-Accuracy gagal atau timeout, beralih ke Network Location Fallback..."
        );
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (stage2Err) => {
            reject(mapError(stage2Err));
          },
          stage2Options
        );
      },
      stage1Options
    );
  });
}
