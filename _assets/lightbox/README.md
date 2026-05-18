# lightbox 共通アセット

画像・動画のクリック拡大（モーダル / ズーム / パン）を提供する共通アセット。

## 出所

`media-lightbox` Skill（`~/.claude/skills/media-lightbox/`）の `lightbox.css` / `lightbox.js` を
コピーして配置している。**手編集禁止**。更新する場合は Skill 側を正として丸ごとコピーし直す。

- 現バージョン: lightbox.css 2,979B / lightbox.js 9,246B

## 使い方（このリポジトリでの統一ルール）

lightbox を使うノートHTMLは、フォルダ階層に関わらず**ルート絶対パス**で参照する:

```html
<link rel="stylesheet" href="/_assets/lightbox/lightbox.css">
<script src="/_assets/lightbox/lightbox.js" defer></script>
```

拡大対象の `<img>` / `<video>` に `data-lightbox` を付ける（詳細は media-lightbox SKILL.md 参照）。

## なぜルート絶対パスか

`index.html` が iframe でノートを読み込む構造のため、相対パスはノートの階層深さで
段数が変わり壊れやすい。ルート絶対パスなら全ノートが深さ非依存で同じ1セットを参照できる。
ローカル（`python3 -m http.server`）も Vercel もルートが同一なので一致する。

> 注: HTML を含まないため `scripts/generate-structure.js` のサイドバーツリーには出ない。
