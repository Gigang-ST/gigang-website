import HeroSection from "@/components/hero-section";
import JoinDialogButton from "@/components/join/join-dialog-button";
import { siteContent } from "@/config";

const { intro, highlights, meetingPlaces, rules, requests, contact } =
  siteContent;

const feeRule = rules.items.find((item) => item.id === 5);

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

              {/* 크루 소개 */}
              <section className="mt-8 space-y-3">
                {intro.paragraphs.map((p, i) => (
                  <p key={i} className="text-white/80 leading-relaxed">
                    {p}
                  </p>
                ))}
              </section>

              {/* 활동 정보 */}
              <section className="mt-10 space-y-3">
                <h2 className="text-xl font-semibold">활동 정보</h2>
                <dl className="space-y-2 text-white/80">
                  <div className="flex gap-2">
                    <dt className="font-medium text-white">연령대</dt>
                    <dd>{highlights.ageRange}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-white">활동지역</dt>
                    <dd>{highlights.activityArea}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-white">주요 활동</dt>
                    <dd>{highlights.primaryActivities.join(", ")}</dd>
                  </div>
                </dl>
              </section>

              {/* 모임 장소 */}
              <section className="mt-10 space-y-4">
                <h2 className="text-xl font-semibold">
                  {meetingPlaces.heading}
                </h2>
                <div className="space-y-3">
                  {meetingPlaces.items.map((place) => (
                    <div
                      key={place.id}
                      className="rounded-lg border border-white/10 bg-white/5 p-4"
                    >
                      <h3 className="font-medium">{place.title}</h3>
                      <p className="mt-1 text-sm text-white/70">
                        {place.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* 회비 안내 */}
              {feeRule && (
                <section className="mt-10 space-y-3">
                  <h2 className="text-xl font-semibold">{feeRule.title}</h2>
                  <ul className="space-y-1 text-white/80">
                    {feeRule.details.map((detail, i) => (
                      <li key={i} className="leading-relaxed">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 요청사항 */}
              <section className="mt-10 space-y-3">
                <h2 className="text-xl font-semibold">{requests.heading}</h2>
                <p className="text-sm text-white/50">{requests.note}</p>
                <ul className="space-y-2">
                  {requests.items.map((item) => (
                    <li key={item.id} className="text-white/80">
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-white"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <span>{item.title}</span>
                      )}
                      {item.description && (
                        <span className="ml-2 text-sm text-white/50">
                          ({item.description})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              {/* 문의 */}
              <section className="mt-10 space-y-3">
                <h2 className="text-xl font-semibold">{contact.heading}</h2>
                <p className="text-white/70">{contact.description}</p>
                <div className="space-y-2">
                  {contact.people.map((person, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
                    >
                      <span className="font-medium">{person.role}</span>
                      {person.instagram && (
                        <span className="ml-3 text-white/60">
                          IG {person.instagram}
                        </span>
                      )}
                      {person.kakaoId && (
                        <span className="ml-3 text-white/60">
                          카카오 {person.kakaoId}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* 가입신청 버튼 */}
              <div className="mt-12">
                <JoinDialogButton />
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
