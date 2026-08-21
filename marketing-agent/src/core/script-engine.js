/**
 * 脚本生成引擎 (Script Engine)
 * 负责生成短视频完整脚本、分镜、拍摄清单
 * 支持多平台适配（视频号、抖音、小红书、公众号、企业微信）
 * 版本: v1.0
 */

const { Platform, ContentType, VideoTheme, BusinessLine } = require('./types');
const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = path.join(__dirname, '..', '..', 'data', 'scripts');

class ScriptEngine {
  constructor() {
    this.scripts = [];
    this.loadScripts();
  }

  loadScripts() {
    if (!fs.existsSync(SCRIPTS_DIR)) {
      fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
    }
    const idx = path.join(SCRIPTS_DIR, 'index.json');
    if (fs.existsSync(idx)) {
      try {
        this.scripts = JSON.parse(fs.readFileSync(idx, 'utf8'));
      } catch (e) {
        this.scripts = [];
      }
    }
  }

  saveScripts() {
    const idx = path.join(SCRIPTS_DIR, 'index.json');
    fs.writeFileSync(idx, JSON.stringify(this.scripts, null, 2), 'utf8');
  }

  generateId() {
    return 'scr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  /**
   * 生成完整视频脚本
   * @param {Object} opportunity - 内容机会
   * @param {string} platform - 目标平台
   * @returns {Object} 完整脚本对象
   */
  generateVideoScript(opportunity, platform = 'VIDEO_HAO') {
    const id = this.generateId();
    const platformConfig = this.getPlatformConfig(platform);
    const contentType = opportunity.contentTypes?.[0] || ContentType.KNOWLEDGE;
    const theme = this.inferTheme(opportunity);

    const script = {
      id,
      opportunityId: opportunity.id,
      platform,
      businessLine: opportunity.businessLine || BusinessLine.TRADITIONAL,
      contentType,
      theme,
      title: this.generateTitle(opportunity, platform, contentType),
      hook: this.generateHook(opportunity, platform),
      targetAudience: opportunity.targetAudience || '工厂质量管理人员',
      purpose: this.generatePurpose(opportunity),
      coreSellingPoint: this.generateCoreSellingPoint(opportunity),
      body: this.generateBody(opportunity, platformConfig),
      productShow: this.generateProductShow(opportunity),
      demo: this.generateDemo(opportunity),
      cta: this.generateCTA(opportunity, platform),
      subtitles: this.generateSubtitles(opportunity),
      bgm: this.generateBGM(platform),
      shots: this.generateShots(opportunity, platformConfig),
      estimatedDuration: platformConfig.defaultDuration,
      props: this.generateProps(opportunity),
      location: this.generateLocation(opportunity),
      presenter: '建议由技术人员或销售工程师出镜',
      platformNotes: platformConfig.notes,
      createdAt: new Date().toISOString(),
      status: 'DRAFT',
    };

    this.scripts.push(script);
    this.saveScripts();

    // 同时保存完整脚本文件
    const scriptFile = path.join(SCRIPTS_DIR, `${id}.json`);
    fs.writeFileSync(scriptFile, JSON.stringify(script, null, 2), 'utf8');

    return script;
  }

  /**
   * 获取平台配置
   */
  getPlatformConfig(platform) {
    const configs = {
      VIDEO_HAO: {
        name: '视频号',
        style: '专业、可信、深度',
        defaultDuration: 90,
        minDuration: 60,
        maxDuration: 180,
        hookStyle: '直接点明问题或抛出专业观点',
        notes: '适合深度产品知识和案例内容',
        ctaStyle: '引导私信或评论区交流',
      },
      DOUYIN: {
        name: '抖音',
        style: '强Hook、快节奏、视觉冲击',
        defaultDuration: 45,
        minDuration: 15,
        maxDuration: 60,
        hookStyle: '前三秒必须有强冲突或悬念',
        notes: '完播率关键，节奏要快，画面切换频繁',
        ctaStyle: '评论区扣1或引导主页',
      },
      XIAOHONGSHU: {
        name: '小红书',
        style: '教程、清单、经验分享、实用',
        defaultDuration: 60,
        minDuration: 30,
        maxDuration: 120,
        hookStyle: '列出痛点或"干货预警"',
        notes: '强调实用性和可操作性，图文结合',
        ctaStyle: '收藏防丢、评论区交流',
      },
      WECHAT_OFFICIAL: {
        name: '公众号',
        style: '完整技术文章、深度分析',
        defaultDuration: null, // 文章
        hookStyle: '标题党+正文深度',
        notes: '长文，适合SEO，需要完整结构和案例',
        ctaStyle: '阅读原文、联系客服、扫码咨询',
      },
      WECHAT_WORK: {
        name: '企业微信',
        style: '精准、客户专属、转化导向',
        defaultDuration: 60,
        hookStyle: '直接点出客户利益',
        notes: '定向推送，可针对特定客户群体',
        ctaStyle: '直接引导询价或预约演示',
      },
    };
    return configs[platform] || configs.VIDEO_HAO;
  }

  /**
   * 推断视频主题
   */
  inferTheme(opportunity) {
    const signalToTheme = {
      INQUIRY_INCREASE: VideoTheme.HOW_TO,
      INQUIRY_TOPIC: VideoTheme.FAQ,
      AFTERSALES_TOP: VideoTheme.TIPS,
      PRODUCT_GROWTH: VideoTheme.REVIEW,
      NEW_PRODUCT: VideoTheme.REVIEW,
      HIGH_MARGIN: VideoTheme.COMPARISON,
      LOW_CONVERSION: VideoTheme.COMPARISON,
      COMPETITOR_ACTION: VideoTheme.COMPARISON,
      TRENDING_SEARCH: VideoTheme.TREND,
      MARKET_EVENT: VideoTheme.NEWS,
      CUSTOMER_PAIN: VideoTheme.PROBLEM_SOLVING,
      CAPABILITY_GAP: VideoTheme.DEMONSTRATION,
      EXPANSION_PROJECT: VideoTheme.CASE_STUDY,
    };
    return signalToTheme[opportunity.signalType] || VideoTheme.HOW_TO;
  }

  /**
   * 生成标题
   */
  generateTitle(opportunity, platform, contentType) {
    const titles = {
      [ContentType.PRODUCT]: {
        VIDEO_HAO: `${opportunity.title} | 三丰产品解析`,
        DOUYIN: `测了100次才发现，${opportunity.relatedProducts?.[0] || '这个工具'} 90%的人都用错了`,
        XIAOHONGSHU: `${opportunity.relatedProducts?.[0] || '测量工具'} 选购指南｜附参数对比表`,
      },
      [ContentType.KNOWLEDGE]: {
        VIDEO_HAO: `${opportunity.title} | 精密测量知识`,
        DOUYIN: `工厂老师傅不会告诉你的：${opportunity.topic || '测量真相'}`,
        XIAOHONGSHU: `${opportunity.topic || '测量'} 知识干货｜小白必看`,
      },
      [ContentType.PITFALL]: {
        VIDEO_HAO: `${opportunity.title} | 避坑指南`,
        DOUYIN: `为什么你的${opportunity.topic || '测量数据'}总是不准？答案扎心了`,
        XIAOHONGSHU: `${opportunity.topic || '测量'} 常见5大错误｜别再踩坑了`,
      },
      [ContentType.DIGITAL]: {
        VIDEO_HAO: `${opportunity.title} | 数字化测量方案`,
        DOUYIN: `还在手写记录？你的卡尺其实可以直接传数据到电脑！`,
        XIAOHONGSHU: `测量数据自动采集教程｜Excel直连实操`,
      },
    };

    const typeTitles = titles[contentType] || titles[ContentType.KNOWLEDGE];
    return typeTitles[platform] || typeTitles.VIDEO_HAO || opportunity.title;
  }

  /**
   * 生成Hook（前三秒开场）
   */
  generateHook(opportunity, platform) {
    const hooks = {
      VIDEO_HAO: [
        `"${opportunity.title}"——这个问题最近被问了${opportunity.inquiryCount || '几十'}次。`,
        `作为三丰代理，今天说一个${opportunity.topic || '测量'}的真相。`,
        `客户问：${opportunity.topic || '这个问题'}。我的回答是：`,
      ],
      DOUYIN: [
        `停！如果你还在${opportunity.painAction || '手动记录数据'}，你已经落后了。`,
        `${opportunity.topic || '测量'} 90%的人都做错了，看看你是不是其中之一。`,
        `这条视频可能会得罪同行，但必须得说。`,
      ],
      XIAOHONGSHU: [
        `干货预警！${opportunity.topic || '测量'} 的${opportunity.relatedProducts?.[0] || '工具'} 怎么选？`,
        `被问了N次的${opportunity.topic || '问题'}，今天一次讲清楚。`,
        `${opportunity.topic || '测量'} 避坑！这5点不注意白花钱。`,
      ],
    };

    const platformHooks = hooks[platform] || hooks.VIDEO_HAO;
    return platformHooks[Math.floor(Math.random() * platformHooks.length)];
  }

  /**
   * 生成视频目的
   */
  generatePurpose(opportunity) {
    const purposes = {
      [ContentType.PRODUCT]: '提升产品认知，建立专业信任，引导产品咨询',
      [ContentType.KNOWLEDGE]: '教育市场，建立专业IP，培养潜在客户认知',
      [ContentType.SCENARIO]: '展示应用场景，帮助客户联想自身需求',
      [ContentType.PITFALL]: '降低客户错误率，减少售后问题，提升满意度',
      [ContentType.COMPARE]: '帮助客户决策，提升报价转化率',
      [ContentType.CASE]: '社会证明，增强信任，展示成功应用',
      [ContentType.FACTORY]: '展示实力，增强品牌可信度',
      [ContentType.DIGITAL]: '教育数字化测量能力，引导数字化传输业务咨询',
    };
    return purposes[opportunity.contentTypes?.[0]] || '提升品牌认知，获取销售线索';
  }

  /**
   * 生成核心卖点
   */
  generateCoreSellingPoint(opportunity) {
    const product = opportunity.relatedProducts?.[0] || '三丰产品';
    const points = {
      [BusinessLine.TRADITIONAL]: `${product} 的精度优势和正确使用方法`,
      [BusinessLine.SMALL_INSTRUMENT]: `${product} 如何解决具体测量难题`,
      [BusinessLine.DIGITAL_TRANSMISSION]: `${product} 如何让测量数据自动流入管理系统，实现零人工录入`,
    };
    return points[opportunity.businessLine] || points[BusinessLine.TRADITIONAL];
  }

  /**
   * 生成正文分镜
   */
  generateBody(opportunity, platformConfig) {
    const body = [];

    // 引入痛点
    body.push(`【分镜1】引入：${opportunity.description || '描述客户常见场景或痛点'}，时长约8秒`);

    // 问题展开
    body.push(`【分镜2】问题展开：解释为什么这个问题会发生，核心原因是什么，时长约15秒`);

    // 解决方案引入
    body.push(`【分镜3】转折："那应该怎么做？" 引入三丰方案，时长约10秒`);

    // 核心内容（根据业务线调整）
    if (opportunity.businessLine === BusinessLine.DIGITAL_TRANSMISSION) {
      body.push(`【分镜4】演示：展示数据从量具→接收器→电脑/Excel的完整流程，时长约20秒`);
      body.push(`【分镜5】对比：手动记录 vs 自动采集的效率对比，时长约12秒`);
    } else if (opportunity.businessLine === BusinessLine.SMALL_INSTRUMENT) {
      body.push(`【分镜4】演示：${opportunity.relatedProducts?.[0] || '仪器'} 的实际测量操作，时长约20秒`);
      body.push(`【分镜5】参数解读：关键参数怎么看、怎么理解，时长约12秒`);
    } else {
      body.push(`【分镜4】演示：${opportunity.relatedProducts?.[0] || '量具'} 的正确使用方法和读数，时长约20秒`);
      body.push(`【分镜5】技巧：展示1-2个专业技巧，时长约12秒`);
    }

    // 总结
    body.push(`【分镜6】总结：核心要点回顾，时长约8秒`);

    return body;
  }

  /**
   * 生成产品展示分镜
   */
  generateProductShow(opportunity) {
    const product = opportunity.relatedProducts?.[0] || '三丰产品';
    return [
      `【产品展示1】产品全景：${product} 整体外观，展示铭牌/型号，时长约3秒`,
      `【产品展示2】细节特写：关键部位、显示屏、刻度/按钮，时长约3秒`,
      `【产品展示3】品牌露出：MITUTOYO logo 清晰可见，时长约2秒`,
    ];
  }

  /**
   * 生成实际演示分镜
   */
  generateDemo(opportunity) {
    const product = opportunity.relatedProducts?.[0] || '三丰产品';
    return [
      `【演示1】准备：测量工件放置，${product} 开机/归零，时长约5秒`,
      `【演示2】测量：实际操作动作，手部特写，数据变化，时长约8秒`,
      `【演示3】读数：显示屏清晰展示，语音播报数值，时长约3秒`,
    ];
  }

  /**
   * 生成CTA（行动号召）
   */
  generateCTA(opportunity, platform) {
    const ctas = {
      VIDEO_HAO: [
        `如果你也遇到${opportunity.topic || '这个问题'}，欢迎私信或评论区留言，我们提供一对一测量方案咨询。`,
        `想了解更多${opportunity.relatedProducts?.[0] || '三丰产品'}信息，点击主页联系或私信"${opportunity.keyword || '咨询'}"获取资料。`,
      ],
      DOUYIN: [
        `评论区扣"1"，发你${opportunity.relatedProducts?.[0] || '产品'} 完整参数表。`,
        `这条视频对你有用的话，双击点赞，下期讲${opportunity.nextTopic || '进阶技巧'}。`,
      ],
      XIAOHONGSHU: [
        `觉得有用的话收藏防丢，有问题评论区交流，看到都会回。`,
        `主页有更多${opportunity.relatedProducts?.[0] || '测量'}干货，关注不迷路。`,
      ],
      WECHAT_OFFICIAL: [
        `如需具体选型建议或报价，请联系您的专属顾问，或拨打咨询热线。`,
      ],
    };

    const platformCTAs = ctas[platform] || ctas.VIDEO_HAO;
    return platformCTAs[0];
  }

  /**
   * 生成字幕重点
   */
  generateSubtitles(opportunity) {
    const product = opportunity.relatedProducts?.[0] || '三丰产品';
    return [
      `【重点字幕】${opportunity.title}`,
      `【重点字幕】${product} 核心优势：精度/效率/可靠性`,
      `【重点字幕】关键数据：对比数值、参数差异`,
      `【重点字幕】行动引导：私信/评论/收藏`,
    ];
  }

  /**
   * 生成BGM建议
   */
  generateBGM(platform) {
    const bgms = {
      VIDEO_HAO: '轻科技/专业感背景音乐，不喧宾夺主，音量低于人声',
      DOUYIN: '节奏感强、有记忆点的音乐，前3秒卡点',
      XIAOHONGSHU: '轻松、实用感背景音，不要太过激昂',
      WECHAT_OFFICIAL: '无需BGM，或极轻的专业背景音',
    };
    return bgms[platform] || bgms.VIDEO_HAO;
  }

  /**
   * 生成分镜列表
   */
  generateShots(opportunity, platformConfig) {
    const product = opportunity.relatedProducts?.[0] || '三丰产品';
    const shots = [
      {
        shotNumber: 1,
        type: '开场',
        description: '出镜人直面镜头，抛出Hook',
        duration: 3,
        camera: '中景/近景',
        notes: '眼神直视镜头，表情专业可信',
      },
      {
        shotNumber: 2,
        type: '痛点',
        description: `展示${opportunity.topic || '错误测量'}场景或错误数据`,
        duration: 8,
        camera: '特写/近景',
        notes: '可用手持拍摄增加真实感',
      },
      {
        shotNumber: 3,
        type: '转折',
        description: '出镜人过渡语，引出解决方案',
        duration: 5,
        camera: '中景',
        notes: '手势引导视线',
      },
      {
        shotNumber: 4,
        type: '产品展示',
        description: `${product} 全景+细节特写`,
        duration: 6,
        camera: '特写/微距',
        notes: '铭牌、型号、logo 必须清晰可见',
      },
      {
        shotNumber: 5,
        type: '操作演示',
        description: '实际测量操作，手部动作+屏幕数据',
        duration: 15,
        camera: '近景/特写',
        notes: '稳定器拍摄，确保数据可读',
      },
      {
        shotNumber: 6,
        type: '对比/效果',
        description: '前后对比或数据对比展示',
        duration: 8,
        camera: '分屏/切换',
        notes: '用图形或字幕强化对比',
      },
      {
        shotNumber: 7,
        type: '总结',
        description: '出镜人总结核心要点',
        duration: 5,
        camera: '中景',
        notes: '语速放慢，重点强调',
      },
      {
        shotNumber: 8,
        type: 'CTA',
        description: '行动号召，引导互动',
        duration: 5,
        camera: '近景',
        notes: '手势配合，增强引导',
      },
    ];

    // 根据平台调整时长
    if (platformConfig.name === '抖音') {
      shots.forEach(s => s.duration = Math.max(2, Math.floor(s.duration * 0.6)));
    }

    return shots;
  }

  /**
   * 生成道具清单
   */
  generateProps(opportunity) {
    const baseProps = [
      opportunity.relatedProducts?.[0] || '三丰产品',
      '测量工件/样品',
      '三脚架',
      '补光灯',
      '领夹麦克风',
    ];

    if (opportunity.businessLine === BusinessLine.DIGITAL_TRANSMISSION) {
      baseProps.push('数据传输接收器/连接线', '笔记本电脑（展示Excel采集）', 'MES/系统界面截图');
    }

    if (opportunity.businessLine === BusinessLine.SMALL_INSTRUMENT) {
      baseProps.push('标准样块/校准件', '工件夹具');
    }

    return baseProps;
  }

  /**
   * 生成拍摄地点
   */
  generateLocation(opportunity) {
    const locations = {
      [BusinessLine.TRADITIONAL]: '测量实验室/演示台',
      [BusinessLine.SMALL_INSTRUMENT]: '仪器展示区/客户现场（如有）',
      [BusinessLine.DIGITAL_TRANSMISSION]: '数字化演示区/工厂现场（展示数据传输）',
    };
    return locations[opportunity.businessLine] || '测量演示区';
  }

  /**
   * 生成拍摄任务单
   */
  generateShootingTask(script) {
    const task = {
      taskId: 'shoot_' + script.id,
      scriptId: script.id,
      theme: script.title,
      responsible: '待分配',
      product: script.props[0] || '三丰产品',
      location: script.location,
      equipment: ['摄像机/手机', '三脚架', '补光灯', '领夹麦克风', '稳定器'],
      shootDate: '待排期',
      estimatedDuration: script.estimatedDuration,
      requiredShots: script.shots.map(s => ({
        number: s.shotNumber,
        type: s.type,
        description: s.description,
        duration: s.duration,
        mustCapture: true,
      })),
      mustShow: [
        '产品铭牌（型号清晰可见）',
        '显示屏/读数区域',
        '测量动作（手部特写）',
        '数据变化过程',
        '产品细节（刻度/logo）',
      ],
      props: script.props,
      notes: [
        '确保产品清洁，无指纹污渍',
        '背景简洁，避免杂乱',
        '光线充足，避免阴影',
        '录制前测试设备电量和存储空间',
        '每条拍摄至少保留2条可用素材',
      ],
      createdAt: new Date().toISOString(),
      status: 'PLANNED',
    };

    return task;
  }

  /**
   * 生成多平台适配版本
   */
  generateMultiPlatformScripts(opportunity) {
    const platforms = ['VIDEO_HAO', 'DOUYIN', 'XIAOHONGSHU'];
    const results = {};
    for (const platform of platforms) {
      results[platform] = this.generateVideoScript(opportunity, platform);
    }
    return results;
  }

  /**
   * 获取脚本
   */
  getScript(id) {
    return this.scripts.find(s => s.id === id);
  }

  /**
   * 获取所有脚本
   */
  getAllScripts() {
    return this.scripts;
  }

  /**
   * 根据机会ID获取脚本
   */
  getScriptsByOpportunity(opportunityId) {
    return this.scripts.filter(s => s.opportunityId === opportunityId);
  }

  /**
   * 删除脚本
   */
  deleteScript(id) {
    const idx = this.scripts.findIndex(s => s.id === id);
    if (idx >= 0) {
      this.scripts.splice(idx, 1);
      this.saveScripts();
      return true;
    }
    return false;
  }
}

module.exports = ScriptEngine;
