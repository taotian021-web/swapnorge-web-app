
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
      title: 'Legg ut gjenstand',
      uploadTitle: 'Last opp bilder',
      uploadDesc: 'Last opp minst 1 bilde, maks 9. Tydelige bilder øker sjansen for bytte.',
      uploadHint: 'Klikk for å laste opp eller dra bilder hit',
      uploadLimit: 'Støtter JPG, PNG, WebP (Maks 5MB)',
      itemTitle: 'Tittel',
      itemTitlePlaceholder: 'F.eks. Helt ny sommerkjole til barn',
      description: 'Detaljert beskrivelse',
      descriptionPlaceholder: 'Beskriv tilstand, merke, størrelse...',
      category: 'Kategori',
      status: 'Tilstand',
      pointsLabel: 'Ønskede byttepoeng',
      rewardTip: '💡 Nye innlegg gir +20 poeng i bonus',
      publish: 'Publiser gjenstand',
      cancel: 'Avbryt',
      success: 'Gjenstanden er lagt ut!',
      process: {
        title: 'Etter publisering:',
        step1: '1. Systemet genererer en QR-kode',
        step2: '2. Mottaker skanner for å bekrefte bytte',
        step3: '3. Poeng overføres automatisk',
      }
    },
    profile: {
      balance: 'Dine poeng',
      reputation: 'Rykte',
      swaps: 'Bytter fullført',
      myItems: 'Mine gjenstander',
      history: 'Historikk',
      loginPrompt: 'Logg inn for å begynne å bytte!',
      noPosts: 'Du har ikke lagt ut noen gjenstander ennå.',
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
      new: 'Helt ny',
      likeNew: 'Som ny',
      good: 'God stand',
      fair: 'Brukt',
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
      title: 'Post Item',
      uploadTitle: 'Upload Photos',
      uploadDesc: 'Upload at least 1 photo, up to 9. Clear photos increase swap success.',
      uploadHint: 'Click to upload or drag photos',
      uploadLimit: 'Supports JPG, PNG, WebP (Max 5MB)',
      itemTitle: 'Item Title',
      itemTitlePlaceholder: 'e.g. Brand new kids summer dress',
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
      noPosts: 'You haven\'t posted any items yet.',
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
      good: 'Good Condition',
      fair: 'Fair',
    }
  }
};

export function getTranslations(lang: Language = 'no') {
  return translations[lang] || translations.no;
}
