/**
 * 跨 Agent 数据接口 (Agent Bridge)
 * 定义与其他 Agent（销售、产品、售后、报价、数字化传输）的数据交换规范
 * 版本: v1.0
 */

const fs = require('fs');
const path = require('path');

const BRIDGE_DIR = path.join(__dirname, '..', '..', 'data');
const INBOUND_DIR = path.join(BRIDGE_DIR, 'inbound');
const OUTBOUND_DIR = path.join(BRIDGE_DIR, 'outbound');

class AgentBridge {
  constructor() {
    this.initDirs();
  }

  initDirs() {
    [INBOUND_DIR, OUTBOUND_DIR].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  // ==================== INBOUND: 接收其他 Agent 信号 ====================

  /**
   * 接收销售 Agent 信号
   * 信号类型：高咨询量主题、高价值商机、客户关注点变化
   */
  receiveSalesSignal(signal) {
    const enriched = {
      source: 'SALES',
      receivedAt: new Date().toISOString(),
      ...signal,
    };
    this.saveInbound('sales', enriched);
    return this.convertToOpportunitySignal(enriched);
  }

  /**
   * 接收产品 Agent 信号
   * 信号类型：增长产品、下降产品、新品上市、高利润产品、需要教育市场的产品
   */
  receiveProductSignal(signal) {
    const enriched = {
      source: 'PRODUCT',
      receivedAt: new Date().toISOString(),
      ...signal,
    };
    this.saveInbound('product', enriched);
    return this.convertToOpportunitySignal(enriched);
  }

  /**
   * 接收售后 Agent 信号
   * 信号类型：售后问题TOP10、高频故障、客户使用误区
   */
  receiveAfterSalesSignal(signal) {
    const enriched = {
      source: 'AFTER_SALES',
      receivedAt: new Date().toISOString(),
      ...signal,
    };
    this.saveInbound('aftersales', enriched);
    return this.convertToOpportunitySignal(enriched);
  }

  /**
   * 接收报价 Agent 信号
   * 信号类型：低转化率产品、高报价流失原因、价格敏感主题
   */
  receiveQuoteSignal(signal) {
    const enriched = {
      source: 'QUOTE',
      receivedAt: new Date().toISOString(),
      ...signal,
    };
    this.saveInbound('quote', enriched);
    return this.convertToOpportunitySignal(enriched);
  }

  /**
   * 接收数字化传输业务 Agent 信号
   * 信号类型：客户咨询数字化方案、MES/ERP连接需求、数据自动采集需求
   */
  receiveDigitalSignal(signal) {
    const enriched = {
      source: 'DIGITAL',
      receivedAt: new Date().toISOString(),
      ...signal,
    };
    this.saveInbound('digital', enriched);
    return this.convertToOpportunitySignal(enriched);
  }

  /**
   * 将外部信号转换为内容选题引擎可用的标准信号格式
   */
  convertToOpportunitySignal(signal) {
    const typeMap = {
      // 销售 Agent → 信号类型
      'inquiry_increase': 'INQUIRY_INCREASE',
      'inquiry_topic': 'INQUIRY_TOPIC',
      'high_value_opportunity': 'INQUIRY_INCREASE',
      'customer_interest': 'INQUIRY_TOPIC',

      // 产品 Agent → 信号类型
      'product_growth': 'PRODUCT_GROWTH',
      'product_decline': 'PRODUCT_DECLINE',
      'new_product': 'NEW_PRODUCT',
      'high_margin': 'HIGH_MARGIN',
      'market_education_needed': 'CUSTOMER_PAIN',

      // 售后 Agent → 信号类型
      'aftersales_top': 'AFTERSALES_TOP',
      'frequent_fault': 'CUSTOMER_PAIN',
      'usage_misconception': 'CAPABILITY_GAP',

      // 报价 Agent → 信号类型
      'low_conversion': 'LOW_CONVERSION',
      'price_sensitive': 'CUSTOMER_PAIN',
      'high_quote_loss': 'COMPARE',

      // 数字化 Agent → 信号类型
      'digital_inquiry': 'INQUIRY_INCREASE',
      'mes_connection': 'CAPABILITY_GAP',
      'auto_collection': 'CAPABILITY_GAP',
      'data_traceability': 'TRENDING_SEARCH',
    };

    const signalType = typeMap[signal.signalType] || 'INQUIRY_TOPIC';

    return {
      source: signal.source,
      signalType,
      title: signal.title || signal.topic || signal.product || '未命名信号',
      description: signal.description || '',
      relatedProducts: signal.products || (signal.product ? [signal.product] : []),
      topic: signal.topic || signal.title || '',
      targetAudience: signal.audience || 'END_USER',
      businessLine: signal.businessLine || 'TRADITIONAL',
      rank: signal.rank,
      inquiryCount: signal.count || signal.inquiryCount,
      painAction: signal.painAction || '',
      keyword: signal.keyword || '',
      nextTopic: signal.nextTopic || '',
      // 原始信号保留
      rawSignal: signal,
    };
  }

  saveInbound(agentType, signal) {
    const file = path.join(INBOUND_DIR, `${agentType}_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(signal, null, 2), 'utf8');
  }

  // ==================== OUTBOUND: 向其他 Agent 输出 ====================

  /**
   * 向销售 Agent 传递营销线索
   */
  sendMarketingLeads(leads) {
    const payload = {
      type: 'MARKETING_LEADS',
      sentAt: new Date().toISOString(),
      source: 'MARKETING_AGENT',
      leads: leads.map(lead => ({
        leadId: lead.id,
        sourceContent: lead.contentId,
        sourcePlatform: lead.platform,
        contactType: lead.contactType, // 'dm', 'phone', 'form', 'wechat'
        contactInfo: lead.contactInfo,
        interestProduct: lead.interestProduct,
        interestTopic: lead.interestTopic,
        customerIntent: lead.intent, // 'info', 'demo', 'quote', 'purchase'
        contentEngagement: {
          viewedVideos: lead.viewedVideos,
          totalWatchTime: lead.totalWatchTime,
        },
        notes: lead.notes,
      })),
    };
    this.saveOutbound('sales_leads', payload);
    return payload;
  }

  /**
   * 向产品 Agent 传递内容反馈
   */
  sendProductFeedback(feedback) {
    const payload = {
      type: 'CONTENT_FEEDBACK',
      sentAt: new Date().toISOString(),
      source: 'MARKETING_AGENT',
      feedback: feedback.map(item => ({
        product: item.product,
        contentType: item.contentType,
        views: item.views,
        engagement: item.engagement,
        leads: item.leads,
        customerQuestions: item.questions, // 客户从内容中产生的问题
        productInterestTrend: item.interestTrend, // 'up', 'down', 'stable'
      })),
    };
    this.saveOutbound('product_feedback', payload);
    return payload;
  }

  /**
   * 向售后 Agent 传递内容效果
   */
  sendAfterSalesFeedback(feedback) {
    const payload = {
      type: 'AFTERSALES_CONTENT_IMPACT',
      sentAt: new Date().toISOString(),
      source: 'MARKETING_AGENT',
      feedback: feedback.map(item => ({
        topic: item.topic,
        contentId: item.contentId,
        views: item.views,
        postPublishInquiryChange: item.inquiryChange, // 发布后相关咨询变化
      })),
    };
    this.saveOutbound('aftersales_feedback', payload);
    return payload;
  }

  saveOutbound(type, payload) {
    const file = path.join(OUTBOUND_DIR, `${type}_${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  }

  // ==================== 批量处理接口 ====================

  /**
   * 批量处理所有 Inbound 信号
   */
  processAllInbound() {
    const signals = [];
    const files = fs.readdirSync(INBOUND_DIR).filter(f => f.endsWith('.json'));

    for (const file of files) {
      try {
        const signal = JSON.parse(fs.readFileSync(path.join(INBOUND_DIR, file), 'utf8'));
        const converted = this.convertToOpportunitySignal(signal);
        signals.push(converted);
      } catch (e) {
        console.error(`Error processing inbound file ${file}:`, e.message);
      }
    }

    return signals;
  }

  /**
   * 读取最近N天的Inbound信号
   */
  getRecentInbound(days = 7) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const files = fs.readdirSync(INBOUND_DIR)
      .filter(f => f.endsWith('.json'))
      .filter(f => {
        const stat = fs.statSync(path.join(INBOUND_DIR, f));
        return stat.mtimeMs >= cutoff;
      });

    return files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(INBOUND_DIR, f), 'utf8'));
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * 读取Outbound历史
   */
  getOutboundHistory(type = null) {
    const files = fs.readdirSync(OUTBOUND_DIR)
      .filter(f => f.endsWith('.json'))
      .filter(f => type ? f.startsWith(type) : true)
      .sort()
      .reverse();

    return files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(OUTBOUND_DIR, f), 'utf8'));
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
  }

  // ==================== 联动规则引擎 ====================

  /**
   * 基于联动规则自动生成内容策略调整建议
   */
  generateCrossAgentStrategy() {
    const recentInbound = this.getRecentInbound(7);
    const strategy = {
      generatedAt: new Date().toISOString(),
      recommendations: [],
    };

    // 规则1：售后高频问题 → 避坑内容
    const aftersalesSignals = recentInbound.filter(s => s.source === 'AFTER_SALES');
    if (aftersalesSignals.length > 0) {
      const topIssues = aftersalesSignals.slice(0, 3);
      strategy.recommendations.push({
        rule: '售后问题→避坑内容',
        priority: 'HIGH',
        action: '生成避坑型内容',
        topics: topIssues.map(s => s.title),
        expectedImpact: '降低售后咨询量，提升客户满意度',
      });
    }

    // 规则2：低转化率产品 → 对比/教育内容
    const quoteSignals = recentInbound.filter(s => s.source === 'QUOTE' && s.signalType === 'LOW_CONVERSION');
    if (quoteSignals.length > 0) {
      strategy.recommendations.push({
        rule: '低转化率→教育内容',
        priority: 'HIGH',
        action: '生成对比型/知识型内容，解释价值差异',
        products: quoteSignals.map(s => s.relatedProducts).flat(),
        expectedImpact: '提升报价转化率，减少价格战',
      });
    }

    // 规则3：数字化咨询增加 → 数字化专题
    const digitalSignals = recentInbound.filter(s => s.source === 'DIGITAL');
    if (digitalSignals.length > 0) {
      strategy.recommendations.push({
        rule: '数字化咨询→重点增长内容',
        priority: 'HIGH',
        action: '增加数字化传输内容占比，建立"精密测量数字化"IP',
        topics: digitalSignals.map(s => s.topic).filter(Boolean),
        expectedImpact: '获取数字化传输业务线索，提升高利润业务占比',
      });
    }

    // 规则4：新品上市 → 产品曝光内容
    const newProductSignals = recentInbound.filter(s => s.signalType === 'NEW_PRODUCT');
    if (newProductSignals.length > 0) {
      strategy.recommendations.push({
        rule: '新品上市→产品内容',
        priority: 'MEDIUM',
        action: '生成新品评测、应用场景、对比内容',
        products: newProductSignals.map(s => s.relatedProducts).flat(),
        expectedImpact: '加速新品市场渗透',
      });
    }

    return strategy;
  }
}

module.exports = AgentBridge;
