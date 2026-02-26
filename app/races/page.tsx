import HeroSection from "@/components/hero-section";
import RaceParticipation from "@/components/races/race-participation";

export default function RacesPage() {
  return (
    <div className="min-h-screen bg-black">
      <HeroSection
        showHeroContent={false}
        showSliderNav={false}
        overlay={
          <div className="h-full overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-3xl flex-col px-6 pb-16 pt-20 text-white md:px-12 md:pt-28">
              <h1 className="text-3xl font-bold md:text-4xl">대회참여</h1>
              <div className="mt-8">
                <RaceParticipation />
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
