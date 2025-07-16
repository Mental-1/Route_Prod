import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import React from "react";
import { banUser, unbanUser } from "./actions";

interface User {
  id: string;
  email?: string;
  created_at: string;
  banned_until?: string;
  profile?: {
    is_flagged?: boolean;
  };
}

async function getAllUsers(): Promise<User[]> {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing required environment variables");
    return [];
  }
  
  const supabase = createServerClient(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    },
  );

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return data.users as User[];
}

const UserActions = ({ user }: { user: User }) => {
  const isBanned =
    user.banned_until && new Date(user.banned_until) > new Date();

  const action = async () => {
    if (isBanned) {
      await unbanUser(user.id);
    } else {
      await banUser(user.id);
    }
  };

  return (
    <form action={action}>
      <button
        type="submit"
        className={`font-bold py-2 px-4 rounded ${isBanned ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
      >
        {isBanned ? "Unban" : "Ban"}
      </button>
    </form>
  );
};

export default async function UsersPage() {
  const users = await getAllUsers();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">User Management</h1>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Status
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
                  <p className="text-gray-900 dark:text-white whitespace-no-wrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <div className="flex items-center">
                    <span
                      className={`relative inline-block px-3 py-1 font-semibold leading-tight ${user.banned_until && new Date(user.banned_until) > new Date() ? "text-red-900" : "text-green-900"}`}
                    >
                      <span
                        aria-hidden
                        className={`absolute inset-0 ${user.banned_until && new Date(user.banned_until) > new Date() ? "bg-red-200" : "bg-green-200"} opacity-50 rounded-full`}
                      />
                      <span className="relative">
                        {user.banned_until &&
                        new Date(user.banned_until) > new Date()
                          ? "Banned"
                          : "Active"}
                      </span>
                    </span>
                    {user.profile?.is_flagged && (
                      <span className="ml-2 px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-200 rounded-full">
                        Flagged
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm">
                  <UserActions user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
