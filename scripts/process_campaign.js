const TMIO = require("trackmania.io");
const pc = require("picocolors");
const fs = require("fs").promises;

const POINTS_AT = 5;
const POINTS_GOLD = 3;
const POINTS_SILVER = 2;
const POINTS_BRONZE = 1;
const POINTS_TOP_10 = "15,12,10,8,6,5,4,3,2,1"
  .split(",")
  .map((i) => parseInt(i));

const CLUB_ID = "2270";
const data = {};
const playerResults = {};
const playerIds = {};

const closeDates = [
  Date.parse('09 Sep 2024 18:00:00 GMT+2'),
  Date.parse('16 Sep 2024 18:00:00 GMT+2'),
  Date.parse('23 Sep 2024 18:00:00 GMT+2'),
  Date.parse('30 Sep 2024 18:00:00 GMT+2'),
  Date.parse('07 Oct 2024 18:00:00 GMT+2'),
]
const campaigns = [
  76165,
  76166,
  76169,
  null,
  null,
]

const getCampaign = async (CAMPAIGN_ID) => {
  let client = new TMIO.Client();
  client.setUserAgent("Scrapie's Sushi event website: sushi.socr.am, discord:@socramdavid mailto:davidmarcosg98@gmail.com")
  let campaign = await client.campaigns.get(
    (clubId = CLUB_ID),
    (id = CAMPAIGN_ID)
  );
  data.maps = []
  data.id = CAMPAIGN_ID;
  data.name = campaign.name;
  data.image = campaign.image;
  data.mapCount = campaign.mapCount;
  data.updateTime = Date.now();
  
  console.log(`Getting campaign ${CAMPAIGN_ID} (${campaign.name}) from club ${CLUB_ID}`);

  playerResults.updateTime = Date.now();
  playerResults.leaderboard = {}

  let maps = await campaign.maps();
  for (let map of maps) {
    await processMap(map, CAMPAIGN_ID);
  }
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const addPlayerPoints = (player, medals) => {
  if (!Object.keys(playerResults.leaderboard).includes(player.playerName)) {
    playerResults.leaderboard[player.playerName] = 0;
  }
  let points = 0;
  if (player.time <= medals.author) {
    points += POINTS_AT;
  } else if (player.time <= medals.gold) {
    points += POINTS_GOLD;
  } else if (player.time <= medals.silver) {
    points += POINTS_SILVER;
  } else if (player.time <= medals.bronze) {
    points += POINTS_BRONZE;
  }
  if (player.position <= 10) {
    points += POINTS_TOP_10[player.position - 1];
  }

  playerResults.leaderboard[player.playerName] += points;
};

const processMap = async (map, CAMPAIGN_ID) => {
  console.log(
    "Getting leaderboard for " +
      pc.bold(
        pc.green(
          map.name.replace(/\$[0-9A-Fa-f]{3}/g, "").replace(/\$[a-zA-Z]/g, "")
        )
      )
  );
  let medals = map.id == "81a71372-c48c-4c7d-b800-0ff6dce537fd" ? {
    author: 46000,
    gold: 50000,
    silver: 60000,
    bronze: 90000,
  } : map.medalTimes;
  let mapData = {
    mapId: map.id,
    mapName: map.name,
    author: map.authorName,
    thumbnail: map.thumbnail,
    id: map.id,
    uid: map.uid,
    url: map.url,
    leaderboard: [],
    medals: {
      at: medals.author,
      gold: medals.gold,
      silver: medals.silver,
      bronze: medals.bronze,
    },
  };
  let lb = await map.leaderboardLoadMore();
  await sleep(3000);
  while (lb.length> 0 && lb.at(-1).time <= medals.bronze) {
    let curLen = lb.length;
    lb = await map.leaderboardLoadMore();
    console.log(
      "Getting leaderboard for " +
        pc.bold(
          pc.green(
            map.name.replace(/\$[0-9A-Fa-f]{3}/g, "").replace(/\$[a-zA-Z]/g, "")
          )
        ) +
        " | " +
        pc.bold(lb.at(-1).position + " positions retrieved")
    );
    if (lb.length == curLen) {
      break;
    }
    await sleep(3000);
  }
  for (let player of lb) {
    addPlayerPoints(player, medals);
    mapData.leaderboard.push({
      position: player.position,
      time: `${(player.time/1000).toFixed(3)}s`,
      player: player.playerName,
      id: player._data.player.id,
      date: player.date
    });
    playerIds[player.playerName] = player._data.player.id;
  }
  data.maps.push(mapData)
};

let campaignsToCheck = []

async function doEverything() {
  for (let campaign of campaigns){
    let isCurrentCampaign = Date.now() < closeDates[campaigns.indexOf(campaign)];
    campaignsToCheck.push(campaign);
    if (isCurrentCampaign && campaign != null) {
      await getCampaign(campaign).then(() => {
        console.log("Saving file...");
        fs.writeFile(`./public/results_${campaign}.json`, JSON.stringify(data), (err) => {
          console.log(err);
        }).then(() => {
          let lb = []
          Object.keys(playerResults.leaderboard).forEach(player => {
            lb.push({
              position: 0,
              player: player,
              points: playerResults.leaderboard[player],
              id: playerIds[player],
            })
          });
          lb.sort((a, b) => b.points - a.points);
          lb.forEach((user, index) => {
            user.position = index + 1;
          })
      
          playerResults.leaderboard = lb;
      
          fs.writeFile(`./public/players_${campaign}.json`, JSON.stringify(playerResults), (err) => {
            console.log(err);
          }).then(() => {
            process.exit();
          });
        });
      });
      break;
    }
  }
}

doEverything()