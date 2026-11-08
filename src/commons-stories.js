// Read alongside the numbered archive records. These short turns reorganize
// their documented arguments, not verbatim member messages or a live chat.
// Questions and unresolved conclusions are rendered directly from the archive.
export const COMMONS_STORIES = [
  {
    id: 'benchmark', label: 'Benchmark 复现', discussionId: 59,
    // Terms from the discussion that drift into its braid on the homepage.
    terms: ['TB2', 'timeout', 'token', 'prompt', 'harness', 'skill', 'BrowseComp', 'trajectories', 'leaderboard'],
    turns: [
      { label: '复现时遇到的问题', text: 'TB2 得对齐 timeout、资源和 token 上限；BrowseComp 的 prompt，还要从 tech report 里找。' },
      { label: '另一位群友的质疑', text: '把 skill 塞进自己的 harness 刷分，换到第三方榜单，成绩就可能对不上。只看分数，怎么判断？' },
    ],
    en: {
      label: 'Benchmarks', question: 'Can we reproduce the agent scores in those reports?',
      turns: [
        { label: 'What reproduction involves', text: 'TB2 needs matching timeouts, resources and token limits. For BrowseComp, even the prompt has to be pieced together from the technical report.' },
        { label: 'Another member’s concern', text: 'Skills tuned for an in-house harness can inflate the score. Move to an independent leaderboard and the numbers may no longer hold up.' },
      ],
      conclusion: 'One proposal: release trajectories that reproduce the scores reported in the blog posts.',
    },
  },
  {
    id: 'projects', label: '项目与交接', discussionId: 47,
    terms: ['handover', 'agent', 'code', 'maintainer', 'knowledge', 'author', 'organization'],
    turns: [
      { label: '担心的是长期维护', text: '关键知识只在一个人和外部 Agent 手里，代码资产就可能脱离组织。换个人，项目还能继续吗？' },
      { label: '另一方提出的条件', text: '项目要完备到不需要原作者讲解，别人也能指挥 Agent 接手。一个人维护的优势，才不至于变成交接的风险。' },
    ],
    en: {
      label: 'Project handover', question: 'Can one person and AI maintain the core of a large project?',
      turns: [
        { label: 'The concern is long-term maintenance', text: 'If critical knowledge lives with one person and an external agent, the organization can lose control of its code. Can someone else take over?' },
        { label: 'A condition from the other side', text: 'The project needs to be complete enough for a new maintainer to direct an agent without the original author explaining it. Handover has to work.' },
      ],
      conclusion: 'A handover condition was proposed. Whether it resolves the concern about organizational stability remains unanswered.',
    },
  },
  {
    id: 'commons', label: '人的注意力', discussionId: 7,
    terms: ['parallel', 'notes', 'batch', 'judgment', 'background', 'agents', 'research', 'experiments'],
    turns: [
      { label: '做研究的群友', text: '科研品味超出模型能力时，人就得一直盯着。简单任务可以放后台，需要判断的事情，没法无限并行。' },
      { label: '另一位群友的实践', text: '试下来，两个任务并行，加上手写记录，效率最高。也有人只让多个 Agent 批量跑补实验。' },
    ],
    en: {
      label: 'Attention', question: 'Can human attention keep up with a room full of agents?',
      turns: [
        { label: 'A researcher’s experience', text: 'When research judgment exceeds the model’s ability, someone has to keep watching. Simple tasks can run in the background; judgment does not scale that way.' },
        { label: 'What worked for another member', text: 'Two parallel tasks with handwritten notes worked best. Others only use multiple agents to batch-run supplementary experiments.' },
      ],
      conclusion: 'People have different limits. Whether many agents working on the same task help is still an open question.',
    },
  },
];
