# Ailis 三件套 · 三丰代理商务台

> 三大模块（行业增量 / 市场行情 / 日币走势）合并到一个工作平台，通过 GitHub 公开仓库 + Pages 免费公网查看。

**🌐 公网地址：https://Ailis97.github.io/ailis-workbench/**

---

## 📦 仓库与目录结构

- **GitHub 仓库**：`git@github.com:Ailis97/ailis-workbench.git`（**公开**，免费账户可开 Pages）
- **本地路径**：`C:\Users\bingy\wb-sync\wb-repo\`

```
wb-repo/
├── index.html                  # 主工作平台（3 模块入口 + 渲染）
├── workbench-push.ps1          # 跨设备同步脚本（SSH push / pull）
├── README.md                   # 本文件
├── .gitignore
└── reports/                    # 历史归档（跨设备可查）
    ├── fx/                     # 日币走势预估每日 HTML/XLSX
    ├── news/                   # 三丰市场行情简报
    └── industries/             # 三丰行业增量简报
```

---

## 🚀 快速上手

### 1. 公网查看（推荐）

直接打开：**https://Ailis97.github.io/ailis-workbench/**

> 页面由 GitHub Pages 免费托管；私有仓库 / 非 Pages 环境无法访问公网页面。

### 2. 本地拉取（任意设备）

```bash
git clone git@github.com:Ailis97/ailis-workbench.git
# Windows
start ailis-workbench\index.html
# macOS
open ailis-workbench/index.html
```

### 3. 修改后推送回 GitHub（Windows）

```powershell
& C:\Users\bingy\wb-sync\wb-repo\workbench-push.ps1 -Action push
```

> 💡 **已全自动**：3 个 WorkBuddy 自动化（行业增量/市场行情/日币走势）每次运行完都会自动调用上面的脚本推送，无需手动执行。脚本特点：
> - 幂等：无改动时跳过 commit（不报错）
> - 互斥锁：多个自动化并发时安全等待
> - 防损坏：不使用 stash（避免 AUTO_MERGE/index.lock 死锁），只 add → commit → pull --rebase → push（失败自动重试 3 次）
> - 日志：`C:\Users\bingy\wb-sync\workbench-push.log`

### 4. GitHub Pages 配置

在 GitHub 仓库设置（Settings → Pages）：
- **Source**：`Deploy from a branch`
- **Branch**：`main` · **Folder**：`/`（根目录）
- 保存后即可访问 **https://Ailis97.github.io/ailis-workbench/**

---

## 🤖 三大自动化对接

| 模块 | WorkBuddy 自动化 | 触发频率 | 写入目标 |
|---|---|---|---|
| 📈 三丰行业增量 | `三丰行业增量每日抓取` | 每天 09:00 | `wb-repo\index.html` → `const INDUSTRIES=[]` |
| 📰 三丰市场行情 | `三丰每日市场行情速递` | 每天 09:00 | `wb-repo\index.html` → `const NEWS=[]` |
| 💴 日币走势预估 | `日币走势预估-1小时更新` | 每 1 小时 | `wb-repo\index.html` → `const FX_DATA={}`（同时归档到 `reports/fx/`） |

3 个自动化的 prompt 已更新为「写入新平台 + 自动推送」，详见 WorkBuddy → 设置 → 自动化。

---

## 🔑 SSH 配置

本平台不需要 PAT / 密码认证，复用 WorkBuddy 多机同步的 SSH 密钥：

```powershell
# 验证 SSH 连通性
ssh -T -o BatchMode=yes git@github.com
# 期望输出：Hi Ailis97! You've successfully authenticated, but GitHub does not provide shell access.
```

每台机器首次使用前：
1. 生成 SSH key（如果没有）：`ssh-keygen -t ed25519 -f $HOME\.ssh\id_ed25519`
2. 把 `~/.ssh/id_ed25519.pub` 添加到 GitHub：https://github.com/settings/ssh/new
3. 验证：`ssh -T -o BatchMode=yes git@github.com`

---

## 📝 数据来源与口径

- **三丰行业增量**：联网检索行业媒体 / 三丰官网 / 公开新闻，6 条/日，覆盖液冷/AI 算力、半导体/先进封装、新能源汽车/电池、航空航天、精密模具/3C、医疗器械/制药，每条必带可点击源链接。
- **三丰市场行情**：仅采用「官方网站 + 权威/专家类网站」——三丰各国官网、基恩士/海克斯康官网、计量 NEWS、中国工控网、MMSC 等；剔除今日头条/搜狐/网易等聚合门户。仅保留发布于近 2 个月内。
- **日币走势预估**：建行日元现汇牌价、Yahoo Finance、新浪财经、金十数据、BoJ 公告、Fed 公告、B 站/油管认证外汇专家访谈。每小时刷新；遇重大新闻弹窗提醒并给出对汇率影响与具体数据。

> ⚠️ 汇率与行情数据来源于公开网络检索，存在时延与口径差异；汇率走势为模型聚合预估，**不构成任何投资建议**。日元采购决策请结合实时牌价与自身风险承受能力。

---

## 🔗 相关链接

- **Pages 公网**：https://Ailis97.github.io/ailis-workbench/
- **Pages 设置**：https://github.com/Ailis97/ailis-workbench/settings/pages
- **仓库**：https://github.com/Ailis97/ailis-workbench

---

最后更新：2026-08-05
