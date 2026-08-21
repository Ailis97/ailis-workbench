/**
 * 数据分析引擎 (Analytics Engine)
 * 负责 Content → Lead → Opportunity → Order 闭环追踪
 * 五级 KPI：曝光(L1) → 互动(L2) → 获客(L3) → 销售(L4) → 经营(L5)
 * 版本: v1.0
 */

const { KPI_WEIGHTS } = require('./types');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', '..', 'data', 'assets');

class AnalyticsEngine {
  constructor() {
    this.assets = [];
    this.loadAssets();
  }

  loadAssets() {
    if (!fs.existsSync(ASSETS_DIR)) {
      fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }
    const idx = path.join(ASSETS_DIR, 'assets.json');
    if (fs.existsSync(idx)) {
      try {
        this.assets = JSON.parse(fs.readFileSync(idx, 'utf8'));
      } catch (e) {
        this.assets = [];
      }
    }
  }

  saveAssets() {
    const idx = path.join(ASSETS_DIR, 'assets.json');
    fs.writeFileSync(idx, JSON.stringify(this.assets, null, 2), 'utf8');
  }

  generateId() {
    return 'ast_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /**
   * 注册内容资产（发布时调用）
   */
  registerAsset(assetData) {
    const asset = {
      id: this.generateId(),
      type: assetData.type || 'PUBLISHED_VIDEO',
      product: assetData.product || '',
      theme: assetData.theme || '',
      scriptId: assetData.scriptId || null,
      shootDate: assetData.shootDate || null,
      platform: assetData.platform || 'VIDEO_HAO',
      publishDate: assetData.publishDate || new Date().toISOString(),
      title: assetData.title || '',
      tags: assetData.tags || [],
      // L1: 曝光
      metrics: {
        views: 0,
        completionRate: 0,
        likes: 0,
        favorites: 0,
        comments: 0,
        shares: 0,
        dms: 0,          // L3: 私信
        leads: 0,        // L3: 线索
        opportunities: 0, // L4: 商机
        quotes: 0,       // L4: 报价
        orders: 0,       // L4: 成交
        revenue: 0,      // L4: 销售额
        // L5: 经营
        grossProfit: 0,
        cost: assetData.cost || 0,
      },
      roi: {
        cost: assetData.cost || 0,
        grossProfit: 0,
        roiRatio: 0,
        cac: 0, // 客户获取成本
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.assets.push(asset);
    this.saveAssets();
    return asset;
  }

  /**
   * 更新数据指标
   */
  updateMetrics(assetId, metrics) {
    const asset = this.assets.find(a => a.id === assetId);
    if (!asset) return null;

    Object.assign(asset.metrics, metrics);
    asset.updatedAt = new Date().toISOString();

    // 重新计算 ROI
    this.calculateROI(asset);
    this.saveAssets();
    return asset;
  }

  /**
   * 计算 ROI
   */
  calculateROI(asset) {
    const m = asset.metrics;
    const roi = asset.roi;

    // 毛利 = 成交毛利总和（假设给定）
    roi.grossProfit = m.grossProfit || 0;
    roi.cost = m.cost || 0;

    // ROI = 毛利 / 成本
    roi.roiRatio = roi.cost > 0 ? (roi.grossProfit / roi.cost) : 0;

    // CAC = 成本 / 有效线索数（或成交数）
    roi.cac = (m.leads > 0 && roi.cost > 0) ? (roi.cost / m.leads) : 0;

    return roi;
  }

  /**
   * 计算五级 KPI 综合得分
   */
  calculateKPI(asset) {
    const m = asset.metrics;

    // L1: 曝光 (0-100)
    const l1 = this.normalize(m.views, 100000) * 40 +
               this.normalize(m.completionRate, 0.5) * 60;

    // L2: 互动 (0-100)
    const l2 = this.normalize(m.likes, 5000) * 25 +
               this.normalize(m.favorites, 2000) * 25 +
               this.normalize(m.comments, 500) * 25 +
               this.normalize(m.shares, 1000) * 25;

    // L3: 获客 (0-100)
    const l3 = this.normalize(m.dms, 100) * 30 +
               this.normalize(m.leads, 50) * 70;

    // L4: 销售 (0-100)
    const l4 = this.normalize(m.opportunities, 20) * 25 +
               this.normalize(m.quotes, 10) * 25 +
               this.normalize(m.orders, 5) * 25 +
               this.normalize(m.revenue, 50000) * 25;

    // L5: 经营 (0-100)
    const l5 = this.normalize(asset.roi.roiRatio, 3) * 40 +  // ROI >= 300% 为满分
               this.normalize(1 / (asset.roi.cac || 1), 0.01) * 30 + // CAC 越低越好
               this.normalize(m.grossProfit, 10000) * 30;

    const weights = KPI_WEIGHTS;
    const composite =
      l1 * weights.EXPOSURE +
      l2 * weights.ENGAGEMENT +
      l3 * weights.ACQUISITION +
      l4 * weights.SALES +
      l5 * weights.OPERATION;

    return {
      l1_exposure: Math.round(l1 * 100) / 100,
      l2_engagement: Math.round(l2 * 100) / 100,
      l3_acquisition: Math.round(l3 * 100) / 100,
      l4_sales: Math.round(l4 * 100) / 100,
      l5_operation: Math.round(l5 * 100) / 100,
      composite: Math.round(composite * 100) / 100,
    };
  }

  normalize(value, target) {
    return Math.min(1, (value || 0) / target) * 100;
  }

  /**
   * 分析漏斗转化
   */
  analyzeFunnel(assetId) {
    const asset = this.assets.find(a => a.id === assetId);
    if (!asset) return null;

    const m = asset.metrics;
    const funnel = {
      views: m.views,
      engagement: m.likes + m.favorites + m.comments + m.shares,
      dms: m.dms,
      leads: m.leads,
      opportunities: m.opportunities,
      quotes: m.quotes,
      orders: m.orders,
      revenue: m.revenue,
    };

    // 计算转化率
    const rates = {
      viewToEngagement: m.views > 0 ? ((funnel.engagement / m.views) * 100).toFixed(2) + '%' : '0%',
      engagementToLead: funnel.engagement > 0 ? ((m.leads / funnel.engagement) * 100).toFixed(2) + '%' : '0%',
      leadToOpportunity: m.leads > 0 ? ((m.opportunities / m.leads) * 100).toFixed(2) + '%' : '0%',
      opportunityToQuote: m.opportunities > 0 ? ((m.quotes / m.opportunities) * 100).toFixed(2) + '%' : '0%',
      quoteToOrder: m.quotes > 0 ? ((m.orders / m.quotes) * 100).toFixed(2) + '%' : '0%',
      leadToOrder: m.leads > 0 ? ((m.orders / m.leads) * 100).toFixed(2) + '%' : '0%',
    };

    return { funnel, rates, asset: { id: asset.id, title: asset.title } };
  }

  /**
   * 按内容类型分析
   */
  analyzeByContentType(contentType) {
    const filtered = this.assets.filter(a => a.contentType === contentType);
    if (filtered.length === 0) return null;

    const totals = filtered.reduce((acc, a) => {
      acc.views += a.metrics.views;
      acc.leads += a.metrics.leads;
      acc.orders += a.metrics.orders;
      acc.revenue += a.metrics.revenue;
      acc.cost += a.roi.cost;
      acc.grossProfit += a.metrics.grossProfit || 0;
      return acc;
    }, { views: 0, leads: 0, orders: 0, revenue: 0, cost: 0, grossProfit: 0 });

    return {
      contentType,
      count: filtered.length,
      averages: {
        views: Math.round(totals.views / filtered.length),
        leads: (totals.leads / filtered.length).toFixed(2),
        orders: (totals.orders / filtered.length).toFixed(2),
        revenue: Math.round(totals.revenue / filtered.length),
      },
      totals,
      roi: totals.cost > 0 ? (totals.grossProfit / totals.cost).toFixed(2) : 0,
      cac: totals.leads > 0 ? (totals.cost / totals.leads).toFixed(2) : 0,
    };
  }

  /**
   * 按平台分析
   */
  analyzeByPlatform(platform) {
    const filtered = this.assets.filter(a => a.platform === platform);
    if (filtered.length === 0) return null;

    const totals = filtered.reduce((acc, a) => {
      acc.views += a.metrics.views;
      acc.leads += a.metrics.leads;
      acc.orders += a.metrics.orders;
      acc.revenue += a.metrics.revenue;
      acc.cost += a.roi.cost;
      acc.grossProfit += a.metrics.grossProfit || 0;
      return acc;
    }, { views: 0, leads: 0, orders: 0, revenue: 0, cost: 0, grossProfit: 0 });

    return {
      platform,
      count: filtered.length,
      totals,
      roi: totals.cost > 0 ? (totals.grossProfit / totals.cost).toFixed(2) : 0,
      cac: totals.leads > 0 ? (totals.cost / totals.leads).toFixed(2) : 0,
    };
  }

  /**
   * 生成数据周报
   */
  generateWeeklyReport() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = this.assets.filter(a => new Date(a.publishDate) >= weekAgo);

    const totals = recent.reduce((acc, a) => {
      acc.views += a.metrics.views;
      acc.leads += a.metrics.leads;
      acc.orders += a.metrics.orders;
      acc.revenue += a.metrics.revenue;
      acc.cost += a.roi.cost;
      acc.grossProfit += a.metrics.grossProfit || 0;
      return acc;
    }, { views: 0, leads: 0, orders: 0, revenue: 0, cost: 0, grossProfit: 0 });

    // 按内容类型分组
    const byContentType = {};
    for (const type of ['PRODUCT', 'KNOWLEDGE', 'SCENARIO', 'PITFALL', 'COMPARE', 'CASE', 'DIGITAL']) {
      const analysis = this.analyzeByContentType(type);
      if (analysis) byContentType[type] = analysis;
    }

    // 按平台分组
    const byPlatform = {};
    for (const platform of ['VIDEO_HAO', 'DOUYIN', 'XIAOHONGSHU']) {
      const analysis = this.analyzeByPlatform(platform);
      if (analysis) byPlatform[platform] = analysis;
    }

    // 最佳内容（按ROI）
    const bestByROI = [...recent]
      .sort((a, b) => (b.roi.roiRatio || 0) - (a.roi.roiRatio || 0))
      .slice(0, 5)
      .map(a => ({ id: a.id, title: a.title, roi: a.roi.roiRatio }));

    // 最佳内容（按获客）
    const bestByLeads = [...recent]
      .sort((a, b) => b.metrics.leads - a.metrics.leads)
      .slice(0, 5)
      .map(a => ({ id: a.id, title: a.title, leads: a.metrics.leads }));

    return {
      period: `${weekAgo.toISOString().split('T')[0]} ~ ${new Date().toISOString().split('T')[0]}`,
      totalAssets: recent.length,
      totals,
      overallROI: totals.cost > 0 ? (totals.grossProfit / totals.cost).toFixed(2) : 0,
      overallCAC: totals.leads > 0 ? (totals.cost / totals.leads).toFixed(2) : 0,
      byContentType,
      byPlatform,
      bestByROI,
      bestByLeads,
    };
  }

  /**
   * 生成优化建议
   */
  generateOptimizationAdvice() {
    const report = this.generateWeeklyReport();
    const advice = [];

    // 分析哪些内容类型ROI最高
    const typeROIs = Object.entries(report.byContentType || {})
      .map(([type, data]) => ({ type, roi: parseFloat(data.roi) || 0 }))
      .sort((a, b) => b.roi - a.roi);

    if (typeROIs.length > 0) {
      const best = typeROIs[0];
      advice.push(`ROI最高内容类型：${best.type}（ROI: ${best.roi}），建议增加该类内容占比。`);

      const worst = typeROIs[typeROIs.length - 1];
      if (worst.roi < 1 && worst.roi > 0) {
        advice.push(`${worst.type} 类型ROI低于1，建议优化内容角度或CTA，降低制作成本。`);
      }
    }

    // 分析平台差异
    const platformROIs = Object.entries(report.byPlatform || {})
      .map(([platform, data]) => ({ platform, roi: parseFloat(data.roi) || 0, cac: parseFloat(data.cac) || 0 }))
      .sort((a, b) => b.roi - a.roi);

    if (platformROIs.length > 0) {
      const best = platformROIs[0];
      advice.push(`ROI最高平台：${best.platform}（ROI: ${best.roi}），建议加大投入。`);
    }

    // 如果获客成本高
    if (report.overallCAC > 500) {
      advice.push(`整体获客成本较高（${report.overallCAC}元/线索），建议优化内容Hook或平台选择。`);
    }

    // 如果播放量高但线索少
    const recent = this.assets.filter(a => new Date(a.publishDate) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const highViewLowLead = recent.find(a => a.metrics.views > 10000 && a.metrics.leads < 2);
    if (highViewLowLead) {
      advice.push(`视频《${highViewLowLead.title}》播放高但获客少，建议优化CTA或增加引导转化的话术。`);
    }

    return advice;
  }

  /**
   * 获取所有资产
   */
  getAllAssets() {
    return this.assets;
  }

  /**
   * 获取资产详情
   */
  getAsset(id) {
    return this.assets.find(a => a.id === id);
  }
}

module.exports = AnalyticsEngine;
