"use client";

import { useState, useEffect } from "react";
import { formatTanggalCompact } from "@/lib/utils";
import Link from "next/link";
import { Loader2, Bell, CheckCircle } from "lucide-react";

export default function NotifikasiContent() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotif = () => {
    fetch("/api/notifikasi")
      .then(r => r.json())
      .then(d => setNotifications(d.notifications || []))
      .finally(() => setLoading(false));
  };

  const markAllAsRead = async () => {
    await fetch("/api/notifikasi", { method: "PATCH" });
    setNotifications(prev => prev.map(n => ({ ...n, dibaca: true })));
  };

  useEffect(() => {
    fetchNotif();
    markAllAsRead();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1E8A3C]" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Notifikasi</span>
      </div>

      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold text-gray-800">Notifikasi</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-5xl mb-3 flex justify-center"><Bell className="w-12 h-12 text-gray-300" /></div>
          <p className="font-semibold text-gray-500">Belum ada notifikasi</p>
          <p className="text-sm text-gray-400 mt-1">Notifikasi baru akan muncul di sini.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {notifications.map((notif: any) => (
              <Link 
                href={notif.link || "#"} 
                key={notif.id}
                className={`block p-5 hover:bg-gray-50 transition-colors ${!notif.dibaca ? 'bg-green-50/30' : ''}`}
              >
                <div className="flex gap-4">
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notif.dibaca ? 'bg-[#1E8A3C] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm ${!notif.dibaca ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                      {notif.judul}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {notif.pesan}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatTanggalCompact(new Date(notif.dibuatPada))}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
