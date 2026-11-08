# Agent Hub Community

Agent Hub 是一个围绕 LLM Agent 进行技术分享、讨论与共建的社群。这里有基模研究员、高校教授与青年硕博，也持续邀请自然科学领域的同行，一起交流 LLM Agent、RSI、AI4Science、AI 安全与物理 AI。

首页依次是 ASCII 双手、星系与字标开场；SpaceX 火星视频背景与社群简介；今天群里在聊的日报摘要；「把想法，一起做出来」讨论星空；「不同的来处，共同的好奇」机构滚动墙，左下角是加入社群的申请入口。顶部提供模块入口和中英文切换，首次访问默认为中文。原来独立的社群资料页 `community.html` 已撤下，旧链接转到首页对应位置。布局、素材和维护说明见 [四屏首页](docs/cinematic-home.md)。

## 本地开发

```sh
npm ci
npm run dev
```

另开终端运行 `npm run preview`，打开 http://127.0.0.1:8000/ 。`dev` 监听源码并重新构建，修改后刷新页面。

## 修改入口

- `src/CinematicHome.jsx`、`src/cinematic-home.css`：火星、社群场景与机构区组合、版式和页脚。
- `src/PlanetScene.jsx`：响应式火星视频、海报、按需加载、暂停和离屏停止。
- `src/HomeLanguage.jsx`、`src/home-copy.js`：首页中英文文案、语言切换和 `agenthub-language` 偏好；日报保留中文原始资料。
- `src/SiteHeader.jsx`、`src/module-header.css`：始终可用的模块入口与移动端菜单。
- `src/InstitutionWall.jsx`、`src/MemberLogo.jsx`：117 个机构的连续滚动、暂停、键盘浏览、完整目录与 SVG 标识去重；左下角的加入入口打开申请表单。
- `src/site-map.js`：全站导航与页脚链接；`JOIN_FORM` 是入群申请表单的地址。
- `src/CommunityIdentity.jsx`、`src/community-identity.css`、`src/commons-sky.js`：首页“把想法，一起做出来”一屏。夜空里每颗星是讨论档案中的一个问题（全部 66 个，按标签聚成星团）；悬停一颗星预览标签和问题，点击展开：它周围以扇形长出编号的想法小星，琥珀色虚线星是还在讨论的部分，悬停或点击想法小星也能预览、定位对应的想法。背景是一条斜贯的银河。下方面板同步显示问题、摘录、编号一致的想法、还在讨论的部分和讨论记录链接，并可上一个、下一个、随机浏览。档案新增讨论时星空自动增加。
- `src/commons-stories.js`：讨论 59、47、7 的英文版，英文页展示这三题时使用；其余讨论保留中文原文。
- `src/site.css`：共享导航、字标、首屏和基础样式。
- `src/brand/noto-sans-sc.css`：正文与导航的本地中文字体，按页面与完整摘录分包。更新方式见 [字体说明](src/brand/README.md#chinese-body-typography)。
- `src/journal-content.json`：首页机构墙读取其中展示图标的机构名称 `featuredInstitutions`。
- `src/community-data.json`：完整保留的 66 则讨论与成员机构资料。
- `scripts/homepage-community.mjs`：首页读取讨论与完整机构标志，直接使用原始 JSON。
- `src/main.jsx`：首页组合；`src/home-routing.js`：旧的 `#daily`、`#topics`、`#discussions`、`#events` 锚点转到讨论星空，`#discussion-N` 由星空打开对应讨论。
- `src/GenesisHero.jsx`、`src/genesis.css`：当前首页的原有 ASCII 开场动画。
- `assets/human-machine-creation.png`：ASCII 开场的采样原图，对应逐像素一致的无损 WebP。需要更新原图时，可用 Pillow 运行 `python -I scripts/optimize-hands.py` 后重新构建。
- `src/BrandWordmark.jsx`、`src/brand/wordmark.json`：原有自绘字标。
- `src/theme-init.js`：在首屏绘制前应用主题偏好。
- `src/index.html`：首页 HTML 模板、分享信息与日报 Atom 订阅声明；根目录 `index.html` 为构建产物。
- `src/community.html`：旧社群资料页地址的转发页，构建时原样复制到根目录。`#join` 和 `#discussion-N` 转到首页同名锚点，其余转到讨论星空。
- `src/brand/social-card.html`：链接分享封面，与原有字标共用源数据；输出为 `assets/social-card.png`，生成方式见 [字体与品牌说明](src/brand/README.md#sharing-cover)。

## 入群申请

加入入口打开飞书多维表格「Agent Hub 入群申请」的公开表单，任何人不登录即可填写：称呼、微信号或邮箱、所在团队或学校、研究方向与参与意向为必填，论文、项目或个人主页选填。每次提交是表里的一行，并自动记下提交时间，可在多维表格里按时间、学校等统计。表单地址见 `src/site-map.js` 的 `JOIN_FORM`；换表单时只改这一处。

页脚提供社群日报、[资料库](https://agent-hub-community.github.io/newspaper/library/)、RSS 与 GitHub 入口。资料库呈现群友分享过的论文、代码与工具；首页不维护它的实时数量。

视觉参考、内容出处与设计取舍见 [设计说明](docs/design-direction.md)。

## 构建与部署

```sh
npm run build
```

构建通过 esbuild 打包并预渲染首页，写入根目录 `index.html`、转发页 `community.html`、对应的 JS/CSS、`assets/theme.js`、`assets/home-routing.js`、共享模块与字体。火星视频仅在该屏可见且允许播放时加载。GitHub Pages 使用 `main` 分支根目录；提交时应同时包含源码与构建产物，包括当前 JS 分包、字体、模型、视频与海报。

首页滚动展示全部 117 个机构，可暂停或展开名称目录；复制轨道对辅助技术隐藏。机构区离屏或页面进入后台时停止自动滚动。

`featuredInstitutions` 的两组名称分别取自原始资料中的团队与科研机构、高校，名称需完全一致。客户端和 HTML 预渲染共用 `agenthub:homepage-community` 构建模块；`npm run dev` 会监听原始资料和精选配置，修改后自动更新。没有额外的数据生成步骤，也不修改完整原始资料。

首页固定为深色展示。减少动态效果时，原开场显示完整静态封面，火星视频默认不加载，机构行保留原生横向浏览。禁用脚本时海报、讨论、模块入口、机构目录和资料仍可使用。

## 许可

Inter、Space Grotesk、Noto Sans SC 的上游许可位于 `assets/licenses/`。火星页使用 SpaceX 官网公开提供的原始视频与海报，具体来源和哈希见 `assets/environment/mars-sources.json`，权利说明见 `assets/licenses/spacex-mars.txt`；这些素材不是 CC0 或 Agent Hub 原创。没有引入 SpaceX 网站的 JavaScript 或品牌字标。

本地检查、截图及早期设计备份保存在忽略目录 `.hallmark/`，不随站点发布。
