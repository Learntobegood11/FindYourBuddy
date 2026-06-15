function Topbar({
  eyebrow,
  title,
  searchValue,
  onSearch,
  placeholder = "Search",
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>

      {onSearch && (
        <input
          className="search"
          type="search"
          value={searchValue}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </header>
  );
}

export default Topbar;