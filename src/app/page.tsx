import { ConnectSection } from "@/components/connect-section";
import { HeroSection } from "@/components/hero-section";
import { TasksSection } from "@/components/tasks-section";

export default function OverviewPage() {
  return (
    <>
      <HeroSection />
      <ConnectSection />
      <TasksSection />
    </>
  );
}
