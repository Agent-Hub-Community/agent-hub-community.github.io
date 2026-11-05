# Agent Hub Community

Agent Hub 社群主页。以开放式文字版面组织社群介绍、研究话题、讨论摘录和日报入口，提供深色夜间与暖白日间两套主题。右上角可随时切换，首次访问跟随系统设置，手动选择会保存在本机；示例申请页沿用相同主题。保留社区 logo 的 ASCII 向心旋转动画，并使用 React Bits 的 ScrollReveal、ScrollFloat、LogoLoop 和 WarmTooltip。

首屏以《创造亚当》的指尖姿态呈现人手与机械手，两只手均由实时 ASCII 字符组成。向下滚动时，两手向两侧分开，社区星系标志从中间出现并放大，接着显示字标与社群介绍；向上滚动可回看。字标采用 Space Grotesk 字形，完整字母随滚动逐渐清晰、收拢归位，没有裁切揭幕。页面不显示滚动提示、播放控制或跳过开场选项。减少动态效果的系统设置会直接显示最终封面。正文依次呈现社群介绍、研究方向、讨论摘录、交流活动、成员机构、日报和加入方式。

## 本地开发

```sh
npm ci
npm run dev
```

另开一个终端运行 `npm run preview`，在 http://127.0.0.1:8000/ 预览。修改后刷新浏览器。

## 修改入口

- `src/main.jsx`：页面结构、讨论摘录与其他正文。
- `src/GenesisHero.jsx`、`src/genesis.css`：ASCII 双手开场与滚动分镜；造型底稿及生成提示见 `src/genesis-art.md`。
- `src/amicro/`：图标切换、磁吸回弹等微交互及上游许可。
- `src/EditorialSections.jsx`、`src/editorial.css`：研究方向的滚动章节、活动横向画廊、讨论版面与章节过渡。
- `src/site.css`：字体排版、配色、布局与响应式样式。
- `src/tokens.css`：统一颜色、字体、间距、字号与动效变量。
- `src/theme-init.js`、`src/ThemeToggle.jsx`、`src/theme.css`：首次绘制前应用主题、日夜切换与本机偏好保存；ASCII 双手和星系同步换色。
- `src/CameraScene.jsx`、`src/camera.css`：正文随滚动推进的镜头、轨道装饰和图片透视效果。
- `src/base.css`：基础排版、键盘焦点与减少动态效果支持。
- `src/BrandWordmark.jsx`：Space Grotesk 轮廓字标及逐字归位动效，首屏、导航与页脚共用。
- `src/media-content.json`：研究话题和社群活动的图片配置；当前 `src` 留空，填入图片路径即可替换。
- `src/join-example.html`：入群申请示例页，构建时复制到根目录；不会提交或保存表单内容。正式表单链接在 `src/main.jsx` 的 `JOIN_FORM` 中替换。
- `src/MediaPanel.jsx`、`src/media-panel.css`：图片叠层切换、指针倾斜、反光与缓慢推进效果。
- `src/community-data.json`：成员机构标识与原主页讨论内容。
- `src/index.html`：HTML 模板；根目录 `index.html` 在构建时自动生成。
- `assets/ascii-logo.js`：ASCII 星系的字符与动画逻辑。
- `logo/`：社区提供的原始 SVG 标识。

## 构建与部署

```sh
npm run build
```

构建会预渲染 HTML，并写入 `index.html`、`assets/site.js`、`assets/site.css`、`assets/theme.js` 和 `assets/fonts/`。这些文件保留在版本库中，因此现有 GitHub Pages 的 `main` 分支根目录部署方式仍然适用。部署前先构建，再提交源码及构建产物。

React Bits 的固定来源版本与修改记录见 `src/react-bits/README.md`，许可证保存在该目录和 `assets/licenses/` 中。Inter 字体采用 OFL 许可证。

## 设计记录

本地设计记录与截图保存在 `.hallmark/`，不提交到仓库。页面保留全部 66 则讨论、原有成员机构资料与链接。活动列表表达待组织的方向，没有新增虚构活动日期或成员背书。

图片区域按后续要求预留了空位，没有使用库存照片。将图片放进 `assets/media/`，在 `src/media-content.json` 填入如 `"src": "assets/media/rsi.webp"` 并补充 `alt`，再运行构建。研究方向图片建议 6:5（至少 1200×1000），活动图片建议 2:1（至少 1800×900），手机端按 5:4 居中裁切。桌面研究区固定图文画面，随滚动切换六个章节，也可点击编号或前后按钮切换。活动区将纵向滚动转换为横向画廊，支持直接选项和左右键；手机端使用原生横向滑动。系统减少动态效果设置及较矮的窗口会使用普通文档与可滚动画廊，不固定整屏。

页面介绍、话题说明、活动、日报和加入文案经过 Humanizer 润色，采用简短、客观的官网口吻。章节标题使用 ScrollFloat 随滚动逐字显现，讨论条目附有悬停划线及展开反馈；图片切换带叠层位移和镜头推进，指针移动会产生倾斜与反光。减少动态效果设置会关闭这些位移与透视动画；禁用脚本时仍可阅读正文。原有 66 则讨论摘录与机构资料保留。AGI House 仅作为内容类别的参考，没有采用它的布局、视觉元素或动效设计。

本轮正文采用章节式图文布局：研究区的图片与说明同步翻页，活动区横向展开，讨论区为主摘录搭配两篇短摘录的非对称版面。讨论直接呈现问题、观点及小结，完整交流内容可展开阅读；保留原有筛选和分页。研究区与讨论区之间的描边字随滚动横移。

研究区的图文随滚动推进并转正，图片切换以轻微透视和局部推近衔接。活动画廊的相邻画面带有角度和缩放差异，图片内部缓慢横移；讨论摘录按不同距离错层移动。正文介绍和日报使用细线轨道与轻微推进。手机端减少大幅透视，保留图片切换和原生横向浏览。日夜主题覆盖正文、图片空位、机构标识、ASCII 双手与星系，十个图片位置继续留空。

小交互参考 Amicro：菜单使用弹簧图标切换，分页图标有轻微磁吸回弹，链接使用箭头滑入与文字滚动。上游来源、适配说明及 MIT 许可保留在 `src/amicro/`，公开许可同时随构建导出。字标来源及 SIL Open Font License 保留在 `src/brand/`。
