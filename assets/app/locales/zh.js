export default {
  page: {
    title: 'Moe Counter! · 网站访问计数器',
    description: '用一张图片在项目说明、博客或网页中显示访问次数，支持 {count} 种主题。'
  },
  common: {
    skip: '跳转到正文',
    language: '语言',
    decrease: '减小{field}',
    increase: '增大{field}',
    copy: '复制',
    copied: '已复制',
    copyLabel: '复制这段代码',
    noOptions: '没有找到匹配的选项。'
  },
  appearance: {
    switchToLight: '切换为浅色模式',
    switchToDark: '切换为深色模式'
  },
  nav: {
    home: 'Moe Counter! — 回到顶部',
    source: '源代码',
    label: '主导航',
    usage: '开始使用',
    config: '设置',
    themes: '主题',
    credits: '致谢',
    top: '回到顶部'
  },
  hero: {
    note: '换个主题，看看效果。',
    kicker: '网站访问计数器',
    line1: '每一次访问，',
    line2: '都有',
    accent: '记录。',
    intro: '在项目说明、博客或网页中显示访问次数。',
    detail: '只需一个图片链接，支持 {count} 种主题。',
    start: '创建计数器',
    browse: '查看主题',
    sparkle: '显示星光效果',
    preview: {
      label: '主题预览',
      status: '示例',
      alt: '{theme} 计数器，显示 0123456789'
    },
    facts: {
      themes: '{count} 种主题',
      svg: 'SVG 图片',
      openSource: '开源项目'
    },
    shuffle: '换一个主题'
  },
  usage: {
    title: '把计数器放到页面上。',
    note: '三种嵌入方式',
    intro: '将 :name 替换为你的计数器名称，再复制需要的格式。首次访问时会自动创建计数器。',
    methods: {
      url: {
        title: '图片地址',
        description: '直接使用图片链接，适用于支持图片地址的地方。'
      },
      html: {
        title: 'HTML',
        description: '把这段图片代码插入网页即可。'
      },
      markdown: {
        title: 'Markdown',
        description: '适用于 GitHub 个人主页、项目说明和 Markdown 文档。'
      }
    },
    name: {
      title: '请使用独特的名称',
      description: '相同名称会共用访问次数。请使用不容易与他人重复的名称，例如域名，或用户名加仓库名，最多 32 个字符。'
    }
  },
  config: {
    title: '设置你的计数器。',
    note: '设置与预览',
    intro: '选择主题并调整显示效果。修改后会自动更新预览，不会影响实际访问次数。',
    sections: {
      basic: {
        title: '基本设置'
      },
      advanced: {
        title: '更多设置',
        description: '可以显示固定数字，或在计数前添加数字。普通访问计数保持默认即可。'
      }
    },
    fields: {
      name: {
        label: '计数器名称',
        hint: '用于保存访问次数，最多 32 个字符。',
        placeholder: '例如 my-blog',
        error: '请先填写计数器名称。'
      },
      theme: {
        label: '主题',
        hint: '选择一个主题，或在每次访问时随机选择。'
      },
      padding: {
        label: '最小位数',
        hint: '不足设定位数时，在前面补零。'
      },
      offset: {
        label: '数字间距',
        hint: '调整数字之间的距离，负值可缩小间距。'
      },
      scale: {
        label: '缩放比例',
        hint: '调整图片大小，范围为 0.1 到 2 倍。'
      },
      align: {
        label: '对齐方式',
        hint: '设置不同高度数字的对齐位置。'
      },
      pixelated: {
        label: '保留像素边缘',
        hint: '放大时保留像素画的清晰边缘，不做平滑处理。'
      },
      darkmode: {
        label: '深色模式',
        hint: '深色模式下调低图片亮度，自动模式跟随访客的系统设置。'
      },
      num: {
        label: '固定数字',
        hint: '用固定数字代替访问次数，设为 0 时恢复正常计数。'
      },
      prefix: {
        label: '数字前缀',
        hint: '在访问次数前添加这些数字，留空时不添加。'
      }
    },
    options: {
      random: '随机主题',
      align: {
        top: '顶部',
        center: '居中',
        bottom: '底部'
      },
      darkmode: {
        '0': '关闭',
        '1': '开启',
        auto: '自动'
      }
    },
    preview: {
      title: '实时预览',
      empty: '填写名称后，这里会显示预览。',
      alt: '计数器预览',
      safe: '预览不会增加实际访问次数。'
    },
    reset: '重置',
    generate: '生成链接',
    embed: '嵌入链接'
  },
  toast: {
    reset: '已恢复默认设置。',
    theme: '已选用主题：{name}',
    copied: '已复制到剪贴板。',
    copyError: '复制失败，请选中文本后手动复制。',
    generated: '链接已生成。'
  },
  themes: {
    title: '选一个喜欢的主题。',
    note: '{count} 种主题',
    intro: '点击使用主题，就会应用到上方的设置中。',
    search: {
      label: '搜索主题',
      placeholder: '输入主题名称…'
    },
    filters: '主题分类',
    all: '全部',
    groups: {
      imageboard: '图片网站',
      numeric: '数字',
      original: '原版',
      illustration: '插画与角色',
      animated: '动态'
    },
    showing: '第 {start}–{end} 个，共 {total} 个主题',
    selected: '已选用',
    use: '使用主题',
    preview: {
      alt: '{name} 主题预览',
      failed: '预览暂不可用'
    },
    empty: '没有找到匹配的主题，请换个关键词或分类。',
    clearFilters: '清除筛选',
    resultsCount: '{count} 个主题',
    pagination: {
      label: '主题分页',
      summary: '第 {page} / {pages} 页',
      previous: '上一页',
      next: '下一页',
      goToPage: '前往第 {page} 页'
    },
    animated: '动态'
  },
  credits: {
    title: '感谢每一位贡献者。',
    note: '致谢',
    contributors: '以及所有主题创作者'
  },
  sponsor: {
    eyebrow: '支持这个项目',
    title: '支持项目持续运行。',
    description: 'Moe Counter 每月处理超过 1000 万次请求。你的赞助将帮助支付服务器费用，让服务持续运行。',
    afdian: '爱发电',
    close: '关闭赞助横幅'
  },
  footer: {
    description: '为网站记录访问次数。也可以部署到自己的服务器上，自行管理数据。',
    license: '采用 MIT 许可证，主题素材除外。',
    communityThemes: '{count} 种主题，由社区提供。',
    nav: '页脚导航',
    contribute: '贡献主题'
  }
}
