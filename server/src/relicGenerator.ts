import { v4 as uuidv4 } from 'uuid';
import { Relic, RelicPart, RelicDescription } from './types';

const ERAS = ['商周', '秦汉', '魏晋', '隋唐', '宋元', '明清'];
const STYLES = ['古朴', '华丽', '简约', '神秘', '典雅', '粗犷'];
const COLORS = ['青铜色', '瓷白色', '朱红色', '墨黑色', '金黄色', '青绿色', '灰褐色'];

const PART_TEMPLATES: Omit<RelicPart, 'id'>[] = [
  { name: '青铜鼎身', category: 'body', era: '商周', style: '古朴', color: '青铜色', compatibleEras: ['商周', '秦汉'], compatibleStyles: ['古朴', '粗犷'] },
  { name: '瓷瓶身', category: 'body', era: '明清', style: '典雅', color: '瓷白色', compatibleEras: ['宋元', '明清'], compatibleStyles: ['典雅', '简约'] },
  { name: '玉璧身', category: 'body', era: '秦汉', style: '简约', color: '青绿色', compatibleEras: ['秦汉', '魏晋'], compatibleStyles: ['简约', '典雅'] },
  { name: '陶俑身', category: 'body', era: '秦汉', style: '粗犷', color: '灰褐色', compatibleEras: ['秦汉', '商周'], compatibleStyles: ['粗犷', '古朴'] },
  { name: '金佛像身', category: 'body', era: '隋唐', style: '华丽', color: '金黄色', compatibleEras: ['隋唐', '宋元'], compatibleStyles: ['华丽', '神秘'] },
  { name: '云锦纹', category: 'pattern', era: '明清', style: '华丽', color: '朱红色', compatibleEras: ['明清', '隋唐'], compatibleStyles: ['华丽', '典雅'] },
  { name: '饕餮纹', category: 'pattern', era: '商周', style: '神秘', color: '青铜色', compatibleEras: ['商周', '秦汉'], compatibleStyles: ['神秘', '古朴'] },
  { name: '莲花纹', category: 'pattern', era: '隋唐', style: '典雅', color: '瓷白色', compatibleEras: ['隋唐', '宋元'], compatibleStyles: ['典雅', '简约'] },
  { name: '云雷纹', category: 'pattern', era: '商周', style: '古朴', color: '青铜色', compatibleEras: ['商周', '秦汉'], compatibleStyles: ['古朴', '神秘'] },
  { name: '龙纹', category: 'pattern', era: '明清', style: '华丽', color: '金黄色', compatibleEras: ['宋元', '明清'], compatibleStyles: ['华丽', '神秘'] },
  { name: '青铜底座', category: 'base', era: '商周', style: '古朴', color: '青铜色', compatibleEras: ['商周', '秦汉'], compatibleStyles: ['古朴', '粗犷'] },
  { name: '红木底座', category: 'base', era: '明清', style: '典雅', color: '朱红色', compatibleEras: ['宋元', '明清'], compatibleStyles: ['典雅', '华丽'] },
  { name: '玉石底座', category: 'base', era: '秦汉', style: '简约', color: '青绿色', compatibleEras: ['秦汉', '魏晋'], compatibleStyles: ['简约', '典雅'] },
  { name: '石刻铭文', category: 'inscription', era: '秦汉', style: '古朴', color: '灰褐色', compatibleEras: ['商周', '秦汉'], compatibleStyles: ['古朴', '神秘'] },
  { name: '御题铭文', category: 'inscription', era: '明清', style: '典雅', color: '墨黑色', compatibleEras: ['宋元', '明清'], compatibleStyles: ['典雅', '华丽'] },
  { name: '甲骨文', category: 'inscription', era: '商周', style: '神秘', color: '墨黑色', compatibleEras: ['商周'], compatibleStyles: ['神秘', '古朴'] },
  { name: '青铜材质', category: 'material', era: '商周', style: '古朴', color: '青铜色', compatibleEras: ['商周', '秦汉'], compatibleStyles: ['古朴', '粗犷'] },
  { name: '瓷器材质', category: 'material', era: '明清', style: '典雅', color: '瓷白色', compatibleEras: ['宋元', '明清'], compatibleStyles: ['典雅', '简约'] },
  { name: '玉石材质', category: 'material', era: '秦汉', style: '简约', color: '青绿色', compatibleEras: ['秦汉', '魏晋'], compatibleStyles: ['简约', '典雅'] },
  { name: '黄金材质', category: 'material', era: '隋唐', style: '华丽', color: '金黄色', compatibleEras: ['隋唐', '明清'], compatibleStyles: ['华丽', '神秘'] },
];

const RELIC_NAMES = [
  '传国玉玺', '司母戊鼎', '清明上河图', '金缕玉衣', '越王勾践剑',
  '曾侯乙编钟', '马踏飞燕', '镶金兽首玛瑙杯', '鎏金舞马衔杯纹银壶', '唐三彩骆驼载乐俑',
  '青花海水纹香炉', '汝窑天青釉洗', '哥窑鱼耳炉', '定窑白瓷孩儿枕', '钧窑玫瑰紫釉尊',
  '红山文化玉龙', '良渚玉琮', '三星堆青铜面具', '甲骨文片', '敦煌壁画残卷'
];

const DESCRIPTION_TEMPLATES = {
  true: [
    '此物品年代久远，据考证应为{era}时期作品。',
    '采用{style}风格制作，工艺精湛。',
    '材质为{material}，表面呈现{color}光泽。',
    '器身饰有{pattern}，线条流畅自然。',
    '底部带有{base}，工艺考究。',
    '上面刻有{inscription}，具有重要史料价值。',
    '从器型判断，符合{era}时期的典型特征。',
    '包浆自然，应为流传有序的珍品。',
  ],
  false: [
    '据传此物品曾为宫廷御用之物。',
    '有专家认为其可能是{era}时期的罕见精品。',
    '从某些特征来看，似乎采用了{style}风格。',
    '表面光泽独特，可能是特殊的{material}材质。',
    '花纹样式罕见，或为失传工艺所作。',
    '此物来历神秘，据说是从古老遗址中发现。',
  ],
  vague: [
    '此物品的具体年代尚有争议。',
    '关于其真伪，学界有不同看法。',
    '从图片上难以完全确定其实际价值。',
    '需要进一步的专业鉴定才能确认。',
    '此物在民间流传已久，故事颇多。',
  ]
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function calculateCompatibility(parts: RelicPart[]): number {
  let score = 0;
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const p1 = parts[i];
      const p2 = parts[j];
      if (p1.compatibleEras.includes(p2.era)) score += 1;
      if (p1.compatibleStyles.includes(p2.style)) score += 1;
      if (p1.era === p2.era) score += 2;
      if (p1.style === p2.style) score += 2;
    }
  }
  return score;
}

function getPartsByCategory(category: RelicPart['category']): RelicPart[] {
  return PART_TEMPLATES.filter(p => p.category === category).map(p => ({ ...p, id: uuidv4() }));
}

function generatePixelData(parts: RelicPart[], isGenuine: boolean): number[][] {
  const size = 32;
  const pixels: number[][] = [];
  const colorMap: Record<string, number> = {
    '青铜色': 0x8B7355,
    '瓷白色': 0xF5F5F5,
    '朱红色': 0xDC143C,
    '墨黑色': 0x1A1A1A,
    '金黄色': 0xFFD700,
    '青绿色': 0x2E8B57,
    '灰褐色': 0x8B7355,
  };

  for (let y = 0; y < size; y++) {
    pixels[y] = [];
    for (let x = 0; x < size; x++) {
      pixels[y][x] = 0x000000;
    }
  }

  const mainColor = colorMap[parts[0]?.color || '青铜色'] || 0x8B7355;
  const accentColor = parts.length > 1 ? colorMap[parts[1]?.color || '金黄色'] || 0xFFD700 : 0xFFD700;

  for (let y = 4; y < size - 4; y++) {
    for (let x = 4; x < size - 4; x++) {
      const centerDist = Math.sqrt(Math.pow(x - size / 2, 2) + Math.pow(y - size / 2, 2));
      if (centerDist < size / 3) {
        pixels[y][x] = mainColor;
      } else if (centerDist < size / 2.5) {
        pixels[y][x] = accentColor;
      }
    }
  }

  if (!isGenuine) {
    const flawX = Math.floor(Math.random() * (size - 8)) + 4;
    const flawY = Math.floor(Math.random() * (size - 8)) + 4;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = flawX + dx;
        const ny = flawY + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          if (pixels[ny][nx] !== 0x000000) {
            pixels[ny][nx] = 0xFF0000;
          }
        }
      }
    }
  }

  return pixels;
}

function generateDescriptions(relic: Relic): RelicDescription[] {
  const descriptions: RelicDescription[] = [];
  const materialPart = relic.parts.find(p => p.category === 'material');
  const patternPart = relic.parts.find(p => p.category === 'pattern');
  const basePart = relic.parts.find(p => p.category === 'base');
  const inscriptionPart = relic.parts.find(p => p.category === 'inscription');

  const trueCount = relic.isGenuine ? 4 : 2;
  const shuffledTrue = shuffle(DESCRIPTION_TEMPLATES.true);
  for (let i = 0; i < trueCount && i < shuffledTrue.length; i++) {
    let text = shuffledTrue[i];
    text = text.replace('{era}', relic.era);
    text = text.replace('{style}', relic.style);
    text = text.replace('{material}', materialPart?.name || '未知材质');
    text = text.replace('{color}', materialPart?.color || '');
    text = text.replace('{pattern}', patternPart?.name || '精美花纹');
    text = text.replace('{base}', basePart?.name || '考究底座');
    text = text.replace('{inscription}', inscriptionPart?.name || '古老铭文');
    descriptions.push({ text, isTrue: true, isVague: false });
  }

  if (!relic.isGenuine) {
    const shuffledFalse = shuffle(DESCRIPTION_TEMPLATES.false);
    for (let i = 0; i < 3 && i < shuffledFalse.length; i++) {
      let text = shuffledFalse[i];
      text = text.replace('{era}', randomChoice(ERAS));
      text = text.replace('{style}', randomChoice(STYLES));
      text = text.replace('{material}', randomChoice(['青铜', '瓷器', '玉石', '黄金']));
      descriptions.push({ text, isTrue: false, isVague: false });
    }
  }

  const shuffledVague = shuffle(DESCRIPTION_TEMPLATES.vague);
  for (let i = 0; i < 2 && i < shuffledVague.length; i++) {
    descriptions.push({ text: shuffledVague[i], isTrue: false, isVague: true });
  }

  return shuffle(descriptions);
}

function generateFlaws(parts: RelicPart[]): string[] {
  const flaws: string[] = [];
  const eras = [...new Set(parts.map(p => p.era))];
  if (eras.length > 1) {
    flaws.push(`零件年代不一致：发现${eras.join('、')}等多个时期特征`);
  }
  const styles = [...new Set(parts.map(p => p.style))];
  if (styles.length > 1) {
    flaws.push(`艺术风格混杂：兼有${styles.join('、')}等风格元素`);
  }
  flaws.push('部分细节工艺略显生硬，与同时期真品有差异');
  return flaws;
}

export function generateRelic(): Relic {
  const isGenuine = Math.random() < 0.5;
  const categories: RelicPart['category'][] = ['body', 'material', 'pattern', 'base', 'inscription'];
  const selectedParts: RelicPart[] = [];
  const era = randomChoice(ERAS);
  const style = randomChoice(STYLES);

  for (const category of categories) {
    const parts = getPartsByCategory(category);
    let candidates = parts;
    
    if (isGenuine || Math.random() < 0.7) {
      candidates = parts.filter(p => 
        p.compatibleEras.includes(era) || p.compatibleStyles.includes(style)
      );
      if (candidates.length === 0) candidates = parts;
    }

    selectedParts.push(randomChoice(candidates));
  }

  if (!isGenuine) {
    const wrongCategory = randomChoice(categories);
    const wrongParts = getPartsByCategory(wrongCategory).filter(p => 
      !p.compatibleEras.includes(era) && !p.compatibleStyles.includes(style)
    );
    if (wrongParts.length > 0) {
      const idx = selectedParts.findIndex(p => p.category === wrongCategory);
      if (idx !== -1) {
        selectedParts[idx] = randomChoice(wrongParts);
      }
    }
  }

  const compatibility = calculateCompatibility(selectedParts);
  const baseValue = isGenuine ? 5000 + compatibility * 500 : 500 + compatibility * 50;
  const variance = Math.floor(Math.random() * 2000) - 1000;

  const relic: Relic = {
    id: uuidv4(),
    name: randomChoice(RELIC_NAMES),
    era,
    style,
    parts: selectedParts,
    isGenuine,
    realValue: Math.max(1000, baseValue + variance),
    fakeValue: Math.max(100, Math.floor((baseValue + variance) * 0.1)),
    descriptions: [],
    flaws: isGenuine ? [] : generateFlaws(selectedParts),
    pixelData: [],
  };

  relic.descriptions = generateDescriptions(relic);
  relic.pixelData = generatePixelData(selectedParts, isGenuine);

  return relic;
}

export { calculateCompatibility };
