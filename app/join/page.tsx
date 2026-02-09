import HeroSection from "@/components/hero-section";
import JoinForm from "@/components/join-form";

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-black">
      <HeroSection
        showHeroContent={false}
        showSliderNav={false}
        overlay={
          <div className="h-full overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-xl flex-col px-6 pb-16 pt-20 text-white md:px-12 md:pt-28">
              <h1 className="text-3xl font-bold md:text-4xl">가입안내</h1>
              <div className="mt-8">
                <JoinForm />
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
