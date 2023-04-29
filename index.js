#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { execSync } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(require("child_process").exec);

const { system, diff_sample, res_sample } = require("./prompt.js");

// 環境変数からAPIキーを読み込む
const apiKey = process.env.AI_COMMIT_KEY;

// APIキーが設定されていない場合、エラーメッセージを表示し、プログラムを終了
if (!apiKey) {
  console.error("環境変数AI_COMMIT_KEYにAPIキーが設定されていません。設定してください。");
  process.exit(1);
}

// オプションの検証
const validateOptions = (args) => {
  const validOptions = ["--cached"];
  for (const arg of args) {
    if (!validOptions.includes(arg)) {
      console.error(`無効なオプション: ${arg}`);
      process.exit(1);
    }
  }
};

(async () => {
  // gitのルートディレクトリを取得
  const { stdout } = await execAsync("git rev-parse --show-toplevel");
  const gitRoot = stdout.trim();
  const gitAddCommand = `git add -N --ignore-removal ${gitRoot}`;

  // --cached オプション確認
  const args = process.argv.slice(2);
  // オプションの検証
  validateOptions(args);
  const useCached = args.includes("--cached");
  const gitDiffCommand = `git --no-pager diff --unified=0 ${useCached ? "--cached" : ""}`;

  const diff = execSync(`${gitAddCommand} && ${gitDiffCommand}`).toString();
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
    process.stdin.on("data", async (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === "y" || answer === "") {
        // コミットメッセージファイルを作成し、コミットメッセージを書き込む
        const commitMessageFilePath = path.join(gitRoot, ".git", "ai-commit-message.txt");
        fs.writeFileSync(commitMessageFilePath, commitMessage, "utf8");

        if (!useCached) execSync(`git add ${gitRoot}`);
        // git commit -Fでコミットメッセージファイルを参照する
        execSync(`git commit -F "${commitMessageFilePath}"`);
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
    if (error.response.data.error.code === "context_length_exceeded") {
      const errorMessage = error.response.data.error.message;
      exceededTokens = checkExceededTokens(errorMessage);
      console.log(
        "error: requested token が超過しています",
        exceededTokens,
        "。--cached オプションを利用して対象を限定してください。\n ex) git add index.js && ai-commit --cached"
      );
    } else if (error.message) {
      console.log("error: " + error.message);
    } else {
      console.log("error: " + error);
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
