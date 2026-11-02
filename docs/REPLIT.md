# Replit에서 실행하기

`dongne-lens-quest`는 Python 3.11+ 서버와 빌드 없는 브라우저 코드로 구성됩니다. 실행에 외부 Python·npm 패키지가 필요하지 않습니다.

## 가져오기

1. [Replit Import](https://replit.com/import)를 엽니다.
2. **GitHub**를 선택해 계정을 연결하고 새 `dongne-lens-quest` 저장소를 가져오거나, **ZIP**을 선택해 `dongne-lens-quest-v0.2.zip`을 업로드합니다.
3. 루트에 `server.py`, `insights.py`, `public/`, `.replit`이 있는지 확인합니다.
4. 실행 명령을 확인한 뒤 **Run**을 누릅니다.

```bash
python3 server.py --host 0.0.0.0 --port 3000
```

[공식 가져오기 안내](https://docs.replit.com/build/import-from-providers)는 공개·비공개 GitHub 저장소와 ZIP 가져오기를 지원합니다. 저장소의 존재·접근 권한은 가져오기 시점에 확인하세요. 기존 `rwa-apartment-model` 대신 새 앱 소스를 사용합니다.

## 설정

`.replit`의 실행 파일은 `server.py`, 내부 포트는 3000, 외부 포트는 80입니다. 가져오기 도중 다른 명령이 지정되었다면 위 명령으로 맞춥니다. 프로젝트는 정적 파일만이 아니라 Python API도 실행하므로 서버 실행이 가능한 게시 방식을 사용합니다.

화면이 열리지 않으면 Console의 시작 오류와 Preview 포트를 확인합니다. 앱 자체의 추가 설치·빌드 과정은 없습니다. Replit 게시 환경과 외부 API 연결은 이 패키지의 로컬 검증과 별도로 확인해야 합니다.

## 선택 사항: 국토부 자료

1. [매매](https://www.data.go.kr/data/15126469/openapi.do)·[전월세](https://www.data.go.kr/data/15126474/openapi.do) API 활용신청을 완료합니다.
2. Replit **Secrets**에 `MOLIT_SERVICE_KEY`를 추가합니다.
3. 서버를 다시 실행하고 공식 자료 모드를 선택합니다.

Secrets의 값은 서버 환경변수로 읽습니다. `.env`는 자동으로 읽지 않습니다. 게시 환경에서도 키가 설정되어 있는지 확인하세요. API 키가 없어도 가상 예시·두 실험·3D 장면은 작동합니다. 키를 넣은 사실만으로 실제 응답이 검증된 것은 아닙니다.

## 확인할 흐름

- 첫 화면의 입체 마을, 움직임 정지 버튼, 가상 데이터 표시.
- 서울 구·동 검색 후 두 실험과 거래 요약의 갱신.
- 착시 연습 예제에서 전체 +100%, 같은 구성 0% 표시와 지역 결과 복귀.
- 블라인드 후보 선택 → 이름 공개 → 선택 유지 또는 다시 선택.
- 기간·면적·동 변경과 표본 부족 안내.
- 자금 변경 후 재계산, JSON 다운로드, 자금 정보를 제외한 링크 공유.
- 지원하지 않는 지역과 공식 조회 실패에서 이전 결과 제거.

자동 검사는 Shell에서 `python3 -m unittest discover -s tests -v`로 실행합니다.

## 공식 문서

2026-11-02 확인: [가져오기](https://docs.replit.com/build/import-from-providers), [Secrets](https://docs.replit.com/core-concepts/project-editor/app-setup/secrets), [앱 설정](https://docs.replit.com/features/project-setup/configuration). Replit UI와 게시 요금은 서비스의 현재 안내를 따릅니다.
