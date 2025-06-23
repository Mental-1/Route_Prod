import type { Database } from "@/utils/supabase/database.types";
import { createBrowserClient } from "@/utils/supabase/supabase-browser";
import { useQuery } from "@tanstack/react-query";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type SubCategory = Database["public"]["Tables"]["subcategories"]["Row"];
export const useCategories = () => {
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes cache time
  });
};

export const useSubcategories = (categoryId: number | null) => {
  const supabase = createBrowserClient();

  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async (): Promise<SubCategory[]> => {
      if (!categoryId) return [];

      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("parent_category_id", categoryId)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!categoryId, // Only run when categoryId exists
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

import { useQuery as useSupabaseQuery } from "@supabase-cache-helpers/postgrest-react-query";

export const useCategoriesWithRealtime = () => {
  const supabase = createBrowserClient();

  return useSupabaseQuery(
    supabase.from("categories").select("*").order("name"),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  );
};
