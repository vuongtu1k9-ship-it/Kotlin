export const SOCIAL_LINKS = {
  facebook: {
    page: 'https://web.facebook.com/cotuong.xyz',
    group: 'https://web.facebook.com/groups/cotuong.xyz',
  },
  youtube: {
    channel: 'https://www.youtube.com/@cotuongxyz', // Placeholder/Predicted
  },
  tiktok: {
    profile: 'https://www.tiktok.com/@cotuongtoday', // Updated by Director
  },
  instagram: {
    profile: '#', // Pending correct link from Director
  },
  x: {
    profile: '#', // Pending correct link from Director
  },
  email: 'choicotuongtoday@gmail.com',
};

export const SHARE_URLS = {
  facebook: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  twitter: (url: string, text: string) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
};
