import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router";

import type { NavItem } from "~/lib/menu";

import { NavLink } from "./NavLink";

/**
 * Desktop menu item with children (e.g. Coffee > Single Origins, Blends ...).
 * Opens on hover for pointer users and from the chevron button for keyboard and
 * touch users (disclosure pattern). Escape closes it and returns focus to the button.
 */
export function NavDropdown({ item, linkClassName }: { item: NavItem; linkClassName: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  // Close after navigating to one of the links.
  useEffect(() => setOpen(false), [location.pathname, location.search]);

  return (
    <div
      ref={wrapperRef}
      className="nav-has-dropdown flex items-center gap-0.5"
      data-open={open ? "" : undefined}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
      onBlur={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <NavLink item={item} className={linkClassName} />
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${item.title} menu`}
        className="focus-visible:outline-accent inline-flex size-6 cursor-pointer items-center justify-center rounded-sm hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          viewBox="0 0 16 16"
          aria-hidden="true"
          className={`size-3.5 motion-safe:transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div id={panelId} className="nav-dropdown">
        <div className="nav-mega bg-surface-raised border-border rounded-card shadow-lg border p-6">
          <ul role="list" className="grid min-w-56 gap-1">
            {item.items.map((child) => (
              <li key={child.id}>
                <NavLink
                  item={child}
                  className="text-on-surface focus-visible:outline-accent flex min-h-10 items-center rounded-sm text-base no-underline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </li>
            ))}
          </ul>
          <NavLink
            item={{ ...item, title: `Shop all ${item.title.toLowerCase()}` }}
            className="border-border text-on-surface focus-visible:outline-accent mt-4 flex items-center border-t pt-4 text-sm font-semibold no-underline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </div>
      </div>
    </div>
  );
}
