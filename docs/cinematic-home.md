# V86 · 首页的四段展示

首页顺序为原有 ASCII 双手、星系与字标开场 → SpaceX 火星背景与社群简介 → 人和 Agent 相聚的赛博空间 →「不同的来处，共同的好奇」机构滚动墙。顶部持续提供模块入口和中英文切换。社群场景不再有地球背景；人物与机器人都保持固定的朝向。

## 页面与语言

- `src/main.jsx`、`src/CinematicHome.jsx`：四段首页与页脚。
- `src/GenesisHero.jsx`、`src/genesis.css`：保留原有双手分开、星系展开、字标出现的滚动映射，只翻译文字与辅助标签。
- `src/PlanetScene.jsx`、`src/cinematic-home.css`：火星、简介、日报和资料库入口。
- `src/CommunityIdentity.jsx`、`src/CyberCommons.jsx`：社群场景、三组讨论和来源链接；维护说明见 [社群场景](cyber-commons.md)。
- `src/HomeLanguage.jsx`、`src/home-copy.js`：首页中英文本。第一次访问始终用中文；明确选择后，通过 `agenthub-language` 保存偏好。切换同时更新文档语言、标题和说明。
- `src/SiteHeader.jsx`、`src/module-header.css`：共享模块导航与移动端菜单，支持 Escape 关闭与焦点返回。
- `src/community.jsx`、`src/community.html`：独立中文资料页，保留日报精选、六个研究方向、66 则讨论、成员目录与邀请方式。
- `src/home-routing.js`：旧首页的讨论、研究等锚点继续打开同目录的 `community.html`；无脚本时提供原生继续阅读链接。

首页简介围绕 LLM Agent 的技术分享、讨论与共建，介绍基模研究员、高校教授、青年硕博以及自然科学领域的成员，涵盖 RSI、AI4Science、AI 安全和物理 AI。切换语言不会改变或翻译原始讨论档案。

## 火星素材与播放

使用 SpaceX 官网「Making life multiplanetary」屏的原始公开素材，保持横竖画面，而不是另画一颗地球。桌面视频为 `Mars_Rotation_Web_HB_d96299f9de.mp4`，手机视频为 `Mobile_v4_HB_e1d2eda88f.mp4`，同时保留各自的原始海报。具体公开 URL、尺寸与 SHA-256 见 `assets/environment/mars-sources.json`，权利说明见 `assets/licenses/spacex-mars.txt`。这些素材不是 CC0、NASA 素材或 Agent Hub 原创；页面保留 SpaceX 来源入口。实现使用自己的 React/CSS，没有导入 SpaceX 的 JavaScript 或字标。

桌面沿用 1700px 内容容器、左侧 100px、居中文案、至少 941px 的全屏构图。961px 以下使用竖版视频，媒体占上方 67%，文案置于下部。新增的社群简介、语言切换和链接使用本站文案。

只在火星屏可见且需要播放时下载匹配视口的视频。离屏、切到后台或点击暂停后停止播放。减少动态效果和节省流量偏好下默认不加载视频，仍可主动点击播放。切换横竖版本保留播放进度；视频失败时保留海报。两个版本总计约 18 MB，单次初始访问不会同时下载它们。

## 机构滚动

完整保留原始资料中的 41 个团队与科研机构、76 所高校。四行相邻方向交替，复制列表带有 `aria-hidden` 和 `inert`，SVG 标识用 `useId` 去重。英文页面只翻译机构显示名称，不改变成员资料或标志。

滚动只在机构区可见且页面在前台时运行。支持暂停、悬停暂停、完整名称目录和键盘横向浏览。减少动态效果或无脚本时使用原生横向列表。这里表示成员的来处，不表示机构背书。

## 构建与验证

`npm run build` 预渲染中文首页和资料页，并生成脚本、样式、字体与共享模块。普通构建使用本地素材，不需要下载视频、运行 Python 或启动浏览器。修改中文文案后，按字体说明重新运行 `scripts/subset-body-font.py`。

首页固定深色，保留阅读偏好。资料页与同源 newspaper 继续共用 `agenthub-theme`。无脚本时开场封面、海报、静态场景、模块入口、机构目录及全部原始讨论仍可用。

验证覆盖开场、四屏导航、中英切换、视频加载与暂停、移动端排版、机构滚动、资料页直达和无脚本阅读。V86 的本地截图与报告位于 `.hallmark/takeover/v86/`，不随站点发布。旧版 NASA 地球和 Robonaut 背景及其生成工具保留供历史设计维护，当前首页不加载它们。
