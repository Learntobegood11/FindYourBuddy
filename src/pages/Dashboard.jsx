import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import BuddyCard from "../components/BuddyCard";
import EventCard from "../components/EventCard";
import Topbar from "../components/Topbar";

import { buddies } from "../data/buddies";

import {
  communities as communityCategories,
} from "../data/communities";

import { supabase } from "../lib/supabase";

function normalizeText(value = "") {
  return String(value)
    .trim()
    .toLowerCase();
}

function locationsMatch(
  firstLocation,
  secondLocation,
) {
  const first =
    normalizeText(firstLocation);

  const second =
    normalizeText(secondLocation);

  if (!first || !second) {
    return false;
  }

  return (
    first.includes(second) ||
    second.includes(first)
  );
}

function readRelatedCommunity(value) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function Dashboard({
  currentUser,
  onNavigate,
  onSelectBuddy,
}) {
  const [databaseEvents, setDatabaseEvents] =
    useState([]);

  const [eventsLoading, setEventsLoading] =
    useState(true);

  const [eventsError, setEventsError] =
    useState("");

  const [searchText, setSearchText] =
    useState("");

  const [
    selectedCommunity,
    setSelectedCommunity,
  ] = useState("all");

  const displayName =
    currentUser?.displayName?.trim() ||
    "Member";

  const firstName =
    displayName.split(" ")[0] ||
    "there";

  const hasSavedCity = Boolean(
    currentUser?.city?.trim(),
  );

  const activeCity =
    currentUser?.city?.trim() ||
    "Hannover";

  const isUsingDemoCity =
    !hasSavedCity;

  const categoryMap = useMemo(() => {
    return Object.fromEntries(
      communityCategories.map(
        (community) => [
          community.id,
          community,
        ],
      ),
    );
  }, []);

  /*
    Load upcoming events from Supabase.

    The query also loads:
    - The event's community
    - The current attendee rows
  */
  const loadEvents = useCallback(
    async () => {
      setEventsLoading(true);
      setEventsError("");

      const currentTime =
        new Date().toISOString();

      const { data, error } =
        await supabase
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

            community:communities (
              id,
              name,
              category,
              city
            ),

            attendees:event_attendees (
              user_id,
              joined_at
            )
          `)
          .gte(
            "starts_at",
            currentTime,
          )
          .order("starts_at", {
            ascending: true,
          })
          .limit(100);

      if (error) {
        console.error(
          "Could not load Dashboard events:",
          error,
        );

        setEventsError(
          error.message ||
            "Events could not be loaded.",
        );

        setDatabaseEvents([]);
        setEventsLoading(false);
        return;
      }

      const formattedEvents = (
        data || []
      ).map((event) => {
        const relatedCommunity =
          readRelatedCommunity(
            event.community,
          );

        const attendees =
          Array.isArray(
            event.attendees,
          )
            ? event.attendees
            : [];

        return {
          id: event.id,

          communityId:
            event.community_id,

          creatorId:
            event.creator_id,

          title:
            event.title,

          description:
            event.description,

          city:
            event.city,

          venue:
            event.venue,

          startAt:
            event.starts_at,

          endAt:
            event.ends_at,

          maximumAttendees:
            event.maximum_attendees,

          attendeeCount:
            attendees.length,

          attendees,

          currentUserAttending:
            attendees.some(
              (attendance) =>
                attendance.user_id ===
                currentUser?.id,
            ),

          communityName:
            relatedCommunity?.name ||
            "Community",

          category:
            relatedCommunity?.category ||
            "social",
        };
      });

      setDatabaseEvents(
        formattedEvents,
      );

      setEventsLoading(false);
    },
    [currentUser?.id],
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  /*
    Show only events located in the
    signed-in user's selected city.
  */
  const cityEvents =
    databaseEvents.filter((event) =>
      locationsMatch(
        event.city,
        activeCity,
      ),
    );

  /*
    Apply category and search filters.
  */
  const visibleEvents =
    cityEvents.filter((event) => {
      const category =
        categoryMap[event.category];

      const matchesCommunity =
        selectedCommunity === "all" ||
        event.category ===
          selectedCommunity;

      const searchableText = [
        event.title,
        event.description,
        event.venue,
        event.city,
        event.communityName,
        category?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(
          searchText
            .trim()
            .toLowerCase(),
        );

      return (
        matchesCommunity &&
        matchesSearch
      );
    });

  /*
    Buddy profiles are still demonstration
    data. They will be moved to Supabase
    in a later stage.
  */
  const localBuddies =
    buddies.filter((buddy) =>
      locationsMatch(
        buddy.city,
        activeCity,
      ),
    );

  const peopleToDisplay =
    localBuddies.length > 0
      ? localBuddies.slice(0, 3)
      : buddies.slice(0, 3);

  return (
    <main className="main-content">
      <Topbar
        eyebrow="DISCOVER"
        title={`Explore ${activeCity}`}
        searchValue={searchText}
        onSearch={setSearchText}
        placeholder="Search activities, venues or communities"
      />

      <section className="discovery-hero">
        <div className="discovery-hero-content">
          <p className="hero-kicker">
            FINDYOURBUDDY ·{" "}
            {activeCity.toUpperCase()}
          </p>

          <h2>
            Welcome, {firstName}.
            <br />
            Discover something new.
          </h2>

          <p>
            Find activities, communities
            and people nearby in{" "}
            {activeCity}. Meet others who
            do not want to attend alone
            either.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                onNavigate(
                  "find-buddy",
                )
              }
            >
              Find a buddy
            </button>

            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                onNavigate("events")
              }
            >
              Browse events
            </button>

            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                onNavigate("groups")
              }
            >
              Explore communities
            </button>
          </div>
        </div>

        <div className="hero-location-card">
          <span className="location-symbol">
            📍
          </span>

          <div>
            <small>
              Your discovery location
            </small>

            <strong>
              {activeCity}
            </strong>
          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate("profile")
            }
          >
            Change
          </button>
        </div>
      </section>

      {isUsingDemoCity && (
        <div className="demo-location-message">
          <span>💡</span>

          <p>
            Add your city in My Profile
            to discover activities near
            you. Hannover is currently
            being used as the
            demonstration location.
          </p>

          <button
            type="button"
            onClick={() =>
              onNavigate("profile")
            }
          >
            Add city
          </button>
        </div>
      )}

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <p className="eyebrow">
              COMMUNITIES
            </p>

            <h2>
              What are you interested in?
            </h2>
          </div>

          <p>
            Choose a category to filter
            nearby activities.
          </p>
        </div>

        <div className="community-strip">
          <button
            className={
              selectedCommunity === "all"
                ? "community-filter active"
                : "community-filter"
            }
            style={{
              "--community-color":
                "#7c3aed",
            }}
            type="button"
            onClick={() =>
              setSelectedCommunity(
                "all",
              )
            }
          >
            <span>🌈</span>

            <strong>
              Everything
            </strong>
          </button>

          {communityCategories.map(
            (community) => (
              <button
                key={community.id}
                className={
                  selectedCommunity ===
                  community.id
                    ? "community-filter active"
                    : "community-filter"
                }
                style={{
                  "--community-color":
                    community.color,
                }}
                type="button"
                onClick={() =>
                  setSelectedCommunity(
                    community.id,
                  )
                }
              >
                <span>
                  {community.icon}
                </span>

                <strong>
                  {community.name}
                </strong>
              </button>
            ),
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <p className="eyebrow">
              NEAR YOU
            </p>

            <h2>
              Upcoming activities in{" "}
              {activeCity}
            </h2>
          </div>

          <button
            className="text-button"
            type="button"
            onClick={() =>
              onNavigate("events")
            }
          >
            View all events
          </button>
        </div>

        {eventsError && (
          <div className="auth-message error">
            {eventsError}
          </div>
        )}

        {eventsLoading ? (
          <div className="profile-loading">
            Loading upcoming events...
          </div>
        ) : visibleEvents.length > 0 ? (
          <div className="events-grid">
            {visibleEvents
              .slice(0, 6)
              .map((event) => {
                const category =
                  categoryMap[
                    event.category
                  ] || {
                    name:
                      event.communityName,
                    icon: "📅",
                    color: "#18a957",
                  };

                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    community={category}
                  />
                );
              })}
          </div>
        ) : (
          <div className="empty-message">
            <h2>
              No upcoming activities
              found
            </h2>

            <p>
              There are currently no
              matching Supabase events
              in {activeCity}. Browse all
              events or create one for a
              community that you own.
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={() =>
                onNavigate("events")
              }
            >
              Open events
            </button>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <p className="eyebrow">
              PEOPLE
            </p>

            <h2>
              Potential buddies near you
            </h2>
          </div>

          <button
            className="text-button"
            type="button"
            onClick={() =>
              onNavigate(
                "find-buddy",
              )
            }
          >
            View everyone
          </button>
        </div>

        {localBuddies.length === 0 && (
          <p className="section-note">
            There are no demonstration
            profiles from {activeCity} yet,
            so other suggested people are
            being shown.
          </p>
        )}

        <div className="buddy-grid">
          {peopleToDisplay.map(
            (buddy) => (
              <BuddyCard
                key={buddy.id}
                buddy={buddy}
                onSelect={
                  onSelectBuddy
                }
              />
            ),
          )}
        </div>
      </section>
    </main>
  );
}

export default Dashboard;