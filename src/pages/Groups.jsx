import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import GroupCard from "../components/GroupCard";
import Topbar from "../components/Topbar";

import { communities } from "../data/communities";
import { supabase } from "../lib/supabase";

function createEmptyForm(city = "") {
  return {
    name: "",
    category: "social",
    activity: "",
    city,
    description: "",
    maximumMembers: 8,
  };
}

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

function Groups({ currentUser }) {
  const [groups, setGroups] = useState([]);

  const [selectedGroupId, setSelectedGroupId] =
    useState(null);

  const [searchText, setSearchText] =
    useState("");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [formData, setFormData] = useState(() =>
    createEmptyForm(currentUser?.city || ""),
  );

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const communityMap = useMemo(() => {
    return Object.fromEntries(
      communities.map((community) => [
        community.id,
        community,
      ]),
    );
  }, []);

  const loadCommunities = useCallback(
    async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } =
        await supabase
          .from("communities")
          .select(`
            id,
            owner_id,
            name,
            category,
            activity,
            city,
            description,
            maximum_members,
            created_at,
            community_members (
              user_id,
              role,
              joined_at
            )
          `)
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Could not load communities:",
          error,
        );

        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      const memberIds = [
        ...new Set(
          (data || []).flatMap((group) =>
            (
              group.community_members || []
            ).map(
              (membership) =>
                membership.user_id,
            ),
          ),
        ),
      ];

      let profileRows = [];

      if (memberIds.length > 0) {
        const profileResult =
          await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", memberIds);

        if (profileResult.error) {
          console.error(
            "Could not load member names:",
            profileResult.error,
          );
        } else {
          profileRows =
            profileResult.data || [];
        }
      }

      const profileNameMap =
        Object.fromEntries(
          profileRows.map((profile) => [
            profile.id,
            profile.display_name,
          ]),
        );

      const formattedGroups = (
        data || []
      ).map((group) => {
        const memberRows =
          Array.isArray(
            group.community_members,
          )
            ? group.community_members
            : [];

        const members = memberRows.map(
          (membership) => {
            let memberName =
              profileNameMap[
                membership.user_id
              ];

            if (
              membership.user_id ===
              currentUser?.id
            ) {
              memberName =
                currentUser.displayName ||
                memberName ||
                "You";
            }

            memberName =
              memberName ||
              "Community member";

            return {
              id: membership.user_id,
              name: memberName,
              initials:
                createInitials(memberName),
              role: membership.role,
              joinedAt:
                membership.joined_at,
            };
          },
        );

        const ownerName =
          profileNameMap[group.owner_id] ||
          (group.owner_id ===
          currentUser?.id
            ? currentUser.displayName
            : "Community creator");

        return {
          id: group.id,
          ownerId: group.owner_id,
          ownerName,
          name: group.name,
          communityId: group.category,
          activity: group.activity,
          city: group.city,
          description:
            group.description,
          maximumMembers:
            group.maximum_members,
          createdAt: group.created_at,
          members,
        };
      });

      setGroups(formattedGroups);

      setSelectedGroupId(
        (currentSelectedId) => {
          const selectionStillExists =
            formattedGroups.some(
              (group) =>
                group.id ===
                currentSelectedId,
            );

          if (selectionStillExists) {
            return currentSelectedId;
          }

          return (
            formattedGroups[0]?.id ||
            null
          );
        },
      );

      setLoading(false);
    },
    [
      currentUser?.id,
      currentUser?.displayName,
    ],
  );

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  const filteredGroups =
    groups.filter((group) => {
      const category =
        communityMap[
          group.communityId
        ];

      const searchableText = [
        group.name,
        group.activity,
        group.city,
        group.description,
        category?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        searchText.trim().toLowerCase(),
      );
    });

  const selectedGroup =
    groups.find(
      (group) =>
        group.id === selectedGroupId,
    ) || null;

  const currentMembership =
    selectedGroup?.members.find(
      (member) =>
        member.id === currentUser?.id,
    );

  const currentUserIsMember =
    Boolean(currentMembership);

  const currentUserIsOwner =
    selectedGroup?.ownerId ===
    currentUser?.id;

  function updateForm(event) {
    const { name, value } =
      event.target;

    setFormData(
      (currentFormData) => ({
        ...currentFormData,
        [name]: value,
      }),
    );
  }

  async function createCommunity(event) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!currentUser?.id) {
      setErrorMessage(
        "Your account could not be identified.",
      );

      return;
    }

    const name =
      formData.name.trim();

    const activity =
      formData.activity.trim();

    const city =
      formData.city.trim();

    const description =
      formData.description.trim();

    const maximumMembers =
      Number(formData.maximumMembers);

    if (
      name.length < 3 ||
      name.length > 80
    ) {
      setErrorMessage(
        "The community name must contain between 3 and 80 characters.",
      );

      return;
    }

    if (
      activity.length < 2 ||
      activity.length > 120
    ) {
      setErrorMessage(
        "The activity must contain between 2 and 120 characters.",
      );

      return;
    }

    if (
      city.length < 2 ||
      city.length > 80
    ) {
      setErrorMessage(
        "Enter a valid city.",
      );

      return;
    }

    if (
      description.length < 10 ||
      description.length > 1000
    ) {
      setErrorMessage(
        "The description must contain between 10 and 1000 characters.",
      );

      return;
    }

    if (
      !Number.isInteger(
        maximumMembers,
      ) ||
      maximumMembers < 2 ||
      maximumMembers > 100
    ) {
      setErrorMessage(
        "Maximum members must be between 2 and 100.",
      );

      return;
    }

    setWorking(true);

    const { data, error } =
      await supabase
        .from("communities")
        .insert({
          owner_id: currentUser.id,
          name,
          category:
            formData.category,
          activity,
          city,
          description,
          maximum_members:
            maximumMembers,
        })
        .select("id")
        .single();

    if (error) {
      console.error(
        "Could not create community:",
        error,
      );

      setErrorMessage(error.message);
      setWorking(false);
      return;
    }

    await loadCommunities();

    setSelectedGroupId(data.id);
    setShowCreateForm(false);

    setFormData(
      createEmptyForm(
        currentUser.city || "",
      ),
    );

    setMessage(
      "Your community was created. You are its owner.",
    );

    setWorking(false);
  }

  async function joinSelectedGroup() {
    if (!selectedGroup) {
      return;
    }

    setWorking(true);
    setMessage("");
    setErrorMessage("");

    const { error } =
      await supabase.rpc(
        "join_community",
        {
          p_community_id:
            selectedGroup.id,
        },
      );

    if (error) {
      console.error(
        "Could not join community:",
        error,
      );

      setErrorMessage(error.message);
      setWorking(false);
      return;
    }

    await loadCommunities();

    setMessage(
      `You joined ${selectedGroup.name}.`,
    );

    setWorking(false);
  }

  async function leaveSelectedGroup() {
    if (
      !selectedGroup ||
      !currentUser?.id
    ) {
      return;
    }

    const shouldLeave =
      window.confirm(
        `Leave ${selectedGroup.name}?`,
      );

    if (!shouldLeave) {
      return;
    }

    setWorking(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from("community_members")
        .delete()
        .eq(
          "community_id",
          selectedGroup.id,
        )
        .eq(
          "user_id",
          currentUser.id,
        )
        .select(
          "community_id, user_id",
        );

    if (error) {
      console.error(
        "Could not leave community:",
        error,
      );

      setErrorMessage(error.message);
      setWorking(false);
      return;
    }

    if (!data || data.length === 0) {
      setErrorMessage(
        "The database did not allow this membership to be removed.",
      );

      setWorking(false);
      return;
    }

    await loadCommunities();

    setMessage(
      `You left ${selectedGroup.name}.`,
    );

    setWorking(false);
  }

  async function removeMember(member) {
    if (
      !selectedGroup ||
      !currentUserIsOwner
    ) {
      setErrorMessage(
        "Only the community owner can remove another member.",
      );

      return;
    }

    if (member.role === "owner") {
      setErrorMessage(
        "The community owner cannot be removed.",
      );

      return;
    }

    const shouldRemove =
      window.confirm(
        `Remove ${member.name} from ${selectedGroup.name}?`,
      );

    if (!shouldRemove) {
      return;
    }

    setWorking(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from("community_members")
        .delete()
        .eq(
          "community_id",
          selectedGroup.id,
        )
        .eq(
          "user_id",
          member.id,
        )
        .select(
          "community_id, user_id",
        );

    if (error) {
      console.error(
        "Could not remove member:",
        error,
      );

      setErrorMessage(error.message);
      setWorking(false);
      return;
    }

    if (!data || data.length === 0) {
      setErrorMessage(
        "The database rejected this removal.",
      );

      setWorking(false);
      return;
    }

    await loadCommunities();

    setMessage(
      `${member.name} was removed from the community.`,
    );

    setWorking(false);
  }

  return (
    <main className="main-content">
      <Topbar
        eyebrow="COMMUNITIES"
        title="Find your community"
        searchValue={searchText}
        onSearch={setSearchText}
        placeholder="Search activities, cities or communities"
      />

      <div className="communities-toolbar">
        <div>
          <h2>
            Discover communities
          </h2>

          <p>
            Join an existing community
            or create your own.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() =>
            setShowCreateForm(
              (currentValue) =>
                !currentValue,
            )
          }
        >
          {showCreateForm
            ? "Cancel"
            : "Create community"}
        </button>
      </div>

      {showCreateForm && (
        <form
          className="create-community-form"
          onSubmit={createCommunity}
        >
          <div className="form-introduction">
            <p className="eyebrow">
              NEW COMMUNITY
            </p>

            <h2>
              Create your community
            </h2>

            <p>
              You automatically become
              the community owner.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="community-name">
                Community name
              </label>

              <input
                id="community-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={updateForm}
                maxLength="80"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="community-category">
                Category
              </label>

              <select
                id="community-category"
                name="category"
                value={formData.category}
                onChange={updateForm}
              >
                {communities.map(
                  (community) => (
                    <option
                      key={community.id}
                      value={community.id}
                    >
                      {community.icon}{" "}
                      {community.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="community-activity">
                Main activity
              </label>

              <input
                id="community-activity"
                name="activity"
                type="text"
                value={formData.activity}
                onChange={updateForm}
                maxLength="120"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="community-city">
                City
              </label>

              <input
                id="community-city"
                name="city"
                type="text"
                value={formData.city}
                onChange={updateForm}
                maxLength="80"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="community-limit">
                Maximum members
              </label>

              <input
                id="community-limit"
                name="maximumMembers"
                type="number"
                min="2"
                max="100"
                value={
                  formData.maximumMembers
                }
                onChange={updateForm}
                required
              />
            </div>

            <div className="form-field full-form-field">
              <label htmlFor="community-description">
                Description
              </label>

              <textarea
                id="community-description"
                name="description"
                rows="5"
                maxLength="1000"
                value={formData.description}
                onChange={updateForm}
                required
              />
            </div>
          </div>

          <button
            className="primary-button"
            type="submit"
            disabled={working}
          >
            {working
              ? "Creating..."
              : "Create community"}
          </button>
        </form>
      )}

      {errorMessage && (
        <div className="auth-message error profile-status-message">
          {errorMessage}
        </div>
      )}

      {message && (
        <div className="auth-message success profile-status-message">
          {message}
        </div>
      )}

      {loading ? (
        <div className="profile-loading">
          Loading communities...
        </div>
      ) : (
        <section className="groups-page-layout">
          <div className="group-list">
            {filteredGroups.map(
              (group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onSelect={(chosenGroup) =>
                    setSelectedGroupId(
                      chosenGroup.id,
                    )
                  }
                />
              ),
            )}

            {filteredGroups.length ===
              0 && (
              <div className="empty-message">
                No communities matched
                your search.
              </div>
            )}
          </div>

          <div className="selected-group-card">
            {selectedGroup ? (
              <>
                <div className="selected-community-heading">
                  <div>
                    <p className="eyebrow">
                      {
                        communityMap[
                          selectedGroup
                            .communityId
                        ]?.name
                      }
                    </p>

                    <h2>
                      {selectedGroup.name}
                    </h2>

                    <p className="location">
                      {selectedGroup.city}
                    </p>
                  </div>

                  {currentUserIsOwner && (
                    <span className="admin-badge">
                      Owner
                    </span>
                  )}
                </div>

                <div className="group-information">
                  <h3>Activity</h3>
                  <p>
                    {selectedGroup.activity}
                  </p>
                </div>

                <div className="group-information">
                  <h3>Description</h3>
                  <p>
                    {
                      selectedGroup.description
                    }
                  </p>
                </div>

                <div className="group-information">
                  <h3>Created by</h3>
                  <p>
                    {
                      selectedGroup.ownerName
                    }
                  </p>
                </div>

                <div className="group-information">
                  <div className="member-section-heading">
                    <h3>Members</h3>

                    <span>
                      {
                        selectedGroup.members
                          .length
                      }
                      /
                      {
                        selectedGroup
                          .maximumMembers
                      }
                    </span>
                  </div>

                  <div className="community-members">
                    {selectedGroup.members.map(
                      (member) => (
                        <div
                          className="community-member"
                          key={member.id}
                        >
                          <div className="small-avatar">
                            {member.initials}
                          </div>

                          <div className="community-member-name">
                            <strong>
                              {member.name}
                            </strong>

                            {member.role ===
                              "owner" && (
                              <span>
                                Owner
                              </span>
                            )}
                          </div>

                          {currentUserIsOwner &&
                            member.role !==
                              "owner" && (
                              <button
                                className="remove-member-button"
                                type="button"
                                disabled={working}
                                onClick={() =>
                                  removeMember(
                                    member,
                                  )
                                }
                              >
                                Remove
                              </button>
                            )}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {currentUserIsOwner ? (
                  <div className="admin-information">
                    You own this community.
                    Only you can remove other
                    members.
                  </div>
                ) : currentUserIsMember ? (
                  <button
                    className="secondary-button full-width"
                    type="button"
                    disabled={working}
                    onClick={
                      leaveSelectedGroup
                    }
                  >
                    {working
                      ? "Please wait..."
                      : "Leave community"}
                  </button>
                ) : (
                  <button
                    className="primary-button full-width"
                    type="button"
                    disabled={
                      working ||
                      selectedGroup.members
                        .length >=
                        selectedGroup
                          .maximumMembers
                    }
                    onClick={
                      joinSelectedGroup
                    }
                  >
                    {selectedGroup.members
                      .length >=
                    selectedGroup.maximumMembers
                      ? "Community full"
                      : working
                        ? "Joining..."
                        : "Join community"}
                  </button>
                )}
              </>
            ) : (
              <div className="select-instruction">
                <h2>
                  Select a community
                </h2>

                <p>
                  Choose a community to
                  view its information.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

export default Groups;