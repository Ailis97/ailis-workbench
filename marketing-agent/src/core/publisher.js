/**
 * 发布计划管理 (Publisher Manager)
 * 负责内容日历、发布排期、内容矩阵管理
 * 版本: v1.0
 */

const { Platform, ContentType, BusinessLine, PublishStatus } = require('./types');
const fs = require('fs');
const path = require('path');

const PLAN_DIR = path.join(__dirname, '..', '..', 'data', 'published');

class PublisherManager {
  constructor() {
    this.plans = [];
    this.loadPlans();
  }

  loadPlans() {
    if (!fs.existsSync(PLAN_DIR)) {
      fs.mkdirSync(PLAN_DIR, { recursive: true });
    }
    const idx = path.join(PLAN_DIR, 'plans.json');
    if (fs.existsSync(idx)) {
      try {
        this.plans = JSON.parse(fs.readFileSync(idx, 'utf8'));
      } catch (e) {
        this.plans = [];
      }
    }
  }

  savePlans() {
    const idx = path.join(PLAN_DIR, 'plans.json');
    fs.writeFileSync(idx, JSON.stringify(this.plans, null, 2), 'utf8');
  }

  generateId() {
    return 'pub_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /**
   * 生成月度内容计划
   * @param {number} year - 年份
   * @param {number} month - 月份 (1-12)
   * @param {Object[]} opportunities - 内容机会列表（已选中的）
   * @returns {Object} 月度计划
   */
  generateMonthlyPlan(year, month, opportunities) {
    const weeks = this.getWeeksOfMonth(year, month);
    const plan = {
      id: this.generateId(),
      type: 'MONTHLY',
      year,
      month,
      generatedAt: new Date().toISOString(),
      weeks: [],
    };

    // 内容矩阵模板：每周覆盖不同内容类型
    const weeklyMatrix = [
      // 第1周：传统量具 + 产品
      [ContentType.PRODUCT, ContentType.KNOWLEDGE, ContentType.SCENARIO],
      // 第2周：小量仪 + 技术
      [ContentType.PRODUCT, ContentType.KNOWLEDGE, ContentType.CASE],
      // 第3周：数字化 + 产品
      [ContentType.DIGITAL, ContentType.PRODUCT, ContentType.CASE],
      // 第4周：案例 + 避坑/对比
      [ContentType.CASE, ContentType.PITFALL, ContentType.COMPARE],
    ];

    // 按业务线分配优先级
    const linePriority = [BusinessLine.DIGITAL_TRANSMISSION, BusinessLine.TRADITIONAL, BusinessLine.SMALL_INSTRUMENT];

    let oppIndex = 0;

    for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
      const weekNum = weeks[weekIdx].weekNumber;
      const matrix = weeklyMatrix[weekIdx % weeklyMatrix.length];
      const weekPlan = {
        weekNumber: weekNum,
        dates: weeks[weekIdx].dates,
        theme: this.getWeekTheme(weekIdx, month),
        items: [],
      };

      // 每天一条内容
      const days = ['周一', '周二', '周三', '周四', '周五'];
      const platforms = ['VIDEO_HAO', 'DOUYIN', 'XIAOHONGSHU', 'VIDEO_HAO', 'VIDEO_HAO'];

      for (let dayIdx = 0; dayIdx < 5; dayIdx++) {
        // 分配内容类型
        const contentType = matrix[dayIdx % matrix.length];
        const platform = platforms[dayIdx];

        // 从机会池中选择匹配的机会
        let opportunity = null;
        if (oppIndex < opportunities.length) {
          // 尝试匹配内容类型
          const match = opportunities.slice(oppIndex).find(o =>
            o.contentTypes?.includes(contentType) ||
            this.matchBusinessLineToContentType(o.businessLine, contentType)
          );
          if (match) {
            opportunity = match;
            oppIndex = opportunities.indexOf(match) + 1;
          } else {
            opportunity = opportunities[oppIndex++];
          }
        }

        weekPlan.items.push({
          id: this.generateId() + '_' + dayIdx,
          day: days[dayIdx],
          contentType,
          topic: opportunity?.title || this.getDefaultTopic(contentType, weekIdx, dayIdx),
          platform,
          opportunityId: opportunity?.id || null,
          status: PublishStatus.PLANNED,
          scheduledAt: null, // 待排期
          notes: this.getPlatformNotes(platform),
        });
      }

      plan.weeks.push(weekPlan);
    }

    this.plans.push(plan);
    this.savePlans();
    return plan;
  }

  /**
   * 生成周度计划（基于已有脚本）
   */
  generateWeeklyPlan(weekStartDate, scripts) {
    const plan = {
      id: this.generateId(),
      type: 'WEEKLY',
      weekStartDate,
      generatedAt: new Date().toISOString(),
      items: [],
    };

    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const contentTypeMap = [
      ContentType.PRODUCT,   // 周一：产品
      ContentType.KNOWLEDGE, // 周二：知识
      ContentType.SCENARIO,  // 周三：场景/痛点
      ContentType.KNOWLEDGE, // 周四：实操/技巧
      ContentType.CASE,      // 周五：案例
      ContentType.DIGITAL,   // 周六：数字化
      ContentType.FACTORY,   // 周日：幕后/工厂
    ];

    for (let i = 0; i < 7; i++) {
      const script = scripts[i];
      plan.items.push({
        id: this.generateId() + '_' + i,
        day: days[i],
        contentType: contentTypeMap[i],
        topic: script?.title || '待确定主题',
        platform: script?.platform || 'VIDEO_HAO',
        scriptId: script?.id || null,
        status: script ? PublishStatus.SCRIPT_READY : PublishStatus.PLANNED,
        scheduledAt: this.addDays(weekStartDate, i),
        notes: script?.platformNotes || '',
      });
    }

    this.plans.push(plan);
    this.savePlans();
    return plan;
  }

  /**
   * 获取月份的所有周
   */
  getWeeksOfMonth(year, month) {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const weeks = [];

    let current = new Date(firstDay);
    while (current.getDay() !== 1) {
      current.setDate(current.getDate() - 1);
    }

    while (current <= lastDay) {
      const weekDates = [];
      const weekStart = new Date(current);
      for (let i = 0; i < 7; i++) {
        const d = new Date(current);
        d.setDate(d.getDate() + i);
        weekDates.push(d.toISOString().split('T')[0]);
      }

      weeks.push({
        weekNumber: this.getWeekNumber(weekStart),
        dates: weekDates,
      });

      current.setDate(current.getDate() + 7);
    }

    return weeks;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  getWeekTheme(weekIdx, month) {
    const themes = [
      '三丰传统量具专题周',
      '小量仪精密测量周',
      '数字化传输专题周',
      '客户案例与避坑指南周',
    ];
    return themes[weekIdx % themes.length];
  }

  matchBusinessLineToContentType(businessLine, contentType) {
    const mapping = {
      [BusinessLine.TRADITIONAL]: [ContentType.PRODUCT, ContentType.KNOWLEDGE, ContentType.PITFALL],
      [BusinessLine.SMALL_INSTRUMENT]: [ContentType.PRODUCT, ContentType.SCENARIO, ContentType.CASE],
      [BusinessLine.DIGITAL_TRANSMISSION]: [ContentType.DIGITAL, ContentType.KNOWLEDGE, ContentType.CASE],
    };
    return mapping[businessLine]?.includes(contentType) || false;
  }

  getDefaultTopic(contentType, weekIdx, dayIdx) {
    const defaults = {
      [ContentType.PRODUCT]: '三丰产品知识解析',
      [ContentType.KNOWLEDGE]: '精密测量技巧分享',
      [ContentType.SCENARIO]: '实际测量场景演示',
      [ContentType.PITFALL]: '常见测量错误避坑',
      [ContentType.COMPARE]: '同类产品对比分析',
      [ContentType.CASE]: '客户成功应用案例',
      [ContentType.FACTORY]: '工厂测量日常记录',
      [ContentType.DIGITAL]: '测量数据数字化方案',
    };
    return defaults[contentType] || '内容待补充';
  }

  getPlatformNotes(platform) {
    const notes = {
      VIDEO_HAO: '视频号：专业风格，重点展示技术细节，CTA引导私信',
      DOUYIN: '抖音：前3秒强Hook，快节奏，字幕大字，CTA引导评论',
      XIAOHONGSHU: '小红书：实用清单风格，图文结合，CTA引导收藏',
      WECHAT_OFFICIAL: '公众号：长文深度，SEO关键词，CTA引导咨询',
      WECHAT_WORK: '企业微信：精准推送，客户专属，CTA直接引导询价',
    };
    return notes[platform] || '';
  }

  /**
   * 更新发布项状态
   */
  updateItemStatus(planId, itemId, status, extra = {}) {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) return null;

    const item = plan.weeks?.flatMap(w => w.items).find(i => i.id === itemId) ||
                 plan.items?.find(i => i.id === itemId);
    if (!item) return null;

    item.status = status;
    Object.assign(item, extra);
    this.savePlans();
    return item;
  }

  /**
   * 获取当前周计划
   */
  getCurrentWeekPlan() {
    const now = new Date();
    return this.plans.find(p => {
      if (p.type === 'WEEKLY') {
        const start = new Date(p.weekStartDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        return now >= start && now < end;
      }
      return false;
    });
  }

  /**
   * 获取所有计划
   */
  getAllPlans() {
    return this.plans;
  }

  /**
   * 获取计划详情
   */
  getPlan(id) {
    return this.plans.find(p => p.id === id);
  }

  /**
   * 导出计划为Markdown日历
   */
  exportToMarkdown(plan) {
    let md = `# 内容发布计划\n\n`;
    md += `**类型**：${plan.type === 'MONTHLY' ? '月度计划' : '周计划'}\n`;
    if (plan.year) md += `**年份**：${plan.year}\n`;
    if (plan.month) md += `**月份**：${plan.month}月\n`;
    if (plan.weekStartDate) md += `**周起始**：${plan.weekStartDate}\n`;
    md += `**生成时间**：${plan.generatedAt}\n\n`;

    if (plan.weeks) {
      for (const week of plan.weeks) {
        md += `## 第${week.weekNumber}周（${week.dates[0]} ~ ${week.dates[6]}）\n\n`;
        md += `| 日期 | 内容类型 | 平台 | 主题 | 状态 |\n`;
        md += `|------|----------|------|------|------|\n`;
        for (const item of week.items) {
          md += `| ${item.day} | ${item.contentType} | ${item.platform} | ${item.topic} | ${item.status} |\n`;
        }
        md += '\n';
      }
    } else if (plan.items) {
      md += `| 日期 | 内容类型 | 平台 | 主题 | 状态 |\n`;
      md += `|------|----------|------|------|------|\n`;
      for (const item of plan.items) {
        md += `| ${item.day} | ${item.contentType} | ${item.platform} | ${item.topic} | ${item.status} |\n`;
      }
    }

    return md;
  }
}

module.exports = PublisherManager;
