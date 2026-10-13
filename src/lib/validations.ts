import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Username atau Email wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const passwordSchema = z.object({
  oldPassword: z.string().min(6, "Password lama wajib diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

export const createUserSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  role: z.enum(["SUPERADMIN", "DPL", "MAHASISWA"]),
  nim: z.string().optional(),
  institusiAsal: z.string().optional(),
  programStudi: z.string().optional(),
  periodeMulai: z.string().optional(),
  periodeSelesai: z.string().optional(),
  dplId: z.string().optional(),
  divisi: z.string().optional(),
  noHp: z.string().optional(),
});

export const laporanSchema = z.object({
  tanggal: z.string(),
  judul: z.string().min(3, "Judul minimal 3 karakter"),
  deskripsi: z.string().min(10, "Deskripsi minimal 10 karakter"),
  kendala: z.string().optional(),
});

export const modulSchema = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter"),
  kategoriId: z.string().min(1, "Pilih kategori"),
  konten: z.string().min(10, "Konten minimal 10 karakter"),
});

export const absensiSchema = z.object({
  tipe: z.enum(["MASUK", "PULANG"]),
  latitude: z.number(),
  longitude: z.number(),
  foto: z.string(), // base64
});

export const jadwalSchema = z.object({
  judul: z.string().min(2, "Judul minimal 2 karakter"),
  deskripsi: z.string().optional(),
  tanggal: z.string(),
  jam: z.string().optional(),
  tipe: z.enum(["PRIBADI", "BIMBINGAN", "INSTANSI"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LaporanInput = z.infer<typeof laporanSchema>;
export type ModulInput = z.infer<typeof modulSchema>;
export type AbsensiInput = z.infer<typeof absensiSchema>;
export type JadwalInput = z.infer<typeof jadwalSchema>;
