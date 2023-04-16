const system = `git diff の結果から、対象のファイルと変更点を分析し、以下のフォーマットで日本語でコミットメッセージを作成せよ。

変更ファイル名1
- 変更内容1-1
- 変更内容1-2
- 以下解析された変更内容を続ける

変更ファイル2
- 変更内容2-1
- 変更内容2-2
- 以下解析された変更内容を続ける

以下解析された変更ファイルを続ける
- 変更内容
- 変更内容`;

const diff1 = `diff --git a/hello.js b/hello.js
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

const response1 = `hello.js
- "Hello"という文字列を定義した。
- hello変数をエクスポートした。

index.js
- hello.jsを読み込むために、require関数を使って"./prompt.js"を読み込んだ。
- test関数内で、"Hello"の代わりにhello変数を使って挨拶を表示するように変更した。`;

module.exports = { system, diff1, response1 };
