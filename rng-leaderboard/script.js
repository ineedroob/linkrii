import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm";

const supabase = createClient(
  "https://lopbzmpnyicvaxfyekbz.supabase.co",
  "sb_publishable_idhYO5dmjg5HmC6GBKdvbw_u0UmW2gd"
);

const list = document.getElementById("leaderboard-list");

async function loadLeaderboard() {
  const { data, error } = await supabase
    .from("rng_leaderboard")
    .select("username, rolls")
    .order("rolls", { ascending: false })
    .limit(100);

  if (error) {
    list.replaceChildren();
    const status = document.createElement("div");
    status.id = "status";
    status.textContent = "Leaderboard unavailable. Please try again later.";
    list.append(status);
    return;
  }

  list.replaceChildren();
  if (!data?.length) {
    const status = document.createElement("div");
    status.id = "status";
    status.textContent = "No rolls yet.";
    list.append(status);
    return;
  }

  data.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";

    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = "#" + (index + 1);

    const username = document.createElement("span");
    username.className = "username";
    username.textContent = player.username;

    const rolls = document.createElement("span");
    rolls.className = "rolls";
    rolls.textContent = Number(player.rolls).toLocaleString();

    row.append(rank, username, rolls);
    list.append(row);
  });
}

loadLeaderboard();