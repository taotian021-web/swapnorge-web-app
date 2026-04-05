
export type Language = 'no' | 'en';

const translations = {
  no: {
    app: {
      name: 'SwapNorge',
      tagline: 'Bytt det du ikke bruker. Få det du trenger.',
    },
    header: {
      searchPlaceholder: 'Søk etter møbler, klær, bøker...',
      notifications: 'Varsler',
    },
    footer: {
      home: 'Hjem',
      search: 'Søk',
      post: 'Bytt',
      activity: 'Aktivitet',
      profile: 'Profil',
    },
    home: {
      title: 'Populært nå',
      categories: 'Kategorier',
      noItems: 'Ingen gjenstander funnet. Prøv et annet søk!',
    },
    item: {
      points: 'Poeng',
      location: 'Sted',
      condition: 'Tilstand',
      seller: 'Selger',
      swapButton: 'Send forespørsel',
      contactButton: 'Kontakt selger',
    },
    post: {
      title: '发布物品',
      uploadTitle: '上传图片',
      uploadDesc: '上传至少1张图片，最多9张。清晰的图片会增加交换成功率。',
      uploadHint: '点击上传或拖拽图片',
      uploadLimit: '支持 JPG, PNG, WebP (最大 5MB)',
      itemTitle: '物品标题',
      itemTitlePlaceholder: '例如：全新童装连衣裙',
      description: '详细描述',
      descriptionPlaceholder: '描述物品的状态、品牌、尺寸等细节...',
      category: '类目',
      status: '状态',
      pointsLabel: '要求交换点数',
      rewardTip: '💡 新发布物品享受 +20 积分奖励',
      publish: '发布物品',
      cancel: '取消',
      success: 'Gjenstanden er lagt ut!',
      process: {
        title: '发布成功后：',
        step1: '1. 系统自动生成 QR 码',
        step2: '2. 买家扫码确认交换',
        step3: '3. 积分自动划转完成',
      }
    },
    profile: {
      balance: 'Dine poeng',
      reputation: 'Rykte',
      swaps: 'Bytter fullført',
      myItems: 'Mine gjenstander',
      history: 'Historikk',
      loginPrompt: 'Logg inn for å begynne å bytte!',
    },
    categories: {
      Elektronikk: 'Elektronikk',
      Klær: 'Klær',
      Hjem: 'Hjem og hage',
      Bøker: 'Bøker',
      Sport: 'Sport og fritid',
      Annet: 'Annet',
    },
    conditions: {
      new: '全新',
      likeNew: '几乎全新',
      good: '良好',
      fair: '一般',
    }
  },
  en: {
    app: {
      name: 'SwapNorge',
      tagline: 'Swap what you don\'t use. Get what you need.',
    },
    header: {
      searchPlaceholder: 'Search for furniture, clothes, books...',
      notifications: 'Notifications',
    },
    footer: {
      home: 'Home',
      search: 'Search',
      post: 'Swap',
      activity: 'Activity',
      profile: 'Profile',
    },
    home: {
      title: 'Popular now',
      categories: 'Categories',
      noItems: 'No items found. Try another search!',
    },
    item: {
      points: 'Points',
      location: 'Location',
      condition: 'Condition',
      seller: 'Seller',
      swapButton: 'Send Request',
      contactButton: 'Contact Seller',
    },
    post: {
      title: 'Publish Item',
      uploadTitle: 'Upload Photos',
      uploadDesc: 'Upload at least 1 photo, up to 9. Clear photos increase swap success.',
      uploadHint: 'Click to upload or drag photos',
      uploadLimit: 'Supports JPG, PNG, WebP (Max 5MB)',
      itemTitle: 'Item Title',
      itemTitlePlaceholder: 'e.g. Brand new kids dress',
      description: 'Detailed Description',
      descriptionPlaceholder: 'Describe item status, brand, size...',
      category: 'Category',
      status: 'Condition',
      pointsLabel: 'Requested Swap Points',
      rewardTip: '💡 New listings enjoy +20 points reward',
      publish: 'Publish Item',
      cancel: 'Cancel',
      success: 'Item posted successfully!',
      process: {
        title: 'After publishing:',
        step1: '1. System auto-generates QR code',
        step2: '2. Buyer scans to confirm swap',
        step3: '3. Points transferred automatically',
      }
    },
    profile: {
      balance: 'Your Points',
      reputation: 'Reputation',
      swaps: 'Swaps Completed',
      myItems: 'My Items',
      history: 'History',
      loginPrompt: 'Log in to start swapping!',
    },
    categories: {
      Elektronikk: 'Electronics',
      Klær: 'Clothing',
      Hjem: 'Home & Garden',
      Bøker: 'Books',
      Sport: 'Sport & Leisure',
      Annet: 'Other',
    },
    conditions: {
      new: 'Brand New',
      likeNew: 'Like New',
      good: 'Good',
      fair: 'Fair',
    }
  }
};

export function getTranslations(lang: Language = 'no') {
  return translations[lang] || translations.no;
}
