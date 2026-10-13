"use client";

import ApexChartWrapper from "@/components/ui/ApexChartWrapper";
import { ApexOptions } from "apexcharts";

export default function GrafikStatusAbsensi({
  data
}: {
  data: { hadir: number; telat: number; izin: number; sakit: number; alpa: number }
}) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: {
          position: "top"
        }
      }
    },
    colors: ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"],
    dataLabels: {
      enabled: true,
      offsetX: 15,
      style: {
        fontSize: "12px",
        colors: ["#1f2937"]
      }
    },
    xaxis: {
      categories: ["Hadir", "Telat", "Izin", "Sakit", "Alpa"],
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          fontWeight: 500,
          colors: ["#4b5563"]
        }
      }
    },
    grid: { show: false },
    tooltip: {
      theme: "light",
      y: {
        formatter: (val) => val + " orang"
      }
    }
  };

  const series = [{
    name: "Total",
    data: [data.hadir, data.telat, data.izin, data.sakit, data.alpa]
  }];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-[380px]">
      <div className="mb-2">
        <h3 className="font-bold text-gray-800 text-base">Rekapitulasi Kehadiran</h3>
        <p className="text-xs text-gray-500">Distribusi status absensi hari ini</p>
      </div>
      <div className="flex-1 w-full relative min-h-0">
        <div className="absolute inset-0">
          <ApexChartWrapper options={options} series={series} type="bar" height="100%" />
        </div>
      </div>
    </div>
  );
}
