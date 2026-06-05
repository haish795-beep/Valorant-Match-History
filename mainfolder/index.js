const https = require("https");
const INF = "\n||";
const y = ""; // https://api.henrikdev.xyz/dashboard/ 에서 발급받은 API 키로 교체하세요!
const g   = "ap";
const P = "pc";
const raw = process.argv.slice(2).join(" ").trim();
if (!raw.includes("#")) {
  console.log(`[ USAGE ]${INF} node index.js <name>#<tag>`);
  console.log(`[ EX    ]${INF} node index.js 이름#KR1`);
  process.exit(1);
}
const hashIdx = raw.lastIndexOf("#");
const NAME = raw.slice(0, hashIdx).trim();
const TAG  = raw.slice(hashIdx + 1).trim();
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "Authorization": y,
        "User-Agent": "val-cli/2.0",
      }
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error("JSON 파싱 실패")); }
      });
    }).on("error", reject);
  });
}
function pad(str, len) { return String(str ?? "—").padEnd(len); }
function tierColor(name) {
  const map = {
    Iron: "\x1b[90m", Bronze: "\x1b[33m", Silver: "\x1b[37m",
    Gold: "\x1b[93m", Platinum: "\x1b[96m", Diamond: "\x1b[94m",
    Ascendant: "\x1b[92m", Immortal: "\x1b[91m", Radiant: "\x1b[95m",
  };
  const key = Object.keys(map).find((k) => name?.includes(k));
  return key ? `${map[key]}${name}\x1b[0m` : (name ?? "—");
}
async function main() {
  const n = encodeURIComponent(NAME);
  const t = encodeURIComponent(TAG);
  console.log(`\n[ VAL ]${INF} ${NAME}#${TAG} 조회 중...\n`);
  const account = await get(`https://api.henrikdev.xyz/valorant/v2/account/${n}/${t}`);
  if (account.status !== 200) {
    console.log(`[ ERR ]${INF} ${account.errors?.[0]?.message ?? "플레이어를 찾을 수 없음"}`);
    process.exit(1);
  }
  const { puuid, account_level } = account.data;
  const mmrRes = await get(`https://api.henrikdev.xyz/valorant/v3/mmr/${g}/${P}/${n}/${t}`);
  const mmr = mmrRes.data;
  const histRes = await get(`https://api.henrikdev.xyz/valorant/v1/mmr-history/${g}/${P}/${n}/${t}`);
  const hist = histRes.data?.slice(0, 5) ?? [];
  const matchRes = await get(`https://api.henrikdev.xyz/valorant/v3/matches/${g}/${n}/${t}?size=5&mode=competitive`);
  const matches = matchRes.data ?? [];
  console.log(`[ 플레이어 ]`);
  console.log(`${INF} 이름    : ${NAME}#${TAG}`);
  console.log(`${INF} 레벨    : ${account_level}`);
  console.log();
  console.log(`[ 랭크 ]`);
  if (mmr?.current) {
    const cur  = mmr.current;
    const peak = mmr.peak;
    console.log(`${INF} 티어    : ${tierColor(cur.tier?.name)}`);
    console.log(`${INF} RR      : ${cur.rr ?? "—"} / 100`);
    console.log(`${INF} 최고    : ${tierColor(peak?.tier?.name)}`);
  } else {
    console.log(`${INF} 랭크 정보 없음`);
  }
  console.log();
  if (hist.length) {
    console.log(`[ 최근 RR 변동 ]`);
    hist.forEach((h) => {
      const diff = h.last_change ?? h.mmr_change_to_last_game ?? 0;
      const sign = diff >= 0 ? "\x1b[92m+" : "\x1b[91m";
      console.log(`${INF} ${pad(h.tier?.name ?? h.currenttierpatched, 20)} ${sign}${diff}\x1b[0m RR`);
    });
    console.log();
  }
  if (!matches.length) {
    console.log(`[ 매치 ]${INF} 최근 경쟁전 기록 없음`);
    return;
  }
  let totalK = 0, totalD = 0, totalA = 0, wins = 0;
  console.log(`[ 최근 ${matches.length}경기 ]`);
  console.log(`${INF} ${"맵".padEnd(16)} ${"요원".padEnd(14)} ${"K/D/A".padEnd(16)} ${"HS%".padEnd(6)} 결과`);
  console.log(`${INF} ${"─".repeat(62)}`);
  matches.forEach((match) => {
    const me = match.players?.all_players?.find((p) => p.puuid === puuid);
    if (!me) return;

    const { kills, deaths, assists, headshots, bodyshots, legshots } = me.stats;
    const shots = headshots + bodyshots + legshots;
    const hs = shots ? ((headshots / shots) * 100).toFixed(1) : "0.0";

    const myTeam = me.team?.toLowerCase();
    const won = match.teams?.[myTeam]?.has_won ?? false;
    const result = won ? "\x1b[92m승\x1b[0m" : "\x1b[91m패\x1b[0m";

    console.log(
      `${INF} ${pad(match.metadata?.map, 16)} ${pad(me.character, 14)} ${pad(`${kills}/${deaths}/${assists}`, 16)} ${pad(hs + "%", 6)} ${result}`
    );

    totalK += kills; totalD += deaths; totalA += assists;
    if (won) wins++;
  });
  const total = matches.length;
  const avgK = (totalK / total).toFixed(1);
  const avgD = (totalD / total).toFixed(1);
  const avgA = (totalA / total).toFixed(1);
  const kd   = totalD === 0 ? totalK.toFixed(2) : (totalK / totalD).toFixed(2);
  const kda  = totalD === 0 ? (totalK + totalA).toFixed(2) : ((totalK + totalA) / totalD).toFixed(2);

  console.log(`\n[ 종합 — 최근 ${total}경기 ]`);
  console.log(`${INF} 승률    : ${((wins / total) * 100).toFixed(1)}%  (${wins}승 ${total - wins}패)`);
  console.log(`${INF} 평균    : ${avgK}/${avgD}/${avgA}`);
  console.log(`${INF} K/D     : ${kd}`);
  console.log(`${INF} KDA     : ${kda}`);
  console.log();
}
main().catch((err) => {
  console.log(`[ ERR ]${INF} ${err.message}`);
  process.exit(1);
});
