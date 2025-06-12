// app/post-ad/hooks/useCategories.ts
import { useQuery } from "@tanstack/react-query";
import { createBrowserClient } from "@/utils/supabase/supabase-browser";
import { Category, SubCategory } from "@/utils/supabase/db-types";

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

export const useSubcategories = (categoryId: string | null) => {
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

// Advanced: Use supabase-cache-helpers for real-time updates
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
