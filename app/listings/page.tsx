import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { getListings } from "../../lib/data";
import { ListingsFilter } from "@/components/listings-filter";
import { ListingsDisplay } from "@/components/listings-display";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const queryClient = new QueryClient();
  const PAGE_SIZE = 20;

  const initialListings = await queryClient.fetchQuery({
    queryKey: ["listings", searchParams],
    queryFn: () => getListings(1, PAGE_SIZE),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <ListingsFilter searchParams={searchParams} />
          <HydrationBoundary state={dehydrate(queryClient)}>
            <ListingsDisplay
              initialListings={initialListings ?? []}
              searchParams={searchParams}
            />
          </HydrationBoundary>
        </div>
      </div>
    </div>
  );
}