import type { ReactElement } from "react";

import { formatRoastDate } from "~/lib/roast-date";

interface Announcement {
  content: ReactElement;
}

// Add announcements as JSX elements here. The next roast date always leads.
const ANNOUNCEMENTS: Announcement[] = [];

export function AnnouncementBar({ nextRoastDate }: { nextRoastDate: string }) {
  const announcements: Announcement[] = [
    {
      content: (
        <>
          Next roast:{" "}
          <time dateTime={nextRoastDate} className="font-mono text-[13px]">
            {formatRoastDate(nextRoastDate)}
          </time>
          . Order by Sunday night to get beans from this batch.
        </>
      ),
    },
    ...ANNOUNCEMENTS,
  ];

  return (
    <div
      role="region"
      aria-label="Announcement"
      className="bg-on-surface px-margin py-2.5 text-center"
    >
      <ul role="list">
        {announcements.map((announcement, index) => (
          <AnnouncementBarItem key={index} {...announcement} />
        ))}
      </ul>
    </div>
  );
}

function AnnouncementBarItem({ content }: Announcement) {
  return <li className="type-body-sm text-surface wrap-anywhere">{content}</li>;
}
