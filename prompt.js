const system = `git diff の結果から、対象のファイルと変更点、変更内容を分析し、以下のフォーマットで日本語のコミットメッセージを作成せよ。
const diff_sample = `diff --git a/hello.js b/hello.js