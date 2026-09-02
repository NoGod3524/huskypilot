import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return <Dashboard initialNow={new Date().toISOString()} />;
}
