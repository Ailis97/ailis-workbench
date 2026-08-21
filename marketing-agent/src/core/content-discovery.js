/**
 * 内容选题引擎 (Content Discovery Engine)
 * 负责从多源信号中自动发现内容机会
 * 版本: v1.0
 */

const { SignalSource, SignalType, ContentType, BusinessLine, OpportunityStatus, Audience, ContentAngle } = require('./types');
const fs = require('fs');
const path = require('path');

// 选题池文件路径
const POOL_DIR = path.join(__dirname, '..', '..', 'data', 'content_pool');
const POOL_FILE = path.join(POOL_DIR, 'opportunities.json');

class ContentDiscoveryEngine {
  constructor() {
    this.opportunities = [];
    this.loadPool();
  }

  loadPool() {
    if (fs.existsSync(POOL_FILE)) {
      try {
        this.opportunities = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
      } catch (e) {
        this.opportunities = [];
      }
    }
  }

  savePool() {
    if (!fs.existsSync(POOL_DIR)) fs.mkdirSync(POOL_DIR, { recursive: true });
    fs.writeFileSync(POOL_FILE, JSON.stringify(this.opportunities, null, 2), 'utf8');
  }

  generateId() {
    return 'opp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /**
   * 从信号中创建内容机会
   * @param {Object} signal - 输入信号
   * @returns {Object} 内容机会
   */
  createOpportunity(signal) {
    const { source, signalType, title, description, relatedProducts, targetAudience, contentAngle, businessLine } = signal;

    // 计算优先级（0-100）
    const priority = this.calculatePriority(signal);
    const estimatedImpact = this.estimateImpact(signal);

    const opportunity = {
      id: this.generateId(),
      source,
      signalType,
      title: title || this.generateTitle(signal),
      description: description || '',
      relatedProducts: relatedProducts || [],
      targetAudience: targetAudience || Audience.END_USER,
      contentAngle: contentAngle || ContentAngle.EDUCATIONAL,
      businessLine: businessLine || BusinessLine.TRADITIONAL,
      priority,
      estimatedImpact,
      createdAt: new Date().toISOString(),
      status: OpportunityStatus.NEW,
      contentTypes: this.suggestContentTypes(signal),
      suggestedPlatforms: this.suggestPlatforms(signal),
      keywords: this.extractKeywords(signal),
    };

    this.opportunities.push(opportunity);
    this.savePool();
    return opportunity;
  }

  /**
   * 计算优先级 - 基于信号类型和权重
   */
  calculatePriority(signal) {
    const baseScores = {
      [SignalType.INQUIRY_INCREASE]: 85,
      [SignalType.INQUIRY_TOPIC]: 80,
      [SignalType.AFTERSALES_TOP]: 75,
      [SignalType.PRODUCT_GROWTH]: 70,
      [SignalType.NEW_PRODUCT]: 90,
      [SignalType.HIGH_MARGIN]: 65,
      [SignalType.LOW_CONVERSION]: 80,
      [SignalType.COMPETITOR_ACTION]: 60,
      [SignalType.TRENDING_SEARCH]: 70,
      [SignalType.MARKET_EVENT]: 75,
      [SignalType.CUSTOMER_PAIN]: 85,
      [SignalType.CAPABILITY_GAP]: 80,
      [SignalType.EXPANSION_PROJECT]: 75,
    };

    const sourceBonus = {
      [SignalSource.SALES]: 5,
      [SignalSource.AFTER_SALES]: 5,
      [SignalSource.CUSTOMER]: 3,
      [SignalSource.PRODUCT]: 3,
      [SignalSource.DIGITAL]: 8, // 数字化传输重点加成
    };

    let score = baseScores[signal.signalType] || 50;
    score += sourceBonus[signal.source] || 0;

    // 与数字化传输相关额外加分
    if (signal.businessLine === BusinessLine.DIGITAL_TRANSMISSION) {
      score += 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 预估影响力
   */
  estimateImpact(signal) {
    // 简单模型：高优先级 + 受众广度 +  evergreen 内容
    let impact = this.calculatePriority(signal) * 0.6;

    // 如果是 evergreen 主题（如测量知识），影响力持久
    const evergreenTypes = [
      SignalType.INQUIRY_TOPIC,
      SignalType.CUSTOMER_PAIN,
      SignalType.AFTERSALES_TOP,
      SignalType.CAPABILITY_GAP,
    ];
    if (evergreenTypes.includes(signal.signalType)) {
      impact += 25;
    }

    return Math.min(100, impact);
  }

  /**
   * 生成标题
   */
  generateTitle(signal) {
    const templates = {
      [SignalType.INQUIRY_INCREASE]: `客户近期大量咨询：${signal.topic || '某产品'}`,
      [SignalType.INQUIRY_TOPIC]: `${signal.topic || '某个话题'} 怎么选？`,
      [SignalType.AFTERSALES_TOP]: `${signal.topic || '某问题'}：售后最常见的${signal.rank || 'N'}大问题`,
      [SignalType.PRODUCT_GROWTH]: `${signal.product || '某产品'} 销量增长，为什么？`,
      [SignalType.NEW_PRODUCT]: `新品：${signal.product || '某产品'} 来了`,
      [SignalType.HIGH_MARGIN]: `${signal.product || '某产品'}：高利润背后的价值`,
      [SignalType.LOW_CONVERSION]: `为什么${signal.product || '某产品'} 报价转化率低？`,
      [SignalType.COMPETITOR_ACTION]: `竞品动态：${signal.topic || '某动作'}`,
      [SignalType.TRENDING_SEARCH]: `热搜：${signal.topic || '某话题'}`,
      [SignalType.MARKET_EVENT]: `行业事件：${signal.topic || '某事件'}`,
      [SignalType.CUSTOMER_PAIN]: `${signal.topic || '某痛点'} 怎么解决？`,
      [SignalType.CAPABILITY_GAP]: `${signal.topic || '某功能'}，你可能还不知道`,
      [SignalType.EXPANSION_PROJECT]: `${signal.company || '某企业'} 扩产，测量需求在哪？`,
    };

    return templates[signal.signalType] || `内容机会：${signal.topic || '未知主题'}`;
  }

  /**
   * 推荐内容类型
   */
  suggestContentTypes(signal) {
    const mapping = {
      [SignalType.INQUIRY_INCREASE]: [ContentType.PRODUCT, ContentType.KNOWLEDGE],
      [SignalType.INQUIRY_TOPIC]: [ContentType.KNOWLEDGE, ContentType.PITFALL],
      [SignalType.AFTERSALES_TOP]: [ContentType.PITFALL, ContentType.KNOWLEDGE],
      [SignalType.PRODUCT_GROWTH]: [ContentType.PRODUCT, ContentType.CASE],
      [SignalType.NEW_PRODUCT]: [ContentType.PRODUCT, ContentType.SCENARIO],
      [SignalType.HIGH_MARGIN]: [ContentType.PRODUCT, ContentType.COMPARE],
      [SignalType.LOW_CONVERSION]: [ContentType.COMPARE, ContentType.PITFALL],
      [SignalType.COMPETITOR_ACTION]: [ContentType.COMPARE, ContentType.PRODUCT],
      [SignalType.TRENDING_SEARCH]: [ContentType.KNOWLEDGE, ContentType.SCENARIO],
      [SignalType.MARKET_EVENT]: [ContentType.NEWS, ContentType.SCENARIO],
      [SignalType.CUSTOMER_PAIN]: [ContentType.PITFALL, ContentType.SCENARIO],
      [SignalType.CAPABILITY_GAP]: [ContentType.DIGITAL, ContentType.KNOWLEDGE],
      [SignalType.EXPANSION_PROJECT]: [ContentType.SCENARIO, ContentType.CASE],
    };
    return mapping[signal.signalType] || [ContentType.KNOWLEDGE];
  }

  /**
   * 推荐发布平台
   */
  suggestPlatforms(signal) {
    const mapping = {
      [SignalType.INQUIRY_INCREASE]: ['VIDEO_HAO', 'DOUYIN', 'WECHAT_OFFICIAL'],
      [SignalType.INQUIRY_TOPIC]: ['VIDEO_HAO', 'XIAOHONGSHU', 'WECHAT_OFFICIAL'],
      [SignalType.AFTERSALES_TOP]: ['VIDEO_HAO', 'DOUYIN', 'XIAOHONGSHU'],
      [SignalType.PRODUCT_GROWTH]: ['VIDEO_HAO', 'WECHAT_OFFICIAL'],
      [SignalType.NEW_PRODUCT]: ['VIDEO_HAO', 'DOUYIN', 'WECHAT_OFFICIAL'],
      [SignalType.HIGH_MARGIN]: ['VIDEO_HAO', 'WECHAT_OFFICIAL'],
      [SignalType.LOW_CONVERSION]: ['VIDEO_HAO', 'DOUYIN', 'XIAOHONGSHU'],
      [SignalType.COMPETITOR_ACTION]: ['VIDEO_HAO', 'WECHAT_OFFICIAL'],
      [SignalType.TRENDING_SEARCH]: ['DOUYIN', 'XIAOHONGSHU', 'VIDEO_HAO'],
      [SignalType.MARKET_EVENT]: ['VIDEO_HAO', 'WECHAT_OFFICIAL'],
      [SignalType.CUSTOMER_PAIN]: ['VIDEO_HAO', 'DOUYIN', 'XIAOHONGSHU'],
      [SignalType.CAPABILITY_GAP]: ['VIDEO_HAO', 'DOUYIN', 'WECHAT_OFFICIAL'],
      [SignalType.EXPANSION_PROJECT]: ['VIDEO_HAO', 'WECHAT_OFFICIAL'],
    };
    return mapping[signal.signalType] || ['VIDEO_HAO'];
  }

  /**
   * 提取关键词
   */
  extractKeywords(signal) {
    const keywords = [];
    if (signal.product) keywords.push(signal.product);
    if (signal.topic) keywords.push(signal.topic);
    if (signal.company) keywords.push(signal.company);
    if (signal.businessLine === BusinessLine.DIGITAL_TRANSMISSION) {
      keywords.push('数字化', '数据传输', 'MES', 'SPC', 'Excel采集');
    }
    return keywords;
  }

  /**
   * 批量处理信号
   */
  processSignals(signals) {
    const results = [];
    for (const signal of signals) {
      const opp = this.createOpportunity(signal);
      results.push(opp);
    }
    return results;
  }

  /**
   * 获取高优先级机会（≥80分）
   */
  getHighPriorityOpportunities(threshold = 80) {
    return this.opportunities
      .filter(o => o.priority >= threshold && o.status !== OpportunityStatus.ARCHIVED)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取按业务线分类的机会
   */
  getOpportunitiesByBusinessLine(line) {
    return this.opportunities
      .filter(o => o.businessLine === line && o.status !== OpportunityStatus.ARCHIVED)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 更新机会状态
   */
  updateStatus(id, status) {
    const idx = this.opportunities.findIndex(o => o.id === id);
    if (idx >= 0) {
      this.opportunities[idx].status = status;
      this.savePool();
      return this.opportunities[idx];
    }
    return null;
  }

  /**
   * 根据信号源获取机会
   */
  getOpportunitiesBySource(source) {
    return this.opportunities
      .filter(o => o.source === source && o.status !== OpportunityStatus.ARCHIVED)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * 生成内容选题周报
   */
  generateWeeklyReport() {
    const newOpps = this.opportunities.filter(o => {
      const created = new Date(o.createdAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created >= weekAgo;
    });

    const highPriority = newOpps.filter(o => o.priority >= 80);

    const byBusinessLine = {};
    for (const line of Object.values(BusinessLine)) {
      byBusinessLine[line] = newOpps.filter(o => o.businessLine === line);
    }

    const bySignalType = {};
    for (const type of Object.values(SignalType)) {
      bySignalType[type] = newOpps.filter(o => o.signalType === type);
    }

    return {
      generatedAt: new Date().toISOString(),
      totalNew: newOpps.length,
      highPriorityCount: highPriority.length,
      byBusinessLine,
      bySignalType,
      top10: newOpps.sort((a, b) => b.priority - a.priority).slice(0, 10),
    };
  }
}

module.exports = ContentDiscoveryEngine;
