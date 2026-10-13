"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, AlignLeft, Trash2, Edit2 } from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay 
} from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { cekLibur, cekPeringatan } from "@/lib/holidays";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  color: string;
  type: string;
  raw?: any;
}

export default function KalenderContent() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Form States
  const [formData, setFormData] = useState({
    id: "",
    judul: "",
    tanggal: "",
    jam: "",
    deskripsi: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentDate(new Date());
  }, []);

  const fetchEvents = () => {
    setLoading(true);
    fetch("/api/kalender")
      .then(res => res.json())
      .then(data => setEvents(data.events || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  const handleOpenForm = (date?: string, event?: CalendarEvent) => {
    if (event) {
      setFormData({
        id: event.raw.id,
        judul: event.raw.judul || "",
        tanggal: event.raw.tanggal ? event.raw.tanggal.split('T')[0] : "",
        jam: event.raw.jam || "",
        deskripsi: event.raw.deskripsi || ""
      });
    } else {
      setFormData({
        id: "",
        judul: "",
        tanggal: date || format(new Date(), "yyyy-MM-dd"),
        jam: "",
        deskripsi: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsModalOpen(false);
    setFormData({ id: "", judul: "", tanggal: "", jam: "", deskripsi: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = formData.id ? `/api/kalender/${formData.id}` : "/api/kalender";
      const method = formData.id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message);
      handleCloseForm();
      if (isDetailModalOpen) setIsDetailModalOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus agenda ini?")) return;
    try {
      const res = await fetch(`/api/kalender/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(data.message);
      setIsDetailModalOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEventDetail = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
        <span>Dashboard</span><span>/</span>
        <span className="text-[#1E8A3C] font-medium">Kalender</span>
      </div>

      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Kalender Kegiatan</h1>
          <p className="text-sm text-gray-500 mt-0.5">Jadwal instansi, bimbingan, dan laporan harian Anda.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenForm()} 
            className="flex items-center gap-2 bg-[#1E8A3C] hover:bg-[#0d5cc5] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Agenda
          </button>
          
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={today} className="px-4 py-2 hover:bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 transition-colors">
              Hari Ini
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/50 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#1E8A3C]" />
          </div>
        )}
        
        <div>
          {/* Calendar Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-2xl font-bold text-gray-800 capitalize">
              {format(currentDate, "MMMM yyyy", { locale: id })}
            </h2>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-100 last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 bg-gray-100 gap-[1px] border-b border-gray-100">
            {days.map((day, i) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayEvents = events.filter(e => e.date === dayStr);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isMounted && isSameDay(day, new Date());
              const infoLibur = cekLibur(dayStr);
              const isHoliday = infoLibur.isLibur;
              const peringatan = cekPeringatan(dayStr);
              
              return (
                <div 
                  key={day.toString()} 
                  className={`min-h-[120px] bg-white p-2 transition-colors hover:bg-gray-50 cursor-pointer ${!isCurrentMonth ? "bg-gray-50/50 text-gray-400" : "text-gray-700"} ${isHoliday ? "bg-red-50/20" : ""}`}
                  onClick={(e) => {
                    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'DIV') {
                      handleOpenForm(dayStr);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2 pointer-events-none">
                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-[#1E8A3C] text-white" : ""} ${isHoliday && !isToday ? "text-red-500" : ""}`}>
                      {format(day, dateFormat)}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 overflow-y-auto max-h-[80px] scrollbar-thin">
                    {isHoliday && infoLibur.keterangan && !infoLibur.keterangan.includes("Akhir Pekan") && (
                      <div className="px-2 py-1 text-[11px] font-semibold rounded-md truncate text-white shadow-sm bg-red-500" title={infoLibur.keterangan}>
                        {infoLibur.keterangan}
                      </div>
                    )}
                    {peringatan && (
                      <div className="px-2 py-1 text-[11px] font-semibold rounded-md truncate text-white shadow-sm bg-green-500" title={peringatan}>
                        {peringatan}
                      </div>
                    )}
                    {dayEvents.map(evt => (
                      <div 
                        key={evt.id} 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEventDetail(evt);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold rounded-md truncate text-white shadow-sm cursor-pointer hover:opacity-90"
                        style={{ backgroundColor: evt.color }}
                        title={evt.title}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Detail Event */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedEvent.color }}></div>
                <h3 className="font-bold text-gray-800">Detail Agenda</h3>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-xl font-bold text-gray-800">{selectedEvent.title}</h4>
                {selectedEvent.raw?.tipe && (
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                    {selectedEvent.raw.tipe}
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4 mt-0.5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-800">Tanggal</p>
                    <p>{format(new Date(selectedEvent.date), "dd MMMM yyyy", { locale: id })}</p>
                  </div>
                </div>
                
                {selectedEvent.raw?.jam && (
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <Clock className="w-4 h-4 mt-0.5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800">Waktu</p>
                      <p>{selectedEvent.raw.jam}</p>
                    </div>
                  </div>
                )}

                {selectedEvent.raw?.deskripsi && (
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <AlignLeft className="w-4 h-4 mt-0.5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-800">Deskripsi</p>
                      <p className="whitespace-pre-wrap">{selectedEvent.raw.deskripsi}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Actions (Only for 'jadwal' type and owner or admin) */}
            {selectedEvent.type === "jadwal" && 
             (session?.user?.id === selectedEvent.raw?.userId || (session?.user as any)?.role === "SUPERADMIN") && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2 justify-end">
                <button 
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenForm(undefined, selectedEvent);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(selectedEvent.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Form Agenda */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800">{formData.id ? "Edit Agenda" : "Tambah Agenda"}</h3>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Judul Kegiatan *</label>
                <input 
                  type="text" 
                  required
                  value={formData.judul}
                  onChange={e => setFormData({...formData, judul: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1E8A3C] focus:ring-1 focus:ring-[#1E8A3C]"
                  placeholder="Contoh: Rapat Koordinasi"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tanggal *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.tanggal}
                    onChange={e => setFormData({...formData, tanggal: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1E8A3C] focus:ring-1 focus:ring-[#1E8A3C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jam</label>
                  <input 
                    type="time" 
                    value={formData.jam}
                    onChange={e => setFormData({...formData, jam: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1E8A3C] focus:ring-1 focus:ring-[#1E8A3C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deskripsi</label>
                <textarea 
                  rows={3}
                  value={formData.deskripsi}
                  onChange={e => setFormData({...formData, deskripsi: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1E8A3C] focus:ring-1 focus:ring-[#1E8A3C]"
                  placeholder="Keterangan tambahan..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[#1E8A3C] rounded-xl hover:bg-[#0d5cc5] disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
