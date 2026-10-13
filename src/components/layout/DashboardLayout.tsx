"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { Dock } from "./Dock";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    // Fetch unread notification count
    const fetchNotif = () => {
      fetch("/api/notifikasi/count")
        .then((r) => r.json())
        .then((data) => setNotifCount(data.count ?? 0))
        .catch(() => {});
    };

    fetchNotif(); // initial fetch
    const interval = setInterval(fetchNotif, 10000); // Poll every 10 seconds

    // Push Notification Setup
    const setupPush = async () => {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          const res = await fetch('/api/push/vapidPublic');
          const data = await res.json();
          if (!data.publicKey) return;

          const publicVapidKey = data.publicKey;
          const urlBase64ToUint8Array = (base64String: string) => {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
              .replace(/\-/g, '+')
              .replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) {
              outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
          };

          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
          });

          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
          });
        }
      } catch (err) {
        console.error("Push setup failed", err);
      }
    };

    setupPush();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Navbar notifCount={notifCount} />

      <Dock />

      {/* Main content */}
      <main className="pt-16 pb-32 min-h-screen">
        <div className={`w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 ${pathname === '/admin/penempatan' ? '' : 'max-w-[1400px]'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
