#!/usr/bin/env node

const axios = require("axios");
const { execSync } = require("child_process");
const { system, diff_sample, res_sample } = require("./prompt.js");

// 環境変数からAPIキーを読み込む
const apiKey = process.env.AI_COMMIT_KEY;

// APIキーが設定されていない場合、エラーメッセージを表示し、プログラムを終了
if (!apiKey) {
  console.error("環境変数AI_COMMIT_KEYにAPIキーが設定されていません。設定してください。");
  process.exit(1);
}

(async () => {
  // コマンドライン引数からファイル名を取得
  const targetFile = process.argv[2];
  const gitAddCommand = targetFile
    ? `git add -N --ignore-removal ${targetFile}`
    : "git add -N --ignore-removal .";
  const diff = execSync(
    `${gitAddCommand} && git --no-pager diff --unified=0 ${targetFile || ""}`
  ).toString();
  if (!diff) return console.log("diffが得られませんでした");

  const URL = "https://api.openai.com/v1/chat/completions";
  try {
    console.log("リクエスト中...");
    const response = await axios.post(
      URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: system },
          { role: "user", content: diff_sample },
          { role: "assistant", content: res_sample },
          { role: "user", content: diff },
        ],
        temperature: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const commitMessage = response.data.choices[0].message.content;

    // デバッグ用
    // console.log(response.data);
    // console.log(response.data.choices[0]);

    console.log(`生成されたコミットメッセージ\n---\n\n${commitMessage}\n\n---\n`);

    process.stdout.write("このメッセージでコミットしますか？ y/n (y): ");
    process.stdin.on("data", (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === "y" || answer === "") {
        execSync("git add .");
        execSync(`git commit -m "${commitMessage}"`);
        console.log("コミットが完了しました。");
        process.exit(0);
      } else if (answer === "n") {
        console.log("コミットをキャンセルしました。");
        process.exit(0);
      } else {
        console.log("無効な入力です。yまたはnを入力してください。y/n (y): ");
      }
    });
  } catch (error) {
    const errorData = error.response.data;

    // デバッグ用
    // console.log(errorData);

    const errorCode = errorData.error.code;
    if (errorCode === "context_length_exceeded") {
      const errorMessage = error.response.data.error.message;
      exceededTokens = checkExceededTokens(errorMessage);
      console.log(
        "error: requested token が超過しています",
        exceededTokens,
        "。対象を限定してください。\n ex) ai-commit index.js"
      );
    }
  }
})();

// ChatGPTのエラーメッセージからトークン数を取り出す
// ex. "This model's maximum context length is 4097 tokens. However, you requested 5568 tokens (1568 in the messages, 4000 in the completion). Please reduce the length of the messages or completion."
// -> (5568/4097 tokens)
const checkExceededTokens = (errorMessage) => {
  const regex = /\d+/g;
  let match;
  let maximum;
  let requested;

  while ((match = regex.exec(errorMessage)) !== null) {
    const number = parseInt(match[0], 10);

    if (maximum === undefined) {
      maximum = number;
    } else if (number > maximum) {
      requested = number;
      return "(" + requested + "/" + maximum + " tokens)";
    }
  }
};
