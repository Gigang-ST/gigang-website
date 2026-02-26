import HeroSection from "@/components/hero-section";
import FeeLookup from "@/components/fee-lookup";

export default function FeePage() {
  return (
    <div className="min-h-screen bg-black">
      <HeroSection
        showHeroContent={false}
        showSliderNav={false}
        overlay={
          <div className="h-full overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-3xl flex-col px-6 pb-16 pt-20 text-white md:px-12 md:pt-28">
              <h1 className="text-3xl font-bold md:text-4xl">회비 조회</h1>
              <div className="mt-8">
                <FeeLookup />
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
