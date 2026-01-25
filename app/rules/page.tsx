import HeroSection from "@/components/hero-section";
import { siteContent } from "@/config";

export default function RulesPage() {
  const { rules } = siteContent;

  return (
    <div className="min-h-screen bg-black">
      <HeroSection
        showHeroContent={false}
        showSliderNav={false}
        overlay={
          <div className="h-full overflow-y-auto">
            <div className="mx-auto flex min-h-full max-w-3xl flex-col px-6 pb-16 pt-20 text-white md:px-12 md:pt-28">
              <h1 className="text-3xl font-bold md:text-4xl">
                {rules.heading}
              </h1>

              <ol className="mt-8 space-y-8 text-white/90">
                {rules.items.map((item) => (
                  <li key={item.id} className="space-y-3">
                    <h2 className="text-lg font-semibold md:text-xl">
                      {item.id}. {item.title}
                    </h2>
                    <ul className="list-disc space-y-2 pl-5 text-white/80">
                      {item.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        }
      />
    </div>
  );
}
