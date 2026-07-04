import { useCallback, useEffect, useState } from "react";
import { DateTime } from "luxon";

import { getUserLogins, getUsers } from "./api/users";
import type { UserSummary, User } from "./types";

const PAGE_SIZE = 20;

function App() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogins, setLoadingLogins] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadLoginBatch = useCallback(
    async (start: number, end: number, currentUsers: UserSummary[]) => {
      setLoadingLogins(true);

      try {
        const batch = currentUsers.slice(start, end);

        const updates = await Promise.all(
          batch.map(async (user) => {
            try {
              const data = await getUserLogins(user.id);

              const latest = data.logins.reduce(
                (latest, login) => {
                  if (!latest) {
                    return login;
                  }

                  return DateTime.fromISO(login.login_time).toMillis() >
                    DateTime.fromISO(latest.login_time).toMillis()
                    ? login
                    : latest;
                },
                undefined as (typeof data.logins)[number] | undefined,
              );

              const lastLogin = latest
                ? DateTime.fromISO(latest.login_time)
                : undefined;

              return {
                id: user.id,
                loginStatus: "loaded" as const,
                lastLoginTime: lastLogin,
                lastLoginIp: latest?.ip_v4,
                inactive:
                  lastLogin != null &&
                  lastLogin < DateTime.now().minus({ months: 1 }),
              };
            } catch (error) {
              console.error(`Failed loading logins for user ${user.id}`, error);

              return {
                id: user.id,
                loginStatus: "failed" as const,
              };
            }
          }),
        );

        const updateMap = new Map(updates.map((u) => [u.id, u]));

        setUsers((current) =>
          current.map((user) => {
            const update = updateMap.get(user.id);

            if (!update) {
              return user;
            }

            return {
              ...user,
              ...update,
            };
          }),
        );
      } finally {
        setLoadingLogins(false);
      }
    },
    [],
  );

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);

    try {
      const data = await getUsers();

      const summaries: UserSummary[] = data.map((user: User) => ({
        id: user.id,
        fullName: `${user.first_name} ${user.last_name}`,
        email: user.email,
        lastLoginTime: undefined,
        lastLoginIp: undefined,
        inactive: false,
        loginStatus: "pending",
      }));

      setUsers(summaries);

      await loadLoginBatch(0, PAGE_SIZE, summaries);
    } finally {
      setLoadingUsers(false);
    }
  }, [loadLoginBatch]);

  useEffect(() => {
    loadUsers().catch(console.error);
  }, [loadUsers]);

  const loadMore = async () => {
    const start = visibleCount;
    const end = Math.min(start + PAGE_SIZE, users.length);

    setVisibleCount(end);

    await loadLoginBatch(start, end, users);
  };

  return (
    <>
      <h1>Sitewire Coding Challenge</h1>

      <button onClick={() => loadUsers().catch(console.error)} disabled={loadingUsers || loadingLogins}>Reload</button>

      {loadingUsers && <p>Loading users...</p>}

      {users.slice(0, visibleCount).map((user) => (
        <div key={user.id}>
          <strong>{user.fullName}</strong>
          <br />
          {user.email}
          <br />

          {user.loginStatus === "pending" && <>Loading login...</>}

          {user.loginStatus === "failed" && <>Unable to load login.</>}

          {user.loginStatus === "loaded" && (
            <>
              {user.lastLoginTime?.toRelative() ?? "Never"}
              {" • "}
              {user.lastLoginIp ?? "-"}
            </>
          )}

          {user.inactive && " ⚠️ Inactive"}

          <hr />
        </div>
      ))}

      {loadingLogins && <p>Loading login history...</p>}

      {visibleCount < users.length && (
        <button
          onClick={() => loadMore().catch(console.error)}
          disabled={loadingLogins}>
          {loadingLogins ? "Loading..." : "Load More"}
        </button>
      )}
    </>
  );
}

export default App;
