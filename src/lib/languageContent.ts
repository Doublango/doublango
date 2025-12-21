// Comprehensive language content generator for all 42 languages
// Each language has equivalent lesson pools, exercises, and content

import type { Database } from '@/integrations/supabase/types';

type ExerciseType = Database['public']['Enums']['exercise_type'];

export interface LanguagePhrase {
  native: string;
  translation: string;
  pronunciation?: string;
  audio?: string;
}

export interface LanguageVocabulary {
  word: string;
  translation: string;
  category: string;
  pronunciation?: string;
}

export interface LanguageExercise {
  type: ExerciseType;
  question: string;
  correctAnswer: string;
  options?: string[];
  hint?: string;
  audioUrl?: string;
}

// Base phrases that exist for all languages
const BASE_PHRASES: Record<string, string> = {
  hello: 'Hello',
  goodbye: 'Goodbye',
  thank_you: 'Thank you',
  please: 'Please',
  yes: 'Yes',
  no: 'No',
  good_morning: 'Good morning',
  good_night: 'Good night',
  how_are_you: 'How are you?',
  im_fine: "I'm fine",
  my_name_is: 'My name is...',
  nice_to_meet_you: 'Nice to meet you',
  excuse_me: 'Excuse me',
  sorry: 'Sorry',
  water: 'Water',
  food: 'Food',
  help: 'Help',
  where_is: 'Where is...?',
  how_much: 'How much?',
  i_dont_understand: "I don't understand",
};

// Translations for all 42 languages
export const LANGUAGE_CONTENT: Record<string, Record<string, string>> = {
  es: {
    hello: 'Hola',
    goodbye: 'Adiós',
    thank_you: 'Gracias',
    please: 'Por favor',
    yes: 'Sí',
    no: 'No',
    good_morning: 'Buenos días',
    good_night: 'Buenas noches',
    how_are_you: '¿Cómo estás?',
    im_fine: 'Estoy bien',
    my_name_is: 'Me llamo...',
    nice_to_meet_you: 'Mucho gusto',
    excuse_me: 'Disculpe',
    sorry: 'Lo siento',
    water: 'Agua',
    food: 'Comida',
    help: 'Ayuda',
    where_is: '¿Dónde está...?',
    how_much: '¿Cuánto cuesta?',
    i_dont_understand: 'No entiendo',
  },
  fr: {
    hello: 'Bonjour',
    goodbye: 'Au revoir',
    thank_you: 'Merci',
    please: "S'il vous plaît",
    yes: 'Oui',
    no: 'Non',
    good_morning: 'Bonjour',
    good_night: 'Bonne nuit',
    how_are_you: 'Comment allez-vous?',
    im_fine: 'Je vais bien',
    my_name_is: "Je m'appelle...",
    nice_to_meet_you: 'Enchanté',
    excuse_me: 'Excusez-moi',
    sorry: 'Pardon',
    water: 'Eau',
    food: 'Nourriture',
    help: 'Aide',
    where_is: 'Où est...?',
    how_much: "C'est combien?",
    i_dont_understand: 'Je ne comprends pas',
  },
  de: {
    hello: 'Hallo',
    goodbye: 'Auf Wiedersehen',
    thank_you: 'Danke',
    please: 'Bitte',
    yes: 'Ja',
    no: 'Nein',
    good_morning: 'Guten Morgen',
    good_night: 'Gute Nacht',
    how_are_you: 'Wie geht es Ihnen?',
    im_fine: 'Mir geht es gut',
    my_name_is: 'Ich heiße...',
    nice_to_meet_you: 'Freut mich',
    excuse_me: 'Entschuldigung',
    sorry: 'Es tut mir leid',
    water: 'Wasser',
    food: 'Essen',
    help: 'Hilfe',
    where_is: 'Wo ist...?',
    how_much: 'Wie viel kostet das?',
    i_dont_understand: 'Ich verstehe nicht',
  },
  ja: {
    hello: 'こんにちは',
    goodbye: 'さようなら',
    thank_you: 'ありがとう',
    please: 'お願いします',
    yes: 'はい',
    no: 'いいえ',
    good_morning: 'おはようございます',
    good_night: 'おやすみなさい',
    how_are_you: 'お元気ですか？',
    im_fine: '元気です',
    my_name_is: '私の名前は...',
    nice_to_meet_you: 'はじめまして',
    excuse_me: 'すみません',
    sorry: 'ごめんなさい',
    water: '水',
    food: '食べ物',
    help: '助けて',
    where_is: '...はどこですか？',
    how_much: 'いくらですか？',
    i_dont_understand: 'わかりません',
  },
  ko: {
    hello: '안녕하세요',
    goodbye: '안녕히 가세요',
    thank_you: '감사합니다',
    please: '제발',
    yes: '네',
    no: '아니요',
    good_morning: '좋은 아침',
    good_night: '안녕히 주무세요',
    how_are_you: '어떻게 지내세요?',
    im_fine: '잘 지내요',
    my_name_is: '제 이름은...',
    nice_to_meet_you: '만나서 반가워요',
    excuse_me: '실례합니다',
    sorry: '죄송합니다',
    water: '물',
    food: '음식',
    help: '도와주세요',
    where_is: '...이/가 어디에 있나요?',
    how_much: '얼마예요?',
    i_dont_understand: '이해하지 못해요',
  },
  zh: {
    hello: '你好',
    goodbye: '再见',
    thank_you: '谢谢',
    please: '请',
    yes: '是',
    no: '不',
    good_morning: '早上好',
    good_night: '晚安',
    how_are_you: '你好吗？',
    im_fine: '我很好',
    my_name_is: '我叫...',
    nice_to_meet_you: '很高兴认识你',
    excuse_me: '打扰一下',
    sorry: '对不起',
    water: '水',
    food: '食物',
    help: '帮助',
    where_is: '...在哪里？',
    how_much: '多少钱？',
    i_dont_understand: '我不明白',
  },
  it: {
    hello: 'Ciao',
    goodbye: 'Arrivederci',
    thank_you: 'Grazie',
    please: 'Per favore',
    yes: 'Sì',
    no: 'No',
    good_morning: 'Buongiorno',
    good_night: 'Buonanotte',
    how_are_you: 'Come stai?',
    im_fine: 'Sto bene',
    my_name_is: 'Mi chiamo...',
    nice_to_meet_you: 'Piacere',
    excuse_me: 'Scusi',
    sorry: 'Mi dispiace',
    water: 'Acqua',
    food: 'Cibo',
    help: 'Aiuto',
    where_is: "Dov'è...?",
    how_much: 'Quanto costa?',
    i_dont_understand: 'Non capisco',
  },
  pt: {
    hello: 'Olá',
    goodbye: 'Tchau',
    thank_you: 'Obrigado',
    please: 'Por favor',
    yes: 'Sim',
    no: 'Não',
    good_morning: 'Bom dia',
    good_night: 'Boa noite',
    how_are_you: 'Como vai você?',
    im_fine: 'Estou bem',
    my_name_is: 'Meu nome é...',
    nice_to_meet_you: 'Prazer em conhecer',
    excuse_me: 'Com licença',
    sorry: 'Desculpe',
    water: 'Água',
    food: 'Comida',
    help: 'Ajuda',
    where_is: 'Onde fica...?',
    how_much: 'Quanto custa?',
    i_dont_understand: 'Não entendo',
  },
  ru: {
    hello: 'Привет',
    goodbye: 'До свидания',
    thank_you: 'Спасибо',
    please: 'Пожалуйста',
    yes: 'Да',
    no: 'Нет',
    good_morning: 'Доброе утро',
    good_night: 'Спокойной ночи',
    how_are_you: 'Как дела?',
    im_fine: 'Хорошо',
    my_name_is: 'Меня зовут...',
    nice_to_meet_you: 'Приятно познакомиться',
    excuse_me: 'Извините',
    sorry: 'Простите',
    water: 'Вода',
    food: 'Еда',
    help: 'Помогите',
    where_is: 'Где...?',
    how_much: 'Сколько стоит?',
    i_dont_understand: 'Я не понимаю',
  },
  ar: {
    hello: 'مرحبا',
    goodbye: 'مع السلامة',
    thank_you: 'شكرا',
    please: 'من فضلك',
    yes: 'نعم',
    no: 'لا',
    good_morning: 'صباح الخير',
    good_night: 'تصبح على خير',
    how_are_you: 'كيف حالك؟',
    im_fine: 'أنا بخير',
    my_name_is: 'اسمي...',
    nice_to_meet_you: 'تشرفت بمعرفتك',
    excuse_me: 'عذرا',
    sorry: 'آسف',
    water: 'ماء',
    food: 'طعام',
    help: 'مساعدة',
    where_is: 'أين...؟',
    how_much: 'بكم هذا؟',
    i_dont_understand: 'لا أفهم',
  },
  tr: {
    hello: 'Merhaba',
    goodbye: 'Hoşça kal',
    thank_you: 'Teşekkürler',
    please: 'Lütfen',
    yes: 'Evet',
    no: 'Hayır',
    good_morning: 'Günaydın',
    good_night: 'İyi geceler',
    how_are_you: 'Nasılsınız?',
    im_fine: 'İyiyim',
    my_name_is: 'Benim adım...',
    nice_to_meet_you: 'Tanıştığımıza memnun oldum',
    excuse_me: 'Affedersiniz',
    sorry: 'Özür dilerim',
    water: 'Su',
    food: 'Yemek',
    help: 'Yardım',
    where_is: '...nerede?',
    how_much: 'Ne kadar?',
    i_dont_understand: 'Anlamıyorum',
  },
  nl: {
    hello: 'Hallo',
    goodbye: 'Tot ziens',
    thank_you: 'Dank je',
    please: 'Alsjeblieft',
    yes: 'Ja',
    no: 'Nee',
    good_morning: 'Goedemorgen',
    good_night: 'Goedenacht',
    how_are_you: 'Hoe gaat het?',
    im_fine: 'Het gaat goed',
    my_name_is: 'Mijn naam is...',
    nice_to_meet_you: 'Aangenaam',
    excuse_me: 'Pardon',
    sorry: 'Sorry',
    water: 'Water',
    food: 'Eten',
    help: 'Help',
    where_is: 'Waar is...?',
    how_much: 'Hoeveel kost het?',
    i_dont_understand: 'Ik begrijp het niet',
  },
  sv: {
    hello: 'Hej',
    goodbye: 'Hej då',
    thank_you: 'Tack',
    please: 'Snälla',
    yes: 'Ja',
    no: 'Nej',
    good_morning: 'God morgon',
    good_night: 'God natt',
    how_are_you: 'Hur mår du?',
    im_fine: 'Jag mår bra',
    my_name_is: 'Jag heter...',
    nice_to_meet_you: 'Trevligt att träffas',
    excuse_me: 'Ursäkta',
    sorry: 'Förlåt',
    water: 'Vatten',
    food: 'Mat',
    help: 'Hjälp',
    where_is: 'Var är...?',
    how_much: 'Hur mycket kostar det?',
    i_dont_understand: 'Jag förstår inte',
  },
  // Additional languages with translations
  ga: { hello: 'Dia duit', goodbye: 'Slán', thank_you: 'Go raibh maith agat', please: 'Le do thoil', yes: 'Tá', no: 'Níl', good_morning: 'Maidin mhaith', good_night: 'Oíche mhaith', how_are_you: 'Conas atá tú?', im_fine: 'Táim go maith', my_name_is: 'Is mise...', nice_to_meet_you: 'Tá áthas orm bualadh leat', excuse_me: 'Gabh mo leithscéal', sorry: 'Tá brón orm', water: 'Uisce', food: 'Bia', help: 'Cabhair', where_is: 'Cá bhfuil...?', how_much: 'Cé mhéad?', i_dont_understand: 'Ní thuigim' },
  pl: { hello: 'Cześć', goodbye: 'Do widzenia', thank_you: 'Dziękuję', please: 'Proszę', yes: 'Tak', no: 'Nie', good_morning: 'Dzień dobry', good_night: 'Dobranoc', how_are_you: 'Jak się masz?', im_fine: 'Dobrze', my_name_is: 'Mam na imię...', nice_to_meet_you: 'Miło cię poznać', excuse_me: 'Przepraszam', sorry: 'Przepraszam', water: 'Woda', food: 'Jedzenie', help: 'Pomoc', where_is: 'Gdzie jest...?', how_much: 'Ile to kosztuje?', i_dont_understand: 'Nie rozumiem' },
  hi: { hello: 'नमस्ते', goodbye: 'अलविदा', thank_you: 'धन्यवाद', please: 'कृपया', yes: 'हाँ', no: 'नहीं', good_morning: 'सुप्रभात', good_night: 'शुभ रात्रि', how_are_you: 'आप कैसे हैं?', im_fine: 'मैं ठीक हूँ', my_name_is: 'मेरा नाम है...', nice_to_meet_you: 'आपसे मिलकर खुशी हुई', excuse_me: 'क्षमा करें', sorry: 'माफ़ कीजिए', water: 'पानी', food: 'खाना', help: 'मदद', where_is: '...कहाँ है?', how_much: 'कितना?', i_dont_understand: 'मुझे समझ नहीं आया' },
  he: { hello: 'שלום', goodbye: 'להתראות', thank_you: 'תודה', please: 'בבקשה', yes: 'כן', no: 'לא', good_morning: 'בוקר טוב', good_night: 'לילה טוב', how_are_you: 'מה שלומך?', im_fine: 'אני בסדר', my_name_is: 'קוראים לי...', nice_to_meet_you: 'נעים להכיר', excuse_me: 'סליחה', sorry: 'מצטער', water: 'מים', food: 'אוכל', help: 'עזרה', where_is: 'איפה...?', how_much: 'כמה זה עולה?', i_dont_understand: 'אני לא מבין' },
  vi: { hello: 'Xin chào', goodbye: 'Tạm biệt', thank_you: 'Cảm ơn', please: 'Làm ơn', yes: 'Vâng', no: 'Không', good_morning: 'Chào buổi sáng', good_night: 'Chúc ngủ ngon', how_are_you: 'Bạn khỏe không?', im_fine: 'Tôi khỏe', my_name_is: 'Tên tôi là...', nice_to_meet_you: 'Rất vui được gặp bạn', excuse_me: 'Xin lỗi', sorry: 'Xin lỗi', water: 'Nước', food: 'Thức ăn', help: 'Giúp đỡ', where_is: '...ở đâu?', how_much: 'Bao nhiêu?', i_dont_understand: 'Tôi không hiểu' },
  el: { hello: 'Γεια σας', goodbye: 'Αντίο', thank_you: 'Ευχαριστώ', please: 'Παρακαλώ', yes: 'Ναι', no: 'Όχι', good_morning: 'Καλημέρα', good_night: 'Καληνύχτα', how_are_you: 'Πώς είστε;', im_fine: 'Είμαι καλά', my_name_is: 'Με λένε...', nice_to_meet_you: 'Χαίρω πολύ', excuse_me: 'Συγγνώμη', sorry: 'Λυπάμαι', water: 'Νερό', food: 'Φαγητό', help: 'Βοήθεια', where_is: 'Πού είναι...;', how_much: 'Πόσο κάνει;', i_dont_understand: 'Δεν καταλαβαίνω' },
  no: { hello: 'Hei', goodbye: 'Ha det', thank_you: 'Takk', please: 'Vær så snill', yes: 'Ja', no: 'Nei', good_morning: 'God morgen', good_night: 'God natt', how_are_you: 'Hvordan har du det?', im_fine: 'Jeg har det bra', my_name_is: 'Jeg heter...', nice_to_meet_you: 'Hyggelig å møte deg', excuse_me: 'Unnskyld', sorry: 'Beklager', water: 'Vann', food: 'Mat', help: 'Hjelp', where_is: 'Hvor er...?', how_much: 'Hvor mye koster det?', i_dont_understand: 'Jeg forstår ikke' },
  da: { hello: 'Hej', goodbye: 'Farvel', thank_you: 'Tak', please: 'Venligst', yes: 'Ja', no: 'Nej', good_morning: 'Godmorgen', good_night: 'Godnat', how_are_you: 'Hvordan har du det?', im_fine: 'Jeg har det godt', my_name_is: 'Jeg hedder...', nice_to_meet_you: 'Rart at møde dig', excuse_me: 'Undskyld', sorry: 'Beklager', water: 'Vand', food: 'Mad', help: 'Hjælp', where_is: 'Hvor er...?', how_much: 'Hvor meget koster det?', i_dont_understand: 'Jeg forstår ikke' },
  ro: { hello: 'Salut', goodbye: 'La revedere', thank_you: 'Mulțumesc', please: 'Te rog', yes: 'Da', no: 'Nu', good_morning: 'Bună dimineața', good_night: 'Noapte bună', how_are_you: 'Ce mai faci?', im_fine: 'Sunt bine', my_name_is: 'Mă numesc...', nice_to_meet_you: 'Încântat de cunoștință', excuse_me: 'Scuzați-mă', sorry: 'Îmi pare rău', water: 'Apă', food: 'Mâncare', help: 'Ajutor', where_is: 'Unde este...?', how_much: 'Cât costă?', i_dont_understand: 'Nu înțeleg' },
  fi: { hello: 'Hei', goodbye: 'Näkemiin', thank_you: 'Kiitos', please: 'Ole hyvä', yes: 'Kyllä', no: 'Ei', good_morning: 'Hyvää huomenta', good_night: 'Hyvää yötä', how_are_you: 'Mitä kuuluu?', im_fine: 'Hyvin menee', my_name_is: 'Nimeni on...', nice_to_meet_you: 'Hauska tavata', excuse_me: 'Anteeksi', sorry: 'Olen pahoillani', water: 'Vesi', food: 'Ruoka', help: 'Apua', where_is: 'Missä on...?', how_much: 'Paljonko se maksaa?', i_dont_understand: 'En ymmärrä' },
  cs: { hello: 'Ahoj', goodbye: 'Na shledanou', thank_you: 'Děkuji', please: 'Prosím', yes: 'Ano', no: 'Ne', good_morning: 'Dobré ráno', good_night: 'Dobrou noc', how_are_you: 'Jak se máte?', im_fine: 'Mám se dobře', my_name_is: 'Jmenuji se...', nice_to_meet_you: 'Těší mě', excuse_me: 'Promiňte', sorry: 'Omlouvám se', water: 'Voda', food: 'Jídlo', help: 'Pomoc', where_is: 'Kde je...?', how_much: 'Kolik to stojí?', i_dont_understand: 'Nerozumím' },
  uk: { hello: 'Привіт', goodbye: 'До побачення', thank_you: 'Дякую', please: 'Будь ласка', yes: 'Так', no: 'Ні', good_morning: 'Доброго ранку', good_night: 'На добраніч', how_are_you: 'Як справи?', im_fine: 'Добре', my_name_is: 'Мене звати...', nice_to_meet_you: 'Приємно познайомитися', excuse_me: 'Вибачте', sorry: 'Пробачте', water: 'Вода', food: 'Їжа', help: 'Допоможіть', where_is: 'Де...?', how_much: 'Скільки коштує?', i_dont_understand: 'Я не розумію' },
  cy: { hello: 'Helo', goodbye: 'Hwyl fawr', thank_you: 'Diolch', please: 'Os gwelwch yn dda', yes: 'Ie', no: 'Na', good_morning: 'Bore da', good_night: 'Nos da', how_are_you: 'Sut wyt ti?', im_fine: 'Dwi\'n dda', my_name_is: 'Fy enw i yw...', nice_to_meet_you: 'Braf cwrdd â chi', excuse_me: 'Esgusodwch fi', sorry: 'Mae\'n ddrwg gen i', water: 'Dŵr', food: 'Bwyd', help: 'Help', where_is: 'Ble mae...?', how_much: 'Faint?', i_dont_understand: 'Dw i ddim yn deall' },
  gd: { hello: 'Halò', goodbye: 'Mar sin leat', thank_you: 'Tapadh leat', please: 'Mas e do thoil e', yes: 'Tha', no: 'Chan eil', good_morning: 'Madainn mhath', good_night: 'Oidhche mhath', how_are_you: 'Ciamar a tha thu?', im_fine: 'Tha gu math', my_name_is: 'Is mise...', nice_to_meet_you: 'Tha mi toilichte coinneachadh riut', excuse_me: 'Gabh mo leisgeul', sorry: 'Tha mi duilich', water: 'Uisge', food: 'Biadh', help: 'Cuideachadh', where_is: 'Càite a bheil...?', how_much: 'Dè a phrìs?', i_dont_understand: 'Chan eil mi a tuigsinn' },
  hu: { hello: 'Szia', goodbye: 'Viszontlátásra', thank_you: 'Köszönöm', please: 'Kérem', yes: 'Igen', no: 'Nem', good_morning: 'Jó reggelt', good_night: 'Jó éjszakát', how_are_you: 'Hogy vagy?', im_fine: 'Jól vagyok', my_name_is: 'A nevem...', nice_to_meet_you: 'Örülök, hogy találkoztunk', excuse_me: 'Elnézést', sorry: 'Sajnálom', water: 'Víz', food: 'Étel', help: 'Segítség', where_is: 'Hol van...?', how_much: 'Mennyibe kerül?', i_dont_understand: 'Nem értem' },
  id: { hello: 'Halo', goodbye: 'Selamat tinggal', thank_you: 'Terima kasih', please: 'Tolong', yes: 'Ya', no: 'Tidak', good_morning: 'Selamat pagi', good_night: 'Selamat malam', how_are_you: 'Apa kabar?', im_fine: 'Saya baik', my_name_is: 'Nama saya...', nice_to_meet_you: 'Senang bertemu denganmu', excuse_me: 'Permisi', sorry: 'Maaf', water: 'Air', food: 'Makanan', help: 'Tolong', where_is: 'Di mana...?', how_much: 'Berapa harganya?', i_dont_understand: 'Saya tidak mengerti' },
  haw: { hello: 'Aloha', goodbye: 'A hui hou', thank_you: 'Mahalo', please: 'E ʻoluʻolu', yes: 'ʻAe', no: 'ʻAʻole', good_morning: 'Aloha kakahiaka', good_night: 'Aloha ahiahi', how_are_you: 'Pehea ʻoe?', im_fine: 'Maikaʻi au', my_name_is: 'ʻO koʻu inoa...', nice_to_meet_you: 'Hauʻoli au e ʻike iā ʻoe', excuse_me: 'E kala mai', sorry: 'E kala mai iaʻu', water: 'Wai', food: 'Meaʻai', help: 'Kōkua', where_is: 'Aia i hea...?', how_much: 'ʻEhia?', i_dont_understand: 'ʻAʻole maopopo iaʻu' },
  nv: { hello: 'Yáʼátʼééh', goodbye: 'Hágoóneeʼ', thank_you: 'Ahéheeʼ', please: 'Tʼáá shǫǫdí', yes: 'Aooʼ', no: 'Dooda', good_morning: 'Yáʼátʼééh abíní', good_night: 'Yáʼátʼééh', how_are_you: 'Nizhónígo?', im_fine: 'Nizhóní', my_name_is: 'Shí éí...', nice_to_meet_you: 'Ayóóʼánóshní', excuse_me: 'Shił aheeheeʼ', sorry: 'Bikʼeh', water: 'Tó', food: 'Chʼiyáán', help: 'Shíká anílyeed', where_is: 'Háádish...?', how_much: 'Díkwíí?', i_dont_understand: 'Doo shił bééhózin da' },
  sw: { hello: 'Habari', goodbye: 'Kwaheri', thank_you: 'Asante', please: 'Tafadhali', yes: 'Ndiyo', no: 'Hapana', good_morning: 'Habari za asubuhi', good_night: 'Usiku mwema', how_are_you: 'Habari yako?', im_fine: 'Nzuri', my_name_is: 'Jina langu ni...', nice_to_meet_you: 'Nimefurahi kukuona', excuse_me: 'Samahani', sorry: 'Pole', water: 'Maji', food: 'Chakula', help: 'Msaada', where_is: '...iko wapi?', how_much: 'Bei gani?', i_dont_understand: 'Sielewi' },
  eo: { hello: 'Saluton', goodbye: 'Ĝis revido', thank_you: 'Dankon', please: 'Bonvolu', yes: 'Jes', no: 'Ne', good_morning: 'Bonan matenon', good_night: 'Bonan nokton', how_are_you: 'Kiel vi fartas?', im_fine: 'Mi fartas bone', my_name_is: 'Mia nomo estas...', nice_to_meet_you: 'Estas plezuro renkonti vin', excuse_me: 'Pardonu min', sorry: 'Mi bedaŭras', water: 'Akvo', food: 'Manĝaĵo', help: 'Helpo', where_is: 'Kie estas...?', how_much: 'Kiom kostas?', i_dont_understand: 'Mi ne komprenas' },
  val: { hello: 'Rytsas', goodbye: 'Geros ilas', thank_you: 'Kirimvose', please: 'Avy jorrāelan', yes: 'Kessa', no: 'Daor', good_morning: 'Sȳz tubis', good_night: 'Sȳz bantis', how_are_you: 'Skoroso glaesā?', im_fine: 'Sȳz', my_name_is: 'Ñuha brōzi...', nice_to_meet_you: 'Sȳrī rȳbagon', excuse_me: 'Sȳrī', sorry: 'Sȳrī', water: 'Udrȳ', food: 'Havor', help: 'Dohaeragon', where_is: 'Skoros...?', how_much: 'Sparos?', i_dont_understand: 'Nyke ȳdra daor' },
  tlh: { hello: 'nuqneH', goodbye: 'Qapla\'', thank_you: 'qatlho\'', please: 'qatlho\'', yes: 'HIja\'', no: 'ghobe\'', good_morning: 'jaj QaQ', good_night: 'ram QaQ', how_are_you: 'nuqDaq?', im_fine: 'jIQuch', my_name_is: 'pongwIj...', nice_to_meet_you: 'qavan', excuse_me: 'tugh', sorry: 'jIQoS', water: 'bIQ', food: 'Soj', help: 'QaH', where_is: 'nuqDaq...?', how_much: 'ar?', i_dont_understand: 'jIyajbe\'' },
  la: { hello: 'Salve', goodbye: 'Vale', thank_you: 'Gratias', please: 'Quaeso', yes: 'Ita', no: 'Minime', good_morning: 'Bonum mane', good_night: 'Bonam noctem', how_are_you: 'Quid agis?', im_fine: 'Valeo', my_name_is: 'Nomen mihi est...', nice_to_meet_you: 'Delectat me te cognoscere', excuse_me: 'Ignosce mihi', sorry: 'Me paenitet', water: 'Aqua', food: 'Cibus', help: 'Auxilium', where_is: 'Ubi est...?', how_much: 'Quanti?', i_dont_understand: 'Non intellego' },
  yi: { hello: 'שלום', goodbye: 'זײַ געזונט', thank_you: 'אַ דאַנק', please: 'ביטע', yes: 'יאָ', no: 'ניין', good_morning: 'גוט מאָרגן', good_night: 'גוטע נאַכט', how_are_you: 'ווי גייט?', im_fine: 'גוט', my_name_is: 'מײַן נאָמען איז...', nice_to_meet_you: 'פֿרייד צו באַקענען', excuse_me: 'אַנטשולדיקט', sorry: 'אַנטשולדיקט', water: 'וואַסער', food: 'עסן', help: 'הילף', where_is: 'וווּ איז...?', how_much: 'וויפֿל קאָסט?', i_dont_understand: 'איך פֿאַרשטיי נישט' },
  ht: { hello: 'Bonjou', goodbye: 'Orevwa', thank_you: 'Mèsi', please: 'Tanpri', yes: 'Wi', no: 'Non', good_morning: 'Bonjou', good_night: 'Bòn nwit', how_are_you: 'Kijan ou ye?', im_fine: 'Mwen byen', my_name_is: 'Non mwen se...', nice_to_meet_you: 'Mwen kontan rankontre ou', excuse_me: 'Eskize mwen', sorry: 'Mwen regret', water: 'Dlo', food: 'Manje', help: 'Èd', where_is: 'Ki kote...?', how_much: 'Konbyen?', i_dont_understand: 'Mwen pa konprann' },
  zu: { hello: 'Sawubona', goodbye: 'Hamba kahle', thank_you: 'Ngiyabonga', please: 'Ngicela', yes: 'Yebo', no: 'Cha', good_morning: 'Sawubona ekuseni', good_night: 'Lala kahle', how_are_you: 'Unjani?', im_fine: 'Ngiyaphila', my_name_is: 'Igama lami ngu...', nice_to_meet_you: 'Ngijabule ukukwazi', excuse_me: 'Uxolo', sorry: 'Ngiyaxolisa', water: 'Amanzi', food: 'Ukudla', help: 'Usizo', where_is: 'Kuphi...?', how_much: 'Malini?', i_dont_understand: 'Angiqondi' },
  ta: { hello: 'வணக்கம்', goodbye: 'பிரியாவிடை', thank_you: 'நன்றி', please: 'தயவுசெய்து', yes: 'ஆம்', no: 'இல்லை', good_morning: 'காலை வணக்கம்', good_night: 'இரவு வணக்கம்', how_are_you: 'எப்படி இருக்கீர்கள்?', im_fine: 'நான் நன்றாக இருக்கிறேன்', my_name_is: 'என் பெயர்...', nice_to_meet_you: 'உங்களை சந்தித்ததில் மகிழ்ச்சி', excuse_me: 'மன்னிக்கவும்', sorry: 'மன்னிக்கவும்', water: 'தண்ணீர்', food: 'உணவு', help: 'உதவி', where_is: '...எங்கே?', how_much: 'எவ்வளவு?', i_dont_understand: 'எனக்கு புரியவில்லை' },
  ca: { hello: 'Hola', goodbye: 'Adéu', thank_you: 'Gràcies', please: 'Si us plau', yes: 'Sí', no: 'No', good_morning: 'Bon dia', good_night: 'Bona nit', how_are_you: 'Com estàs?', im_fine: 'Estic bé', my_name_is: 'Em dic...', nice_to_meet_you: 'Encantat de conèixer-te', excuse_me: 'Perdoni', sorry: 'Ho sento', water: 'Aigua', food: 'Menjar', help: 'Ajuda', where_is: 'On és...?', how_much: 'Quant costa?', i_dont_understand: 'No entenc' },
  th: { hello: 'สวัสดี', goodbye: 'ลาก่อน', thank_you: 'ขอบคุณ', please: 'กรุณา', yes: 'ใช่', no: 'ไม่', good_morning: 'สวัสดีตอนเช้า', good_night: 'ราตรีสวัสดิ์', how_are_you: 'สบายดีไหม?', im_fine: 'สบายดี', my_name_is: 'ฉันชื่อ...', nice_to_meet_you: 'ยินดีที่ได้รู้จัก', excuse_me: 'ขอโทษ', sorry: 'ขอโทษ', water: 'น้ำ', food: 'อาหาร', help: 'ช่วยด้วย', where_is: '...อยู่ที่ไหน?', how_much: 'เท่าไหร่?', i_dont_understand: 'ไม่เข้าใจ' },
};

// Generate exercises for a specific language and phrase key
export function generateExercisesForPhrase(
  languageCode: string,
  phraseKey: keyof typeof BASE_PHRASES,
): LanguageExercise[] {
  const content = LANGUAGE_CONTENT[languageCode];
  if (!content) return [];

  const nativePhrase = content[phraseKey];
  const englishPhrase = BASE_PHRASES[phraseKey];

  if (!nativePhrase) return [];

  // Generate distractor options for multiple choice
  const allPhrases = Object.values(content);
  const distractors = allPhrases
    .filter(p => p !== nativePhrase)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const exercises: LanguageExercise[] = [
    // Multiple choice - translate to target language
    {
      type: 'multiple_choice',
      question: `What is "${englishPhrase}" in this language?`,
      correctAnswer: nativePhrase,
      options: shuffleArray([nativePhrase, ...distractors]),
      hint: `Think about common greetings`,
    },
    // Translation - type the answer
    {
      type: 'translation',
      question: `Translate: "${englishPhrase}"`,
      correctAnswer: nativePhrase,
      options: nativePhrase.split(' ').concat(distractors.flatMap(d => d.split(' '))).slice(0, 6),
      hint: `Type the ${languageCode.toUpperCase()} translation`,
    },
    // Fill blank with word bank
    {
      type: 'fill_blank',
      question: `Complete: ___ (${englishPhrase})`,
      correctAnswer: nativePhrase,
      options: [nativePhrase, ...distractors.slice(0, 2)],
      hint: `Select the correct translation`,
    },
    // Word bank - arrange words
    {
      type: 'word_bank',
      question: `Arrange the words to say: "${englishPhrase}"`,
      correctAnswer: nativePhrase,
      options: shuffleArray(nativePhrase.split(' ')),
    },
    // Speak answer (placeholder for speech recognition)
    {
      type: 'speak_answer',
      question: `Say: "${nativePhrase}"`,
      correctAnswer: nativePhrase,
      hint: `Speak clearly into your microphone`,
    },
    // Type what you hear
    {
      type: 'type_what_you_hear',
      question: `Listen and type what you hear`,
      correctAnswer: nativePhrase,
      options: shuffleArray(nativePhrase.split(' ')),
      audioUrl: `audio_placeholder_${languageCode}_${phraseKey}`,
    },
  ];

  return exercises;
}

// Generate a complete lesson for a language
export function generateLessonForLanguage(
  languageCode: string,
  lessonNumber: number = 1,
): LanguageExercise[] {
  const phraseKeys = Object.keys(BASE_PHRASES) as (keyof typeof BASE_PHRASES)[];
  
  // Select phrases based on lesson number (5 phrases per lesson)
  const startIndex = ((lessonNumber - 1) * 5) % phraseKeys.length;
  const selectedPhrases = phraseKeys.slice(startIndex, startIndex + 5);
  
  // Generate mixed exercises
  const allExercises: LanguageExercise[] = [];
  
  selectedPhrases.forEach(phraseKey => {
    const exercises = generateExercisesForPhrase(languageCode, phraseKey);
    // Pick 2 random exercises per phrase for variety
    const shuffled = shuffleArray(exercises);
    allExercises.push(...shuffled.slice(0, 2));
  });

  // Shuffle and limit to 10 exercises per lesson
  return shuffleArray(allExercises).slice(0, 10);
}

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get TTS language code mapping
export function getTTSLanguageCode(languageCode: string): string {
  const mapping: Record<string, string> = {
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    ja: 'ja-JP',
    ko: 'ko-KR',
    zh: 'zh-CN',
    it: 'it-IT',
    pt: 'pt-BR',
    ru: 'ru-RU',
    ar: 'ar-SA',
    tr: 'tr-TR',
    nl: 'nl-NL',
    sv: 'sv-SE',
    pl: 'pl-PL',
    hi: 'hi-IN',
    he: 'he-IL',
    vi: 'vi-VN',
    el: 'el-GR',
    no: 'no-NO',
    da: 'da-DK',
    ro: 'ro-RO',
    fi: 'fi-FI',
    cs: 'cs-CZ',
    uk: 'uk-UA',
    hu: 'hu-HU',
    id: 'id-ID',
    sw: 'sw-KE',
    th: 'th-TH',
    ta: 'ta-IN',
    ca: 'ca-ES',
  };
  return mapping[languageCode] || 'en-US';
}
