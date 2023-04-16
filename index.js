#!/usr/bin/env node

const axios = require("axios");
const { execSync } = require("child_process");

// 環境変数からAPIキーを読み込む
const apiKey = process.env.AI_COMMIT_KEY;

// APIキーが設定されていない場合、エラーメッセージを表示し、プログラムを終了
if (!apiKey) {
  console.error("環境変数AI_COMMIT_KEYにAPIキーが設定されていません。設定してください。");
  process.exit(1);
}

(async () => {
  const diff = execSync("git diff").toString();
  const prompt = `以下はgit diff の出力結果である。この内容からcommitメッセージとしてふさわしいコメントを生成してください。ただし以下のフォーマットで作成することとしてください

test.txt : 文字列をtextからtestに変更

以下 git diff の内容

`;

  const input = prompt + diff;

  const URL = "https://api.openai.com/v1/chat/completions";
  try {
    console.log("リクエスト中...");
    const response = await axios.post(
      URL,
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: input }],
        temperature: 0.1,
        max_tokens: 1000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const commitMessage = response.data.choices[0].message.content;
    console.log("生成されたコミットメッセージ: ", commitMessage);

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
