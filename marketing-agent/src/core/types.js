/**
 * 市场宣传与内容营销 Agent - 数据类型定义
 * 版本: v1.0
 */

// 信号来源
const SignalSource = Object.freeze({
  SALES: 'SALES',           // 销售数据
  CUSTOMER: 'CUSTOMER',     // 客户反馈
  AFTER_SALES: 'AFTER_SALES', // 售后问题
  SEARCH: 'SEARCH',         // 搜索趋势
  PRODUCT: 'PRODUCT',       // 产品数据
  COMPETITOR: 'COMPETITOR', // 竞品动态
  SALES_FEEDBACK: 'SALES_FEEDBACK', // 销售反馈
  MARKET: 'MARKET',         // 市场数据
  DIGITAL: 'DIGITAL',       // 数字化传输业务
  MANUAL: 'MANUAL',         // 手动录入
});

// 信号类型
const SignalType = Object.freeze({
  INQUIRY_INCREASE: 'INQUIRY_INCREASE',       // 咨询增加
  INQUIRY_TOPIC: 'INQUIRY_TOPIC',             // 咨询主题
  AFTERSALES_TOP: 'AFTERSALES_TOP',           // 售后高频问题
  PRODUCT_GROWTH: 'PRODUCT_GROWTH',           // 产品增长
  PRODUCT_DECLINE: 'PRODUCT_DECLINE',         // 产品下降
  NEW_PRODUCT: 'NEW_PRODUCT',                 // 新品上市
  HIGH_MARGIN: 'HIGH_MARGIN',                 // 高利润产品
  LOW_CONVERSION: 'LOW_CONVERSION',           // 低转化率
  COMPETITOR_ACTION: 'COMPETITOR_ACTION',     // 竞品动作
  TRENDING_SEARCH: 'TRENDING_SEARCH',         // 搜索热词
  MARKET_EVENT: 'MARKET_EVENT',               // 市场事件
  CUSTOMER_PAIN: 'CUSTOMER_PAIN',             // 客户痛点
  CAPABILITY_GAP: 'CAPABILITY_GAP',           // 客户不知能力
  EXPANSION_PROJECT: 'EXPANSION_PROJECT',     // 扩产/新建项目
});

// 平台
const Platform = Object.freeze({
  VIDEO_HAO: 'VIDEO_HAO',   // 视频号
  DOUYIN: 'DOUYIN',         // 抖音
  XIAOHONGSHU: 'XIAOHONGSHU', // 小红书
  WECHAT_OFFICIAL: 'WECHAT_OFFICIAL', // 公众号
  WECHAT_WORK: 'WECHAT_WORK', // 企业微信
  BILIBILI: 'BILIBILI',     // B站
  ZHIHU: 'ZHIHU',           // 知乎
  TOUTIAO: 'TOUTIAO',       // 今日头条
  WEBSITE: 'WEBSITE',       // 官网
  INDUSTRY_MEDIA: 'INDUSTRY_MEDIA', // 行业媒体
});

// 内容类型（矩阵）
const ContentType = Object.freeze({
  PRODUCT: 'PRODUCT',       // 产品型
  KNOWLEDGE: 'KNOWLEDGE',   // 知识型
  SCENARIO: 'SCENARIO',     // 场景型
  PITFALL: 'PITFALL',       // 避坑型
  COMPARE: 'COMPARE',         // 对比型
  CASE: 'CASE',             // 案例型
  FACTORY: 'FACTORY',       // 工厂/幕后型
  DIGITAL: 'DIGITAL',       // 数字化内容
});

// 视频主题
const VideoTheme = Object.freeze({
  HOW_TO: 'HOW_TO',         // 使用教程
  TIPS: 'TIPS',             // 技巧
  COMPARISON: 'COMPARISON', // 对比
  REVIEW: 'REVIEW',         // 评测
  CASE_STUDY: 'CASE_STUDY', // 案例
  TREND: 'TREND',           // 趋势
  FAQ: 'FAQ',               // 常见问题
  DEMONSTRATION: 'DEMONSTRATION', // 演示
  BEHIND_SCENES: 'BEHIND_SCENES', // 幕后
  NEWS: 'NEWS',             // 资讯
});

// 业务方向
const BusinessLine = Object.freeze({
  TRADITIONAL: 'TRADITIONAL', // 传统量具
  SMALL_INSTRUMENT: 'SMALL_INSTRUMENT', // 小量仪
  DIGITAL_TRANSMISSION: 'DIGITAL_TRANSMISSION', // 数字化传输
});

// 机会状态
const OpportunityStatus = Object.freeze({
  NEW: 'NEW',               // 新建
  EVALUATING: 'EVALUATING', // 评估中
  APPROVED: 'APPROVED',     // 已批准
  REJECTED: 'REJECTED',     // 已拒绝
  IN_PRODUCTION: 'IN_PRODUCTION', // 生产中
  PUBLISHED: 'PUBLISHED',   // 已发布
  ARCHIVED: 'ARCHIVED',     // 已归档
});

// 发布状态
const PublishStatus = Object.freeze({
  PLANNED: 'PLANNED',       // 计划中
  SCRIPT_READY: 'SCRIPT_READY', // 脚本就绪
  SHOOTING: 'SHOOTING',     // 拍摄中
  EDITING: 'EDITING',       // 剪辑中
  PENDING_REVIEW: 'PENDING_REVIEW', // 待审核
  APPROVED: 'APPROVED',     // 已审核
  SCHEDULED: 'SCHEDULED',   // 已排期
  PUBLISHED: 'PUBLISHED',   // 已发布
  ANALYZING: 'ANALYZING',   // 分析中
  COMPLETED: 'COMPLETED',   // 已完成
});

// 资产类型
const AssetType = Object.freeze({
  RAW_VIDEO: 'RAW_VIDEO',       // 原始视频
  EDITED_VIDEO: 'EDITED_VIDEO', // 剪辑后视频
  PUBLISHED_VIDEO: 'PUBLISHED_VIDEO', // 已发布视频
  IMAGE: 'IMAGE',               // 图片
  PRODUCT_PHOTO: 'PRODUCT_PHOTO', // 产品照片
  SCRIPT: 'SCRIPT',             // 脚本
  SUBTITLE: 'SUBTITLE',         // 字幕
  THUMBNAIL: 'THUMBNAIL',       // 封面
  CASE_STUDY: 'CASE_STUDY',     // 案例
});

// 受众
const Audience = Object.freeze({
  FACTORY_MANAGER: 'FACTORY_MANAGER',     // 工厂管理者
  QUALITY_ENGINEER: 'QUALITY_ENGINEER',   // 质量工程师
  PRODUCTION_ENGINEER: 'PRODUCTION_ENGINEER', // 生产工程师
  METROLOGY_ENGINEER: 'METROLOGY_ENGINEER', // 计量工程师
  PURCHASER: 'PURCHASER',                 // 采购人员
  DISTRIBUTOR: 'DISTRIBUTOR',             // 经销商
  END_USER: 'END_USER',                   // 最终使用者
  DECISION_MAKER: 'DECISION_MAKER',       // 决策者
});

// 内容角度
const ContentAngle = Object.freeze({
  EDUCATIONAL: 'EDUCATIONAL',     // 教育型
  PROBLEM_SOLVING: 'PROBLEM_SOLVING', // 问题解决型
  COMPARATIVE: 'COMPARATIVE',     // 比较型
  INSPIRATIONAL: 'INSPIRATIONAL', // 启发型
  ENTERTAINING: 'ENTERTAINING',   // 娱乐型
  AUTHORITATIVE: 'AUTHORITATIVE',   // 权威型
  STORYTELLING: 'STORYTELLING',   // 故事型
});

// 权重配置（选品/选题评分）
const SCORING_WEIGHTS = Object.freeze({
  MARKET_DEMAND: 30,      // 市场需求
  INCREMENTAL_MARKET: 20, // 增量市场
  CUSTOMER_PAIN: 20,      // 客户痛点
  PRODUCT_ADVANTAGE: 10,  // 产品优势
  CONTENT_SPREAD: 10,     // 内容传播性
  BUSINESS_CONVERSION: 10, // 商业转化
});

// KPI 五级权重
const KPI_WEIGHTS = Object.freeze({
  EXPOSURE: 0.10,    // 曝光
  ENGAGEMENT: 0.15,  // 互动
  ACQUISITION: 0.25, // 获客
  SALES: 0.30,       // 销售
  OPERATION: 0.20,   // 经营
});

module.exports = {
  SignalSource,
  SignalType,
  Platform,
  ContentType,
  VideoTheme,
  BusinessLine,
  OpportunityStatus,
  PublishStatus,
  AssetType,
  Audience,
  ContentAngle,
  SCORING_WEIGHTS,
  KPI_WEIGHTS,
};
