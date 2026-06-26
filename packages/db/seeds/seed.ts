import { writeFileSync } from 'node:fs'
import { buildSeedSql } from './build-seed-sql.ts'
import {
  buildSeedArticles,
  buildSeedArticleTags,
  buildSeedTags,
} from './seed-data.ts'

const sql = buildSeedSql({
  tags: buildSeedTags(),
  articles: buildSeedArticles(),
  articleTags: buildSeedArticleTags(),
})

const outputPath = new URL('./seed.sql', import.meta.url)
writeFileSync(outputPath, `${sql}\n`)

console.log(`シードSQLを生成しました: ${outputPath.pathname}`)
