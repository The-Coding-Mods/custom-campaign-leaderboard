from typing import List
from dataclasses import dataclass
from datetime import datetime
import json

campaigns = [76165, 76166, 76169,]
main_lb = {}
final_lb = []

@dataclass
class Player:
    position:int
    player:str
    points:int
    id:int

for campaign in campaigns:
    with open(f'./public/players_{campaign}.json', 'r') as f:
        data = json.load(f)
        players: List[Player] = [Player(**x) for x in data['leaderboard']]
        for player in players:
            if player.player not in main_lb:
                player.position = 0
                main_lb[player.player] = player
            else:
                main_lb[player.player].points += player.points

for name, player in main_lb.items():
    final_lb.append(player.__dict__)

final_lb = sorted(final_lb, key=lambda d: int(d['points']), reverse=True)
for index, player in enumerate(final_lb):
    player['position'] = index + 1

with open('./public/main_leaderboard.json', 'w') as f:
    json.dump({"leaderboard": final_lb, "updateTime": int(datetime.now().timestamp())}, f)
