import { Link } from "react-router";

import type { NavItem } from "~/lib/menu";

export function NavLink({
  item,
  className,
  onClick,
}: {
  item: NavItem;
  className: string;
  onClick?: () => void;
}) {
  if (item.external) {
    return (
      <a href={item.to} className={className} onClick={onClick}>
        {item.title}
      </a>
    );
  }
  return (
    <Link to={item.to} className={className} onClick={onClick} prefetch="intent">
      {item.title}
    </Link>
  );
}
