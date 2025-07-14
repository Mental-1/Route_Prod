import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import React from "react";
import { updateUserRole } from "./actions";

type User = {
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

  // Fetch users and their roles from the profiles table
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role");

  if (error) {
    console.error("Error fetching users with roles:", error);
    return [];
  }

  return data as User[];
}

const RoleManagementForm = ({ userId, currentRole }: { userId: string, currentRole: string }) => {
  const action = async (formData: FormData) => {
    await updateUserRole(userId, formData);
  };

  return (
    <form action={action} className="flex items-center gap-2">
      <select
        name="role"
        defaultValue={currentRole}
        className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-2 py-1"
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="moderator">Moderator</option>
      </select>
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded"
      >
        Update
      </button>
    </form>
  );
};

export default async function RoleManagementPage() {
  const users = await getUsersWithRoles();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">User Role Management</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Current Role
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <p className="text-gray-900 dark:text-white whitespace-no-wrap">
                    {user.email}
                  </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <span className="capitalize bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <RoleManagementForm
                    userId={user.id}
                    currentRole={user.role}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
