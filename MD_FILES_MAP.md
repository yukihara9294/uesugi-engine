# MDファイル相関図

最終更新: 2025-06-13  
更新者: Claude Code  
更新内容: DESIGN_REFERENCE.mdを追加、ファイル間連携を明確化

## ファイル間の関係性

```
開始 → .claude_instruction（作業ルール）
  ↓
PROJECT_GUIDE.md（作業概要・現状）
  ├→ 技術的な詳細が必要 → TECHNICAL_DETAILS.md
  ├→ 過去の経緯を確認 → CLAUDE.md
  ├→ デザイン仕様確認 → DESIGN_REFERENCE.md
  └→ プロジェクト説明 → README.md

相互参照関係:
- PROJECT_GUIDE.md ⟷ TECHNICAL_DETAILS.md（仕様と実装）
- CLAUDE.md → 他の全MDファイル（作業履歴から参照）
- DESIGN_REFERENCE.md ⟷ TECHNICAL_DETAILS.md（デザインと実装）
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

### DESIGN_REFERENCE.md
- ダミーデータ時のデザイン仕様
- 理想的な表現の参照基準
- 人流・宿泊・ランドマーク等の視覚仕様
- AI分析画面のデザイン仕様

## 情報を追加する場合

1. 作業指示・現状更新 → PROJECT_GUIDE.md
2. 技術的な発見・バグ → TECHNICAL_DETAILS.md
3. 完了した作業の記録 → CLAUDE.md
4. 外部向け情報更新 → README.md
5. デザイン仕様・視覚表現 → DESIGN_REFERENCE.md

## 重要な原則

**情報は削減しない。整理して適切なファイルに配置する。**

## 更新管理

### 各ファイルの更新频度

| ファイル | 更新频度 | 更新必須項目 |
|---------|---------|-------------|
| PROJECT_GUIDE.md | 毎回 | 現在の状況、次の作業、日付 |
| CLAUDE.md | 毎回 | 作業内容、日付 |
| TECHNICAL_DETAILS.md | 必要時 | 新しい技術的発見 |
| README.md | 必要時 | 大きな機能変更時 |
| DESIGN_REFERENCE.md | 必要時 | デザイン変更・仕様確定時 |
| .claude_instruction | ほとんど更新しない | ルール変更時のみ |
| MD_FILES_MAP.md | ほとんど更新しない | 構造変更時のみ |

### 更新時のルール

1. **日付を必ず記載** (YYYY-MM-DD形式)
2. **変更内容を具体的に記載**
3. **影響範囲を明記**
4. **未完了タスクは明確に残す**