## 重要
- HTMLを作成する際は、他のHTMLファイルを参考にしてはいけない

## lightbox（画像・動画クリック拡大）の共通利用

- `media-lightbox` Skill を使う場合、Skill 標準手順（フォルダ内 `assets/` へコピー＋相対参照）は**使わない**
- 共通実体は `/_assets/lightbox/lightbox.{css,js}` に1セットのみ。各ノートHTMLは階層に関わらず**ルート絶対パス**で参照する:
  ```html
  <link rel="stylesheet" href="/_assets/lightbox/lightbox.css">
  <script src="/_assets/lightbox/lightbox.js" defer></script>
  ```
- 拡大対象の `<img>` / `<video>` に `data-lightbox` を付ける
- Skill 側が更新されたら `/_assets/lightbox/` を Skill から丸ごとコピーし直す（手編集禁止）