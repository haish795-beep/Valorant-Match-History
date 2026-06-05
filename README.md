# val-cli

Valorant 전적 조회 CLI. Henrik API 기반으로 K/D, 승률, 랭크, 최근 매치를 터미널에 출력합니다.

---

## 출력 정보

- 플레이어 레벨
- 현재 티어 / RR / 최고 티어
- 최근 5경기 RR 변동
- 최근 5경기 맵 / 요원 / K/D/A / HS% / 승패
- 종합 승률 / 평균 K/D/A

---

## 요구사항

- Node.js 16+
- Henrik API 키 — [발급](https://api.henrikdev.xyz/dashboard/)

---

## 설정

`index.js` 상단에서 수정:

```js
const y  = ""; // Henrik API 키
const g   = "ap";                // ap / na / eu / kr
const P = "pc";
```

---

## 실행

```bash
node index.js <name>#<tag>
```

```bash
node index.js 이름#KR1
```

---

## 주의사항

- Henrik API 무료(Basic) 키는 분당 30 요청 제한이 있습니다.
