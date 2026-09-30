"use client";

import { useState } from "react";
import { initials, photoUrl } from "@/lib/team";

/* A member's photo (resized by the Sanity CDN), or their initials if
   there is no photo or it fails to load. Fills its parent box. Used by
   the team views and by the domain member lists. */
export default function Portrait({
  member,
  size,
  alt = "",
  eager = false,
}: {
  member: { name: string; photo?: string };
  /** requested pixel size - pass about twice the displayed size */
  size: number;
  alt?: string;
  /** load immediately (for the profile, which is already in view) */
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = photoUrl(member.photo ?? "", size);

  if (!src || failed) {
    return (
      <span className="tm-initials" aria-hidden={alt ? undefined : true}>
        {initials(member.name)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className="tm-photo photo-mono"
      onError={() => setFailed(true)}
    />
  );
}
