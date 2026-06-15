function BuddyCard({ buddy, onSelect }) {
  return (
    <article className="buddy-card">
      <div className="avatar">{buddy.initials}</div>

      <h3>
        {buddy.name}, {buddy.age}
      </h3>

      <p className="location">{buddy.city}</p>

      <p>{buddy.description}</p>

      <div className="tags">
        {buddy.interests.map((interest) => (
          <span key={interest}>{interest}</span>
        ))}
      </div>

      <button
        className="secondary-button"
        onClick={() => onSelect(buddy)}
      >
        View profile
      </button>
    </article>
  );
}

export default BuddyCard;