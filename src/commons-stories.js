// English readings of three archived discussions, keyed by their archive number. The homepage sky shows every
// discussion in its original Chinese; on the English page these three are shown in translation. The ideas
// reorganize each discussion's documented arguments; they are not verbatim member messages.
export const DISCUSSION_TRANSLATIONS = {
  59: {
    tag: 'Benchmarks',
    question: 'Can we reproduce the agent scores in those reports?',
    ideas: [
      'TB2 needs matching timeouts, resources and token limits. For BrowseComp, even the prompt has to be pieced together from the technical report.',
      'Skills tuned for an in-house harness can inflate the score. Move to an independent leaderboard and the numbers may no longer hold up.',
    ],
    conclusion: 'One proposal: release trajectories that reproduce the scores reported in the blog posts.',
  },
  47: {
    tag: 'Project handover',
    question: 'Can one person and AI maintain the core of a large project?',
    ideas: [
      'If critical knowledge lives with one person and an external agent, the organization can lose control of its code. Can someone else take over?',
      'The project needs to be complete enough for a new maintainer to direct an agent without the original author explaining it. Handover has to work.',
    ],
    conclusion: 'A handover condition was proposed. Whether it resolves the concern about organizational stability remains unanswered.',
  },
  7: {
    tag: 'Attention',
    question: 'Can human attention keep up with a room full of agents?',
    ideas: [
      'When research judgment exceeds the model’s ability, someone has to keep watching. Simple tasks can run in the background; judgment does not scale that way.',
      'Two parallel tasks with handwritten notes worked best. Others only use multiple agents to batch-run supplementary experiments.',
    ],
    conclusion: 'People have different limits. Whether many agents working on the same task help is still an open question.',
  },
};
