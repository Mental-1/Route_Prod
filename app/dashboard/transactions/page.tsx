"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";

interface Transaction {
  id: string;
  created_at: string;
  payment_method: string;
  status: "completed" | "pending" | "failed";
  amount: number;
  listings: {
    id: string;
    title: string;
  } | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
        });

        if (dateRange?.from) {
          params.append("startDate", dateRange.from.toISOString());
        }

        if (dateRange?.to) {
          params.append("endDate", dateRange.to.toISOString());
        }

        const response = await fetch(`/api/transactions?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }
        const data = await response.json();
        setTransactions(data.data);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, [page, dateRange]);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full";
      case "pending":
        return "px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full";
      case "failed":
        return "px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full";
      default:
        return "";
    }
  };

  return (
    <Card className="mx-4 my-8 px-4 py-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <div className="flex items-center space-x-4">
            <DatePickerWithRange onDateChangeAction={setDateRange} />
            <Button>Export</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing ID</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.listings?.title || "N/A"}</TableCell>
                <TableCell>{transaction.payment_method}</TableCell>
                <TableCell>
                  {new Date(transaction.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <span className={getStatusClass(transaction.status)}>
                    {transaction.status}
                  </span>
                </TableCell>
                <TableCell>KES {transaction.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
