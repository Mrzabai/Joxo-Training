import TrainingApp from "./training-app";

export const dynamic = "force-dynamic";

export default function Home() {
  const now = new Date();
  const todayLabel = new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Stockholm",
  }).format(now).toLocaleUpperCase("sv-SE");
  const hour = Number(new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/Stockholm",
  }).format(now));
  const greeting = hour < 10 ? "God morgon" : hour < 17 ? "Hej" : "God kväll";

  return <TrainingApp todayLabel={todayLabel} greeting={greeting} nowIso={now.toISOString()} />;
}
