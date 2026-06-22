'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav>
      <Link href="/" className="nav-logo" onClick={() => setOpen(false)}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="14,2 18,10 27,11 21,17 23,26 14,21 5,26 7,17 1,11 10,10" fill="none" stroke="#1a56db" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="14" cy="14" r="3" fill="#1a56db" />
        </svg>
        <span className="nav-logo-text">Lighthouse <span>Capital</span> Research</span>
      </Link>

      <button
        className="nav-toggle"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>

      <ul className={open ? 'open' : ''}>
        <li className="nav-dropdown">
          <Link href="/research" onClick={() => setOpen(false)}>Equity Research</Link>
          <div className="dropdown-menu">
            <div className="dropdown-menu-inner">
              <Link href="/research/okta" onClick={() => setOpen(false)}>Okta (OKTA)</Link>
            </div>
          </div>
        </li>
        <li><Link href="/#contact" onClick={() => setOpen(false)}>Contact</Link></li>
      </ul>
    </nav>
  );
}
