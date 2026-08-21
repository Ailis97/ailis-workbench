/**
 * 主控编排器 (Main Orchestrator)
 * 协调内容选题引擎、脚本生成引擎、发布计划管理和数据分析引擎
 * 提供一键式工作流：信号输入 → 选题发现 → 脚本生成 → 排期发布 → 数据追踪
 * 版本: v1.0
 */

const ContentDiscoveryEngine = require('./core/content-discovery');
const ScriptEngine = require('./core/script-engine');
const PublisherManager = require('./core/publisher');
const AnalyticsEngine = require('./core/analytics');
const AgentBridge = require('./core/agent-bridge');
const { BusinessLine, Platform, ContentType, OpportunityStatus, PublishStatus } = require('./core/types');

class MarketingAgent {
  constructor() {
    this.discovery = new ContentDiscoveryEngine();
    this.scriptEngine = new ScriptEngine();
    this.publisher = new PublisherManager();
    this.analytics = new AnalyticsEngine();
    this.bridge = new AgentBridge();
  }

  // ==================== 核心工作流 ====================

  /**
   * 工作流1：从信号到选题
   * 接收外部信号，自动发现内容机会
   */
  async signalToOpportunity(signals) {
    console.log(`[MarketingAgent] 接收 ${signals.length} 条信号，开始发现内容机会...`);

    const opportunities = [];
    for (const signal of signals) {
      // 如果是外部Agent信号，先通过Bridge转换
      let processedSignal = signal;
      if (signal.source && ['SALES', 'PRODUCT', 'AFTER_SALES', 'QUOTE', 'DIGITAL'].includes(signal.source)) {
        const bridgeMethod = {
          'SALES': 'receiveSalesSignal',
          'PRODUCT': 'receiveProductSignal',
          'AFTER_SALES': 'receiveAfterSalesSignal',
          'QUOTE': 'receiveQuoteSignal',
          'DIGITAL': 'receiveDigitalSignal',
        }[signal.source];
        if (bridgeMethod) {
          processedSignal = this.bridge[bridgeMethod](signal);
        }
      }

      const opp = this.discovery.createOpportunity(processedSignal);
      opportunities.push(opp);
      console.log(`  ✓ 创建机会: [${opp.priority}分] ${opp.title}`);
    }

    console.log(`[MarketingAgent] 共发现 ${opportunities.length} 个内容机会`);
    return opportunities;
  }

  /**
   * 工作流2：从选题到脚本
   * 选择高优先级机会，生成完整脚本
   */
  async opportunityToScript(opportunityIds, platform = 'VIDEO_HAO') {
    console.log(`[MarketingAgent] 为 ${opportunityIds.length} 个机会生成脚本...`);

    const scripts = [];
    for (const oppId of opportunityIds) {
      const opp = this.discovery.opportunities.find(o => o.id === oppId);
      if (!opp) {
        console.log(`  ✗ 机会 ${oppId} 未找到`);
        continue;
      }

      // 更新状态为生产中
      this.discovery.updateStatus(oppId, OpportunityStatus.IN_PRODUCTION);

      // 生成脚本
      const script = this.scriptEngine.generateVideoScript(opp, platform);
      scripts.push(script);
      console.log(`  ✓ 生成脚本: ${script.title} (${script.estimatedDuration}秒)`);

      // 生成拍摄任务单
      const task = this.scriptEngine.generateShootingTask(script);
      const taskPath = require('path').join(
        require('path').dirname(require.main.filename),
        '..', 'data', 'scripts', `${script.id}_shooting_task.json`
      );
      require('fs').writeFileSync(taskPath, JSON.stringify(task, null, 2), 'utf8');
    }

    return scripts;
  }

  /**
   * 工作流3：批量生成多平台脚本
   */
  async opportunityToMultiPlatformScripts(opportunityId) {
    const opp = this.discovery.opportunities.find(o => o.id === opportunityId);
    if (!opp) return null;

    const results = this.scriptEngine.generateMultiPlatformScripts(opp);
    return results;
  }

  /**
   * 工作流4：生成发布计划
   */
  async generateWeeklyPlan(weekStartDate, scriptIds) {
    const scripts = scriptIds.map(id => this.scriptEngine.getScript(id)).filter(Boolean);
    const plan = this.publisher.generateWeeklyPlan(weekStartDate, scripts);
    console.log(`[MarketingAgent] 生成周计划: ${plan.id}, 包含 ${plan.items.length} 项内容`);
    return plan;
  }

  /**
   * 工作流5：月度内容矩阵
   */
  async generateMonthlyPlan(year, month, minPriority = 70) {
    // 获取足够的高优先级机会
    const opportunities = this.discovery.getHighPriorityOpportunities(minPriority);
    if (opportunities.length < 20) {
      console.log(`[MarketingAgent] 警告: 高优先级机会仅 ${opportunities.length} 个，建议补充更多内容选题`);
    }

    const plan = this.publisher.generateMonthlyPlan(year, month, opportunities);
    console.log(`[MarketingAgent] 生成月度计划: ${year}年${month}月, 包含 ${plan.weeks.length} 周`);
    return plan;
  }

  /**
   * 工作流6：发布内容并注册资产
   */
  async publishContent(planId, itemId, assetData) {
    // 更新发布状态
    const updated = this.publisher.updateItemStatus(planId, itemId, PublishStatus.PUBLISHED, {
      publishDate: new Date().toISOString(),
    });

    if (!updated) {
      console.log(`[MarketingAgent] 发布项未找到: plan=${planId}, item=${itemId}`);
      return null;
    }

    // 注册到资产库
    const asset = this.analytics.registerAsset({
      ...assetData,
      scriptId: updated.scriptId,
      platform: updated.platform,
      publishDate: updated.publishDate || new Date().toISOString(),
      title: updated.topic,
      tags: updated.tags || [],
    });

    console.log(`[MarketingAgent] 内容已发布并注册资产: ${asset.id}`);
    return asset;
  }

  /**
   * 工作流7：更新数据并分析
   */
  async updateMetrics(assetId, metrics) {
    const asset = this.analytics.updateMetrics(assetId, metrics);
    if (!asset) {
      console.log(`[MarketingAgent] 资产未找到: ${assetId}`);
      return null;
    }

    const kpi = this.analytics.calculateKPI(asset);
    const funnel = this.analytics.analyzeFunnel(assetId);

    console.log(`[MarketingAgent] 数据更新: ${asset.title}`);
    console.log(`  KPI综合得分: ${kpi.composite}`);
    console.log(`  L1曝光: ${kpi.l1_exposure}, L2互动: ${kpi.l2_engagement}, L3获客: ${kpi.l3_acquisition}`);
    console.log(`  L4销售: ${kpi.l4_sales}, L5经营: ${kpi.l5_operation}`);

    return { asset, kpi, funnel };
  }

  // ==================== 跨Agent联动 ====================

  /**
   * 自动处理所有跨Agent信号
   */
  async processCrossAgentSignals() {
    const signals = this.bridge.processAllInbound();
    console.log(`[MarketingAgent] 发现 ${signals.length} 条跨Agent信号`);

    if (signals.length === 0) return { signals: [], opportunities: [] };

    const opportunities = await this.signalToOpportunity(signals);
    return { signals, opportunities };
  }

  /**
   * 生成跨Agent联动策略
   */
  async generateCrossAgentStrategy() {
    const strategy = this.bridge.generateCrossAgentStrategy();
    console.log(`[MarketingAgent] 生成跨Agent策略, ${strategy.recommendations.length} 条建议`);
    return strategy;
  }

  /**
   * 向销售Agent传递线索
   */
  async sendLeadsToSales(leads) {
    const payload = this.bridge.sendMarketingLeads(leads);
    console.log(`[MarketingAgent] 向销售Agent传递 ${payload.leads.length} 条线索`);
    return payload;
  }

  // ==================== 自动化工作流 ====================

  /**
   * 每日自动工作流
   * 1. 处理跨Agent信号
   * 2. 生成高优先级选题
   * 3. 生成跨Agent策略建议
   */
  async dailyWorkflow() {
    console.log(`\n========== 每日营销自动化工作流 ==========`);
    console.log(`时间: ${new Date().toISOString()}`);

    // 步骤1: 处理信号
    const { signals, opportunities } = await this.processCrossAgentSignals();

    // 步骤2: 高优先级选题
    const highPriority = this.discovery.getHighPriorityOpportunities(80);
    console.log(`\n[每日选题] 高优先级(≥80分)内容机会: ${highPriority.length} 个`);
    highPriority.slice(0, 5).forEach((o, i) => {
      console.log(`  ${i + 1}. [${o.priority}分] ${o.title} (${o.source})`);
    });

    // 步骤3: 跨Agent策略
    const strategy = await this.generateCrossAgentStrategy();
    console.log(`\n[联动策略] ${strategy.recommendations.length} 条建议:`);
    strategy.recommendations.forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.priority}] ${r.rule}: ${r.action}`);
      if (r.topics) console.log(`     主题: ${r.topics.join(', ')}`);
    });

    // 步骤4: 数据周报
    const weeklyReport = this.analytics.generateWeeklyReport();
    console.log(`\n[数据周报] 近7天发布: ${weeklyReport.totalAssets} 条, 总播放: ${weeklyReport.totals.views}`);
    console.log(`  整体ROI: ${weeklyReport.overallROI}, 获客成本: ${weeklyReport.overallCAC}元/线索`);

    // 步骤5: 优化建议
    const advice = this.analytics.generateOptimizationAdvice();
    console.log(`\n[优化建议] ${advice.length} 条:`);
    advice.forEach((a, i) => console.log(`  ${i + 1}. ${a}`));

    console.log(`\n========== 每日工作流完成 ==========\n`);

    return {
      signalsProcessed: signals.length,
      opportunitiesCreated: opportunities.length,
      highPriorityCount: highPriority.length,
      strategy,
      weeklyReport,
      advice,
    };
  }

  /**
   * 每周内容生产工作流
   * 1. 选择本周要生产的内容
   * 2. 生成脚本
   * 3. 生成拍摄任务单
   * 4. 生成发布计划
   */
  async weeklyProductionWorkflow(weekStartDate, count = 5) {
    console.log(`\n========== 每周内容生产工作流 ==========`);
    console.log(`周起始: ${weekStartDate}, 计划生产: ${count} 条内容`);

    // 步骤1: 选择高优先级机会（未进入生产的）
    const available = this.discovery.opportunities.filter(
      o => o.status === OpportunityStatus.NEW || o.status === OpportunityStatus.APPROVED
    ).sort((a, b) => b.priority - a.priority);

    const selected = available.slice(0, count);
    console.log(`\n[选题] 从 ${available.length} 个可用机会中选中 ${selected.length} 个:`);
    selected.forEach((o, i) => console.log(`  ${i + 1}. [${o.priority}分] ${o.title}`));

    // 步骤2: 生成脚本（视频号为主）
    const scripts = await this.opportunityToScript(
      selected.map(o => o.id),
      'VIDEO_HAO'
    );

    // 步骤3: 生成周计划
    const plan = await this.generateWeeklyPlan(weekStartDate, scripts.map(s => s.id));

    // 导出计划为Markdown
    const md = this.publisher.exportToMarkdown(plan);
    const mdPath = require('path').join(
      require('path').dirname(require.main.filename),
      '..', 'data', 'published', `${plan.id}_plan.md`
    );
    require('fs').writeFileSync(mdPath, md, 'utf8');
    console.log(`\n[发布计划] 已导出: ${mdPath}`);

    console.log(`\n========== 每周工作流完成 ==========\n`);

    return {
      selectedOpportunities: selected,
      scripts,
      plan,
      markdownPath: mdPath,
    };
  }

  // ==================== 查询接口 ====================

  getOpportunities(filter = {}) {
    let result = this.discovery.opportunities;
    if (filter.status) result = result.filter(o => o.status === filter.status);
    if (filter.minPriority) result = result.filter(o => o.priority >= filter.minPriority);
    if (filter.businessLine) result = result.filter(o => o.businessLine === filter.businessLine);
    return result.sort((a, b) => b.priority - a.priority);
  }

  getScripts(filter = {}) {
    let result = this.scriptEngine.getAllScripts();
    if (filter.platform) result = result.filter(s => s.platform === filter.platform);
    if (filter.status) result = result.filter(s => s.status === filter.status);
    return result;
  }

  getPlans() {
    return this.publisher.getAllPlans();
  }

  getAssets() {
    return this.analytics.getAllAssets();
  }

  getAssetReport(assetId) {
    const asset = this.analytics.getAsset(assetId);
    if (!asset) return null;

    const kpi = this.analytics.calculateKPI(asset);
    const funnel = this.analytics.analyzeFunnel(assetId);

    return { asset, kpi, funnel };
  }

  // ==================== 初始化示例数据 ====================

  /**
   * 初始化示例信号（用于演示系统）
   */
  initDemoSignals() {
    const demoSignals = [
      {
        source: 'AFTER_SALES',
        signalType: 'aftersales_top',
        title: '卡尺测量最常见的5个错误',
        description: '售后数据显示，卡尺测量错误咨询占售后问题TOP3，主要集中在测量力控制、温度影响、零点校准等问题',
        products: ['500系列卡尺', '530系列卡尺'],
        topic: '卡尺测量错误',
        businessLine: 'TRADITIONAL',
      },
      {
        source: 'SALES',
        signalType: 'inquiry_increase',
        title: '粗糙度仪选型咨询激增',
        description: '最近一周粗糙度仪相关咨询量增加40%，客户主要关注SJ-210和SJ-310的选择',
        products: ['SJ-210', 'SJ-310'],
        topic: '粗糙度仪选型',
        businessLine: 'SMALL_INSTRUMENT',
        inquiryCount: 25,
      },
      {
        source: 'DIGITAL',
        signalType: 'digital_inquiry',
        title: '卡尺数据如何直接传入Excel？',
        description: '多位客户询问数字卡尺的数据传输功能，不了解三丰已经具备完整的测量数据采集方案',
        products: ['500系列数显卡尺', 'U-WAVE'],
        topic: '测量数据自动采集',
        businessLine: 'DIGITAL_TRANSMISSION',
      },
      {
        source: 'QUOTE',
        signalType: 'low_conversion',
        title: '数显高度尺报价转化率低',
        description: '高度尺报价后转化率不足15%，客户反馈价格高于预期，但不知价值差异',
        products: ['570系列数显高度尺'],
        topic: '高度尺价值',
        businessLine: 'TRADITIONAL',
      },
      {
        source: 'PRODUCT',
        signalType: 'new_product',
        title: '新品：MITUTOYO 数显千分尺新功能发布',
        description: '三丰发布新型数显千分尺，具备蓝牙传输功能，需要市场教育',
        products: ['293系列数显千分尺'],
        topic: '蓝牙千分尺',
        businessLine: 'DIGITAL_TRANSMISSION',
      },
    ];

    return demoSignals;
  }
}

module.exports = MarketingAgent;
