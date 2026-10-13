"use client";

import ApexChartWrapper from "@/components/ui/ApexChartWrapper";
import { ApexOptions } from "apexcharts";

export default function GrafikDistribusiAkun({
  data
}: {
  data: { role: string; count: number }[]
}) {
  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    labels: data.map(d => d.role),
    colors: ["#3b82f6", "#10b981", "#6366f1"],
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "12px",
              color: "#6b7280"
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 700,
              color: "#1f2937"
            },
            total: {
              show: true,
              showAlways: true,
              label: "Total Akun",
              fontSize: "12px",
              fontWeight: 500,
              color: "#6b7280",
              formatter: function (w) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString();
              }
            }
          }
        },
      }
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 0,
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      markers: {
        shape: "circle",
      }
    },
    tooltip: {
      theme: "light",
      y: {
        formatter: (val) => val + " akun"
      }
    }
  };

  const series = data.map(d => d.count);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-[380px]">
      <div className="mb-4">
        <h3 className="font-bold text-gray-800 text-base">Distribusi Akun</h3>
        <p className="text-xs text-gray-500">Porsi akun berdasarkan role</p>
      </div>
      <div className="flex-1 w-full flex items-center justify-center relative min-h-0">
        <div className="absolute inset-0">
          <ApexChartWrapper options={options} series={series} type="donut" height="100%" />
        </div>
      </div>
    </div>
  );
}
