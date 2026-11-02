# API와 화면 이벤트

서버와 브라우저는 같은 출처를 사용한다. 모든 금액은 원, 날짜는 ISO 형식이다. JSON 요청은 최대 3MB·거래 5,000건으로 제한한다. 잘못된 입력은 오류를 반환하며 값으로 대체하지 않는다.

| API | 용도 |
| --- | --- |
| `GET /health` | 상태·앱 버전 |
| `GET /api/config` | 공식 키 설정 여부·자료 라벨 |
| `GET /api/regions?q=청담` | 지원 지역 검색 |
| `GET /api/market?region=11680&months=6&mode=demo` | 지역·기간별 가상/공식 거래 |
| `POST /api/analyze` | 거래 집계·자금 계산 |
| `POST /api/insights` | 가격 착시 비교·블라인드 후보 |
| `GET /api/insights/example` | 별도 가상 착시 연습 예제 |

`mode`는 `demo` 또는 `live`, `months`는 3·6·12다. 키 없는 공식 요청은 오류를 반환한다. `market` 응답의 `coverage`, `warnings`, `mode`, `source`, `period`를 화면에서 유지한다.

## 두 실험 요청

```json
{
  "records": [],
  "area_band": "all",
  "neighborhood": "",
  "period": {"start": "2026-06-01", "end": "2026-11-02"}
}
```

`records`에는 `/api/market`의 표준 거래 배열을 전달한다. `area_band`는 `all`, `small`, `medium`, `large`다. 날짜 예시는 스키마 설명이며 호출 시 조회 응답의 기간을 그대로 사용한다.

응답의 `mix`에는 `status`, 앞/뒤 기간 요약, `raw_change_pct`, `matched_change_pct`, `matched_cohorts`, `coverage_pct`, 매칭 그룹, 계산식과 한계가 담긴다. `blind`에는 `status`, 후보 목록, 후보 수와 한계가 담긴다. 표본 부족은 `insufficient`와 빈 후보 또는 null 지표로 표현한다. 연습 예제의 `mix.is_example`은 true다.

실제 필드와 계산의 기준은 `insights.py`와 테스트다. `mix_gap_pp`는 두 결과의 차이이며 인과적 구성 효과가 아니다.

## 브라우저 이벤트

| 이벤트 | detail | 동작 |
| --- | --- | --- |
| `lens:analysis` | `market`, `analysis`, `filters`, `assumptions` | 실험 계산 요청과 새 결과 표시 |
| `lens:clear` | `reason` | 대기 요청 취소·이전 실험과 선택 초기화 |
| `lens:destination` | `name`, `mode` | 3D 마을 목적지 갱신 |

`labs.js`는 요청 순번과 AbortController로 이전 응답이 새 조건을 덮지 않게 한다. 금융 입력과 선택 이력은 서버 저장이나 외부 추적에 보내지 않는다.
