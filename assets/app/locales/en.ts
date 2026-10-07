export default {
  rank: {
    page: { title: 'Rank · Moe Counter!', description: 'Counter rankings, referring websites and request traffic for Moe Counter.' },
    kicker: 'MOE COUNTER / SERVICE ACTIVITY', title: 'Counter rankings',
    intro: 'Top 100 counters and referring websites',
    home: 'Back to home', loading: 'Updating statistics…', updated: 'Updated {time}', refreshNote: 'Updates every minute', refresh: 'Refresh',
    error: 'Unable to load statistics', stale: 'Refresh failed · showing previous data',
    siteRpm: 'Site request rate', rpmNote: '5-minute average',
    site24h: '24h requests', siteNote: 'Total over the last 24 hours',
    unknown: 'Unknown sources', unknownNote: '{total} all time · {rpm} RPM',
    warming: 'Collecting data',
    counters: 'Counters',
    sources: 'Referring websites',
    position: 'Position', id: 'Counter ID', hostname: 'Hostname', total: 'All time', empty: 'No data yet',
    topNote: 'TOP 100', boards: 'Most active', sort: 'Ranking order',
    sort_rpm: 'By RPM', sort_24h: 'By 24h calls', sort_total: 'By all time',
    external: {
      kicker: 'EXTERNAL WEBSITE / SAFETY NOTICE', title: 'You are leaving Moe Counter!',
      intro: 'You are about to visit a third-party website in a new tab.', destination: 'Destination',
      listingTitle: 'A ranking is not a safety certification',
      listing: 'Rankings are based on request referrer information, which can be forged. A listing does not imply endorsement, recommendation or a safety guarantee by Moe Counter.',
      riskTitle: 'Protect your personal information and money',
      risk: 'Third-party websites may contain phishing, scams, malicious downloads or inappropriate content. Verify the address, be cautious about sign-in, payment and download requests, and never disclose passwords, verification codes or other sensitive information.',
      disclaimer: 'The website is independently operated and subject to its own terms and privacy policy. Moe Counter does not guarantee the accuracy, safety or availability of its content or services and, to the extent permitted by applicable law, is not liable for losses arising from visiting or using it. Assess the risks before continuing.',
      cancel: 'Stay here', continue: 'Understand risks and continue'
    },
    chart: {
      kicker: 'SITE REQUESTS / TRAFFIC', title: 'Request traffic',
      minute_24h: '24h · minutes', hour_24h: '24h · hours', hour_7d: '7 days · hours',
      perMinute: 'Requests / minute', perHour: 'Requests / hour',
      description: 'Counter request traffic',
      empty: 'No data yet', missing: 'No data', requests: '{count} requests'
    },
    geo: {
      kicker: 'REQUEST SOURCES / AUDIENCE', title: 'Countries and regions',
      language: 'Browser language',
      emptyGeo: 'No data yet', emptyLanguage: 'No data yet', share: 'Share',
      mapLoading: 'Loading map…', mapError: 'Map is temporarily unavailable', mapDescription: 'Lifetime requests by country and region',
      noRegionData: 'No data for this region',
      pagination: {
        label: 'Browser language pages',
        summary: 'Page {page} of {pages}',
        previous: 'Previous page',
        next: 'Next page',
        goToPage: 'Go to page {page}'
      }
    }
  },
  view: {
    page: { title: '{name} · Moe Counter!', description: 'Visit count and request trend for the counter {name}.' },
    kicker: 'Counter detail',
    intro: 'Total visits and the recent request trend for {name}.',
    rank: 'View rankings', loading: 'Updating statistics…', updated: 'Updated {time}', refreshNote: 'Updates every minute', refresh: 'Refresh',
    error: 'Could not load', stale: 'Refresh failed · showing the last data',
    total: 'Total visits', totalNote: 'Counted since the counter was created',
    calls24h: 'Calls in 24h', callsNote: 'Total over the last 24 hours',
    rank24h: '24h call rank', rank24hNote: 'Position among all counters', unranked: 'Not ranked',
    warming: 'Still collecting, the 24 hour range is not complete yet',
    chart: {
      kicker: 'Request trend', title: 'Calls per 5 minutes',
      perMinute: 'Requests / 5 min', description: 'Line chart of how often this counter is called every 5 minutes',
      empty: 'No data yet', missing: 'No data', requests: '{count} requests'
    }
  },
  page: {
    title: 'Moe Counter! · A visitor counter for your website',
    description: 'An image-based visitor counter for your README, blog or website, with {count} themes to choose from.'
  },
  common: {
    language: 'Language',
    decrease: 'Decrease {field}',
    increase: 'Increase {field}',
    copy: 'Copy',
    copied: 'Copied',
    copyLabel: 'Copy this code',
    noOptions: 'No matching options.'
  },
  appearance: {
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode'
  },
  nav: {
    rank: 'Rank',
    home: 'Moe Counter! — Back to top',
    source: 'GitHub',
    label: 'Main navigation',
    usage: 'Get started',
    config: 'Customize',
    themes: 'Themes',
    credits: 'Credits',
    top: 'Back to top'
  },
  hero: {
    notes: [
      'Try a theme. See how it looks.',
      'Swap in your own name and it works.',
      'Looks right at home in a README.',
      'Pick a number style you like.',
      'One visit, one number.'
    ],
    kicker: 'VISITOR COUNTER',
    line1: 'Every visit.',
    line2: 'Make it ',
    accent: 'count.',
    intro: 'Display visits on your README, blog or website.',
    detail: 'One image link, with {count} themes to choose from.',
    start: 'Create your counter',
    browse: 'Explore themes',
    sparkle: 'Add a little sparkle',
    preview: {
      label: 'THEME PREVIEW',
      status: 'PREVIEW',
      alt: '{theme} counter showing 0123456789'
    },
    facts: {
      themes: '{count} themes',
      svg: 'SVG image',
      openSource: 'Open source'
    },
    shuffle: 'Try another theme'
  },
  usage: {
    title: 'Add it to your page.',
    note: 'THREE WAYS TO EMBED',
    intro: 'Replace :name with your counter’s name, then copy the format you need. Your counter is created on the first visit.',
    methods: {
      url: {
        title: 'Image URL',
        description: 'Use the link anywhere an image URL is accepted.'
      },
      html: {
        title: 'HTML',
        description: 'Paste this image tag into your webpage.'
      },
      markdown: {
        title: 'Markdown',
        description: 'For GitHub profiles, READMEs and Markdown pages.'
      }
    },
    name: {
      title: 'Choose a unique name',
      description: 'Counters with the same name share a visit count. Choose a unique name of up to 32 characters, such as your domain or username and repository name.'
    }
  },
  config: {
    title: 'Set up your counter.',
    note: 'SETTINGS & PREVIEW',
    intro: 'Choose a theme and adjust its appearance. The preview updates as you edit, without changing your actual count.',
    sections: {
      basic: {
        title: 'Basic settings'
      },
      advanced: {
        title: 'More options',
        description: 'For displaying a fixed number or adding digits before the count. Leave the defaults for normal visit counting.'
      }
    },
    fields: {
      name: {
        label: 'Counter name',
        hint: 'A unique name for your count. Up to 32 characters.',
        placeholder: 'e.g. my-little-blog',
        error: 'Enter a counter name first.'
      },
      theme: {
        label: 'Theme',
        hint: 'Choose a theme, or pick a random one for each visit.'
      },
      padding: {
        label: 'Minimum digits',
        hint: 'Add leading zeroes to reach this many digits.'
      },
      offset: {
        label: 'Digit spacing',
        hint: 'Space between digits. Negative values bring them closer.'
      },
      scale: {
        label: 'Scale',
        hint: 'Resize your counter, from 0.1× to 2×.'
      },
      align: {
        label: 'Alignment',
        hint: 'Line up digits of different heights.'
      },
      pixelated: {
        label: 'Crisp pixels',
        hint: 'Keep pixel art sharp when enlarged.'
      },
      darkmode: {
        label: 'Dark mode',
        hint: 'Dim in dark mode. Auto follows the viewer’s system.'
      },
      num: {
        label: 'Fixed number',
        hint: 'Show a fixed value instead of counting. Set to 0 to disable.'
      },
      prefix: {
        label: 'Prefix',
        hint: 'Add these digits before the count. Leave blank to disable.'
      }
    },
    options: {
      random: 'Random theme',
      align: {
        top: 'Top',
        center: 'Center',
        bottom: 'Bottom'
      },
      darkmode: {
        '0': 'Off',
        '1': 'On',
        auto: 'Auto'
      }
    },
    preview: {
      title: 'LIVE PREVIEW',
      empty: 'Enter a name to see your counter.',
      alt: 'Preview of your counter',
      safe: 'Just a preview. Your visits are not counted.'
    },
    reset: 'Reset',
    generate: 'Generate link',
    embed: 'EMBED LINK'
  },
  toast: {
    reset: 'Default settings restored.',
    theme: 'Theme selected: {name}',
    copied: 'Copied to clipboard.',
    copyError: 'Could not copy. Please select and copy the text.',
    generated: 'Link generated.'
  },
  themes: {
    title: 'Browse the themes.',
    note: '{count} THEMES',
    intro: 'Choose a theme to apply it to the settings above.',
    search: {
      label: 'Search themes',
      placeholder: 'Find a theme…'
    },
    filters: 'Theme categories',
    all: 'All themes',
    groups: {
      imageboard: 'Booru',
      numeric: 'Numbers',
      original: 'Original',
      illustration: 'Characters',
      animated: 'Animated'
    },
    showing: '{start}–{end} of {total} themes',
    selected: 'Selected',
    use: 'Use theme',
    preview: {
      alt: '{name} theme preview',
      failed: 'Preview unavailable'
    },
    empty: 'No themes found. Try another name or category.',
    clearFilters: 'Clear filters',
    resultsCount: '{count} themes',
    pagination: {
      label: 'Theme pages',
      summary: 'Page {page} of {pages}',
      previous: 'Previous page',
      next: 'Next page',
      goToPage: 'Go to page {page}'
    },
    animated: 'Animated'
  },
  credits: {
    title: 'Thanks to the creators.',
    note: 'CONTRIBUTORS',
    contributors: 'And every theme creator'
  },
  sponsor: {
    eyebrow: 'SUPPORT THE PROJECT',
    title: 'Help keep the service running.',
    description: 'Moe Counter! handles over 10 million requests each month. Your support helps cover server costs and keep the service available.',
    afdian: 'Afdian',
    close: 'Close the support banner'
  },
  footer: {
    requestsPerMinute: 'Currently receiving about {count} requests per minute',
    description: 'A visitor counter for your website. Host it on your own server to manage your data.',
    license: 'MIT License, except for themes.',
    communityThemes: '{count} themes, made by the community.',
    nav: 'Footer navigation',
    contribute: 'Contribute a theme'
  }
}
