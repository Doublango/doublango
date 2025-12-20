// Language data with all 42 supported languages
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  difficulty: 'easy' | 'medium' | 'hard';
  speakers: string;
}

export const LANGUAGES: Language[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', difficulty: 'easy', speakers: '500M+' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', difficulty: 'easy', speakers: '280M+' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', difficulty: 'medium', speakers: '130M+' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', difficulty: 'hard', speakers: '125M+' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', difficulty: 'easy', speakers: '85M+' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', difficulty: 'hard', speakers: '77M+' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', difficulty: 'hard', speakers: '1.1B+' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', difficulty: 'easy', speakers: '260M+' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', difficulty: 'hard', speakers: '255M+' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', difficulty: 'hard', speakers: '420M+' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', difficulty: 'medium', speakers: '80M+' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', difficulty: 'medium', speakers: '25M+' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', difficulty: 'medium', speakers: '10M+' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪', difficulty: 'hard', speakers: '1.7M+' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', difficulty: 'hard', speakers: '45M+' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', difficulty: 'hard', speakers: '600M+' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', difficulty: 'hard', speakers: '9M+' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', difficulty: 'hard', speakers: '85M+' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', difficulty: 'hard', speakers: '13M+' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', difficulty: 'medium', speakers: '5M+' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', difficulty: 'medium', speakers: '6M+' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', difficulty: 'medium', speakers: '26M+' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', difficulty: 'hard', speakers: '5M+' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', difficulty: 'hard', speakers: '10M+' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', difficulty: 'hard', speakers: '45M+' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', difficulty: 'hard', speakers: '750K+' },
  { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', difficulty: 'hard', speakers: '60K+' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', difficulty: 'hard', speakers: '13M+' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa', flag: '🇮🇩', difficulty: 'easy', speakers: '200M+' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🌺', difficulty: 'hard', speakers: '24K+' },
  { code: 'nv', name: 'Navajo', nativeName: 'Diné bizaad', flag: '🏜️', difficulty: 'hard', speakers: '170K+' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', difficulty: 'medium', speakers: '100M+' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', flag: '🌍', difficulty: 'easy', speakers: '2M+' },
  { code: 'val', name: 'High Valyrian', nativeName: 'Valyrio', flag: '🐉', difficulty: 'hard', speakers: 'Fantasy' },
  { code: 'tlh', name: 'Klingon', nativeName: 'tlhIngan Hol', flag: '🖖', difficulty: 'hard', speakers: 'Sci-Fi' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', flag: '🏛️', difficulty: 'hard', speakers: 'Classical' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', flag: '✡️', difficulty: 'hard', speakers: '1.5M+' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl ayisyen', flag: '🇭🇹', difficulty: 'medium', speakers: '12M+' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', difficulty: 'hard', speakers: '12M+' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇱🇰', difficulty: 'hard', speakers: '75M+' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🏴', difficulty: 'medium', speakers: '10M+' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', difficulty: 'hard', speakers: '60M+' },
];

export const DAILY_GOALS = [
  { xp: 10, label: 'Casual', description: '5 minutes a day', icon: '🌱' },
  { xp: 20, label: 'Regular', description: '10 minutes a day', icon: '📚' },
  { xp: 30, label: 'Serious', description: '15 minutes a day', icon: '💪' },
  { xp: 50, label: 'Intense', description: '20+ minutes a day', icon: '🔥' },
];

export const MOTIVATIONS = [
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'career', label: 'Career', icon: '💼' },
  { id: 'culture', label: 'Culture', icon: '🎭' },
  { id: 'brain', label: 'Brain Training', icon: '🧠' },
  { id: 'family', label: 'Family/Friends', icon: '👨‍👩‍👧‍👦' },
  { id: 'school', label: 'School', icon: '🎓' },
  { id: 'fun', label: 'Just for Fun', icon: '🎉' },
  { id: 'other', label: 'Other', icon: '✨' },
];