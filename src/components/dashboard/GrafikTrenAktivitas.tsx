"use client";

import ApexChartWrapper from "@/components/ui/ApexChartWrapper";
import { ApexOptions } from "apexcharts";

export default function GrafikTrenAktivitas({
  data
}: {
  data: { hari: string; laporan: number; modul: number }[]
}) {
  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
      zoom: {
        enabled: false
      },
      dropShadow: {
        enabled: true,
        top: 3,
        left: 2,
        blur: 4,
        opacity: 0.1,
      }
    },
    stroke: {
      curve: "smooth",
      width: 3
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
    },
    xaxis: {
      categories: data.map(d => d.hari),
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: "#9ca3af",
          fontSize: "11px",
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: "#9ca3af",
          fontSize: "11px",
        }
      }
    },
    grid: {
      borderColor: "#f3f4f6",
      strokeDashArray: 4,
    },
    colors: ["#3b82f6", "#8b5cf6"],
    dataLabels: {
      enabled: false
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
      markers: {
        shape: "circle",
      }
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (val) => val + " dokumen"
      }
    }
  };

  const series = [
    {
      name: "Laporan Harian",
      data: data.map(d => d.laporan)
    },
    {
      name: "Modul Praktikum",
      data: data.map(d => d.modul)
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-[380px]">
      <div className="mb-2">
        <h3 className="font-bold text-gray-800 text-base">Tren Aktivitas Masuk</h3>
        <p className="text-xs text-gray-500">Total dokumen masuk 7 hari terakhir</p>
      </div>
      <div className="flex-1 w-full relative min-h-0">
        <div className="absolute inset-0">
          <ApexChartWrapper options={options} series={series} type="area" height="100%" />
        </div>
      </div>
    </div>
  );
}
