/**
 * 演示脚本：展示市场宣传与内容营销 Agent 完整工作流
 * 运行: node src/demo.js
 */

const MarketingAgent = require('./main');

async function runDemo() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     市场宣传与内容营销 Agent - 完整工作流演示                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const agent = new MarketingAgent();

  // ========== 步骤1: 初始化示例信号 ==========
  console.log('▶ 步骤1: 接收多源信号（模拟跨Agent输入）\n');
  const demoSignals = agent.initDemoSignals();

  console.log('  信号来源分布:');
  const sourceCount = {};
  demoSignals.forEach(s => {
    sourceCount[s.source] = (sourceCount[s.source] || 0) + 1;
  });
  Object.entries(sourceCount).forEach(([k, v]) => {
    console.log(`    - ${k}: ${v} 条`);
  });
  console.log();

  // ========== 步骤2: 信号 → 内容机会 ==========
  console.log('▶ 步骤2: 内容选题引擎 - 自动发现内容机会\n');
  const opportunities = await agent.signalToOpportunity(demoSignals);

  console.log('  发现内容机会（按优先级排序）:');
  opportunities
    .sort((a, b) => b.priority - a.priority)
    .forEach((o, i) => {
      console.log(`    ${i + 1}. [${o.priority.toString().padStart(2)}分] ${o.title}`);
      console.log(`       来源: ${o.source} | 业务线: ${o.businessLine} | 建议内容类型: ${o.contentTypes?.join(', ')}`);
      console.log(`       推荐平台: ${o.suggestedPlatforms?.join(', ')}`);
      console.log();
    });

  // ========== 步骤3: 高优先级机会 → 脚本生成 ==========
  console.log('▶ 步骤3: 脚本生成引擎 - 为TOP3高优先级机会生成脚本\n');

  const top3 = agent.getOpportunities({ minPriority: 80 }).slice(0, 3);
  const scriptIds = top3.map(o => o.id);

  const scripts = await agent.opportunityToScript(scriptIds, 'VIDEO_HAO');

  scripts.forEach((s, i) => {
    console.log(`  脚本 ${i + 1}: 《${s.title}》`);
    console.log(`    平台: ${s.platform} | 预计时长: ${s.estimatedDuration}秒`);
    console.log(`    前三秒Hook: ${s.hook}`);
    console.log(`    核心卖点: ${s.coreSellingPoint}`);
    console.log(`    CTA: ${s.cta}`);
    console.log(`    分镜数: ${s.shots.length} 组`);
    console.log(`    道具: ${s.props.join(', ')}`);
    console.log();
  });

  // ========== 步骤4: 多平台适配 ==========
  console.log('▶ 步骤4: 多平台内容适配 - 同一主题生成不同版本\n');

  const firstOpp = top3[0];
  const multiPlatform = await agent.opportunityToMultiPlatformScripts(firstOpp.id);

  console.log(`  主题: "${firstOpp.title}" 的多平台适配:\n`);
  Object.entries(multiPlatform).forEach(([platform, script]) => {
    const platformNames = {
      VIDEO_HAO: '视频号',
      DOUYIN: '抖音',
      XIAOHONGSHU: '小红书',
    };
    console.log(`    [${platformNames[platform] || platform}]`);
    console.log(`    标题: ${script.title}`);
    console.log(`    时长: ${script.estimatedDuration}秒 | Hook: ${script.hook}`);
    console.log(`    CTA: ${script.cta}`);
    console.log();
  });

  // ========== 步骤5: 拍摄任务单 ==========
  console.log('▶ 步骤5: 拍摄任务单生成\n');

  const firstScript = scripts[0];
  const taskPath = require('path').join(
    require('path').dirname(require.main.filename),
    '..', 'data', 'scripts', `${firstScript.id}_shooting_task.json`
  );

  if (require('fs').existsSync(taskPath)) {
    const task = JSON.parse(require('fs').readFileSync(taskPath, 'utf8'));
    console.log(`  拍摄主题: ${task.theme}`);
    console.log(`  拍摄地点: ${task.location}`);
    console.log(`  预计时长: ${task.estimatedDuration}秒`);
    console.log(`  必须拍摄镜头: ${task.requiredShots.length} 组`);
    task.requiredShots.forEach(s => {
      console.log(`    ${s.number}. [${s.type}] ${s.description} (${s.duration}秒)`);
    });
    console.log(`  必须展示: ${task.mustShow.join(', ')}`);
    console.log(`  需要准备: ${task.props.join(', ')}`);
    console.log();
  }

  // ========== 步骤6: 周度发布计划 ==========
  console.log('▶ 步骤6: 发布计划管理 - 生成周度内容日历\n');

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // 本周一
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const plan = await agent.weeklyProductionWorkflow(weekStartStr, 3);

  console.log('  周计划概览:');
  plan.plan.items.forEach(item => {
    console.log(`    ${item.day} | [${item.platform}] ${item.contentType} | ${item.topic} | ${item.status}`);
  });
  console.log();

  // ========== 步骤7: 内容发布 & 资产注册 ==========
  console.log('▶ 步骤7: 内容发布 & 数据资产注册\n');

  const publishedAsset = await agent.publishContent(plan.plan.id, plan.plan.items[0].id, {
    product: '500系列卡尺',
    cost: 500, // 制作成本（示例）
    tags: ['卡尺', '测量技巧', '三丰', '避坑'],
  });

  console.log(`  资产已注册: ${publishedAsset.id}`);
  console.log(`  标题: ${publishedAsset.title}`);
  console.log(`  制作成本: ${publishedAsset.roi.cost}元`);
  console.log();

  // ========== 步骤8: 数据追踪 & ROI分析 ==========
  console.log('▶ 步骤8: 数据分析引擎 - 五级KPI追踪\n');

  // 模拟数据更新
  await agent.updateMetrics(publishedAsset.id, {
    views: 15000,
    completionRate: 0.35,
    likes: 450,
    favorites: 120,
    comments: 85,
    shares: 30,
    dms: 12,         // 私信
    leads: 5,        // 有效线索
    opportunities: 3, // 商机
    quotes: 2,       // 报价
    orders: 1,       // 成交
    revenue: 15000,  // 销售额
    grossProfit: 4500, // 毛利
  });

  const report = agent.getAssetReport(publishedAsset.id);

  console.log('  五级KPI分析:');
  console.log(`    L1 曝光得分: ${report.kpi.l1_exposure}`);
  console.log(`    L2 互动得分: ${report.kpi.l2_engagement}`);
  console.log(`    L3 获客得分: ${report.kpi.l3_acquisition}`);
  console.log(`    L4 销售得分: ${report.kpi.l4_sales}`);
  console.log(`    L5 经营得分: ${report.kpi.l5_operation}`);
  console.log(`    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`    综合 KPI 得分: ${report.kpi.composite}`);
  console.log();

  console.log('  转化漏斗:');
  console.log(`    播放: ${report.funnel.funnel.views}`);
  console.log(`    ↓ 互动率: ${report.funnel.rates.viewToEngagement}`);
  console.log(`    互动: ${report.funnel.funnel.engagement}`);
  console.log(`    ↓ 互动→线索: ${report.funnel.rates.engagementToLead}`);
  console.log(`    线索: ${report.funnel.funnel.leads}`);
  console.log(`    ↓ 线索→商机: ${report.funnel.rates.leadToOpportunity}`);
  console.log(`    商机: ${report.funnel.funnel.opportunities}`);
  console.log(`    ↓ 商机→报价: ${report.funnel.rates.opportunityToQuote}`);
  console.log(`    报价: ${report.funnel.funnel.quotes}`);
  console.log(`    ↓ 报价→成交: ${report.funnel.rates.quoteToOrder}`);
  console.log(`    成交: ${report.funnel.funnel.orders} (¥${report.funnel.funnel.revenue})`);
  console.log();

  console.log(`  ROI分析:`);
  console.log(`    制作成本: ¥${report.asset.roi.cost}`);
  console.log(`    内容毛利: ¥${report.asset.roi.grossProfit}`);
  console.log(`    ROI: ${report.asset.roi.roiRatio.toFixed(2)}x`);
  console.log(`    获客成本: ¥${report.asset.roi.cac.toFixed(2)}/线索`);
  console.log();

  // ========== 步骤9: 跨Agent联动 ==========
  console.log('▶ 步骤9: 跨Agent联动 - 自动生成策略建议\n');

  const strategy = await agent.generateCrossAgentStrategy();
  strategy.recommendations.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.priority}] ${r.rule}`);
    console.log(`     行动: ${r.action}`);
    if (r.topics) console.log(`     主题: ${r.topics.join(', ')}`);
    if (r.products) console.log(`     产品: ${r.products.join(', ')}`);
    console.log(`     预期效果: ${r.expectedImpact}`);
    console.log();
  });

  // ========== 步骤10: 每日自动化工作流 ==========
  console.log('▶ 步骤10: 每日自动化工作流执行\n');
  await agent.dailyWorkflow();

  // ========== 总结 ==========
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                     演示完成 - 系统状态                       ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  内容机会池: ${agent.discovery.opportunities.length.toString().padStart(3)} 个                                      ║`);
  console.log(`║  生成脚本: ${agent.scriptEngine.getAllScripts().length.toString().padStart(3)} 条                                       ║`);
  console.log(`║  发布计划: ${agent.getPlans().length.toString().padStart(3)} 个                                       ║`);
  console.log(`║  内容资产: ${agent.getAssets().length.toString().padStart(3)} 条                                       ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('系统文件位置:');
  console.log(`  - 数据目录: ${require('path').join(require('path').dirname(require.main.filename), '..', 'data')}`);
  console.log(`  - 内容机会池: data/content_pool/opportunities.json`);
  console.log(`  - 脚本库: data/scripts/index.json`);
  console.log(`  - 发布计划: data/published/plans.json`);
  console.log(`  - 资产库: data/assets/assets.json`);
  console.log(`  - 跨Agent信号: data/inbound/ & data/outbound/`);
  console.log();
}

runDemo().catch(console.error);
