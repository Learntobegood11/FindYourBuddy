import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Topbar from "../components/Topbar";
import { supabase } from "../lib/supabase";

function createInitials(name = "") {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "MB";
}

function createBuddy(profile) {
  const displayName =
    profile.display_name ||
    "Community member";

  const activities =
    Array.isArray(
      profile.favorite_activities,
    )
      ? profile.favorite_activities
      : [];

  return {
    id: profile.id,
    name: displayName,
    displayName,
    initials:
      createInitials(displayName),
    city: profile.city || "",
    location: profile.city || "",
    occupation:
      profile.occupation || "",
    interests: activities,
    favoriteActivities: activities,
    bio: profile.biography || "",
    biography:
      profile.biography || "",
    isDiscoverable:
      profile.is_discoverable,
  };
}

function BuddyProfileCard({
  profile,
  status,
  request,
  working,
  onSelect,
  onSend,
  onAccept,
  onDecline,
  onCancel,
  onRemove,
}) {
  const buddy = createBuddy(profile);

  return (
    <article className="database-buddy-card">
      <button
        className="database-buddy-main"
        type="button"
        onClick={() => onSelect(buddy)}
      >
        <div className="database-buddy-avatar">
          {buddy.initials}
        </div>

        <div className="database-buddy-heading">
          <h3>{buddy.displayName}</h3>

          <p>
            {buddy.city ||
              "City not specified"}
          </p>
        </div>
      </button>

      {buddy.occupation && (
        <p className="database-buddy-occupation">
          {buddy.occupation}
        </p>
      )}

      {buddy.biography && (
        <p className="database-buddy-biography">
          {buddy.biography}
        </p>
      )}

      {buddy.favoriteActivities.length >
        0 && (
        <div className="database-buddy-tags">
          {buddy.favoriteActivities
            .slice(0, 4)
            .map((activity) => (
              <span key={activity}>
                {activity}
              </span>
            ))}
        </div>
      )}

      <div className="database-buddy-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={() => onSelect(buddy)}
        >
          View profile
        </button>

        {status === "none" && (
          <button
            className="primary-button"
            type="button"
            disabled={working}
            onClick={() =>
              onSend(profile)
            }
          >
            {working
              ? "Sending..."
              : "Send request"}
          </button>
        )}

        {status === "outgoing" && (
          <button
            className="secondary-button"
            type="button"
            disabled={working}
            onClick={() =>
              onCancel(request)
            }
          >
            {working
              ? "Cancelling..."
              : "Cancel request"}
          </button>
        )}

        {status === "incoming" && (
          <>
            <button
              className="primary-button"
              type="button"
              disabled={working}
              onClick={() =>
                onAccept(request)
              }
            >
              Accept
            </button>

            <button
              className="secondary-button"
              type="button"
              disabled={working}
              onClick={() =>
                onDecline(request)
              }
            >
              Decline
            </button>
          </>
        )}

        {status === "friend" && (
          <button
            className="remove-friend-button"
            type="button"
            disabled={working}
            onClick={() =>
              onRemove(profile)
            }
          >
            Remove buddy
          </button>
        )}
      </div>
    </article>
  );
}

function FindBuddy({
  currentUser,
  onSelectBuddy,
}) {
  const [profiles, setProfiles] =
    useState([]);

  const [requests, setRequests] =
    useState([]);

  const [friendships, setFriendships] =
    useState([]);

  const [searchText, setSearchText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [workingKey, setWorkingKey] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadBuddyData = useCallback(
    async () => {
      if (!currentUser?.id) {
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const [
        profilesResult,
        requestsResult,
        friendshipsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(`
            id,
            display_name,
            city,
            occupation,
            favorite_activities,
            biography,
            is_discoverable
          `)
          .neq("id", currentUser.id)
          .order("display_name", {
            ascending: true,
          })
          .limit(200),

        supabase
          .from("friend_requests")
          .select(`
            id,
            sender_id,
            receiver_id,
            created_at
          `)
          .or(
            `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`,
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("friendships")
          .select(`
            user_one_id,
            user_two_id,
            created_at
          `)
          .or(
            `user_one_id.eq.${currentUser.id},user_two_id.eq.${currentUser.id}`,
          ),
      ]);

      if (profilesResult.error) {
        console.error(
          "Could not load buddy profiles:",
          profilesResult.error,
        );

        setErrorMessage(
          profilesResult.error.message,
        );

        setLoading(false);
        return;
      }

      if (requestsResult.error) {
        console.error(
          "Could not load buddy requests:",
          requestsResult.error,
        );

        setErrorMessage(
          requestsResult.error.message,
        );

        setLoading(false);
        return;
      }

      if (friendshipsResult.error) {
        console.error(
          "Could not load friendships:",
          friendshipsResult.error,
        );

        setErrorMessage(
          friendshipsResult.error
            .message,
        );

        setLoading(false);
        return;
      }

      setProfiles(
        profilesResult.data || [],
      );

      setRequests(
        requestsResult.data || [],
      );

      setFriendships(
        friendshipsResult.data || [],
      );

      setLoading(false);
    },
    [currentUser?.id],
  );

  useEffect(() => {
    loadBuddyData();
  }, [loadBuddyData]);

  const profileMap = useMemo(
    () =>
      Object.fromEntries(
        profiles.map((profile) => [
          profile.id,
          profile,
        ]),
      ),
    [profiles],
  );

  const friendIds = useMemo(() => {
    return new Set(
      friendships.map((friendship) =>
        friendship.user_one_id ===
        currentUser?.id
          ? friendship.user_two_id
          : friendship.user_one_id,
      ),
    );
  }, [
    friendships,
    currentUser?.id,
  ]);

  const outgoingRequestMap =
    useMemo(() => {
      return Object.fromEntries(
        requests
          .filter(
            (request) =>
              request.sender_id ===
              currentUser?.id,
          )
          .map((request) => [
            request.receiver_id,
            request,
          ]),
      );
    }, [
      requests,
      currentUser?.id,
    ]);

  const incomingRequestMap =
    useMemo(() => {
      return Object.fromEntries(
        requests
          .filter(
            (request) =>
              request.receiver_id ===
              currentUser?.id,
          )
          .map((request) => [
            request.sender_id,
            request,
          ]),
      );
    }, [
      requests,
      currentUser?.id,
    ]);

  const incomingRequests =
    requests.filter(
      (request) =>
        request.receiver_id ===
        currentUser?.id &&
        profileMap[request.sender_id],
    );

  const friendProfiles =
    profiles.filter((profile) =>
      friendIds.has(profile.id),
    );

  const discoverableProfiles =
    profiles
      .filter(
        (profile) =>
          profile.is_discoverable,
      )
      .filter((profile) => {
        const searchableText = [
          profile.display_name,
          profile.city,
          profile.occupation,
          profile.biography,
          ...(Array.isArray(
            profile.favorite_activities,
          )
            ? profile.favorite_activities
            : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          searchText
            .trim()
            .toLowerCase(),
        );
      });

  function getProfileStatus(profileId) {
    if (friendIds.has(profileId)) {
      return {
        type: "friend",
        request: null,
      };
    }

    if (
      incomingRequestMap[profileId]
    ) {
      return {
        type: "incoming",
        request:
          incomingRequestMap[
            profileId
          ],
      };
    }

    if (
      outgoingRequestMap[profileId]
    ) {
      return {
        type: "outgoing",
        request:
          outgoingRequestMap[
            profileId
          ],
      };
    }

    return {
      type: "none",
      request: null,
    };
  }

  async function runAction(
    actionKey,
    action,
    successMessage,
  ) {
    setWorkingKey(actionKey);
    setMessage("");
    setErrorMessage("");

    const { error } =
      await action();

    if (error) {
      console.error(
        "Buddy action failed:",
        error,
      );

      setErrorMessage(error.message);
      setWorkingKey("");
      return;
    }

    await loadBuddyData();

    setMessage(successMessage);
    setWorkingKey("");
  }

  async function sendRequest(profile) {
    await runAction(
      `send-${profile.id}`,

      () =>
        supabase.rpc(
          "send_buddy_request",
          {
            p_receiver_id:
              profile.id,
          },
        ),

      `Buddy request sent to ${profile.display_name}.`,
    );
  }

  async function acceptRequest(
    request,
  ) {
    const profile =
      profileMap[request.sender_id];

    await runAction(
      `accept-${request.id}`,

      () =>
        supabase.rpc(
          "respond_to_buddy_request",
          {
            p_request_id:
              request.id,
            p_accept: true,
          },
        ),

      `${profile?.display_name || "This user"} is now your buddy.`,
    );
  }

  async function declineRequest(
    request,
  ) {
    const profile =
      profileMap[request.sender_id];

    await runAction(
      `decline-${request.id}`,

      () =>
        supabase.rpc(
          "respond_to_buddy_request",
          {
            p_request_id:
              request.id,
            p_accept: false,
          },
        ),

      `The request from ${profile?.display_name || "this user"} was declined.`,
    );
  }

  async function cancelRequest(
    request,
  ) {
    const profile =
      profileMap[
        request.receiver_id
      ];

    await runAction(
      `cancel-${request.id}`,

      () =>
        supabase.rpc(
          "cancel_buddy_request",
          {
            p_request_id:
              request.id,
          },
        ),

      `The request to ${profile?.display_name || "this user"} was cancelled.`,
    );
  }

  async function removeFriend(
    profile,
  ) {
    const shouldRemove =
      window.confirm(
        `Remove ${profile.display_name} from your buddies?`,
      );

    if (!shouldRemove) {
      return;
    }

    await runAction(
      `remove-${profile.id}`,

      () =>
        supabase.rpc(
          "remove_friendship",
          {
            p_friend_id: profile.id,
          },
        ),

      `${profile.display_name} was removed from your buddies.`,
    );
  }

  return (
    <main className="main-content">
      <Topbar
        eyebrow="PEOPLE"
        title="Find a buddy"
        searchValue={searchText}
        onSearch={setSearchText}
        placeholder="Search names, cities or activities"
      />

      {errorMessage && (
        <div className="auth-message error buddy-page-message">
          {errorMessage}
        </div>
      )}

      {message && (
        <div className="auth-message success buddy-page-message">
          {message}
        </div>
      )}

      {loading ? (
        <div className="profile-loading">
          Loading people...
        </div>
      ) : (
        <>
          {incomingRequests.length >
            0 && (
            <section className="buddy-directory-section">
              <div className="buddy-directory-heading">
                <div>
                  <p className="eyebrow">
                    REQUESTS
                  </p>

                  <h2>
                    Incoming buddy requests
                  </h2>
                </div>

                <span>
                  {
                    incomingRequests.length
                  }
                </span>
              </div>

              <div className="database-buddy-grid">
                {incomingRequests.map(
                  (request) => {
                    const profile =
                      profileMap[
                        request.sender_id
                      ];

                    return (
                      <BuddyProfileCard
                        key={request.id}
                        profile={profile}
                        status="incoming"
                        request={request}
                        working={
                          workingKey.includes(
                            request.id,
                          )
                        }
                        onSelect={
                          onSelectBuddy
                        }
                        onSend={
                          sendRequest
                        }
                        onAccept={
                          acceptRequest
                        }
                        onDecline={
                          declineRequest
                        }
                        onCancel={
                          cancelRequest
                        }
                        onRemove={
                          removeFriend
                        }
                      />
                    );
                  },
                )}
              </div>
            </section>
          )}

          {friendProfiles.length > 0 && (
            <section className="buddy-directory-section">
              <div className="buddy-directory-heading">
                <div>
                  <p className="eyebrow">
                    YOUR BUDDIES
                  </p>

                  <h2>
                    People you connected with
                  </h2>
                </div>

                <span>
                  {friendProfiles.length}
                </span>
              </div>

              <div className="database-buddy-grid">
                {friendProfiles.map(
                  (profile) => (
                    <BuddyProfileCard
                      key={profile.id}
                      profile={profile}
                      status="friend"
                      request={null}
                      working={
                        workingKey ===
                        `remove-${profile.id}`
                      }
                      onSelect={
                        onSelectBuddy
                      }
                      onSend={
                        sendRequest
                      }
                      onAccept={
                        acceptRequest
                      }
                      onDecline={
                        declineRequest
                      }
                      onCancel={
                        cancelRequest
                      }
                      onRemove={
                        removeFriend
                      }
                    />
                  ),
                )}
              </div>
            </section>
          )}

          <section className="buddy-directory-section">
            <div className="buddy-directory-heading">
              <div>
                <p className="eyebrow">
                  DISCOVER
                </p>

                <h2>
                  People looking for buddies
                </h2>
              </div>

              <span>
                {
                  discoverableProfiles.length
                }
              </span>
            </div>

            {discoverableProfiles.length >
            0 ? (
              <div className="database-buddy-grid">
                {discoverableProfiles.map(
                  (profile) => {
                    const status =
                      getProfileStatus(
                        profile.id,
                      );

                    const actionId =
                      status.request?.id ||
                      profile.id;

                    return (
                      <BuddyProfileCard
                        key={profile.id}
                        profile={profile}
                        status={
                          status.type
                        }
                        request={
                          status.request
                        }
                        working={
                          workingKey.includes(
                            actionId,
                          )
                        }
                        onSelect={
                          onSelectBuddy
                        }
                        onSend={
                          sendRequest
                        }
                        onAccept={
                          acceptRequest
                        }
                        onDecline={
                          declineRequest
                        }
                        onCancel={
                          cancelRequest
                        }
                        onRemove={
                          removeFriend
                        }
                      />
                    );
                  },
                )}
              </div>
            ) : (
              <div className="empty-message">
                <h2>
                  No matching profiles
                </h2>

                <p>
                  Try another search or
                  check again after more
                  users create discoverable
                  profiles.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default FindBuddy;