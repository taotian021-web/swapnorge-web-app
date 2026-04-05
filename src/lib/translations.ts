
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
      title: 'Legg ut noe nytt',
      itemTitle: 'Hva vil du bytte bort?',
      description: 'Beskriv gjenstanden',
      points: 'Poengpris',
      category: 'Kategori',
      publish: 'Publiser',
      cancel: 'Avbryt',
      success: 'Gjenstanden er lagt ut!',
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
      title: 'Post New Item',
      itemTitle: 'What do you want to swap?',
      description: 'Describe the item',
      points: 'Point Price',
      category: 'Category',
      publish: 'Publish',
      cancel: 'Cancel',
      success: 'Item posted successfully!',
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
    }
  }
};

export function getTranslations(lang: Language = 'no') {
  return translations[lang] || translations.no;
}
