#!/usr/bin/env node

const axios = require("axios");
const { execSync } = require("child_process");
const { system, diff1, response1 } = require("./prompt.js");

// 環境変数からAPIキーを読み込む
const apiKey = process.env.AI_COMMIT_KEY;

// APIキーが設定されていない場合、エラーメッセージを表示し、プログラムを終了
if (!apiKey) {
  console.error("環境変数AI_COMMIT_KEYにAPIキーが設定されていません。設定してください。");
  process.exit(1);
}

(async () => {
  const diff = execSync("git add -N . && git --no-pager diff").toString();
  const URL = "https://api.openai.com/v1/chat/completions";
  try {
    console.log("リクエスト中...");
    const response = await axios.post(
      URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: system,
          },
          {
            role: "user",
            content: diff1,
          },
          {
            role: "assistant",
            content: response1,
          },
          { role: "user", content: diff },
        ],
        temperature: 0,
        max_tokens: 3000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const commitMessage = response.data.choices[0].message.content;
    console.log("生成されたコミットメッセージ: \n --- \n\n", commitMessage, "\n\n --- \n");

    process.stdout.write("このメッセージでコミットしますか？ y/n: ");
    process.stdin.on("data", (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === "y") {
        execSync("git add .");
        execSync(`git commit -m "${commitMessage}"`);
        console.log("コミットが完了しました。");
        process.exit(0);
      } else if (answer === "n") {
        console.log("コミットをキャンセルしました。");
        process.exit(0);
      } else {
        console.log("無効な入力です。yまたはnを入力してください。");
      }
    });
  } catch (error) {
    console.error("リクエストに失敗しました:", error);
  }
})();
