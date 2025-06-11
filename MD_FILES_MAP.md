# MDファイル相関図

## ファイル間の関係性

```
開始 → .claude_instruction（作業ルール）
  ↓
PROJECT_GUIDE.md（作業概要・現状）
  ├→ 技術的な詳細が必要 → TECHNICAL_DETAILS.md
  ├→ 過去の経緯を確認 → CLAUDE.md
  └→ プロジェクト説明 → README.md
```

## 各ファイルの内容

### .claude_instruction
- 絶対的ルール（絵文字禁止等）
- MDファイル管理方針
- 情報は削減せず整理のみ

### PROJECT_GUIDE.md
- コアコンセプト（施策効果検証プラットフォーム）
- 現在の状況（広島・山口データ可視化中）
- 作業優先順位
- API構成
- 次の作業

### TECHNICAL_DETAILS.md
- 実装済み機能の技術仕様
- バグ・ワークアラウンド情報
- 未解決の問題
- パフォーマンス最適化
- 環境設定詳細

### CLAUDE.md
- 開発履歴
- 過去の作業内容
- 他ファイルへの参照

### README.md
- 外部向けプロジェクト説明
- 環境構築手順（簡潔版）

## 情報を追加する場合

1. 作業指示・現状更新 → PROJECT_GUIDE.md
2. 技術的な発見・バグ → TECHNICAL_DETAILS.md
3. 完了した作業の記録 → CLAUDE.md
4. 外部向け情報更新 → README.md

## 重要な原則

**情報は削減しない。整理して適切なファイルに配置する。**