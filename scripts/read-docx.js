import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docxPath = path.join(__dirname, '../pro_3d_music_earth_advanced.docx');
const outputPath = path.join(__dirname, '../docs/ORIGINAL_DOCX.md');

console.log('正在读取 docx 文件...');

mammoth.convertToMarkdown({ path: docxPath })
  .then(function(result) {
    const markdown = result.value;
    const messages = result.messages;

    console.log('✓ 读取成功！');

    if (messages.length > 0) {
      console.log('\n⚠️  提示信息:');
      messages.forEach(msg => console.log(msg));
    }

    console.log('\n正在保存到 docs/ORIGINAL_DOCX.md...');
    fs.writeFileSync(outputPath, markdown, 'utf8');
    console.log('✓ 保存完成！');

    console.log('\n---\n文档内容预览:\n---');
    console.log(markdown.substring(0, 2000) + '...');
  })
  .catch(function(err) {
    console.error('❌ 读取失败:', err);
  });
