function GroupCard({ group, onSelect }) {
  const memberCount = Array.isArray(group.members)
    ? group.members.length
    : Number(group.members || 0);

  return (
    <article className="group-card">
      <div>
        <h3>{group.name}</h3>
        <p>{group.activity || group.match}</p>
        <p className="location">{group.city}</p>
      </div>

      <div className="group-actions">
        <span>
          {memberCount}/{group.maximumMembers} members
        </span>

        <button
          className="secondary-button"
          type="button"
          onClick={() => onSelect(group)}
        >
          View community
        </button>
      </div>
    </article>
  );
}

export default GroupCard;