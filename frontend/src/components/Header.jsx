import "./Header.css";

function Header({ total, soon, expired }) {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none">
              <path
                d="M6.5 3h11l-.9 3.6H7.4L6.5 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M5.2 6.9h13.6l-1.28 12.6a2 2 0 0 1-1.99 1.8H8.47a2 2 0 0 1-1.99-1.8L5.2 6.9Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 11c0 1.3 1.3 2.1 3 2.1s3-.8 3-2.1"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div>
            <p className="eyebrow">Kitchen inventory</p>
            <h1>Smart Pantry</h1>
          </div>
        </div>

        <dl className="stat-row">
          <div className="stat">
            <dt>On the shelf</dt>
            <dd>{total}</dd>
          </div>
          <div className="stat stat--soon">
            <dt>Expiring soon</dt>
            <dd>{soon}</dd>
          </div>
          <div className="stat stat--expired">
            <dt>Expired</dt>
            <dd>{expired}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}

export default Header;
