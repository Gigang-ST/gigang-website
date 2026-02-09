/** 대회현황 시트 한 행 */
export type RaceInfo = {
  date: string;       // "2026. 2. 22"
  name: string;       // "고구려마라톤"
  category: string;   // "마라톤"
  courses: string[];  // ["FULL", "32K", "HALF"] — 쉼표로 분리된 코스
  note: string;
};

/** 대회참여현황 시트 한 행 */
export type RaceParticipant = {
  registeredDate: string; // "2026. 2. 2"
  raceName: string;       // "고구려마라톤"
  course: string;         // "마라톤-FULL"
  memberName: string;     // "정지형"
  resolution: string;     // 각오
};

/** 가입신청서 시트 한 행 */
export type Member = {
  name: string;
  gender: string;
  birthDate: string;  // "1994. 10. 17"
  isWithdrawn: boolean;
};

/** 대회기록 시트 한 행 */
export type RaceRecord = {
  name: string;
  raceName: string;
  course: string;
  record: string;     // "1:32:32"
  raceDate: string;   // "2025. 4. 13"
};

/** 대회 카드에 넘길 가공된 대회 데이터 */
export type Race = {
  id: string;          // "2026. 2. 22_고구려마라톤"
  date: string;
  name: string;
  category: string;
  courses: string[];   // "마라톤-FULL" 형태
  participants: RaceParticipant[];
  records: RaceRecord[];
  isPast: boolean;
};
