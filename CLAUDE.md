@AGENTS.md

# 支出管理アプリ — 仕様要点（詳細: docs/SPEC.md）

現在の実装対象は **Phase 1 と Phase 2（写真・スクショからの自動入力）**。Phase 2 は開発者の判断で Phase 1 の1ヶ月運用を待たずに着手した。Phase 3 には着手しない。

## Phase 1 の範囲
- 手入力による支出・収入記録、カテゴリ管理、日割り残高、2通貨併記、ルールベース予算アラート、公開統計との比較、分析画面
- データは端末内の `expo-sqlite` のまま。Supabase は **Edge Function（Gemini 呼び出しの中継）にだけ使う**。DB・認証・ストレージは使わない（Phase 3 まで）
- 外部API呼び出しは **為替レート取得（frankfurter.app）** と **Supabase Edge Function 経由の Gemini** のみ。アプリから Gemini を直接呼ばない

## 絶対厳守のルール
- **金額は必ず整数（最小通貨単位）で保存**。浮動小数点で金額を持たない
- 取引ごとに `rate_used`（記録時点のレート）をレコードに保存し、後からのレート変動で過去記録の換算額を変えない
- 永続化は `expo-sqlite`。`AsyncStorage` は使わない（集計クエリが必要なため）
- `src/domain/` は UI に依存しない純関数のみで構成し、金額計算・日割り計算には**必ずテストを書く**
- ベンチマーク数値（`assets/benchmarks.json`）はAIに生成させず、信頼できる出典から手入力する。表示には必ず出典名と調査年度を出す。データが無い地域では比較を非表示にする（推測値を出さない）
- TypeScript は `any` 禁止
- **Gemini の APIキーは Edge Function の secrets にだけ置く**。アプリのコード・`.env`・`EXPO_PUBLIC_*` に入れない
- AI の読み取り結果は必ず確認画面に出し、ユーザーが直してから保存する。自動保存しない
- 画像はクラウドに保存しない（Edge Function は読み取り後に破棄し、保存するのは端末内だけ）
- 状態管理は React state/Context のみで開始し、ライブラリは必要になってから追加する
- グラフは `react-native-gifted-charts` を使う（`victory-native` は Skia ネイティブモジュール依存で Expo Go 非対応のため不採用）
- 「月」の区切りは常に `month_start_day` 基準の予算期間を使う。暦月（1日〜末日）は使わない。期間ラベルは常に日付範囲をそのまま表示する（例: `Aug 25 – Sep 24`）。グラフ軸など省スペースが必要な箇所は開始日のみの短縮表示＋タップ/ホバーで全期間表示
- `assets/benchmarks.json` は Phase 1 開始時点では `regions: []` の空データで実装する。スキーマ・型定義は先に確定し、データが無い地域（＝現状は全地域）では比較セクションを非表示にする挙動を実装・確認する。実データは後日、開発者が出典付きで追記する

## ディレクトリ方針
```
src/
  db/          スキーマ、マイグレーション、クエリ
  domain/      金額計算、日割り計算、アラート判定（純関数、テスト必須）
  components/  再利用UI
  hooks/
  constants/   カテゴリ初期値、閾値、通貨定義
assets/
  benchmarks.json
```
（本リポジトリは Expo Router の `src/app/` 構成。SPEC.md 上の `app/` はこの `src/app/` に対応）

## Non-goals（Phase 1）
銀行口座連携、複数ユーザー共有、投資管理、Edge Function 経由以外の外部AI API呼び出し、レシート画像のクラウド保存、SQLite から Supabase DB への移行
