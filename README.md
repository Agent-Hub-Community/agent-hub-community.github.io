# Agent Hub Community

Agent Hub 是一个围绕 LLM Agent 进行技术分享、讨论与共建的社群。这里有基模研究员、高校教授与青年硕博，也持续邀请自然科学领域的同行，一起交流 LLM Agent、RSI、AI4Science、AI 安全与物理 AI。

V86 首页由四段展示组成：原有 ASCII 双手、星系与字标开场；SpaceX 火星视频背景与社群简介；三组并排的社群讨论；「不同的来处，共同的好奇」机构滚动页。顶部提供模块入口和中英文切换，首次访问默认为中文。117 个机构标志连续滚动，支持暂停、键盘浏览与完整目录。日报精选、研究方向、66 则真实讨论和加入方式保留在独立的 `community.html` 中。布局、素材和维护说明见 [四屏首页](docs/cinematic-home.md)。

## 本地开发

```sh
npm ci
npm run dev
```

另开终端运行 `npm run preview`，打开 http://127.0.0.1:8000/ 。`dev` 监听源码并重新构建，修改后刷新页面。

## 修改入口

- `src/CinematicHome.jsx`、`src/cinematic-home.css`：火星、社群场景与机构区组合、版式和页脚。
- `src/PlanetScene.jsx`：响应式火星视频、海报、按需加载、暂停和离屏停止。
- `src/HomeLanguage.jsx`、`src/home-copy.js`：首页中英文文案、语言切换和 `agenthub-language` 偏好；资料页与日报仍保留中文原始资料。
- `src/SiteHeader.jsx`、`src/module-header.css`：始终可用的模块入口与移动端菜单。
- `src/InstitutionWall.jsx`、`src/MemberLogo.jsx`：117 个机构的连续滚动、暂停、键盘浏览、完整目录与 SVG 标识去重。
- `src/community.jsx`、`src/FieldJournal.jsx`：独立资料页、讨论搜索与分页、成员目录、加入说明和页脚。
- `src/CommunityIdentity.jsx`、`src/community-identity.css`：首页“把想法，一起做出来”一屏，三组讨论并排展示问题、双方观点、仍未解决的部分和讨论记录链接。
- `src/commons-stories.js`：根据原始讨论 59、47、7 整理的三组对话及英文翻译，结论保留原讨论中的不确定性。
- `src/site.css`：共享导航、字标、首屏和基础样式；正文使用 `src/field-journal.css`。
- `src/journal-search.js`：搜索词的原文位置与匹配句提取，保留原始文字和完整句子。
- `src/ResearchPlate.jsx`：三张原创 SVG 研究插图。
- `src/field-journal.css`：统一排版、色彩、响应式与主题样式。
- `src/brand/noto-sans-sc.css`：正文与导航的本地中文字体，按页面与完整摘录分包。更新方式见 [字体说明](src/brand/README.md#chinese-body-typography)。
- `src/journal-content.json`：附日期和原文链接的日报精选、六个研究方向引用的讨论编号 `discussionId`、首页优先呈现的讨论编号 `discussionHighlights`，以及展示图标的机构名称 `featuredInstitutions`。精选由人工维护，不自动追踪最新一期。
- `src/community-data.json`：完整保留的 66 则讨论与成员机构资料。
- `scripts/homepage-community.mjs`：首页读取完整机构标志，资料页读取全部讨论、机构名称及精选标志；共同使用原始 JSON。
- `src/main.jsx`：首页组合；`src/home-routing.js`：保留旧首页讨论与内容锚点，跳转至资料页。
- `src/GenesisHero.jsx`、`src/genesis.css`：当前首页的原有 ASCII 开场动画。
- `assets/human-machine-creation.png`：ASCII 开场的采样原图，对应逐像素一致的无损 WebP。需要更新原图时，可用 Pillow 运行 `python -I scripts/optimize-hands.py` 后重新构建。
- `src/BrandWordmark.jsx`、`src/brand/wordmark.json`：原有自绘字标。
- `src/theme-init.js`、`src/ThemeToggle.jsx`、`src/theme.css`：主题偏好与切换。
- `src/join-example.html`：独立保留的入群申请设计示例，不提交或保存表单内容，不在首页推广。社群仍采用现有成员邀请制。
- `src/index.html`、`src/community.html`：首页与资料页的 HTML 模板、分享信息与日报 Atom 订阅声明；根目录中的同名文件为构建产物。
- `src/brand/social-card.html`：链接分享封面，与原有字标共用源数据；输出为 `assets/social-card.png`，生成方式见 [字体与品牌说明](src/brand/README.md#sharing-cover)。

日报插图是原创 SVG，分别对应接口选择、内核对齐和机器人实践，不代表实验测量数据。更换精选文章时，检查插图是否仍与主题一致。研究方向直接引用原始讨论的问题，点击后打开对应摘录；`discussionId` 与 `#discussion-N` 使用相同的原始编号。讨论列表直接展示问题与一句原有摘录，展开后阅读完整上下文，支持直达、自动翻页与展开。调整展示顺序不会改变链接。更换研究方向引用的问题或首页优先呈现的讨论后，按字体说明重新生成中文字体子集。

精选说明中的多词英文项目名可用 JSON 的 `\u00a0` 表示名称内部的不间断空格，避免在窄屏中拆开；当前仅用于 Hybrid Computer Use。它与普通空格的字距相同，浏览器仍能用普通空格查找名称。不要用这种方式锁住整段中文。

页脚提供社群日报、[资料库](https://agent-hub-community.github.io/newspaper/library/)、RSS 与 GitHub 入口。资料库呈现群友分享过的论文、代码与工具；首页不维护它的实时数量。

视觉参考、内容出处与设计取舍见 [设计说明](docs/design-direction.md)。

## 构建与部署

```sh
npm run build
```

构建通过 esbuild 同时打包并预渲染首页与资料页，写入根目录 `index.html`、`community.html`、`join-example.html`、对应的 JS/CSS、`assets/theme.js`、`assets/home-routing.js`、共享模块与字体。火星视频仅在该屏可见且允许播放时加载。GitHub Pages 使用 `main` 分支根目录；提交时应同时包含源码与构建产物，包括当前 JS 分包、字体、模型、视频与海报。

资料页的六个研究方向始终可见。讨论支持全文搜索、话题筛选和分页，通过原生 `details` 展开。禁用脚本后，全部 66 则讨论与成员目录仍可阅读。首页滚动展示全部 117 个机构，可暂停或展开名称目录；复制轨道对辅助技术隐藏。机构区离屏或页面进入后台时停止自动滚动。

搜索会以浅色背景标出原文中的匹配词。命中内容只在折叠正文中时，列表预览显示对应的完整原句；展开后仍保留原引用、正文和小结。清空搜索后恢复原有摘录。匹配句由已有资料截取，不另外维护搜索摘要。

`featuredInstitutions` 的两组名称分别取自原始资料中的团队与科研机构、高校，名称需完全一致。客户端和 HTML 预渲染共用 `agenthub:homepage-community` 构建模块；`npm run dev` 会监听原始资料和精选配置，修改后自动更新。没有额外的数据生成步骤，也不修改完整原始资料。

首页固定为深色展示，并保留已有阅读偏好。资料页跟随系统并保存手动选择，与同源 newspaper 共用 `agenthub-theme`。减少动态效果时，原开场显示完整静态封面，火星视频默认不加载，机构行保留原生横向浏览。禁用脚本时海报、讨论、模块入口、机构目录和资料仍可使用。

## 许可

Inter、Space Grotesk、Noto Sans SC、Noto Serif SC 的上游许可位于 `assets/licenses/`。火星页使用 SpaceX 官网公开提供的原始视频与海报，具体来源和哈希见 `assets/environment/mars-sources.json`，权利说明见 `assets/licenses/spacex-mars.txt`；这些素材不是 CC0 或 Agent Hub 原创。没有引入 SpaceX 网站的 JavaScript 或品牌字标。

本地检查、截图及早期设计备份保存在忽略目录 `.hallmark/`，不随站点发布。
