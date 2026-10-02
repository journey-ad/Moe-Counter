export default {
  page: {
    title: 'Moe Counter! · サイトのアクセスカウンター',
    description: 'ブログやウェブサイトにアクセス数を表示する画像カウンターです。{count} 種類のテーマから選べます。'
  },
  common: {
    skip: '本文へスキップ',
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
    note: 'いろいろなテーマを試せます。',
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
    description: 'Moe Counter は毎月 1,000 万件以上のリクエストを処理しています。ご支援はサーバー費用に充て、サービスの継続に役立てます。',
    afdian: 'Afdian',
    close: '支援の案内を閉じる'
  },
  footer: {
    description: 'サイトのアクセス数を記録します。自分のサーバーで運用して、データを管理することもできます。',
    license: 'MIT ライセンスで公開しています（テーマ素材を除く）。',
    communityThemes: '{count} 種類のテーマがコミュニティから提供されています。',
    nav: 'フッターナビゲーション',
    contribute: 'テーマを追加する'
  }
}
