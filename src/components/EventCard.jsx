function formatEventDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
}

function formatEventTime(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function EventCard({
  event,
  community,
  primaryLabel = "",
  onPrimary = null,
  primaryDisabled = false,
  deleteLabel = "",
  onDelete = null,
  deleteDisabled = false,
}) {
  const attendeeCount =
    Number.isFinite(
      event.attendeeCount,
    )
      ? event.attendeeCount
      : Array.isArray(event.attendees)
        ? event.attendees.length
        : Number(event.attendees || 0);

  const maximumAttendees =
    Number(
      event.maximumAttendees ||
        event.capacity ||
        1,
    );

  const percentage =
    maximumAttendees > 0
      ? Math.min(
          100,
          Math.round(
            (
              attendeeCount /
              maximumAttendees
            ) * 100,
          ),
        )
      : 0;

  const communityColor =
    community?.color || "#18a957";

  return (
    <article
      className="event-card"
      style={{
        "--event-accent":
          communityColor,
      }}
    >
      <div className="event-card-top">
        <div className="event-icon">
          {community?.icon || "📅"}
        </div>

        <span className="event-category">
          {community?.name ||
            event.communityName ||
            "Community"}
        </span>
      </div>

      <div className="event-date">
        <span>
          {formatEventDate(
            event.startAt,
          )}
        </span>

        <span>
          {formatEventTime(
            event.startAt,
          )}
        </span>
      </div>

      <h3>{event.title}</h3>

      <p className="event-description">
        {event.description}
      </p>

      <div className="event-information">
        <span>
          📍 {event.venue}
        </span>

        <span>
          🏙️ {event.city}
        </span>

        <span>
          👥 {event.communityName ||
            community?.name}
        </span>
      </div>

      <div className="event-capacity">
        <div className="event-capacity-label">
          <span>
            {attendeeCount} attending
          </span>

          <span>
            {maximumAttendees} maximum
          </span>
        </div>

        <div className="event-capacity-track">
          <span
            className="event-capacity-fill"
            style={{
              width: `${percentage}%`,
            }}
          />
        </div>
      </div>

      {(onPrimary || onDelete) && (
        <div className="event-actions">
          {onPrimary && (
            <button
              className="event-button"
              type="button"
              disabled={
                primaryDisabled
              }
              onClick={onPrimary}
            >
              {primaryLabel}
            </button>
          )}

          {onDelete && (
            <button
              className="event-delete-button"
              type="button"
              disabled={
                deleteDisabled
              }
              onClick={onDelete}
            >
              {deleteLabel}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default EventCard;