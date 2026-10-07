export default {
  rank: {
    page: { title: 'ランキング · Moe Counter!', description: 'カウンターと参照元サイトのランキング、リクエスト数の推移を確認できます。' },
    kicker: 'MOE COUNTER / 利用状況', title: 'カウンターランキング',
    intro: 'カウンターと参照元サイトの Top 100',
    home: 'ホームへ', loading: '統計を更新中…', updated: '更新日時 {time}', refreshNote: '毎分更新', refresh: '更新',
    error: '読み込み失敗', stale: '更新失敗 · 前回のデータを表示',
    siteRpm: '全体のリクエスト速度', rpmNote: '直近 5 分間の平均',
    site24h: '24 時間のリクエスト', siteNote: '直近 24 時間の合計',
    unknown: '参照元不明', unknownNote: '累計 {total} 回 · {rpm} RPM',
    warming: 'データ収集中',
    counters: 'カウンター',
    sources: '参照元サイト',
    position: '順位', id: 'カウンター ID', hostname: 'ホスト名', total: '累計', empty: 'データなし',
    topNote: 'TOP 100', boards: '利用ランキング', sort: 'ランキングの並び順',
    sort_rpm: 'RPM 順', sort_24h: '24h 件数順', sort_total: '累計順',
    external: {
      kicker: '外部サイト / 安全上の注意', title: '外部サイトへ移動します',
      intro: 'Moe Counter! を離れ、新しいタブで第三者のサイトにアクセスします。', destination: 'アクセス先',
      listingTitle: 'ランキングは安全性の認証ではありません',
      listing: 'ランキングはリクエストの参照元情報に基づいており、この情報は偽装される可能性があります。掲載は Moe Counter による承認、推奨、安全性の保証を意味しません。',
      riskTitle: '個人情報と財産を守ってください',
      risk: '第三者のサイトにはフィッシング、詐欺、悪意のあるダウンロード、不適切な内容が含まれる場合があります。URL を確認し、ログイン、支払い、ダウンロードの要求に注意してください。パスワードや認証コードなどの機密情報を開示しないでください。',
      disclaimer: 'リンク先は第三者が独立して運営し、その利用規約とプライバシーポリシーが適用されます。Moe Counter は内容やサービスの正確性、安全性、利用可能性を保証せず、適用法で認められる範囲において、アクセスや利用による損失の責任を負いません。リスクを確認した上で続行してください。',
      cancel: 'このサイトに留まる', continue: 'リスクを理解して続行'
    },
    chart: {
      kicker: '全体のリクエスト / TRAFFIC', title: 'リクエスト推移',
      minute_24h: '24h · 分単位', hour_24h: '24h · 時間単位', hour_7d: '7 日 · 時間単位',
      perMinute: 'リクエスト数 / 分', perHour: 'リクエスト数 / 時間',
      description: 'カウンターのリクエスト推移',
      empty: 'データなし', missing: 'データなし', requests: '{count} リクエスト'
    },
    geo: {
      kicker: 'リクエスト元 / AUDIENCE', title: 'リクエスト元の国と地域',
      language: 'ブラウザの言語',
      emptyGeo: 'データなし', emptyLanguage: 'データなし', share: '割合',
      mapLoading: '地図を読み込み中…', mapError: '地図を読み込めません', mapDescription: '国と地域別の累計リクエスト数',
      noRegionData: 'この地域のデータはありません',
      pagination: {
        label: 'ブラウザ言語のページ',
        summary: '{pages} ページ中 {page}',
        previous: '前のページ',
        next: '次のページ',
        goToPage: '{page} ページ目へ'
      }
    }
  },
  view: {
    page: { title: '{name} · Moe Counter!', description: 'カウンター {name} のアクセス数とリクエストの推移。' },
    kicker: 'カウンターの詳細',
    intro: '{name} の累計アクセス数と最近のリクエスト推移。',
    rank: 'ランキングを見る', loading: '統計を更新中…', updated: '{time} 更新', refreshNote: '1 分ごとに更新', refresh: '更新',
    error: '読み込みに失敗しました', stale: '更新に失敗 · 前回のデータを表示しています',
    total: '累計アクセス', totalNote: 'カウンター作成からの累計回数',
    calls24h: '24 時間の呼び出し数', callsNote: '直近 24 時間の合計',
    rank24h: '24時間の呼び出し数順位', rank24hNote: '全カウンターの中での順位', unranked: '順位なし',
    warming: 'データ収集中です。24 時間の範囲はまだ完全ではありません',
    chart: {
      kicker: 'リクエスト推移', title: '5 分あたりの呼び出し数',
      perMinute: 'リクエスト / 5 分', description: 'このカウンターが 5 分間に何回呼び出されたかの折れ線グラフ',
      empty: 'データがありません', missing: 'データなし', requests: '{count} リクエスト'
    }
  },
  page: {
    title: 'Moe Counter! · サイトのアクセスカウンター',
    description: 'ブログやウェブサイトにアクセス数を表示する画像カウンターです。{count} 種類のテーマから選べます。'
  },
  common: {
    language: '言語',
    decrease: '{field}を減らす',
    increase: '{field}を増やす',
    copy: 'コピー',
    copied: 'コピー済み',
    copyLabel: 'このコードをコピー',
    noOptions: '一致する項目がありません。'
  },
  appearance: {
    switchToLight: 'ライトモードに切り替える',
    switchToDark: 'ダークモードに切り替える'
  },
  nav: {
    rank: 'ランキング',
    home: 'Moe Counter! — ページの先頭へ',
    source: 'ソースコード',
    label: 'メインナビゲーション',
    usage: '使い方',
    config: 'カスタマイズ',
    themes: 'テーマ',
    credits: '協力者',
    top: 'ページの先頭へ'
  },
  hero: {
    notes: [
      'いろいろなテーマを試せます。',
      '名前に変えるだけで使えます。',
      'README に置いてもちょうどいい。',
      '好きな数字のスタイルを選んで。',
      'アクセスひとつ、数字ひとつ。'
    ],
    kicker: 'サイトのアクセスカウンター',
    line1: 'アクセス数を、',
    line2: '画像で',
    accent: '表示。',
    intro: 'ブログやサイトにアクセス数を表示できます。',
    detail: '画像のリンクを貼るだけ。{count} 種類のテーマが使えます。',
    start: 'カウンターを作る',
    browse: 'テーマを見る',
    sparkle: '星のエフェクトを表示',
    preview: {
      label: 'テーマのプレビュー',
      status: '表示例',
      alt: '0123456789 を表示する {theme} カウンター'
    },
    facts: {
      themes: '{count} 種類のテーマ',
      svg: 'SVG 画像',
      openSource: 'オープンソース'
    },
    shuffle: '別のテーマを試す'
  },
  usage: {
    title: 'ページにカウンターを追加。',
    note: '3 つの埋め込み方法',
    intro: ':name をカウンターの名前に置き換えて、必要な形式をコピーしてください。最初のアクセスで自動的に作成されます。',
    methods: {
      url: {
        title: '画像のリンク',
        description: '画像のリンクを指定できる場所で使えます。'
      },
      html: {
        title: 'HTML',
        description: 'ウェブページの HTML に貼り付けて使えます。'
      },
      markdown: {
        title: 'Markdown',
        description: 'GitHub のプロフィールや Markdown 形式のページで使えます。'
      }
    },
    name: {
      title: 'ほかの人と重ならない名前を使ってください',
      description: '同じ名前のカウンターはアクセス数を共有します。ドメイン名や、ユーザー名とリポジトリ名を組み合わせた名前など、ほかの人と重ならない名前を 32 文字以内で指定してください。'
    }
  },
  config: {
    title: 'カウンターを設定。',
    note: '設定とプレビュー',
    intro: 'テーマや表示方法を変更すると、プレビューに反映されます。実際のアクセス数は増えません。',
    sections: {
      basic: {
        title: '基本設定'
      },
      advanced: {
        title: 'その他の設定',
        description: '固定の数字を表示したり、アクセス数の前に数字を追加したりできます。通常は初期設定のまま使えます。'
      }
    },
    fields: {
      name: {
        label: 'カウンター名',
        hint: 'アクセス数を保存するための名前です。32 文字以内で入力してください。',
        placeholder: '例：my-blog',
        error: 'カウンターの名前を入力してください。'
      },
      theme: {
        label: 'テーマ',
        hint: 'テーマを選ぶか、アクセスのたびにランダムに変更できます。'
      },
      padding: {
        label: '最小桁数',
        hint: '桁数が足りない場合は、先頭に 0 を付けます。'
      },
      offset: {
        label: '数字の間隔',
        hint: '数字の間隔を調整します。負の値で狭くできます。'
      },
      scale: {
        label: '表示倍率',
        hint: '画像の大きさを 0.1〜2 倍に変更します。'
      },
      align: {
        label: '数字の位置',
        hint: '高さの異なる数字を揃える位置を指定します。'
      },
      pixelated: {
        label: '輪郭をくっきり表示',
        hint: '拡大したときに、ドット絵の輪郭をぼかさずに表示します。'
      },
      darkmode: {
        label: 'ダークモード',
        hint: 'ダークモードでは画像を暗く表示します。「自動」にすると、端末の設定に合わせます。'
      },
      num: {
        label: '固定の数字',
        hint: 'アクセス数の代わりに指定した数字を表示します。0 で通常のカウントに戻ります。'
      },
      prefix: {
        label: '先頭に付ける数字',
        hint: 'アクセス数の前にこの数字を付けます。空欄の場合は追加しません。'
      }
    },
    options: {
      random: 'ランダム',
      align: {
        top: '上揃え',
        center: '中央揃え',
        bottom: '下揃え'
      },
      darkmode: {
        '0': 'オフ',
        '1': 'オン',
        auto: '自動'
      }
    },
    preview: {
      title: 'プレビュー',
      empty: '名前を入力すると、ここに表示されます。',
      alt: 'カウンターのプレビュー',
      safe: 'プレビューでは実際のアクセス数は増えません。'
    },
    reset: 'リセット',
    generate: 'リンクを作成',
    embed: '埋め込み用リンク'
  },
  toast: {
    reset: '初期設定に戻しました。',
    theme: 'テーマを変更しました：{name}',
    copied: 'コピーしました。',
    copyError: 'コピーできませんでした。文字を選択して手動でコピーしてください。',
    generated: 'リンクを作成しました。'
  },
  themes: {
    title: 'テーマを選ぶ。',
    note: '{count} 種類のテーマ',
    intro: '「このテーマを使う」を押すと、上の設定に反映されます。',
    search: {
      label: 'テーマを検索',
      placeholder: 'テーマ名を入力…'
    },
    filters: 'テーマのカテゴリ',
    all: 'すべて',
    groups: {
      imageboard: '画像サイト',
      numeric: '数字',
      original: 'オリジナル',
      illustration: 'キャラクター',
      animated: 'アニメーション'
    },
    showing: '{total} 件中 {start}〜{end} 件',
    selected: '選択中',
    use: 'このテーマを使う',
    preview: {
      alt: '{name} テーマのプレビュー',
      failed: 'プレビューを表示できません'
    },
    empty: 'テーマが見つかりません。別の名前やカテゴリをお試しください。',
    clearFilters: '絞り込みを解除',
    resultsCount: '{count} 件のテーマ',
    pagination: {
      label: 'テーマのページ',
      summary: '{pages} ページ中 {page} ページ',
      previous: '前のページ',
      next: '次のページ',
      goToPage: '{page} ページへ'
    },
    animated: 'アニメーション'
  },
  credits: {
    title: 'ご協力ありがとうございます。',
    note: '制作への協力',
    contributors: 'テーマを提供してくださった皆さま'
  },
  sponsor: {
    eyebrow: 'プロジェクトへの支援',
    title: '運営へのご支援をお願いします。',
    description: 'Moe Counter! は毎月 1,000 万件以上のリクエストを処理しています。ご支援はサーバー費用に充て、サービスの継続に役立てます。',
    afdian: 'Afdian',
    close: '支援の案内を閉じる'
  },
  footer: {
    requestsPerMinute: '現在、毎分約 {count} 件のリクエストを受信',
    description: 'サイトのアクセス数を記録します。自分のサーバーで運用して、データを管理することもできます。',
    license: 'MIT ライセンスで公開しています（テーマ素材を除く）。',
    communityThemes: '{count} 種類のテーマがコミュニティから提供されています。',
    nav: 'フッターナビゲーション',
    contribute: 'テーマを追加する'
  }
}
