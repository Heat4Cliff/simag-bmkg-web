"use client";

import ApexChartWrapper from "@/components/ui/ApexChartWrapper";
import { ApexOptions } from "apexcharts";

export default function GrafikKehadiran({
  data
}: {
  data: { hari: string; hadir: number; telat: number }[]
}) {
  const options: ApexOptions = {
    chart: {
      type: "line",
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
    },
    stroke: {
      curve: "smooth",
      width: 3,
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
          fontSize: "9px",
        }
      }
    },
    yaxis: {
      min: 0,
      max: 1,
      tickAmount: 1,
      labels: {
        formatter: (val) => (val === 1 ? "H" : "A"),
        style: {
          colors: "#9ca3af",
          fontSize: "10px",
        }
      }
    },
    grid: {
      borderColor: "#f0f0f0",
      strokeDashArray: 3,
      yaxis: {
        lines: {
          show: true
        }
      },
      xaxis: {
        lines: {
          show: false
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      },
    },
    colors: ["#1E8A3C"],
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    tooltip: {
      y: {
        formatter: (val) => (val === 1 ? "Ya" : "Tidak")
      }
    }
  };

  const series = [
    {
      name: "Hadir",
      data: data.map(d => d.hadir)
    }
  ];

  return (
    <div className="w-full h-40">
      <ApexChartWrapper 
        options={options} 
        series={series} 
        type="line" 
        height="100%" 
        width="100%" 
      />
    </div>
  );
}
