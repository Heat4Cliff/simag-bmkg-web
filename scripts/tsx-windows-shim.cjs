// tsx uses process.geteuid() when available to name its temporary directory.
// Node.js on Windows does not provide it, and some restricted Windows runners
// cannot service the os.userInfo() fallback used by tsx. Supply a stable local
// identifier only for that fallback; POSIX and normal Windows hosts are unchanged.
if (process.platform === "win32" && typeof process.geteuid !== "function") {
  process.geteuid = () => process.env.USERNAME || "simag";
}
