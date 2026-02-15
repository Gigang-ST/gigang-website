/** 대회현황 시트 한 행 (competition_id 단위) */
export type RaceInfo = {
  competitionId: string;     // "comp_001"
  type: string;              // "road_run" | "trail_run" | "triathlon" | "cycling"
  name: string;              // "썸머나이트런"
  competitionClass: string;  // "10K" | "Half" | "Full"
  distanceKm: number;        // 10
  pbKey: string;             // "10k"
  date: string;              // "2024-08-17"
};

/** 대회참여현황 시트 한 행 */
export type RaceParticipant = {
  memberId: string;          // "mem_175"
  memberName: string;        // "정지형"
  competitionId: string;     // "comp_025"
  competitionName: string;   // "고구려마라톤"
  competitionClass: string;  // "FULL"
  status: string;            // "applied" | "cheering"
  pledge: string;            // 각오
};

/** 가입신청서 시트 한 행 */
export type Member = {
  memberId: string;   // "mem_001"
  name: string;       // "이현근"
  gender: string;     // "male" | "female"
  birthDate: string;  // "1994-10-17"
  status: string;     // "active" | "inactive" | "banned"
};

/** 대회기록 시트 한 행 (15컬럼) */
export type RaceRecord = {
  recordId: string;          // "rec_001"
  recordType: string;        // "marathon" | "trail" | "triathlon"
  memberName: string;        // "이현근"
  competitionId: string;     // "comp_055" (선택)
  competitionName: string;   // "JTBC 마라톤"
  competitionClass: string;  // "Full" | "Half" | "10K" | "King" | "Olympic"
  record: string;            // "3:25:10"
  competitionDate: string;   // "2025-11-02"
  swimTime: string;          // 철인3종 전용
  bikeTime: string;          // 철인3종 전용
  runTime: string;           // 철인3종 전용
  utmbSlug: string;          // 트레일 전용 "7477568.hyeongeun.lee"
  utmbIndex: string;         // 트레일 전용 UTMB 인덱스 점수
};

/** 대회 카드의 코스 정보 */
export type RaceCourse = {
  competitionId: string;
  competitionClass: string;
};

/** 대회 카드에 넘길 가공된 대회 데이터 */
export type Race = {
  id: string;          // "2024-08-17_고구려마라톤"
  date: string;        // "2024-08-17"
  name: string;
  type: string;        // "road_run"
  courses: RaceCourse[];
  participants: RaceParticipant[];
  records: RaceRecord[];
  isPast: boolean;
};
