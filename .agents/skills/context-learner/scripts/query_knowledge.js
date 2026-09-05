#!/usr/bin/env node
/**
 * query_knowledge.js
 * 
 * 우현이 관찰 시스템 지식 베이스(knowledge/)를 빠르고 가볍게 검색하여
 * AI 에이전트의 컨텍스트 낭비를 방지하고 필요한 지식만 추출하는 CLI 도구입니다.
 */

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_ROOT = path.resolve(__dirname, '../../../../knowledge');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    keyword: '',
    category: '',
    recent: 0,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--keyword=')) {
      options.keyword = arg.split('=')[1].replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1].toLowerCase().replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--recent=')) {
      options.recent = parseInt(arg.split('=')[1], 10) || 3;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
🔍 우현이 관찰 시스템 지식 검색 도구 (Knowledge Query CLI)

사용법:
  node query_knowledge.js [옵션]

옵션:
  --keyword="단어"     전체 지식 베이스에서 해당 키워드가 포함된 섹션을 타겟팅 검색
  --category=카테고리   특정 카테고리(dev, care, tasks) 핵심 요약 출력
  --recent=N          최근 작업 로그(task_log.md)에서 N개 항목 추출 (기본: 3)
  --help, -h          도움말 표시

예시:
  node query_knowledge.js --keyword="아빌리파이"
  node query_knowledge.js --keyword="차트"
  node query_knowledge.js --category=dev
  node query_knowledge.js --recent=2
`);
}

function getAllMarkdownFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'archive' || file === 'node_modules' || file.startsWith('.')) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function searchByKeyword(keyword) {
  console.log(`\n🔎 [지식 검색 결과: "${keyword}"]\n` + '='.repeat(50));
  const files = getAllMarkdownFiles(KNOWLEDGE_ROOT);
  let totalMatches = 0;

  for (const file of files) {
    const relPath = path.relative(KNOWLEDGE_ROOT, file);
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const matchingBlocks = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
        // 문맥 전후 2줄 추출
        const start = Math.max(0, i - 2);
        const end = Math.min(lines.length - 1, i + 3);
        const snippet = lines.slice(start, end + 1).join('\n');
        matchingBlocks.push({ lineNum: i + 1, snippet });
        i = end; // 중복 건너뛰기
      }
    }

    if (matchingBlocks.length > 0) {
      console.log(`\n📄 [파일: knowledge/${relPath}] (${matchingBlocks.length}건 발견)`);
      for (const block of matchingBlocks.slice(0, 3)) { // 파일당 최대 3개 블록
        console.log(`  ----------------------------------------`);
        console.log(block.snippet.split('\n').map(l => '  | ' + l).join('\n'));
      }
      totalMatches += matchingBlocks.length;
    }
  }

  if (totalMatches === 0) {
    console.log(`\n❌ "${keyword}"에 대한 검색 결과가 없습니다.`);
  } else {
    console.log(`\n총 ${totalMatches}건의 관련 컨텍스트를 찾았습니다.\n`);
  }
}

function showCategorySummary(category) {
  const targetDir = path.join(KNOWLEDGE_ROOT, category);
  if (!fs.existsSync(targetDir)) {
    console.log(`\n❌ 카테고리 폴더가 존재하지 않습니다: ${category}`);
    console.log(`가능한 카테고리: dev, care, tasks`);
    return;
  }

  console.log(`\n📂 [카테고리 요약: "${category.toUpperCase()}"]\n` + '='.repeat(50));
  const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));

  for (const f of files) {
    const fullPath = path.join(targetDir, f);
    const content = fs.readFileSync(fullPath, 'utf8');
    const firstHeader = content.split('\n').find(l => l.startsWith('# ')) || f;
    console.log(`\n📄 knowledge/${category}/${f}`);
    console.log(`   제목: ${firstHeader.replace(/^#\s*/, '')}`);
    
    // 주요 소제목 목록 추출
    const subHeaders = content.split('\n')
      .filter(l => l.startsWith('## ') || l.startsWith('### '))
      .slice(0, 5)
      .map(l => '   - ' + l.replace(/^#+\s*/, ''));
    if (subHeaders.length > 0) {
      console.log(`   주요 항목:`);
      console.log(subHeaders.join('\n'));
    }
  }
  console.log('\n' + '='.repeat(50) + '\n');
}

function showRecentTasks(limit) {
  const taskLogPath = path.join(KNOWLEDGE_ROOT, 'tasks', 'task_log.md');
  if (!fs.existsSync(taskLogPath)) {
    console.log(`\n❌ task_log.md 파일이 존재하지 않습니다.`);
    return;
  }

  const content = fs.readFileSync(taskLogPath, 'utf8');
  const sections = content.split(/(?=###\s*📌\s*\[\d{4}-\d{2}-\d{2}\])/);

  console.log(`\n📋 [최근 활성 작업 히스토리 (최대 ${limit}건)]\n` + '='.repeat(50));
  
  // 첫 번째 항목은 헤더 설명일 수 있으므로 작업 섹션만 필터링
  const taskSections = sections.filter(s => s.trim().startsWith('### 📌'));
  const recentList = taskSections.slice(0, limit);

  if (recentList.length === 0) {
    console.log(`기록된 작업이 없습니다.`);
  } else {
    for (const item of recentList) {
      console.log('\n' + item.trim() + '\n----------------------------------------');
    }
  }
}

function main() {
  const options = parseArgs();

  if (options.help || (!options.keyword && !options.category && !options.recent)) {
    // 기본 인자 없을 때 전체 색인 안내
    const readmePath = path.join(KNOWLEDGE_ROOT, 'README.md');
    if (fs.existsSync(readmePath) && !options.help) {
      console.log(`\n📖 [지식 베이스 색인 요약]`);
      const lines = fs.readFileSync(readmePath, 'utf8').split('\n');
      console.log(lines.slice(0, 30).join('\n'));
      console.log(`\n💡 특정 키워드로 검색하려면: node query_knowledge.js --keyword="키워드"`);
      return;
    }
    printHelp();
    return;
  }

  if (options.keyword) {
    searchByKeyword(options.keyword);
  } else if (options.category) {
    showCategorySummary(options.category);
  } else if (options.recent) {
    showRecentTasks(options.recent);
  }
}

main();
