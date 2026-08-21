# 市场宣传与内容营销 Agent 架构文档

> 版本：v1.0  
> 日期：2026-08-21  
> 定位：建立 `产品 → 内容 → 发布 → 传播 → 线索 → 商机 → 成交` 的完整增长闭环

---

## 一、系统架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         市场宣传与内容营销 Agent                         │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  内容选题引擎  │  │  脚本生成引擎  │  │  发布计划管理  │  │  数据分析引擎  │  │
│  │  content-    │  │  script-     │  │  publisher-  │  │  analytics-  │  │
│  │  discovery   │  │  engine      │  │  manager     │  │  engine      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │                 │         │
│         └─────────────────┴─────────────────┴─────────────────┘         │
│                                   │                                   │
│                           ┌───────┴───────┐                           │
│                           │   主控编排器    │                           │
│                           │    main.js    │                           │
│                           └───────┬───────┘                           │
│                                   │                                   │
│  ┌────────────────────────────────┼────────────────────────────────┐  │
│  │                                │                                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │  │
│  │  │  销售Agent  │  │  产品Agent  │  │  售后Agent  │  │ 报价Agent │  │  │
│  │  │  agent-bridge (inbound)     │     │ 数字化传输 │  │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 二、数据模型

### 2.1 内容机会 (ContentOpportunity)
```typescript
interface ContentOpportunity {
  id: string;                    // 唯一标识
  source: SignalSource;          // 信号来源
  signalType: SignalType;        // 信号类型
  title: string;                 // 机会标题
  description: string;           // 机会描述
  relatedProducts: string[];     // 相关产品
  targetAudience: Audience;      // 目标受众
  contentAngle: ContentAngle;    // 内容角度
  priority: number;              // 优先级 (0-100)
  estimatedImpact: number;       // 预估影响力 (0-100)
  createdAt: string;             // 创建时间
  status: OpportunityStatus;     // 状态
}
```

### 2.2 视频脚本 (VideoScript)
```typescript
interface VideoScript {
  id: string;
  opportunityId: string;         // 关联机会
  platform: Platform;              // 目标平台
  theme: VideoTheme;             // 内容主题
  title: string;                 // 视频标题
  hook: string;                  // 3秒开场钩子
  targetAudience: string;        // 目标客户
  purpose: string;               // 视频目的
  coreSellingPoint: string;      // 核心卖点
  body: string[];               // 正文分镜
  productShow: string[];         // 产品展示
  demo: string[];                // 实际演示
  cta: string;                   // 结尾行动号召
  subtitles: string[];           // 建议字幕
  bgm: string;                   // 建议BGM
  shots: Shot[];                 // 分镜列表
  estimatedDuration: number;     // 预计时长(秒)
  props: string[];               // 道具清单
  location: string;              // 拍摄地点
  presenter: string;             // 出镜人员
}
```

### 2.3 发布计划 (PublishPlan)
```typescript
interface PublishPlan {
  id: string;
  week: number;                  // 第几周
  theme: string;                 // 本周主题
  items: PublishItem[];         // 发布项
}

interface PublishItem {
  day: string;                   // 星期几
  contentType: ContentType;     // 内容类型 (产品/知识/场景/避坑/对比/案例/工厂/数字化)
  topic: string;                // 主题
  platform: Platform;          // 平台
  scriptId: string;             // 关联脚本
  status: PublishStatus;        // 状态
  scheduledAt: string;         // 计划发布时间
}
```

### 2.4 内容资产 (ContentAsset)
```typescript
interface ContentAsset {
  id: string;
  type: AssetType;              // 类型 (raw/edited/published/script/subtitle/thumbnail/case)
  product: string;              // 关联产品
  theme: string;                // 主题
  shootDate: string;            // 拍摄日期
  platform: Platform;           // 发布平台
  publishDate: string;          // 发布日期
  title: string;                // 标题
  tags: string[];               // 标签
  // 数据指标
  metrics: {
    views: number;
    completionRate: number;
    likes: number;
    favorites: number;
    comments: number;
    shares: number;
    dms: number;                // 私信
    leads: number;             // 线索
    opportunities: number;     // 商机
    quotes: number;             // 报价
    orders: number;            // 成交
    revenue: number;           // 销售额
  };
  // ROI
  roi: {
    cost: number;              // 投入成本
    grossProfit: number;       // 毛利
    roiRatio: number;          // ROI = 毛利/成本
  };
}
```

---

## 三、信号来源 (SignalSource)

| 来源 | 类型 | 描述 |
|------|------|------|
| `SALES` | 销售数据 | 客户咨询、商机、报价 |
| `CUSTOMER` | 客户反馈 | 客户问题、咨询记录 |
| `AFTER_SALES` | 售后问题 | 售后TOP10、故障反馈 |
| `SEARCH` | 搜索趋势 | 行业搜索热词 |
| `PRODUCT` | 产品数据 | 增长/下降/新品/利润 |
| `COMPETITOR` | 竞品动态 | 竞品发布/促销/活动 |
| `SALES_FEEDBACK` | 销售反馈 | 一线销售人员反馈 |
| `MARKET` | 市场数据 | 行业报告、市场趋势 |

---

## 四、内容矩阵 (ContentMatrix)

| 类型 | 代码 | 说明 | 示例 |
|------|------|------|------|
| 产品型 | `PRODUCT` | 产品知识、差异对比 | "MITUTOYO 500系列卡尺有什么区别？" |
| 知识型 | `KNOWLEDGE` | 测量知识、技术原理 | "千分尺和卡尺到底有什么区别？" |
| 场景型 | `SCENARIO` | 行业应用、测量场景 | "轴承怎么测？" |
| 避坑型 | `PITFALL` | 常见错误、问题解决 | "为什么你的粗糙度数据总是不稳定？" |
| 对比型 | `COMPARE` | 产品对比、方案选择 | "A产品和B产品怎么选？" |
| 案例型 | `CASE` | 客户案例、成功故事 | "某工厂如何把测量数据自动传进电脑？" |
| 工厂型 | `FACTORY` | 幕后、测试、日常 | "今天我们测试一台新的测量设备。" |
| 数字化 | `DIGITAL` | 数据传输、数字化工厂 | "卡尺数据怎么直接进入Excel？" |

---

## 五、平台适配规则

| 平台 | 风格 | 时长建议 | 特点 |
|------|------|----------|------|
| 视频号 | 专业、可信 | 60-180s | 深度内容、信任建立 |
| 抖音 | 强Hook、快节奏 | 15-60s | 前三秒决定生死 |
| 小红书 | 教程、清单、经验 | 60-120s | 图文+视频、实用导向 |
| 公众号 | 完整技术文章 | 长文 | 深度阅读、SEO友好 |
| 企业微信 | 客户专属、精准 | 灵活 | 定向推送、转化导向 |

---

## 六、KPI 五级体系

| Level | 名称 | 指标 | 权重建议 |
|-------|------|------|----------|
| L1 | 曝光 | 播放量、曝光量、粉丝增长 | 10% |
| L2 | 互动 | 点赞、收藏、评论、转发 | 15% |
| L3 | 获客 | 私信、电话咨询、微信添加、表单 | 25% |
| L4 | 销售 | 商机数、报价数、报价金额、成交金额 | 30% |
| L5 | 经营 | 内容毛利、CAC、ROI、新客户贡献、复购 | 20% |

---

## 七、自动化等级

| Level | 能力 | 状态 | 说明 |
|-------|------|------|------|
| L1 | AI生成选题 | 已实现 | 基于多源信号自动发现内容机会 |
| L2 | AI生成脚本 | 已实现 | 完整脚本含分镜、字幕、BGM |
| L3 | AI生成拍摄清单 | 已实现 | 拍摄任务单、道具、场地 |
| L4 | AI生成标题、字幕、文案 | 已实现 | 多平台适配 |
| L5 | AI生成发布计划 | 已实现 | 月度/周度内容日历 |
| L6 | 人审核后发布 | **强制** | 第一版禁止自动对外发布 |
| L7 | 读取平台数据并分析 | 待实现 | 需平台API接入 |
| L8 | AI自动优化下一轮策略 | 待实现 | 依赖L7数据反馈 |

---

## 八、跨Agent数据接口

### 8.1 Inbound (接收其他Agent信号)

```
/agents/sales/leads          → 销售线索类型、客户关注点
/agents/sales/opportunities  → 高价值商机主题
/agents/product/growth       → 增长产品列表（需推广）
/agents/product/decline      → 下降产品列表（需教育）
/agents/product/new          → 新品列表（需曝光）
/agents/aftersales/top10     → 售后问题TOP10（内容选题）
/agents/quote/conversion     → 低转化率产品（内容教育）
/agents/digital/leads        → 数字化传输咨询（重点增长）
```

### 8.2 Outbound (向其他Agent输出)

```
/agents/sales/marketing-leads  → 内容产生的有效线索
/agents/product/content-feedback → 内容带来的产品反馈
```

---

## 九、文件结构

```
市场宣传与内容营销Agent/
├── ARCHITECTURE.md              # 本架构文档
├── src/
│   ├── main.js                  # 主控编排器
│   ├── core/
│   │   ├── types.js             # 数据类型定义
│   │   ├── content-discovery.js # 内容选题引擎
│   │   ├── script-engine.js     # 脚本生成引擎
│   │   ├── publisher.js         # 发布计划管理
│   │   ├── analytics.js         # 数据分析与ROI
│   │   └── agent-bridge.js      # 跨Agent接口
│   ├── data/
│   │   └── templates/           # 模板文件
│   └── utils/
│       └── helpers.js           # 工具函数
├── data/
│   ├── content_pool/            # 内容机会池
│   ├── scripts/                 # 生成的脚本
│   ├── published/               # 已发布内容记录
│   └── assets/                  # 内容资产元数据
└── package.json
```

---

## 十、关键约束

1. **禁止自动对外发布**：第一版所有内容必须经过人工审核后才能发布（L6强制人工审核）
2. **产品参数核验**：涉及三丰产品时，优先检索 IMA「三丰大全」知识库（ID: 7460527257172677），禁止编造参数
3. **主动选品**：用户未主动提供产品时，必须基于市场情报、增量市场、历史销售数据主动选品，不允许反问用户
4. **数据闭环**：必须建立 Content → Lead → Opportunity → Order 的完整追踪链路
5. **ROI计算**：每条内容必须计算内容带来的毛利 ÷ 内容投入成本
6. **跨Agent联动**：每日将有效营销线索传递给销售Agent，售后问题TOP10自动转化为内容选题
