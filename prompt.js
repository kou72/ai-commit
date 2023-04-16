const system = `git diff の結果から、対象のファイルと変更点、変更内容を分析し、以下のフォーマットで日本語のコミットメッセージを作成せよ。

冒頭で変更内容の概要を50字程度で記述せよ

変更ファイル名
- 変更内容
- 変更内容
- 変更内容
- 変更内容
- 以下解析された変更内容を続ける

変更ファイル名
- 変更内容
- 変更内容
- 変更内容
- 変更内容
- 以下解析された変更内容を続ける

以下解析された変更ファイル名を続ける
- 変更内容
- 変更内容
- 変更内容
- 変更内容
- 以下解析された変更内容を続ける`;

const diff_sample = `diff --git a/hello.js b/hello.js
new file mode 100644
index 0000000..92dd441
--- /dev/null
+++ b/hello.js
@@ -0,0 +1,2 @@
+const hello = "Hello";
+module.exports = hello;
diff --git a/index.js b/index.js
index fa77789..d3c80d2 100644
--- a/index.js
+++ b/index.js
@@ -1,7 +1,8 @@
 #!/usr/bin/env node
+const hello = require("./prompt.js");

 const test = (name) => {
-  console.log(\`Hello, \${name}!\`);
+  console.log(\`\${hello}, \${name}!\`);
 };

 const args = process.argv.slice(2);`;

const res_sample = `hello.jsファイルを新規作成、index.jsでhello変数をインポートして利用するように修正

hello.js
- "Hello"という文字列を定義
- hello変数をエクスポート

index.js
- hello.jsを読み込むために、require関数を使って"./prompt.js"を読み込み
- test関数内で、"Hello"の代わりにhello変数を使って挨拶を表示するように変更`;

module.exports = { system, diff_sample, res_sample };
