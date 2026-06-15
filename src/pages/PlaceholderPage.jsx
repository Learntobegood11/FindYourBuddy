import Topbar from "../components/Topbar";

function PlaceholderPage({ eyebrow, title, description }) {
  return (
    <main className="main-content">
      <Topbar
        eyebrow={eyebrow}
        title={title}
      />

      <section className="placeholder-card">
        <div className="placeholder-icon">FUB</div>

        <h2>{title} is coming later</h2>

        <p>{description}</p>
      </section>
    </main>
  );
}

export default PlaceholderPage;