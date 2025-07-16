"use client";

import React, { useEffect, useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalyticsData } from "./actions";
import { ListingCategoryData } from "./actions";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

interface ChartData {
  labels: string[];
  newUsersByDay: number[];
  newListingsByDay: number[];
  categoryCounts: Record<string, number>;
}

// Helper to generate date labels for the last 7 days
const getLast7DaysLabels = () => {
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
  }
  return labels;
};

export default function AnalyticsCharts() {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      const labels = getLast7DaysLabels();
      const analyticsResult = await getAnalyticsData();

      if ("error" in analyticsResult) {
        console.error("Error fetching chart data:", analyticsResult.error);
        setLoading(false);
        return;
      }

      const { usersData, listingsData } = analyticsResult;

      // Process data for charts
      const newUsersByDay = Array(7).fill(0);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      usersData.users.forEach((user) => {
        const userDate = new Date(user.created_at);
        if (userDate >= sevenDaysAgo) {
          const diffDays = Math.floor(
            (new Date().getTime() - userDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (diffDays < 7) {
            newUsersByDay[6 - diffDays]++;
          }
        }
      });

      const newListingsByDay = Array(7).fill(0);
      listingsData.forEach((listing) => {
        const listingDate = new Date(listing.created_at);
        const diffDays = Math.floor(
          (new Date().getTime() - listingDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (diffDays < 7) {
          newListingsByDay[6 - diffDays]++;
        }
      });

      const categoryCounts: Record<string, number> = listingsData.reduce(
        (acc: Record<string, number>, listing) => {
          if (listing.categories && listing.categories.length > 0) {
            listing.categories.forEach((category) => {
              const categoryName = category.name || "Uncategorized";
              acc[categoryName] = (acc[categoryName] || 0) + 1;
            });
          } else {
            acc["Uncategorized"] = (acc["Uncategorized"] || 0) + 1;
          }
          return acc;
        },
        {},
      );

      setChartData({
        labels,
        newUsersByDay,
        newListingsByDay,
        categoryCounts,
      });
      setLoading(false);
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="flex justify-center items-center h-80">
            <Skeleton className="h-64 w-64 rounded-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chartData) {
    return <div>Could not load chart data.</div>;
  }

  const userGrowthData = {
    labels: chartData.labels,
    datasets: [
      {
        label: "New Users",
        data: chartData.newUsersByDay,
        borderColor: "hsl(var(--primary))",
        backgroundColor: "hsla(var(--primary), 0.2)",
        fill: true,
      },
    ],
  };

  const listingsGrowthData = {
    labels: chartData.labels,
    datasets: [
      {
        label: "New Listings",
        data: chartData.newListingsByDay,
        borderColor: "hsl(var(--accent))",
        backgroundColor: "hsla(var(--accent), 0.2)",
        fill: true,
      },
    ],
  };

  const categoryDistributionData = {
    labels: Object.keys(chartData.categoryCounts),
    datasets: [
      {
        label: "Listings",
        data: Object.values(chartData.categoryCounts),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <Card>
        <CardHeader>
          <CardTitle>User Growth (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Line data={userGrowthData} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>New Listings (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Line data={listingsGrowthData} />
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Listing Distribution by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-80">
          <Doughnut
            data={categoryDistributionData}
            options={{ maintainAspectRatio: false }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
