# V86 · 赛博社群空间

这是首页第三段：人和不同形态的 Agent 在共享空间里讨论 Benchmark、项目交接和人的注意力。保留协作面板、桌边交流、视角探索与档案入口。场景没有地球或湿实验台；人物是创作形象，不代表真实成员。

## 内容与组件

- `CommunityIdentity.jsx`、`community-identity.css`：场景标题、简介、讨论与共建入口。
- `CyberCommons.jsx`、`cyber-commons.css`：渐进加载、对话、议题切换、视角按钮、全屏和来源导航。
- `commons-stories.js`：三个议题对应原始讨论 59、47、7。中文问题与结论直接读取档案，两轮文字整理已有观点，英文为对应翻译。没有虚构实时聊天、成员姓名或已完成的项目成果。
- `community-world.js`：Agent、协作面板、相机、点选、按需绘制和资源清理。
- `community-actors.js`：Quaternius 人物、骨骼、配色、交谈姿态及手臂逆运动学。
- `community-atmosphere.js`：深色空间背景、地面和路径。当前场景不导入 `community-earth.js`，也不请求地球纹理。

桌面标题位于左侧，讨论在右上，人物位于其下方；视角按钮放在标题一侧，避开角色。900px 以下使用对话、人物、标题依次排列的构图，场景高度至少 1160px，保证较长英文对话和窄屏空间。手指可以原生纵向滚动页面。

## 姿态与交互

所有人物的头部朝向固定。导入模型保留身体和手臂动作，但每次采样后将头部恢复为相对人物的固定方向，同时抵消父骨骼带来的旋转。几何后备人物也没有转头动画。机器人头部、身体与圆球的位置和朝向固定，仅保留眨眼等细节。

可点选人物或 Agent，拖动探索；议题按钮切换到对应预设镜头。复位和切换前清除 OrbitControls 遗留阻尼。按钮支持旋转、缩放、复位、暂停与全屏。从全屏打开来源时先退出全屏，再跳转至 `community.html#discussion-N`。

减少动态效果时默认暂停，镜头直接切换。离屏、后台和主动暂停时停止持续绘制。调度上限为 30 fps，并非实测帧率；负载高时自动暂停，主动点击播放可覆盖本次访问的自动暂停。软件渲染测试不代表实际硬件帧率。

## 素材与渲染

两份具体的 Quaternius Casual Character、Animated Woman 存档采用 CC0，来源和原始/裁剪哈希见 `assets/characters/sources.json` 与 `assets/licenses/quaternius-characters.txt`。环境光为 Poly Haven CC0 Studio Small 08，许可见 `assets/licenses/polyhaven-studio-small-08.txt`。人物与环境光保留本地后备方案。

场景使用 Three.js r180、PMREM、RenderPass、适量 Bloom 和 OutputPass。半浮点缓冲、2 倍 MSAA、最高 1.35 像素比；静态几何合批，人物保留骨骼资源。相关材质、几何、环境贴图与监听器在销毁时释放。

WebGL 不可用或上下文丢失时，显示由同一场景导出的 WebP；讨论、议题选择及来源链接继续可用。无脚本时保留静态场景、初始对话及三组档案入口。

## 更新静态后备图

```sh
python3 -I scripts/render-community-world.py
npm run build
```

导出器需要项目 npm 依赖、Pillow、Python Playwright 和 Chromium；普通网站构建不需要这些额外工具。它以关闭动画的生产镜头导出桌面 1600×900 和手机 390×1160 构图，输出 `assets/community-world.webp` 与 `assets/community-world-mobile.webp`。

修改人物动作后，应在多个动画时间检查世界坐标中的头部朝向，同时覆盖模型加载失败的后备人物。修改相机或排版后，应检查中英文三组对话、角色遮挡、控制按钮、全屏、无 WebGL、上下文恢复及更新后的静态图。
