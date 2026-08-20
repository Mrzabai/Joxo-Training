"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="route-error">
      <span><TriangleAlert size={30} /></span>
      <small>NÅGOT GICK SNETT</small>
      <h1>Appen tappade greppet</h1>
      <p>Din senaste träningsdata finns kvar. Försök ladda om den här vyn.</p>
      <button type="button" onClick={reset}><RefreshCw size={17} /> Försök igen</button>
    </main>
  );
}
