import { config } from "dotenv";
import { AtpAgent } from "@atproto/api";
import fs from "fs";

config();
const { BLUESKY_USERNAME, BLUESKY_PASSWORD } = process.env;

if (!BLUESKY_USERNAME || !BLUESKY_PASSWORD) {
  console.error("Missing BLUESKY_USERNAME or BLUESKY_PASSWORD in .env file.");
  process.exit(1);
}

const agent = new AtpAgent({ service: "https://bsky.social" });

async function searchPosts(keyword) {
  try {
    await agent.login({
      identifier: BLUESKY_USERNAME,
      password: BLUESKY_PASSWORD,
    });
    console.log(`Logged in as ${BLUESKY_USERNAME}`);
  } catch (err) {
    console.error("Failed to login:", err);
    process.exit(1);
  }

  const now = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(now.getMonth() - 1);

  const since = lastMonth.toISOString(); // 'YYYY-MM-DD'
  const until = now.toISOString(); // 'YYYY-MM-DD'

  console.log(since);
  console.log(until);
  let count = 0;
  let cursor = 0;
  let hasMore = true;
  const posts = [];

  while (hasMore) {
    try {
      const response = await agent.app.bsky.feed.searchPosts({
        q: keyword,
        // sort: "latest",
        since,
        until,
        limit: 100,
        cursor: cursor,
      });

      console.log(`Fetched ${response.data.posts.length} posts`, cursor);
      posts.push(response.data.posts);
      count += response.data.posts.length;

      cursor = response.data.cursor;
      hasMore = !!cursor;
    } catch (error) {
      console.error("Error fetching posts:", error.response?.data || error);
      break;
    }
  }

  console.log(
    `Number of posts containing "${keyword}" in the last month: ${count}`
  );

  // save posts to a file
  fs.writeFile("posts.json", JSON.stringify(posts, null, 2), (err) => {
    if (err) throw err;
    console.log("Posts saved to posts.json");
  });
}

const keyword = process.argv[2];
if (!keyword) {
  console.error("Usage: node bluesky_search.mjs <search_word>");
  process.exit(1);
}

searchPosts(keyword);
