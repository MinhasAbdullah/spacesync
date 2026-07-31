"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/async-state";

export default function ApplicationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <ErrorState message="This page could not be loaded." onRetry={reset} />;
}
