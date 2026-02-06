"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const PRIVACY_TEXT = `개인정보 수집 및 이용 동의서

기강(이하 "크루")은 가입 신청 및 원활한 크루 운영을 위해 아래와 같이 개인정보를 수집·이용합니다.

1. 수집 항목
   - 필수: 이름, 성별, 생년월일, 거주지역(가까운 지하철역)
   - 선택: 연락처, 계좌번호, 러닝경력

2. 수집 목적
   - 크루 가입 신청 및 자격 확인
   - 크루 활동 안내 및 연락
   - 회비 관리 및 환급 처리

3. 보유 기간
   - 크루 탈퇴 후 1년간 보관 후 파기

4. 동의 거부 권리
   - 개인정보 수집·이용에 동의하지 않을 권리가 있으나, 필수 항목 미동의 시 가입이 제한될 수 있습니다.`;

function validateBirthDate(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();

  // YYMMDD (6자리)
  if (/^\d{6}$/.test(trimmed)) {
    const yy = parseInt(trimmed.slice(0, 2), 10);
    const mm = parseInt(trimmed.slice(2, 4), 10);
    const dd = parseInt(trimmed.slice(4, 6), 10);
    if (mm < 1 || mm > 12) return "월은 01~12 사이여야 합니다.";
    if (dd < 1 || dd > 31) return "일은 01~31 사이여야 합니다.";
    const year = yy >= 0 && yy <= 30 ? 2000 + yy : 1900 + yy;
    const date = new Date(year, mm - 1, dd);
    if (date.getMonth() !== mm - 1 || date.getDate() !== dd)
      return "유효하지 않은 날짜입니다.";
    return null;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split("-").map(Number);
    if (yyyy < 1900 || yyyy > new Date().getFullYear())
      return "연도를 확인해주세요.";
    if (mm < 1 || mm > 12) return "월은 01~12 사이여야 합니다.";
    if (dd < 1 || dd > 31) return "일은 01~31 사이여야 합니다.";
    const date = new Date(yyyy, mm - 1, dd);
    if (date.getMonth() !== mm - 1 || date.getDate() !== dd)
      return "유효하지 않은 날짜입니다.";
    return null;
  }

  return "형식: 1995-03-15 또는 950315";
}

export default function JoinForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [nearestStation, setNearestStation] = useState("");
  const [instagramFollow, setInstagramFollow] = useState("");
  const [runningExperience, setRunningExperience] = useState("");
  const [phone, setPhone] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const handleBirthDateChange = useCallback((value: string) => {
    setBirthDate(value);
    if (value) {
      setBirthDateError(validateBirthDate(value));
    } else {
      setBirthDateError(null);
    }
  }, []);

  const isValid =
    name &&
    gender &&
    birthDate &&
    !birthDateError &&
    nearestStation &&
    instagramFollow &&
    privacyAgreed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);

    const payload = {
      timestamp: new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }),
      name,
      gender,
      birthDate,
      nearestStation,
      instagramFollow,
      runningExperience: runningExperience || "",
      phone: phone || "",
      bankAccount: bankAccount || "",
      privacyAgreed: privacyAgreed ? "동의" : "미동의",
    };

    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (scriptUrl) {
        await fetch(scriptUrl, {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify(payload),
        });
      }
      setSubmitted(true);
    } catch {
      alert("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-3xl font-bold">환영합니다</h2>
        <div className="space-y-2 text-white/80">
          <p>양재천에서 같이 즐겁게 운동하는 사람들의 모임</p>
          <p>언제든 모임을 만들거나 참여할 수 있습니다.</p>
        </div>
        <p className="text-lg font-semibold">런닝베이스 2030 운동모임!</p>
        <p className="text-white/80">
          러닝 · 자전거 · 수영 · 등산 · 대회 외 활동 다수!
        </p>
        <div className="space-y-2 text-left text-sm text-white/70">
          <p>✨ 카카오톡에 사람이 더 많아요</p>
          <p>📖 모임홈페이지에 크루에 대해 많이 적어뒀어요</p>
          <p>💬 모임장은 언제나 놀고있으니 카톡 답변이 빠릅니다!</p>
        </div>
        <p className="font-medium">기억에 남을만한 하루를 만들어봐요</p>
        <div className="rounded-lg border border-white/20 bg-white/5 p-4 text-left text-sm">
          <p className="mb-2 font-semibold">🔥 기강 단체 톡방 (중요)</p>
          <a
            href="https://open.kakao.com/o/grnMFGng"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-300 underline underline-offset-2 hover:text-blue-200"
          >
            https://open.kakao.com/o/grnMFGng
          </a>
          <p className="mt-1 text-white/60">비밀번호: 1017</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 필수 항목 */}
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold">필수 항목</legend>

        <div className="space-y-2">
          <Label htmlFor="name">이름 *</Label>
          <Input
            id="name"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
          />
        </div>

        <div className="space-y-3">
          <Label>성별 *</Label>
          <RadioGroup value={gender} onValueChange={setGender}>
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="남"
                id="gender-male"
                className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <Label htmlFor="gender-male" className="font-normal">
                남
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="여"
                id="gender-female"
                className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <Label htmlFor="gender-female" className="font-normal">
                여
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">생년월일 *</Label>
          <Input
            id="birthDate"
            placeholder="예: 1995-03-15 또는 950315"
            value={birthDate}
            onChange={(e) => handleBirthDateChange(e.target.value)}
            required
            aria-invalid={!!birthDateError}
            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
          />
          {birthDateError && (
            <p className="text-sm text-red-400">{birthDateError}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nearestStation">사는곳 (가까운 지하철역) *</Label>
          <Input
            id="nearestStation"
            placeholder="가까운 지하철역"
            value={nearestStation}
            onChange={(e) => setNearestStation(e.target.value)}
            required
            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
          />
        </div>

        <div className="space-y-3">
          <Label>인스타 팔로우 *</Label>
          <RadioGroup
            value={instagramFollow}
            onValueChange={setInstagramFollow}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="Yes"
                id="insta-yes"
                className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <Label htmlFor="insta-yes" className="font-normal">
                Yes
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="나는 인스타가 없다"
                id="insta-no"
                className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <Label htmlFor="insta-no" className="font-normal">
                나는 인스타가 없다
              </Label>
            </div>
          </RadioGroup>
        </div>
      </fieldset>

      {/* 선택 항목 */}
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold">선택 항목</legend>

        <div className="space-y-3">
          <Label>러닝경력</Label>
          <RadioGroup
            value={runningExperience}
            onValueChange={setRunningExperience}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="런린이(입문 이하)"
                id="exp-beginner"
                className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <Label htmlFor="exp-beginner" className="font-normal">
                런린이(입문 이하)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="입문(5K 30분 이내)"
                id="exp-entry"
                className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <Label htmlFor="exp-entry" className="font-normal">
                입문(5K 30분 이내)
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem
                value="초보 이상(10K 대회 경험)"
                id="exp-intermediate"
                className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
              />
              <Label htmlFor="exp-intermediate" className="font-normal">
                초보 이상(10K 대회 경험)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">연락처</Label>
          <Input
            id="phone"
            placeholder="추후 활동시 연락용"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccount">계좌번호</Label>
          <Input
            id="bankAccount"
            placeholder="회비, 환급 처리용"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
          />
        </div>
      </fieldset>

      {/* 개인정보 수집동의 */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">개인정보 수집동의</legend>
        <Textarea
          readOnly
          value={PRIVACY_TEXT}
          rows={12}
          className="border-white/20 bg-white/5 text-xs text-white/70 leading-relaxed"
        />
        <div className="flex items-start gap-2">
          <Checkbox
            id="privacy"
            checked={privacyAgreed}
            onCheckedChange={(checked) =>
              setPrivacyAgreed(checked === true)
            }
            className="mt-0.5 border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
          />
          <Label htmlFor="privacy" className="font-normal leading-snug">
            개인정보 수집 및 이용에 동의합니다. *
          </Label>
        </div>
      </fieldset>

      <Button
        type="submit"
        disabled={!isValid || loading}
        className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-40"
      >
        {loading ? "제출 중..." : "제출하기"}
      </Button>
    </form>
  );
}
