import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { RoleManagementView } from "./roles-view";

export type User = {
  id: string;
  email: string;
  role: string;
};

async function getUsersWithRoles(): Promise<User[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    },
  );

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role");

  if (error) {
    console.error("Error fetching users with roles:", error);
    return [];
  }

  return data as User[];
}

export default async function RoleManagementPage() {
  const users = await getUsersWithRoles();

  return <RoleManagementView users={users} />;
}
