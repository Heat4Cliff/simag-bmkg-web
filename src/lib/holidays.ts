import { format, isWeekend } from "date-fns";

// Format: YYYY-MM-DD
export const ID_HOLIDAYS: Record<string, string> = {
  // 2024
  "2024-01-01": "Tahun Baru Masehi",
  "2024-02-08": "Isra Mi'raj Nabi Muhammad SAW",
  "2024-02-09": "Cuti Bersama Tahun Baru Imlek",
  "2024-02-10": "Tahun Baru Imlek 2575 Kongzili",
  "2024-03-11": "Hari Suci Nyepi Tahun Baru Saka 1946",
  "2024-03-12": "Cuti Bersama Hari Suci Nyepi",
  "2024-03-29": "Wafat Isa Al Masih",
  "2024-03-31": "Hari Paskah",
  "2024-04-08": "Cuti Bersama Idul Fitri 1445 H",
  "2024-04-09": "Cuti Bersama Idul Fitri 1445 H",
  "2024-04-10": "Hari Raya Idul Fitri 1445 H",
  "2024-04-11": "Hari Raya Idul Fitri 1445 H",
  "2024-04-12": "Cuti Bersama Idul Fitri 1445 H",
  "2024-04-15": "Cuti Bersama Idul Fitri 1445 H",
  "2024-05-01": "Hari Buruh Internasional",
  "2024-05-09": "Kenaikan Isa Al Masih",
  "2024-05-10": "Cuti Bersama Kenaikan Isa Al Masih",
  "2024-05-23": "Hari Raya Waisak 2568 BE",
  "2024-05-24": "Cuti Bersama Hari Raya Waisak",
  "2024-06-01": "Hari Lahir Pancasila",
  "2024-06-17": "Hari Raya Idul Adha 1445 H",
  "2024-06-18": "Cuti Bersama Idul Adha 1445 H",
  "2024-07-07": "Tahun Baru Islam 1446 H",
  "2024-08-17": "Hari Kemerdekaan Republik Indonesia",
  "2024-09-16": "Maulid Nabi Muhammad SAW",
  "2024-12-25": "Hari Raya Natal",
  "2024-12-26": "Cuti Bersama Hari Raya Natal",

  // 2025
  "2025-01-01": "Tahun Baru Masehi",
  "2025-01-27": "Isra Mi'raj Nabi Muhammad SAW",
  "2025-01-29": "Tahun Baru Imlek 2576 Kongzili",
  "2025-03-29": "Hari Suci Nyepi Tahun Baru Saka 1947",
  "2025-03-31": "Hari Raya Idul Fitri 1446 H",
  "2025-04-01": "Hari Raya Idul Fitri 1446 H",
  "2025-04-18": "Wafat Isa Al Masih",
  "2025-04-20": "Hari Paskah",
  "2025-05-01": "Hari Buruh Internasional",
  "2025-05-12": "Hari Raya Waisak 2569 BE",
  "2025-05-29": "Kenaikan Isa Al Masih",
  "2025-06-01": "Hari Lahir Pancasila",
  "2025-06-06": "Hari Raya Idul Adha 1446 H",
  "2025-06-27": "Tahun Baru Islam 1447 H",
  "2025-08-17": "Hari Kemerdekaan Republik Indonesia",
  "2025-09-05": "Maulid Nabi Muhammad SAW",
  "2025-12-25": "Hari Raya Natal",
};

/**
 * Mengecek apakah suatu tanggal adalah hari libur (nasional/cuti bersama) atau akhir pekan.
 * @param date Objek Date
 * @returns Object berisi { isLibur: boolean, keterangan?: string }
 */
export function cekLibur(date: Date | string | number): { isLibur: boolean; keterangan: string } {
  const d = new Date(date);
  const dateStr = format(d, "yyyy-MM-dd");

  if (ID_HOLIDAYS[dateStr]) {
    return { isLibur: true, keterangan: ID_HOLIDAYS[dateStr] };
  }

  if (isWeekend(d)) {
    const isSaturday = d.getDay() === 6;
    return { 
      isLibur: true, 
      keterangan: isSaturday ? "Akhir Pekan (Sabtu)" : "Akhir Pekan (Minggu)" 
    };
  }

  return { isLibur: false, keterangan: "" };
}

export const COMMEMORATIVE_DAYS: Record<string, string> = {
  // Nasional
  "04-21": "Hari Kartini",
  "05-02": "Hari Pendidikan Nasional",
  "05-20": "Hari Kebangkitan Nasional",
  "08-14": "Hari Pramuka",
  "10-01": "Hari Kesaktian Pancasila",
  "10-28": "Hari Sumpah Pemuda",
  "11-10": "Hari Pahlawan",
  "12-22": "Hari Ibu",
  // UNUGHA / Meteorologi
  "03-23": "Hari Meteorologi Sedunia",
  "07-21": "Hari Meteorologi, Klimatologi, dan Geofisika (HMKG)",
  // Internasional
  "04-22": "Hari Bumi",
  "06-05": "Hari Lingkungan Hidup Sedunia",
  "12-01": "Hari AIDS Sedunia"
};

/**
 * Mengecek apakah suatu tanggal adalah hari peringatan nasional/internasional.
 * Peringatan tidak selalu berarti hari libur.
 * @param date Objek Date
 * @returns string nama peringatan atau null
 */
export function cekPeringatan(date: Date | string | number): string | null {
  const d = new Date(date);
  const monthDay = format(d, "MM-dd");
  return COMMEMORATIVE_DAYS[monthDay] || null;
}
