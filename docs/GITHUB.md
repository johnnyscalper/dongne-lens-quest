# 새 GitHub 저장소 구성

기존 계산 실험과 앱의 버전 관리를 분리합니다. 이 폴더 전체가 하나의 독립 저장소 루트입니다.

| 항목 | 값 |
| --- | --- |
| 소유자 | `johnnyscalper` |
| 저장소 이름 | `dongne-lens-quest` |
| 설명 | `A lightweight Korean apartment explorer with a 3D journey, price-mix detective, and blind choice experiment.` |
| 기본 브랜치 | `main` |
| 앱 버전 | `0.2.0` |
| 실행 | `python3 server.py --host 0.0.0.0 --port 3000` |

이 문서는 구성·업로드 절차이며 원격 생성 완료를 증명하지 않습니다. 실제 업로드 결과는 GitHub의 파일 목록과 커밋으로 확인합니다.

## 본인 환경에서 올리는 경우

GitHub에 위 이름의 빈 저장소를 만든 다음, 다운로드한 앱 폴더에서 실행합니다. 기존 다른 저장소 안에 복사하지 마세요. 원격 README·라이선스·gitignore 자동 생성은 하지 않고 이 패키지 파일을 사용하면 첫 커밋 충돌을 피할 수 있습니다.

```bash
python3 -m unittest discover -s tests -v
git init -b main
git add .
git status --short
git commit -m "Build Dongne Lens Quest v0.2"
git remote add origin https://github.com/johnnyscalper/dongne-lens-quest.git
git push -u origin main
```

이미 로컬 Git이 초기화되어 있으면 `git init`을 생략합니다. 이미 `origin`이 있으면 주소를 먼저 확인하고 다른 저장소에 덮어쓰지 않습니다. GitHub 인증은 본인 개발 환경의 인증 절차를 사용하며 토큰을 코드나 URL에 넣지 않습니다.

`.replit`, `.github`, `.gitignore`, `.env.example`을 포함해야 Replit 설정과 CI가 함께 전달됩니다. 실제 `.env`, 키, 개인 자료, 가상환경, 캐시는 올리지 않습니다. `.gitignore`에 관련 제외 규칙이 있습니다. 저장소 공개 범위는 소유자가 선택하며 이 패키지에는 별도 라이선스 허락을 추가하지 않았습니다.

## 업로드 후

GitHub 파일 목록에 `server.py`, `insights.py`, `public/journey.js`, `public/labs.js`가 있는지 확인합니다. Actions의 검사가 통과한 뒤 Replit에서 이 새 저장소를 가져옵니다. 앱 개선은 별도 브랜치에서 진행하고, 계산 변경은 해당 테스트와 함께 수정합니다.
