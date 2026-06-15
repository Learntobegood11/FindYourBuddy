import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import EventCard from "../components/EventCard";
import Topbar from "../components/Topbar";

import {
  communities as communityCategories,
} from "../data/communities";

import { supabase } from "../lib/supabase";

function createEmptyForm(
  city = "",
  communityId = "",
) {
  return {
    communityId,
    title: "",
    description: "",
    city,
    venue: "",
    startsAt: "",
    endsAt: "",
    maximumAttendees: 10,
  };
}

function readRelatedCommunity(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function Events({ currentUser }) {
  const [events, setEvents] =
    useState([]);

  const [
    ownedCommunities,
    setOwnedCommunities,
  ] = useState([]);

  const [searchText, setSearchText] =
    useState("");

  const [
    showCreateForm,
    setShowCreateForm,
  ] = useState(false);

  const [formData, setFormData] =
    useState(() =>
      createEmptyForm(
        currentUser?.city || "",
      ),
    );

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const categoryMap = useMemo(() => {
    return Object.fromEntries(
      communityCategories.map(
        (category) => [
          category.id,
          category,
        ],
      ),
    );
  }, []);

  const loadEvents = useCallback(
    async () => {
      if (!currentUser?.id) {
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const [
        ownedCommunitiesResult,
        eventsResult,
      ] = await Promise.all([
        supabase
          .from("communities")
          .select(`
            id,
            name,
            category,
            city,
            owner_id
          `)
          .eq(
            "owner_id",
            currentUser.id,
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("events")
          .select(`
            id,
            community_id,
            creator_id,
            title,
            description,
            city,
            venue,
            starts_at,
            ends_at,
            maximum_attendees,
            created_at,
            communities (
              id,
              name,
              category,
              city,
              owner_id
            ),
            event_attendees (
              user_id,
              joined_at
            )
          `)
          .order("starts_at", {
            ascending: true,
          }),
      ]);

      if (
        ownedCommunitiesResult.error
      ) {
        console.error(
          "Could not load owned communities:",
          ownedCommunitiesResult.error,
        );

        setErrorMessage(
          ownedCommunitiesResult.error
            .message,
        );

        setLoading(false);
        return;
      }

      if (eventsResult.error) {
        console.error(
          "Could not load events:",
          eventsResult.error,
        );

        setErrorMessage(
          eventsResult.error.message,
        );

        setLoading(false);
        return;
      }

      const owned =
        ownedCommunitiesResult.data ||
        [];

      const formattedEvents = (
        eventsResult.data || []
      ).map((event) => {
        const relatedCommunity =
          readRelatedCommunity(
            event.communities,
          );

        const attendees =
          Array.isArray(
            event.event_attendees,
          )
            ? event.event_attendees
            : [];

        return {
          id: event.id,
          communityId:
            event.community_id,
          creatorId:
            event.creator_id,
          title: event.title,
          description:
            event.description,
          city: event.city,
          venue: event.venue,
          startAt:
            event.starts_at,
          endAt:
            event.ends_at,
          maximumAttendees:
            event.maximum_attendees,
          createdAt:
            event.created_at,
          attendees,
          attendeeCount:
            attendees.length,
          currentUserAttending:
            attendees.some(
              (attendance) =>
                attendance.user_id ===
                currentUser.id,
            ),
          communityName:
            relatedCommunity?.name ||
            "Community",
          category:
            relatedCommunity?.category ||
            "social",
        };
      });

      setOwnedCommunities(owned);
      setEvents(formattedEvents);

      setFormData(
        (currentForm) => {
          const selectedStillOwned =
            owned.some(
              (community) =>
                community.id ===
                currentForm.communityId,
            );

          if (selectedStillOwned) {
            return currentForm;
          }

          const firstCommunity =
            owned[0];

          return {
            ...currentForm,
            communityId:
              firstCommunity?.id || "",
            city:
              currentForm.city ||
              firstCommunity?.city ||
              currentUser.city ||
              "",
          };
        },
      );

      setLoading(false);
    },
    [
      currentUser?.id,
      currentUser?.city,
    ],
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents =
    events.filter((event) => {
      const searchableText = [
        event.title,
        event.description,
        event.city,
        event.venue,
        event.communityName,
        categoryMap[event.category]
          ?.name,
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

  function updateForm(event) {
    const { name, value } =
      event.target;

    if (name === "communityId") {
      const selectedCommunity =
        ownedCommunities.find(
          (community) =>
            community.id === value,
        );

      setFormData(
        (currentForm) => ({
          ...currentForm,
          communityId: value,
          city:
            selectedCommunity?.city ||
            currentForm.city,
        }),
      );

      return;
    }

    setFormData(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      }),
    );
  }

  async function createEvent(event) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!currentUser?.id) {
      setErrorMessage(
        "Your account could not be identified.",
      );

      return;
    }

    const ownedCommunity =
      ownedCommunities.find(
        (community) =>
          community.id ===
          formData.communityId,
      );

    if (!ownedCommunity) {
      setErrorMessage(
        "Select a community that you own.",
      );

      return;
    }

    const title =
      formData.title.trim();

    const description =
      formData.description.trim();

    const city =
      formData.city.trim();

    const venue =
      formData.venue.trim();

    const maximumAttendees =
      Number(
        formData.maximumAttendees,
      );

    const startDate =
      new Date(formData.startsAt);

    const endDate =
      formData.endsAt
        ? new Date(formData.endsAt)
        : null;

    if (
      title.length < 3 ||
      title.length > 120
    ) {
      setErrorMessage(
        "The title must contain between 3 and 120 characters.",
      );

      return;
    }

    if (
      description.length < 10 ||
      description.length > 2000
    ) {
      setErrorMessage(
        "The description must contain between 10 and 2000 characters.",
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
      venue.length < 2 ||
      venue.length > 160
    ) {
      setErrorMessage(
        "Enter a valid venue.",
      );

      return;
    }

    if (
      Number.isNaN(
        startDate.getTime(),
      )
    ) {
      setErrorMessage(
        "Select a valid starting date and time.",
      );

      return;
    }

    if (startDate <= new Date()) {
      setErrorMessage(
        "The event must start in the future.",
      );

      return;
    }

    if (
      endDate &&
      (
        Number.isNaN(
          endDate.getTime(),
        ) ||
        endDate <= startDate
      )
    ) {
      setErrorMessage(
        "The ending time must be after the starting time.",
      );

      return;
    }

    if (
      !Number.isInteger(
        maximumAttendees,
      ) ||
      maximumAttendees < 2 ||
      maximumAttendees > 500
    ) {
      setErrorMessage(
        "Maximum attendees must be between 2 and 500.",
      );

      return;
    }

    setWorking(true);

    const { data, error } =
      await supabase
        .from("events")
        .insert({
          community_id:
            ownedCommunity.id,
          creator_id:
            currentUser.id,
          title,
          description,
          city,
          venue,
          starts_at:
            startDate.toISOString(),
          ends_at:
            endDate
              ? endDate.toISOString()
              : null,
          maximum_attendees:
            maximumAttendees,
        })
        .select("id")
        .single();

    if (error) {
      console.error(
        "Could not create event:",
        error,
      );

      setErrorMessage(error.message);
      setWorking(false);
      return;
    }

    await loadEvents();

    setFormData(
      createEmptyForm(
        currentUser.city ||
          ownedCommunity.city ||
          "",
        ownedCommunity.id,
      ),
    );

    setShowCreateForm(false);

    setMessage(
      "Your event was created. You were automatically added as an attendee.",
    );

    console.log(
      "Created event:",
      data.id,
    );

    setWorking(false);
  }

  async function joinEvent(event) {
    setWorking(true);
    setMessage("");
    setErrorMessage("");

    const { error } =
      await supabase.rpc(
        "join_event",
        {
          p_event_id: event.id,
        },
      );

    if (error) {
      console.error(
        "Could not join event:",
        error,
      );

      setErrorMessage(error.message);
      setWorking(false);
      return;
    }

    await loadEvents();

    setMessage(
      `You joined ${event.title}.`,
    );

    setWorking(false);
  }

  async function leaveEvent(event) {
    const shouldLeave =
      window.confirm(
        `Leave ${event.title}?`,
      );

    if (!shouldLeave) {
      return;
    }

    setWorking(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", event.id)
        .eq(
          "user_id",
          currentUser.id,
        )
        .select(
          "event_id, user_id",
        );

    if (error) {
      console.error(
        "Could not leave event:",
        error,
      );

      setErrorMessage(error.message);
      setWorking(false);
      return;
    }

    if (!data || data.length === 0) {
      setErrorMessage(
        "The database did not allow this attendance to be removed.",
      );

      setWorking(false);
      return;
    }

    await loadEvents();

    setMessage(
      `You left ${event.title}.`,
    );

    setWorking(false);
  }

  async function deleteEvent(event) {
    const shouldDelete =
      window.confirm(
        `Delete ${event.title}? This cannot be undone.`,
      );

    if (!shouldDelete) {
      return;
    }

    setWorking(true);
    setMessage("");
    setErrorMessage("");

    const { data, error } =
      await supabase
        .from("events")
        .delete()
        .eq("id", event.id)
        .select("id");

    if (error) {
      console.error(
        "Could not delete event:",
        error,
      );

      setErrorMessage(error.message);
      setWorking(false);
      return;
    }

    if (!data || data.length === 0) {
      setErrorMessage(
        "The database rejected this deletion. Only the creator may delete the event.",
      );

      setWorking(false);
      return;
    }

    await loadEvents();

    setMessage(
      `${event.title} was deleted.`,
    );

    setWorking(false);
  }

  return (
    <main className="main-content">
      <Topbar
        eyebrow="ACTIVITIES"
        title="Events"
        searchValue={searchText}
        onSearch={setSearchText}
        placeholder="Search events, venues or cities"
      />

      <div className="events-toolbar">
        <div>
          <h2>
            Discover real activities
          </h2>

          <p>
            Join events or create one
            for a community that you own.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          disabled={
            ownedCommunities.length ===
            0
          }
          onClick={() =>
            setShowCreateForm(
              (currentValue) =>
                !currentValue,
            )
          }
        >
          {showCreateForm
            ? "Cancel"
            : "Create event"}
        </button>
      </div>

      {ownedCommunities.length ===
        0 && (
        <div className="event-information-message">
          Create a community first. Only
          community owners can create
          events.
        </div>
      )}

      {showCreateForm && (
        <form
          className="create-event-form"
          onSubmit={createEvent}
        >
          <div className="form-introduction">
            <p className="eyebrow">
              NEW EVENT
            </p>

            <h2>Create an activity</h2>

            <p>
              The database will verify
              that you own the selected
              community.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="event-community">
                Community
              </label>

              <select
                id="event-community"
                name="communityId"
                value={
                  formData.communityId
                }
                onChange={updateForm}
                required
              >
                <option value="">
                  Select a community
                </option>

                {ownedCommunities.map(
                  (community) => (
                    <option
                      key={community.id}
                      value={community.id}
                    >
                      {community.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="event-title">
                Event title
              </label>

              <input
                id="event-title"
                name="title"
                type="text"
                value={formData.title}
                onChange={updateForm}
                maxLength="120"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="event-city">
                City
              </label>

              <input
                id="event-city"
                name="city"
                type="text"
                value={formData.city}
                onChange={updateForm}
                maxLength="80"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="event-venue">
                Venue
              </label>

              <input
                id="event-venue"
                name="venue"
                type="text"
                value={formData.venue}
                onChange={updateForm}
                maxLength="160"
                placeholder="Park, stadium, café..."
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="event-start">
                Starts
              </label>

              <input
                id="event-start"
                name="startsAt"
                type="datetime-local"
                value={formData.startsAt}
                onChange={updateForm}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="event-end">
                Ends
              </label>

              <input
                id="event-end"
                name="endsAt"
                type="datetime-local"
                value={formData.endsAt}
                onChange={updateForm}
              />
            </div>

            <div className="form-field">
              <label htmlFor="event-capacity">
                Maximum attendees
              </label>

              <input
                id="event-capacity"
                name="maximumAttendees"
                type="number"
                min="2"
                max="500"
                value={
                  formData.maximumAttendees
                }
                onChange={updateForm}
                required
              />
            </div>

            <div className="form-field full-form-field">
              <label htmlFor="event-description">
                Description
              </label>

              <textarea
                id="event-description"
                name="description"
                value={
                  formData.description
                }
                onChange={updateForm}
                rows="5"
                maxLength="2000"
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
              : "Create event"}
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
          Loading events...
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="events-grid events-page-grid">
          {filteredEvents.map(
            (event) => {
              const category =
                categoryMap[
                  event.category
                ] || {
                  name:
                    event.communityName,
                  icon: "📅",
                  color: "#18a957",
                };

              const isCreator =
                event.creatorId ===
                currentUser.id;

              const eventIsFull =
                event.attendeeCount >=
                event.maximumAttendees;

              const eventStarted =
                new Date(
                  event.startAt,
                ) <= new Date();

              let primaryLabel = "";
              let primaryAction = null;
              let primaryDisabled = false;

              if (!isCreator) {
                if (
                  event.currentUserAttending
                ) {
                  primaryLabel =
                    "Leave event";
                  primaryAction = () =>
                    leaveEvent(event);
                } else {
                  primaryLabel =
                    eventIsFull
                      ? "Event full"
                      : eventStarted
                        ? "Event started"
                        : "Join event";

                  primaryAction = () =>
                    joinEvent(event);

                  primaryDisabled =
                    eventIsFull ||
                    eventStarted;
                }
              }

              return (
                <EventCard
                  key={event.id}
                  event={event}
                  community={category}
                  primaryLabel={
                    primaryLabel
                  }
                  onPrimary={
                    primaryAction
                  }
                  primaryDisabled={
                    working ||
                    primaryDisabled
                  }
                  deleteLabel={
                    isCreator
                      ? "Delete event"
                      : ""
                  }
                  onDelete={
                    isCreator
                      ? () =>
                          deleteEvent(
                            event,
                          )
                      : null
                  }
                  deleteDisabled={
                    working
                  }
                />
              );
            },
          )}
        </div>
      ) : (
        <div className="empty-message">
          <h2>No events found</h2>

          <p>
            Create the first activity
            or change your search.
          </p>
        </div>
      )}
    </main>
  );
}

export default Events;