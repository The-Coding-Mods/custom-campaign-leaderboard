import DefaultLayout from "@/layouts/default";
import users from "../public/main_leaderboard.json";
import Link from 'next/link';

import React from "react";
import TableView from "@/components/table";

interface Campaign {
  id: number,
  enabled: boolean
}
const campaigns: Campaign[] = [{id: 76165, enabled: true}, {id: 76166, enabled: true}, {id: 76169, enabled: true}, {id: 76165, enabled: false}, {id: 76165, enabled: false}, ]

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 h-full">
        
        <div id="campaignSelector" className="flex justify-center items-center gap-4 md:pt-2 pt-3">
          {campaigns.map((campaign: Campaign, index: number) => {
            if (campaign.enabled) {
              return (
                <Link key={campaign.id} href={`/campaign/${campaign.id}`}><p className="lg:text-2xl md:text-lg text-sm font-bold underline">Week {index + 1}</p></Link>
              )
            } else {
              return (
                <Link key={campaign.id} href={"/"} className="pointer-events-none"><p className="lg:text-2xl sm:text-xl text-sm font-bold line-through" style={{ color: "grey" }}>Week {index + 1}</p></Link>
              )
            }
          })}
        </div>
        { users.leaderboard.length > 0 &&
          <div id="leaderboardTable" className="xl:w-[30vw] lg:w-[40vw] md:w-[50vw] w-[90vw]">
            <TableView users={users.leaderboard} updated={users.updateTime}></TableView>
          </div>
        }
      </section>
    </DefaultLayout>
  );
}
