"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function MiniKalender({
  tanggalEvent = []
}: {
  tanggalEvent?: number[]
}) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setSelected(new Date().getDate());
  }, []);

  const tahun = currentDate.getFullYear();
  const bulan = currentDate.getMonth();

  const firstDay = new Date(tahun, bulan, 1).getDay();
  const daysInMonth = new Date(tahun, bulan + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(tahun, bulan - 1, 1));
    setSelected(0);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(tahun, bulan + 1, 1));
    setSelected(0);
  };

  const isToday = (d: number) =>
    isMounted &&
    d === today.getDate() &&
    bulan === today.getMonth() &&
    tahun === today.getFullYear();

  const cells = [];
  // Empty cells for first week
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e-${i}`} />);
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const hasEvent = tanggalEvent.includes(d);
    cells.push(
      <button
        key={d}
        onClick={() => setSelected(d)}
        className={cn(
          "relative w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all mx-auto",
          isToday(d)
            ? "bg-[#1E8A3C] text-white font-bold shadow-md"
            : selected === d
            ? "bg-green-100 text-[#1E8A3C] font-semibold"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        {d}
        {hasEvent && !isToday(d) && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1E8A3C]" />
        )}
      </button>
    );
  }

  return (
    <div>
      {/* Header bulan */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-xs font-semibold text-gray-700">
          {BULAN[bulan]}, {tahun}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Grid hari */}
      <div className="grid grid-cols-7 mb-1">
        {HARI.map((h) => (
          <div key={h} className="text-center text-[10px] font-semibold text-gray-400 py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Grid tanggal */}
      <div className="grid grid-cols-7 gap-y-1">{cells}</div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#1E8A3C]" />
          <span className="text-[10px] text-gray-400">Hari ini</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#1E8A3C]" />
          <span className="text-[10px] text-gray-400">Ada kegiatan</span>
        </div>
      </div>
    </div>
  );
}
