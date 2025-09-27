// components/ClientSideTime.tsx (Create this new file)

"use client";

import { useEffect, useState } from "react";

export function ClientSideTime({ dateString }: { dateString: string }) {
  const [localTime, setLocalTime] = useState("");

  useEffect(() => {
    // Only run this code on the client side
    if (dateString) {
      setLocalTime(new Date(dateString).toLocaleString());
    }
  }, [dateString]);

  // Render a placeholder on the server, and the actual time on the client
  return <>{localTime || dateString}</>;
}