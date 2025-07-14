"use client";

import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() => import("./analytics-charts"), {
  ssr: false,
  loading: () => <p>Loading charts...</p>,
});

export default function AdminChartsWrapper() {
  return <AnalyticsCharts />;
}
