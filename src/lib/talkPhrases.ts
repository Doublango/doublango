// Comprehensive phrase library for Talk practice with difficulty levels and no-repeat logic

export type DifficultyLevel = 'beginner' | 'basic' | 'intermediate' | 'advanced';

export interface PhraseData {
  key: string;
  en: string;
  level: DifficultyLevel;
}

export interface CategoryData {
  id: string;
  title: string;
  icon: string;
  phrases: PhraseData[];
}

// Session tracking to prevent repeats
const usedPhrases = new Map<string, Set<string>>();

export function getUnusedPhrases(categoryId: string, allPhrases: PhraseData[], maxLevel: DifficultyLevel): PhraseData[] {
  const levelOrder: DifficultyLevel[] = ['beginner', 'basic', 'intermediate', 'advanced'];
  const maxLevelIndex = levelOrder.indexOf(maxLevel);
  
  // Filter by level
  const eligiblePhrases = allPhrases.filter(p => levelOrder.indexOf(p.level) <= maxLevelIndex);
  
  // Get used phrases for this category
  const usedKeys = usedPhrases.get(categoryId) || new Set<string>();
  
  // Filter out used ones
  const unusedPhrases = eligiblePhrases.filter(p => !usedKeys.has(p.key));
  
  // If all used, reset and return all
  if (unusedPhrases.length === 0) {
    usedPhrases.set(categoryId, new Set<string>());
    return shuffleArray([...eligiblePhrases]);
  }
  
  return shuffleArray(unusedPhrases);
}

export function markPhraseUsed(categoryId: string, phraseKey: string) {
  const usedKeys = usedPhrases.get(categoryId) || new Set<string>();
  usedKeys.add(phraseKey);
  usedPhrases.set(categoryId, usedKeys);
}

export function resetCategoryProgress(categoryId: string) {
  usedPhrases.delete(categoryId);
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Adult phrase library - comprehensive with difficulty levels
export const ADULT_PHRASE_LIBRARY: CategoryData[] = [
  {
    id: 'greetings',
    title: 'Greetings',
    icon: '👋',
    phrases: [
      // Beginner
      { key: 'hello', en: 'Hello', level: 'beginner' },
      { key: 'hi', en: 'Hi', level: 'beginner' },
      { key: 'good_morning', en: 'Good morning', level: 'beginner' },
      { key: 'good_afternoon', en: 'Good afternoon', level: 'beginner' },
      { key: 'good_evening', en: 'Good evening', level: 'beginner' },
      { key: 'good_night', en: 'Good night', level: 'beginner' },
      { key: 'goodbye', en: 'Goodbye', level: 'beginner' },
      { key: 'bye', en: 'Bye', level: 'beginner' },
      // Basic
      { key: 'how_are_you', en: 'How are you?', level: 'basic' },
      { key: 'im_fine', en: 'I am fine', level: 'basic' },
      { key: 'im_good', en: 'I am good', level: 'basic' },
      { key: 'and_you', en: 'And you?', level: 'basic' },
      { key: 'nice_to_meet_you', en: 'Nice to meet you', level: 'basic' },
      { key: 'welcome', en: 'Welcome', level: 'basic' },
      { key: 'whats_up', en: "What's up?", level: 'basic' },
      { key: 'how_is_it_going', en: 'How is it going?', level: 'basic' },
      // Intermediate
      { key: 'see_you_later', en: 'See you later', level: 'intermediate' },
      { key: 'see_you_tomorrow', en: 'See you tomorrow', level: 'intermediate' },
      { key: 'see_you_soon', en: 'See you soon', level: 'intermediate' },
      { key: 'have_a_nice_day', en: 'Have a nice day', level: 'intermediate' },
      { key: 'have_a_good_weekend', en: 'Have a good weekend', level: 'intermediate' },
      { key: 'take_care', en: 'Take care', level: 'intermediate' },
      { key: 'its_been_a_pleasure', en: 'It has been a pleasure', level: 'intermediate' },
      { key: 'how_have_you_been', en: 'How have you been?', level: 'intermediate' },
      // Advanced
      { key: 'long_time_no_see', en: 'Long time no see', level: 'advanced' },
      { key: 'pleasure_to_meet_you', en: 'It is a pleasure to meet you', level: 'advanced' },
      { key: 'looking_forward', en: 'I am looking forward to seeing you', level: 'advanced' },
      { key: 'keep_in_touch', en: 'Let us keep in touch', level: 'advanced' },
      { key: 'give_regards', en: 'Please give my regards to your family', level: 'advanced' },
      { key: 'delighted_meet', en: 'I am delighted to meet you', level: 'advanced' },
    ]
  },
  {
    id: 'basics',
    title: 'Basic Phrases',
    icon: '💬',
    phrases: [
      // Beginner
      { key: 'yes', en: 'Yes', level: 'beginner' },
      { key: 'no', en: 'No', level: 'beginner' },
      { key: 'please', en: 'Please', level: 'beginner' },
      { key: 'thank_you', en: 'Thank you', level: 'beginner' },
      { key: 'thanks', en: 'Thanks', level: 'beginner' },
      { key: 'ok', en: 'Okay', level: 'beginner' },
      { key: 'good', en: 'Good', level: 'beginner' },
      { key: 'bad', en: 'Bad', level: 'beginner' },
      // Basic
      { key: 'excuse_me', en: 'Excuse me', level: 'basic' },
      { key: 'sorry', en: 'Sorry', level: 'basic' },
      { key: 'i_dont_understand', en: "I don't understand", level: 'basic' },
      { key: 'i_understand', en: 'I understand', level: 'basic' },
      { key: 'i_dont_know', en: "I don't know", level: 'basic' },
      { key: 'i_think_so', en: 'I think so', level: 'basic' },
      { key: 'maybe', en: 'Maybe', level: 'basic' },
      { key: 'of_course', en: 'Of course', level: 'basic' },
      // Intermediate
      { key: 'can_you_repeat', en: 'Can you repeat that?', level: 'intermediate' },
      { key: 'speak_slowly', en: 'Please speak slowly', level: 'intermediate' },
      { key: 'how_do_you_say', en: 'How do you say...?', level: 'intermediate' },
      { key: 'what_does_mean', en: 'What does that mean?', level: 'intermediate' },
      { key: 'i_dont_speak_well', en: "I don't speak very well", level: 'intermediate' },
      { key: 'im_learning', en: 'I am learning your language', level: 'intermediate' },
      { key: 'could_you_help', en: 'Could you help me?', level: 'intermediate' },
      { key: 'no_problem', en: 'No problem', level: 'intermediate' },
      // Advanced
      { key: 'i_appreciate_it', en: 'I really appreciate it', level: 'advanced' },
      { key: 'thats_very_kind', en: 'That is very kind of you', level: 'advanced' },
      { key: 'i_apologize', en: 'I sincerely apologize', level: 'advanced' },
      { key: 'would_you_mind', en: 'Would you mind explaining that?', level: 'advanced' },
      { key: 'if_im_not_mistaken', en: 'If I am not mistaken', level: 'advanced' },
      { key: 'to_be_honest', en: 'To be honest with you', level: 'advanced' },
    ]
  },
  {
    id: 'introductions',
    title: 'Introductions',
    icon: '🤝',
    phrases: [
      // Beginner
      { key: 'my_name_is', en: 'My name is...', level: 'beginner' },
      { key: 'i_am', en: 'I am...', level: 'beginner' },
      { key: 'this_is', en: 'This is...', level: 'beginner' },
      // Basic
      { key: 'whats_your_name', en: 'What is your name?', level: 'basic' },
      { key: 'nice_meet', en: 'Nice to meet you', level: 'basic' },
      { key: 'where_from', en: 'Where are you from?', level: 'basic' },
      { key: 'i_am_from', en: 'I am from...', level: 'basic' },
      { key: 'i_live_in', en: 'I live in...', level: 'basic' },
      { key: 'how_old', en: 'How old are you?', level: 'basic' },
      { key: 'i_am_years', en: 'I am ... years old', level: 'basic' },
      // Intermediate
      { key: 'what_do_you_do', en: 'What do you do?', level: 'intermediate' },
      { key: 'i_work_as', en: 'I work as...', level: 'intermediate' },
      { key: 'i_am_student', en: 'I am a student', level: 'intermediate' },
      { key: 'i_study', en: 'I study...', level: 'intermediate' },
      { key: 'i_speak', en: 'I speak...', level: 'intermediate' },
      { key: 'do_you_speak', en: 'Do you speak English?', level: 'intermediate' },
      { key: 'where_work', en: 'Where do you work?', level: 'intermediate' },
      { key: 'how_long_here', en: 'How long have you been here?', level: 'intermediate' },
      // Advanced
      { key: 'pleasure_meeting', en: 'It was a pleasure meeting you', level: 'advanced' },
      { key: 'allow_introduce', en: 'Allow me to introduce myself', level: 'advanced' },
      { key: 'heard_lot', en: 'I have heard a lot about you', level: 'advanced' },
      { key: 'looking_forward_working', en: 'I am looking forward to working with you', level: 'advanced' },
      { key: 'may_i_ask', en: 'May I ask what you do for a living?', level: 'advanced' },
      { key: 'background_in', en: 'I have a background in...', level: 'advanced' },
    ]
  },
  {
    id: 'numbers',
    title: 'Numbers',
    icon: '🔢',
    phrases: [
      // Beginner - Basic numbers
      { key: 'zero', en: 'Zero', level: 'beginner' },
      { key: 'one', en: 'One', level: 'beginner' },
      { key: 'two', en: 'Two', level: 'beginner' },
      { key: 'three', en: 'Three', level: 'beginner' },
      { key: 'four', en: 'Four', level: 'beginner' },
      { key: 'five', en: 'Five', level: 'beginner' },
      { key: 'six', en: 'Six', level: 'beginner' },
      { key: 'seven', en: 'Seven', level: 'beginner' },
      { key: 'eight', en: 'Eight', level: 'beginner' },
      { key: 'nine', en: 'Nine', level: 'beginner' },
      { key: 'ten', en: 'Ten', level: 'beginner' },
      // Basic - Teens and context
      { key: 'eleven', en: 'Eleven', level: 'basic' },
      { key: 'twelve', en: 'Twelve', level: 'basic' },
      { key: 'thirteen', en: 'Thirteen', level: 'basic' },
      { key: 'fourteen', en: 'Fourteen', level: 'basic' },
      { key: 'fifteen', en: 'Fifteen', level: 'basic' },
      { key: 'sixteen', en: 'Sixteen', level: 'basic' },
      { key: 'seventeen', en: 'Seventeen', level: 'basic' },
      { key: 'eighteen', en: 'Eighteen', level: 'basic' },
      { key: 'nineteen', en: 'Nineteen', level: 'basic' },
      { key: 'twenty', en: 'Twenty', level: 'basic' },
      { key: 'how_much_cost', en: 'How much does it cost?', level: 'basic' },
      { key: 'what_is_price', en: 'What is the price?', level: 'basic' },
      // Intermediate - Larger numbers and usage
      { key: 'twenty_one', en: 'Twenty-one', level: 'intermediate' },
      { key: 'thirty', en: 'Thirty', level: 'intermediate' },
      { key: 'forty', en: 'Forty', level: 'intermediate' },
      { key: 'fifty', en: 'Fifty', level: 'intermediate' },
      { key: 'sixty', en: 'Sixty', level: 'intermediate' },
      { key: 'seventy', en: 'Seventy', level: 'intermediate' },
      { key: 'eighty', en: 'Eighty', level: 'intermediate' },
      { key: 'ninety', en: 'Ninety', level: 'intermediate' },
      { key: 'hundred', en: 'One hundred', level: 'intermediate' },
      { key: 'first', en: 'First', level: 'intermediate' },
      { key: 'second', en: 'Second', level: 'intermediate' },
      { key: 'third', en: 'Third', level: 'intermediate' },
      { key: 'it_costs_ten', en: 'It costs ten dollars', level: 'intermediate' },
      { key: 'phone_number', en: 'What is your phone number?', level: 'intermediate' },
      { key: 'my_number_is', en: 'My number is...', level: 'intermediate' },
      // Advanced - Complex numbers
      { key: 'two_hundred', en: 'Two hundred', level: 'advanced' },
      { key: 'three_hundred', en: 'Three hundred', level: 'advanced' },
      { key: 'five_hundred', en: 'Five hundred', level: 'advanced' },
      { key: 'thousand', en: 'One thousand', level: 'advanced' },
      { key: 'two_thousand', en: 'Two thousand', level: 'advanced' },
      { key: 'million', en: 'One million', level: 'advanced' },
      { key: 'fourth', en: 'Fourth', level: 'advanced' },
      { key: 'fifth', en: 'Fifth', level: 'advanced' },
      { key: 'tenth', en: 'Tenth', level: 'advanced' },
      { key: 'half', en: 'Half', level: 'advanced' },
      { key: 'quarter', en: 'A quarter', level: 'advanced' },
      { key: 'percentage', en: 'Fifty percent', level: 'advanced' },
    ]
  },
  {
    id: 'time',
    title: 'Time & Dates',
    icon: '⏰',
    phrases: [
      // Beginner
      { key: 'today', en: 'Today', level: 'beginner' },
      { key: 'tomorrow', en: 'Tomorrow', level: 'beginner' },
      { key: 'yesterday', en: 'Yesterday', level: 'beginner' },
      { key: 'now', en: 'Now', level: 'beginner' },
      { key: 'later', en: 'Later', level: 'beginner' },
      // Basic
      { key: 'what_time', en: 'What time is it?', level: 'basic' },
      { key: 'morning', en: 'In the morning', level: 'basic' },
      { key: 'afternoon', en: 'In the afternoon', level: 'basic' },
      { key: 'evening', en: 'In the evening', level: 'basic' },
      { key: 'night', en: 'At night', level: 'basic' },
      { key: 'monday', en: 'Monday', level: 'basic' },
      { key: 'tuesday', en: 'Tuesday', level: 'basic' },
      { key: 'wednesday', en: 'Wednesday', level: 'basic' },
      { key: 'thursday', en: 'Thursday', level: 'basic' },
      { key: 'friday', en: 'Friday', level: 'basic' },
      { key: 'saturday', en: 'Saturday', level: 'basic' },
      { key: 'sunday', en: 'Sunday', level: 'basic' },
      // Intermediate
      { key: 'at_what_time', en: 'At what time?', level: 'intermediate' },
      { key: 'next_week', en: 'Next week', level: 'intermediate' },
      { key: 'last_week', en: 'Last week', level: 'intermediate' },
      { key: 'this_month', en: 'This month', level: 'intermediate' },
      { key: 'next_year', en: 'Next year', level: 'intermediate' },
      { key: 'in_one_hour', en: 'In one hour', level: 'intermediate' },
      { key: 'half_past', en: 'Half past two', level: 'intermediate' },
      { key: 'quarter_past', en: 'Quarter past three', level: 'intermediate' },
      { key: 'what_day', en: 'What day is it?', level: 'intermediate' },
      { key: 'what_date', en: 'What is the date?', level: 'intermediate' },
      // Advanced
      { key: 'day_after_tomorrow', en: 'The day after tomorrow', level: 'advanced' },
      { key: 'day_before_yesterday', en: 'The day before yesterday', level: 'advanced' },
      { key: 'in_two_weeks', en: 'In two weeks time', level: 'advanced' },
      { key: 'around_noon', en: 'Around noon', level: 'advanced' },
      { key: 'at_the_latest', en: 'At the latest by five', level: 'advanced' },
      { key: 'as_soon_as', en: 'As soon as possible', level: 'advanced' },
    ]
  },
  {
    id: 'directions',
    title: 'Directions',
    icon: '🗺️',
    phrases: [
      // Beginner
      { key: 'left', en: 'Left', level: 'beginner' },
      { key: 'right', en: 'Right', level: 'beginner' },
      { key: 'straight', en: 'Straight ahead', level: 'beginner' },
      { key: 'here', en: 'Here', level: 'beginner' },
      { key: 'there', en: 'There', level: 'beginner' },
      // Basic
      { key: 'where_is', en: 'Where is...?', level: 'basic' },
      { key: 'where_is_bathroom', en: 'Where is the bathroom?', level: 'basic' },
      { key: 'where_is_station', en: 'Where is the station?', level: 'basic' },
      { key: 'turn_left', en: 'Turn left', level: 'basic' },
      { key: 'turn_right', en: 'Turn right', level: 'basic' },
      { key: 'go_straight', en: 'Go straight', level: 'basic' },
      { key: 'near', en: 'Near', level: 'basic' },
      { key: 'far', en: 'Far', level: 'basic' },
      // Intermediate
      { key: 'how_do_i_get_to', en: 'How do I get to...?', level: 'intermediate' },
      { key: 'is_it_far', en: 'Is it far from here?', level: 'intermediate' },
      { key: 'next_to', en: 'Next to', level: 'intermediate' },
      { key: 'across_from', en: 'Across from', level: 'intermediate' },
      { key: 'on_the_corner', en: 'On the corner', level: 'intermediate' },
      { key: 'at_the_end', en: 'At the end of the street', level: 'intermediate' },
      { key: 'take_first', en: 'Take the first left', level: 'intermediate' },
      { key: 'keep_going', en: 'Keep going straight', level: 'intermediate' },
      // Advanced
      { key: 'can_you_show_map', en: 'Can you show me on the map?', level: 'advanced' },
      { key: 'how_far_walking', en: 'How far is it on foot?', level: 'advanced' },
      { key: 'which_bus', en: 'Which bus do I need to take?', level: 'advanced' },
      { key: 'get_off_at', en: 'Get off at the third stop', level: 'advanced' },
      { key: 'you_cant_miss', en: 'You cannot miss it', level: 'advanced' },
      { key: 'its_about', en: 'It is about ten minutes away', level: 'advanced' },
    ]
  },
  {
    id: 'shopping',
    title: 'Shopping',
    icon: '🛍️',
    phrases: [
      // Beginner
      { key: 'how_much', en: 'How much?', level: 'beginner' },
      { key: 'this', en: 'This', level: 'beginner' },
      { key: 'that', en: 'That', level: 'beginner' },
      { key: 'big', en: 'Big', level: 'beginner' },
      { key: 'small', en: 'Small', level: 'beginner' },
      // Basic
      { key: 'how_much_this', en: 'How much is this?', level: 'basic' },
      { key: 'too_expensive', en: 'Too expensive', level: 'basic' },
      { key: 'cheap', en: 'Cheap', level: 'basic' },
      { key: 'i_want_to_buy', en: 'I want to buy...', level: 'basic' },
      { key: 'do_you_have', en: 'Do you have...?', level: 'basic' },
      { key: 'i_need', en: 'I need...', level: 'basic' },
      { key: 'cash', en: 'Cash', level: 'basic' },
      { key: 'card', en: 'Card', level: 'basic' },
      // Intermediate
      { key: 'different_size', en: 'Do you have a different size?', level: 'intermediate' },
      { key: 'different_color', en: 'Do you have a different color?', level: 'intermediate' },
      { key: 'can_i_try', en: 'Can I try this on?', level: 'intermediate' },
      { key: 'ill_take_it', en: "I'll take it", level: 'intermediate' },
      { key: 'just_looking', en: 'I am just looking', level: 'intermediate' },
      { key: 'wheres_fitting', en: 'Where is the fitting room?', level: 'intermediate' },
      { key: 'do_you_accept_cards', en: 'Do you accept cards?', level: 'intermediate' },
      { key: 'can_i_pay', en: 'Can I pay by card?', level: 'intermediate' },
      // Advanced
      { key: 'can_you_discount', en: 'Can you give me a discount?', level: 'advanced' },
      { key: 'is_there_warranty', en: 'Is there a warranty?', level: 'advanced' },
      { key: 'can_i_return', en: 'Can I return this?', level: 'advanced' },
      { key: 'do_you_deliver', en: 'Do you deliver?', level: 'advanced' },
      { key: 'out_of_stock', en: 'Is this out of stock?', level: 'advanced' },
      { key: 'when_available', en: 'When will it be available?', level: 'advanced' },
    ]
  },
  {
    id: 'restaurant',
    title: 'Restaurant & Food',
    icon: '🍴',
    phrases: [
      // Beginner
      { key: 'water', en: 'Water', level: 'beginner' },
      { key: 'food', en: 'Food', level: 'beginner' },
      { key: 'coffee', en: 'Coffee', level: 'beginner' },
      { key: 'tea', en: 'Tea', level: 'beginner' },
      { key: 'bread', en: 'Bread', level: 'beginner' },
      // Basic
      { key: 'menu_please', en: 'Menu, please', level: 'basic' },
      { key: 'i_would_like', en: 'I would like...', level: 'basic' },
      { key: 'the_bill_please', en: 'The bill, please', level: 'basic' },
      { key: 'delicious', en: 'Delicious', level: 'basic' },
      { key: 'hungry', en: 'I am hungry', level: 'basic' },
      { key: 'thirsty', en: 'I am thirsty', level: 'basic' },
      { key: 'more_please', en: 'More, please', level: 'basic' },
      // Intermediate
      { key: 'what_recommend', en: 'What do you recommend?', level: 'intermediate' },
      { key: 'vegetarian', en: 'I am vegetarian', level: 'intermediate' },
      { key: 'vegan', en: 'I am vegan', level: 'intermediate' },
      { key: 'allergic_to', en: 'I am allergic to...', level: 'intermediate' },
      { key: 'no_meat', en: 'No meat, please', level: 'intermediate' },
      { key: 'more_water', en: 'More water, please', level: 'intermediate' },
      { key: 'is_this_spicy', en: 'Is this spicy?', level: 'intermediate' },
      { key: 'table_for', en: 'A table for two, please', level: 'intermediate' },
      // Advanced
      { key: 'reservation_for', en: 'I have a reservation for...', level: 'advanced' },
      { key: 'special_today', en: 'What is the special today?', level: 'advanced' },
      { key: 'gluten_free', en: 'Do you have gluten-free options?', level: 'advanced' },
      { key: 'separate_bills', en: 'Can we have separate bills?', level: 'advanced' },
      { key: 'compliments_chef', en: 'My compliments to the chef', level: 'advanced' },
      { key: 'wine_list', en: 'May I see the wine list?', level: 'advanced' },
    ]
  },
  {
    id: 'travel',
    title: 'Travel & Transport',
    icon: '✈️',
    phrases: [
      // Beginner
      { key: 'airport', en: 'Airport', level: 'beginner' },
      { key: 'train', en: 'Train', level: 'beginner' },
      { key: 'bus', en: 'Bus', level: 'beginner' },
      { key: 'taxi', en: 'Taxi', level: 'beginner' },
      { key: 'hotel', en: 'Hotel', level: 'beginner' },
      // Basic
      { key: 'ticket_please', en: 'One ticket, please', level: 'basic' },
      { key: 'what_time_leave', en: 'What time does it leave?', level: 'basic' },
      { key: 'where_is_airport', en: 'Where is the airport?', level: 'basic' },
      { key: 'i_have_reservation', en: 'I have a reservation', level: 'basic' },
      { key: 'passport', en: 'Passport', level: 'basic' },
      { key: 'luggage', en: 'Luggage', level: 'basic' },
      { key: 'departure', en: 'Departure', level: 'basic' },
      { key: 'arrival', en: 'Arrival', level: 'basic' },
      // Intermediate
      { key: 'round_trip', en: 'Round trip ticket, please', level: 'intermediate' },
      { key: 'one_way', en: 'One way ticket', level: 'intermediate' },
      { key: 'delayed', en: 'Is it delayed?', level: 'intermediate' },
      { key: 'platform', en: 'Which platform?', level: 'intermediate' },
      { key: 'gate', en: 'Which gate?', level: 'intermediate' },
      { key: 'check_in', en: 'Where do I check in?', level: 'intermediate' },
      { key: 'boarding_time', en: 'What time is boarding?', level: 'intermediate' },
      { key: 'window_seat', en: 'Window seat, please', level: 'intermediate' },
      // Advanced
      { key: 'lost_luggage', en: 'I lost my luggage', level: 'advanced' },
      { key: 'missed_flight', en: 'I missed my flight', level: 'advanced' },
      { key: 'connecting_flight', en: 'I have a connecting flight', level: 'advanced' },
      { key: 'upgrade', en: 'Can I upgrade my seat?', level: 'advanced' },
      { key: 'delay_reason', en: 'What is the reason for the delay?', level: 'advanced' },
      { key: 'claim_baggage', en: 'Where do I claim my baggage?', level: 'advanced' },
    ]
  },
  {
    id: 'weather',
    title: 'Weather',
    icon: '🌤️',
    phrases: [
      // Beginner
      { key: 'sunny', en: 'It is sunny', level: 'beginner' },
      { key: 'raining', en: 'It is raining', level: 'beginner' },
      { key: 'cold', en: 'It is cold', level: 'beginner' },
      { key: 'hot', en: 'It is hot', level: 'beginner' },
      { key: 'cloudy', en: 'It is cloudy', level: 'beginner' },
      // Basic
      { key: 'weather_today', en: 'How is the weather today?', level: 'basic' },
      { key: 'nice_weather', en: 'Nice weather today', level: 'basic' },
      { key: 'bad_weather', en: 'Bad weather today', level: 'basic' },
      { key: 'windy', en: 'It is windy', level: 'basic' },
      { key: 'snowing', en: 'It is snowing', level: 'basic' },
      { key: 'warm', en: 'It is warm', level: 'basic' },
      { key: 'cool', en: 'It is cool', level: 'basic' },
      // Intermediate
      { key: 'will_rain', en: 'Will it rain tomorrow?', level: 'intermediate' },
      { key: 'temperature', en: 'What is the temperature?', level: 'intermediate' },
      { key: 'humid', en: 'It is very humid', level: 'intermediate' },
      { key: 'foggy', en: 'It is foggy', level: 'intermediate' },
      { key: 'storm', en: 'There is a storm coming', level: 'intermediate' },
      { key: 'need_umbrella', en: 'Do I need an umbrella?', level: 'intermediate' },
      // Advanced
      { key: 'forecast', en: 'What is the forecast for the week?', level: 'advanced' },
      { key: 'heat_wave', en: 'There is a heat wave', level: 'advanced' },
      { key: 'freezing', en: 'It is freezing outside', level: 'advanced' },
      { key: 'perfect_weather', en: 'The weather is perfect for outdoor activities', level: 'advanced' },
      { key: 'unpredictable', en: 'The weather has been unpredictable', level: 'advanced' },
      { key: 'dress_warmly', en: 'Make sure to dress warmly', level: 'advanced' },
    ]
  },
  {
    id: 'emergency',
    title: 'Emergency',
    icon: '🚨',
    phrases: [
      // Beginner
      { key: 'help', en: 'Help!', level: 'beginner' },
      { key: 'stop', en: 'Stop!', level: 'beginner' },
      { key: 'fire', en: 'Fire!', level: 'beginner' },
      { key: 'doctor', en: 'Doctor', level: 'beginner' },
      { key: 'hospital', en: 'Hospital', level: 'beginner' },
      // Basic
      { key: 'call_police', en: 'Call the police', level: 'basic' },
      { key: 'call_ambulance', en: 'Call an ambulance', level: 'basic' },
      { key: 'i_am_lost', en: 'I am lost', level: 'basic' },
      { key: 'i_am_sick', en: 'I am sick', level: 'basic' },
      { key: 'i_am_hurt', en: 'I am hurt', level: 'basic' },
      { key: 'pharmacy', en: 'Where is the pharmacy?', level: 'basic' },
      { key: 'emergency', en: 'Emergency', level: 'basic' },
      // Intermediate
      { key: 'need_doctor', en: 'I need a doctor', level: 'intermediate' },
      { key: 'not_feeling_well', en: 'I am not feeling well', level: 'intermediate' },
      { key: 'accident', en: 'There has been an accident', level: 'intermediate' },
      { key: 'call_emergency', en: 'Please call emergency services', level: 'intermediate' },
      { key: 'where_hospital', en: 'Where is the nearest hospital?', level: 'intermediate' },
      { key: 'need_medicine', en: 'I need medicine', level: 'intermediate' },
      // Advanced
      { key: 'stolen', en: 'Someone stole my wallet', level: 'advanced' },
      { key: 'embassy', en: 'Where is the embassy?', level: 'advanced' },
      { key: 'file_report', en: 'I need to file a police report', level: 'advanced' },
      { key: 'insurance', en: 'I need to contact my insurance', level: 'advanced' },
      { key: 'allergic_reaction', en: 'I am having an allergic reaction', level: 'advanced' },
      { key: 'chest_pain', en: 'I am experiencing chest pain', level: 'advanced' },
    ]
  },
  {
    id: 'feelings',
    title: 'Feelings & Emotions',
    icon: '😊',
    phrases: [
      // Beginner
      { key: 'happy', en: 'I am happy', level: 'beginner' },
      { key: 'sad', en: 'I am sad', level: 'beginner' },
      { key: 'tired', en: 'I am tired', level: 'beginner' },
      { key: 'good_feeling', en: 'I feel good', level: 'beginner' },
      { key: 'bad_feeling', en: 'I feel bad', level: 'beginner' },
      // Basic
      { key: 'excited', en: 'I am excited', level: 'basic' },
      { key: 'angry', en: 'I am angry', level: 'basic' },
      { key: 'scared', en: 'I am scared', level: 'basic' },
      { key: 'bored', en: 'I am bored', level: 'basic' },
      { key: 'surprised', en: 'I am surprised', level: 'basic' },
      { key: 'nervous', en: 'I am nervous', level: 'basic' },
      { key: 'relaxed', en: 'I am relaxed', level: 'basic' },
      // Intermediate
      { key: 'frustrated', en: 'I feel frustrated', level: 'intermediate' },
      { key: 'overwhelmed', en: 'I feel overwhelmed', level: 'intermediate' },
      { key: 'grateful', en: 'I am grateful', level: 'intermediate' },
      { key: 'disappointed', en: 'I am disappointed', level: 'intermediate' },
      { key: 'confident', en: 'I feel confident', level: 'intermediate' },
      { key: 'lonely', en: 'I feel lonely', level: 'intermediate' },
      // Advanced
      { key: 'mixed_feelings', en: 'I have mixed feelings about this', level: 'advanced' },
      { key: 'under_pressure', en: 'I feel under pressure', level: 'advanced' },
      { key: 'at_peace', en: 'I feel at peace', level: 'advanced' },
      { key: 'nostalgic', en: 'I am feeling nostalgic', level: 'advanced' },
      { key: 'relieved', en: 'I am relieved to hear that', level: 'advanced' },
      { key: 'anxious', en: 'I am feeling quite anxious', level: 'advanced' },
    ]
  },
  {
    id: 'hobbies',
    title: 'Hobbies & Activities',
    icon: '🎨',
    phrases: [
      // Beginner
      { key: 'music', en: 'Music', level: 'beginner' },
      { key: 'sports', en: 'Sports', level: 'beginner' },
      { key: 'books', en: 'Books', level: 'beginner' },
      { key: 'movies', en: 'Movies', level: 'beginner' },
      { key: 'cooking', en: 'Cooking', level: 'beginner' },
      // Basic
      { key: 'i_like', en: 'I like...', level: 'basic' },
      { key: 'i_love', en: 'I love...', level: 'basic' },
      { key: 'i_dont_like', en: "I don't like...", level: 'basic' },
      { key: 'do_you_like', en: 'Do you like...?', level: 'basic' },
      { key: 'my_hobby', en: 'My hobby is...', level: 'basic' },
      { key: 'free_time', en: 'In my free time', level: 'basic' },
      { key: 'play_sports', en: 'I play sports', level: 'basic' },
      // Intermediate
      { key: 'what_hobbies', en: 'What are your hobbies?', level: 'intermediate' },
      { key: 'interested_in', en: 'I am interested in...', level: 'intermediate' },
      { key: 'enjoy_doing', en: 'I enjoy doing...', level: 'intermediate' },
      { key: 'good_at', en: 'I am good at...', level: 'intermediate' },
      { key: 'learning_to', en: 'I am learning to...', level: 'intermediate' },
      { key: 'play_instrument', en: 'I play an instrument', level: 'intermediate' },
      // Advanced
      { key: 'passionate_about', en: 'I am passionate about...', level: 'advanced' },
      { key: 'recently_started', en: 'I have recently started...', level: 'advanced' },
      { key: 'how_long_hobby', en: 'How long have you been doing that?', level: 'advanced' },
      { key: 'recommend_trying', en: 'I would recommend trying...', level: 'advanced' },
      { key: 'spare_time', en: 'In my spare time I usually...', level: 'advanced' },
      { key: 'get_into', en: 'I got into it because...', level: 'advanced' },
    ]
  },
  {
    id: 'work',
    title: 'Work & Business',
    icon: '💼',
    phrases: [
      // Beginner
      { key: 'work_noun', en: 'Work', level: 'beginner' },
      { key: 'office', en: 'Office', level: 'beginner' },
      { key: 'job', en: 'Job', level: 'beginner' },
      { key: 'boss', en: 'Boss', level: 'beginner' },
      { key: 'meeting', en: 'Meeting', level: 'beginner' },
      // Basic
      { key: 'i_work', en: 'I work at...', level: 'basic' },
      { key: 'i_have_meeting', en: 'I have a meeting', level: 'basic' },
      { key: 'my_job', en: 'My job is...', level: 'basic' },
      { key: 'busy', en: 'I am busy', level: 'basic' },
      { key: 'not_available', en: 'I am not available', level: 'basic' },
      { key: 'can_i_help', en: 'Can I help you?', level: 'basic' },
      { key: 'one_moment', en: 'One moment, please', level: 'basic' },
      // Intermediate
      { key: 'schedule_meeting', en: 'Can we schedule a meeting?', level: 'intermediate' },
      { key: 'send_email', en: 'I will send you an email', level: 'intermediate' },
      { key: 'deadline', en: 'When is the deadline?', level: 'intermediate' },
      { key: 'work_from_home', en: 'I work from home', level: 'intermediate' },
      { key: 'on_vacation', en: 'I am on vacation', level: 'intermediate' },
      { key: 'call_back', en: 'Can you call back later?', level: 'intermediate' },
      // Advanced
      { key: 'discuss_project', en: 'I would like to discuss the project', level: 'advanced' },
      { key: 'proposal', en: 'I will prepare a proposal', level: 'advanced' },
      { key: 'negotiate', en: 'We need to negotiate the terms', level: 'advanced' },
      { key: 'follow_up', en: 'I will follow up on that', level: 'advanced' },
      { key: 'touch_base', en: 'Let us touch base next week', level: 'advanced' },
      { key: 'going_forward', en: 'Going forward, we should...', level: 'advanced' },
    ]
  },
  {
    id: 'family',
    title: 'Family & Relationships',
    icon: '👨‍👩‍👧‍👦',
    phrases: [
      // Beginner
      { key: 'mom', en: 'Mom', level: 'beginner' },
      { key: 'dad', en: 'Dad', level: 'beginner' },
      { key: 'brother', en: 'Brother', level: 'beginner' },
      { key: 'sister', en: 'Sister', level: 'beginner' },
      { key: 'family', en: 'Family', level: 'beginner' },
      // Basic
      { key: 'parents', en: 'Parents', level: 'basic' },
      { key: 'children', en: 'Children', level: 'basic' },
      { key: 'husband', en: 'Husband', level: 'basic' },
      { key: 'wife', en: 'Wife', level: 'basic' },
      { key: 'friend', en: 'Friend', level: 'basic' },
      { key: 'i_love_you', en: 'I love you', level: 'basic' },
      { key: 'this_is_my', en: 'This is my...', level: 'basic' },
      // Intermediate
      { key: 'grandmother', en: 'Grandmother', level: 'intermediate' },
      { key: 'grandfather', en: 'Grandfather', level: 'intermediate' },
      { key: 'aunt', en: 'Aunt', level: 'intermediate' },
      { key: 'uncle', en: 'Uncle', level: 'intermediate' },
      { key: 'cousin', en: 'Cousin', level: 'intermediate' },
      { key: 'how_many_siblings', en: 'How many siblings do you have?', level: 'intermediate' },
      // Advanced
      { key: 'close_to_family', en: 'I am very close to my family', level: 'advanced' },
      { key: 'family_gathering', en: 'We are having a family gathering', level: 'advanced' },
      { key: 'runs_in_family', en: 'It runs in the family', level: 'advanced' },
      { key: 'married_for', en: 'We have been married for...', level: 'advanced' },
      { key: 'expecting', en: 'We are expecting a baby', level: 'advanced' },
      { key: 'raise_children', en: 'How do you raise your children?', level: 'advanced' },
    ]
  },
];

// Kids phrase library - simplified and fun
export const KIDS_PHRASE_LIBRARY: CategoryData[] = [
  {
    id: 'greetings',
    title: 'Say Hi! 👋',
    icon: '👋',
    phrases: [
      { key: 'hello', en: 'Hello!', level: 'beginner' },
      { key: 'hi', en: 'Hi!', level: 'beginner' },
      { key: 'good_morning', en: 'Good morning!', level: 'beginner' },
      { key: 'goodbye', en: 'Bye bye!', level: 'beginner' },
      { key: 'how_are_you', en: 'How are you?', level: 'basic' },
      { key: 'im_fine', en: 'I am fine!', level: 'basic' },
      { key: 'see_you', en: 'See you!', level: 'basic' },
    ]
  },
  {
    id: 'polite',
    title: 'Magic Words ✨',
    icon: '✨',
    phrases: [
      { key: 'please', en: 'Please', level: 'beginner' },
      { key: 'thank_you', en: 'Thank you!', level: 'beginner' },
      { key: 'sorry', en: 'Sorry', level: 'beginner' },
      { key: 'excuse_me', en: 'Excuse me', level: 'basic' },
      { key: 'youre_welcome', en: "You're welcome", level: 'basic' },
      { key: 'help_please', en: 'Help, please!', level: 'basic' },
    ]
  },
  {
    id: 'basics',
    title: 'Yes & No 👍',
    icon: '👍',
    phrases: [
      { key: 'yes', en: 'Yes!', level: 'beginner' },
      { key: 'no', en: 'No', level: 'beginner' },
      { key: 'i_dont_know', en: "I don't know", level: 'basic' },
      { key: 'help', en: 'Help!', level: 'beginner' },
      { key: 'i_understand', en: 'I understand', level: 'basic' },
      { key: 'i_dont_understand', en: "I don't understand", level: 'basic' },
    ]
  },
  {
    id: 'food',
    title: 'Yummy Food! 🍎',
    icon: '🍎',
    phrases: [
      { key: 'water', en: 'Water', level: 'beginner' },
      { key: 'food', en: 'Food', level: 'beginner' },
      { key: 'apple', en: 'Apple', level: 'beginner' },
      { key: 'hungry', en: 'I am hungry', level: 'basic' },
      { key: 'thirsty', en: 'I am thirsty', level: 'basic' },
      { key: 'delicious', en: 'Delicious!', level: 'basic' },
      { key: 'more_please', en: 'More, please', level: 'basic' },
    ]
  },
  {
    id: 'family',
    title: 'My Family 👨‍👩‍👧',
    icon: '👨‍👩‍👧',
    phrases: [
      { key: 'mom', en: 'Mom', level: 'beginner' },
      { key: 'dad', en: 'Dad', level: 'beginner' },
      { key: 'brother', en: 'Brother', level: 'beginner' },
      { key: 'sister', en: 'Sister', level: 'beginner' },
      { key: 'i_love_you', en: 'I love you', level: 'basic' },
      { key: 'my_family', en: 'My family', level: 'basic' },
    ]
  },
  {
    id: 'animals',
    title: 'Animals 🐶',
    icon: '🐶',
    phrases: [
      { key: 'dog', en: 'Dog', level: 'beginner' },
      { key: 'cat', en: 'Cat', level: 'beginner' },
      { key: 'bird', en: 'Bird', level: 'beginner' },
      { key: 'fish', en: 'Fish', level: 'beginner' },
      { key: 'rabbit', en: 'Rabbit', level: 'basic' },
      { key: 'i_have_pet', en: 'I have a pet', level: 'basic' },
      { key: 'i_like_animals', en: 'I like animals', level: 'basic' },
    ]
  },
  {
    id: 'colors',
    title: 'Colors 🌈',
    icon: '🌈',
    phrases: [
      { key: 'red', en: 'Red', level: 'beginner' },
      { key: 'blue', en: 'Blue', level: 'beginner' },
      { key: 'green', en: 'Green', level: 'beginner' },
      { key: 'yellow', en: 'Yellow', level: 'beginner' },
      { key: 'orange', en: 'Orange', level: 'basic' },
      { key: 'purple', en: 'Purple', level: 'basic' },
      { key: 'favorite_color', en: 'My favorite color is...', level: 'basic' },
    ]
  },
  {
    id: 'numbers',
    title: 'Count! 🔢',
    icon: '🔢',
    phrases: [
      { key: 'one', en: 'One', level: 'beginner' },
      { key: 'two', en: 'Two', level: 'beginner' },
      { key: 'three', en: 'Three', level: 'beginner' },
      { key: 'four', en: 'Four', level: 'beginner' },
      { key: 'five', en: 'Five', level: 'beginner' },
      { key: 'six', en: 'Six', level: 'basic' },
      { key: 'seven', en: 'Seven', level: 'basic' },
      { key: 'eight', en: 'Eight', level: 'basic' },
      { key: 'nine', en: 'Nine', level: 'basic' },
      { key: 'ten', en: 'Ten', level: 'basic' },
    ]
  },
];

// Massive translations database
export const EXTENDED_TRANSLATIONS: Record<string, Record<string, string>> = {
  es: {
    // Greetings
    hello: 'Hola', hi: 'Hola', good_morning: 'Buenos días', good_afternoon: 'Buenas tardes',
    good_evening: 'Buenas noches', good_night: 'Buenas noches', goodbye: 'Adiós', bye: 'Adiós',
    how_are_you: '¿Cómo estás?', im_fine: 'Estoy bien', im_good: 'Estoy bien', and_you: '¿Y tú?',
    nice_to_meet_you: 'Mucho gusto', welcome: 'Bienvenido', whats_up: '¿Qué tal?',
    how_is_it_going: '¿Cómo va todo?', see_you_later: 'Hasta luego', see_you_tomorrow: 'Hasta mañana',
    see_you_soon: 'Hasta pronto', have_a_nice_day: 'Que tengas un buen día',
    have_a_good_weekend: 'Buen fin de semana', take_care: 'Cuídate',
    its_been_a_pleasure: 'Ha sido un placer', how_have_you_been: '¿Cómo has estado?',
    long_time_no_see: 'Cuánto tiempo sin verte', pleasure_to_meet_you: 'Es un placer conocerte',
    looking_forward: 'Espero verte pronto', keep_in_touch: 'Mantengamos el contacto',
    give_regards: 'Dale mis saludos a tu familia', delighted_meet: 'Encantado de conocerte',
    
    // Basics
    yes: 'Sí', no: 'No', please: 'Por favor', thank_you: 'Gracias', thanks: 'Gracias',
    ok: 'Vale', good: 'Bueno', bad: 'Malo', excuse_me: 'Disculpe', sorry: 'Lo siento',
    i_dont_understand: 'No entiendo', i_understand: 'Entiendo', i_dont_know: 'No sé',
    i_think_so: 'Creo que sí', maybe: 'Quizás', of_course: 'Por supuesto',
    can_you_repeat: '¿Puede repetir?', speak_slowly: 'Hable despacio, por favor',
    how_do_you_say: '¿Cómo se dice...?', what_does_mean: '¿Qué significa eso?',
    i_dont_speak_well: 'No hablo muy bien', im_learning: 'Estoy aprendiendo tu idioma',
    could_you_help: '¿Podría ayudarme?', no_problem: 'No hay problema',
    i_appreciate_it: 'Te lo agradezco mucho', thats_very_kind: 'Eso es muy amable de tu parte',
    i_apologize: 'Pido disculpas sinceramente', would_you_mind: '¿Te importaría explicar eso?',
    if_im_not_mistaken: 'Si no me equivoco', to_be_honest: 'Para ser honesto contigo',
    
    // Introductions
    my_name_is: 'Me llamo...', i_am: 'Soy...', this_is: 'Este es...',
    whats_your_name: '¿Cómo te llamas?', nice_meet: 'Encantado',
    where_from: '¿De dónde eres?', i_am_from: 'Soy de...',
    i_live_in: 'Vivo en...', how_old: '¿Cuántos años tienes?', i_am_years: 'Tengo ... años',
    what_do_you_do: '¿A qué te dedicas?', i_work_as: 'Trabajo como...',
    i_am_student: 'Soy estudiante', i_study: 'Estudio...', i_speak: 'Hablo...',
    do_you_speak: '¿Hablas inglés?', where_work: '¿Dónde trabajas?',
    how_long_here: '¿Cuánto tiempo llevas aquí?', pleasure_meeting: 'Fue un placer conocerte',
    allow_introduce: 'Permíteme presentarme', heard_lot: 'He oído mucho de ti',
    looking_forward_working: 'Espero trabajar contigo', may_i_ask: '¿Puedo preguntar a qué te dedicas?',
    background_in: 'Tengo experiencia en...',
    
    // Numbers
    zero: 'Cero', one: 'Uno', two: 'Dos', three: 'Tres', four: 'Cuatro',
    five: 'Cinco', six: 'Seis', seven: 'Siete', eight: 'Ocho', nine: 'Nueve', ten: 'Diez',
    eleven: 'Once', twelve: 'Doce', thirteen: 'Trece', fourteen: 'Catorce', fifteen: 'Quince',
    sixteen: 'Dieciséis', seventeen: 'Diecisiete', eighteen: 'Dieciocho', nineteen: 'Diecinueve',
    twenty: 'Veinte', twenty_one: 'Veintiuno', thirty: 'Treinta', forty: 'Cuarenta',
    fifty: 'Cincuenta', sixty: 'Sesenta', seventy: 'Setenta', eighty: 'Ochenta', ninety: 'Noventa',
    hundred: 'Cien', two_hundred: 'Doscientos', three_hundred: 'Trescientos',
    five_hundred: 'Quinientos', thousand: 'Mil', two_thousand: 'Dos mil', million: 'Un millón',
    first: 'Primero', second: 'Segundo', third: 'Tercero', fourth: 'Cuarto', fifth: 'Quinto',
    tenth: 'Décimo', half: 'Medio', quarter: 'Un cuarto', percentage: 'Cincuenta por ciento',
    how_much_cost: '¿Cuánto cuesta?', what_is_price: '¿Cuál es el precio?',
    it_costs_ten: 'Cuesta diez dólares', phone_number: '¿Cuál es tu número de teléfono?',
    my_number_is: 'Mi número es...',
    
    // Time
    today: 'Hoy', tomorrow: 'Mañana', yesterday: 'Ayer', now: 'Ahora', later: 'Más tarde',
    what_time: '¿Qué hora es?', morning: 'Por la mañana', afternoon: 'Por la tarde',
    evening: 'Por la noche', night: 'Por la noche',
    monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves',
    friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
    at_what_time: '¿A qué hora?', next_week: 'La próxima semana', last_week: 'La semana pasada',
    this_month: 'Este mes', next_year: 'El próximo año', in_one_hour: 'En una hora',
    half_past: 'Las dos y media', quarter_past: 'Las tres y cuarto',
    what_day: '¿Qué día es?', what_date: '¿Cuál es la fecha?',
    day_after_tomorrow: 'Pasado mañana', day_before_yesterday: 'Anteayer',
    in_two_weeks: 'En dos semanas', around_noon: 'Alrededor del mediodía',
    at_the_latest: 'A más tardar a las cinco', as_soon_as: 'Lo antes posible',
    
    // Directions
    left: 'Izquierda', right: 'Derecha', straight: 'Todo recto', here: 'Aquí', there: 'Allí',
    where_is: '¿Dónde está...?', where_is_bathroom: '¿Dónde está el baño?',
    where_is_station: '¿Dónde está la estación?', turn_left: 'Gire a la izquierda',
    turn_right: 'Gire a la derecha', go_straight: 'Siga recto', near: 'Cerca', far: 'Lejos',
    how_do_i_get_to: '¿Cómo llego a...?', is_it_far: '¿Está lejos de aquí?',
    next_to: 'Al lado de', across_from: 'Enfrente de', on_the_corner: 'En la esquina',
    at_the_end: 'Al final de la calle', take_first: 'Tome la primera a la izquierda',
    keep_going: 'Siga recto', can_you_show_map: '¿Puede mostrarme en el mapa?',
    how_far_walking: '¿A cuánto queda caminando?', which_bus: '¿Qué autobús debo tomar?',
    get_off_at: 'Bájese en la tercera parada', you_cant_miss: 'No tiene pérdida',
    its_about: 'Está a unos diez minutos',
    
    // Shopping
    how_much: '¿Cuánto?', this: 'Esto', that: 'Eso', big: 'Grande', small: 'Pequeño',
    how_much_this: '¿Cuánto cuesta esto?', too_expensive: 'Muy caro', cheap: 'Barato',
    i_want_to_buy: 'Quiero comprar...', do_you_have: '¿Tiene...?', i_need: 'Necesito...',
    cash: 'Efectivo', card: 'Tarjeta', different_size: '¿Tiene otra talla?',
    different_color: '¿Tiene otro color?', can_i_try: '¿Puedo probármelo?',
    ill_take_it: 'Me lo llevo', just_looking: 'Solo estoy mirando',
    wheres_fitting: '¿Dónde está el probador?', do_you_accept_cards: '¿Aceptan tarjetas?',
    can_i_pay: '¿Puedo pagar con tarjeta?', can_you_discount: '¿Puede hacerme un descuento?',
    is_there_warranty: '¿Tiene garantía?', can_i_return: '¿Puedo devolverlo?',
    do_you_deliver: '¿Hacen entregas?', out_of_stock: '¿Está agotado?',
    when_available: '¿Cuándo estará disponible?',
    
    // Restaurant
    water: 'Agua', food: 'Comida', coffee: 'Café', tea: 'Té', bread: 'Pan',
    menu_please: 'El menú, por favor', i_would_like: 'Me gustaría...',
    the_bill_please: 'La cuenta, por favor', delicious: 'Delicioso',
    hungry: 'Tengo hambre', thirsty: 'Tengo sed', more_please: 'Más, por favor',
    what_recommend: '¿Qué recomienda?', vegetarian: 'Soy vegetariano', vegan: 'Soy vegano',
    allergic_to: 'Soy alérgico a...', no_meat: 'Sin carne, por favor',
    more_water: 'Más agua, por favor', is_this_spicy: '¿Esto es picante?',
    table_for: 'Una mesa para dos, por favor', reservation_for: 'Tengo una reserva para...',
    special_today: '¿Cuál es el especial de hoy?', gluten_free: '¿Tienen opciones sin gluten?',
    separate_bills: '¿Podemos pagar por separado?', compliments_chef: 'Felicidades al chef',
    wine_list: '¿Puedo ver la carta de vinos?',
    
    // Travel
    airport: 'Aeropuerto', train: 'Tren', bus: 'Autobús', taxi: 'Taxi', hotel: 'Hotel',
    ticket_please: 'Un billete, por favor', what_time_leave: '¿A qué hora sale?',
    where_is_airport: '¿Dónde está el aeropuerto?', i_have_reservation: 'Tengo una reserva',
    passport: 'Pasaporte', luggage: 'Equipaje', departure: 'Salida', arrival: 'Llegada',
    round_trip: 'Ida y vuelta, por favor', one_way: 'Solo ida', delayed: '¿Está retrasado?',
    platform: '¿Qué andén?', gate: '¿Qué puerta?', check_in: '¿Dónde hago el check-in?',
    boarding_time: '¿A qué hora es el embarque?', window_seat: 'Asiento de ventana, por favor',
    lost_luggage: 'He perdido mi equipaje', missed_flight: 'He perdido mi vuelo',
    connecting_flight: 'Tengo un vuelo de conexión', upgrade: '¿Puedo mejorar mi asiento?',
    delay_reason: '¿Cuál es el motivo del retraso?', claim_baggage: '¿Dónde recojo mi equipaje?',
    
    // Weather
    sunny: 'Hace sol', raining: 'Está lloviendo', cold: 'Hace frío', hot: 'Hace calor',
    cloudy: 'Está nublado', weather_today: '¿Cómo está el clima hoy?',
    nice_weather: 'Hace buen tiempo hoy', bad_weather: 'Hace mal tiempo hoy',
    windy: 'Hace viento', snowing: 'Está nevando', warm: 'Hace calor', cool: 'Hace fresco',
    will_rain: '¿Lloverá mañana?', temperature: '¿Cuál es la temperatura?',
    humid: 'Hace mucha humedad', foggy: 'Hay niebla', storm: 'Viene una tormenta',
    need_umbrella: '¿Necesito paraguas?', forecast: '¿Cuál es el pronóstico de la semana?',
    heat_wave: 'Hay una ola de calor', freezing: 'Hace muchísimo frío',
    perfect_weather: 'El clima es perfecto para actividades al aire libre',
    unpredictable: 'El clima ha sido impredecible', dress_warmly: 'Abrígate bien',
    
    // Emergency
    help: '¡Ayuda!', stop: '¡Para!', fire: '¡Fuego!', doctor: 'Médico', hospital: 'Hospital',
    call_police: 'Llame a la policía', call_ambulance: 'Llame una ambulancia',
    i_am_lost: 'Estoy perdido', i_am_sick: 'Estoy enfermo', i_am_hurt: 'Estoy herido',
    pharmacy: '¿Dónde está la farmacia?', emergency: 'Emergencia',
    need_doctor: 'Necesito un médico', not_feeling_well: 'No me siento bien',
    accident: 'Ha habido un accidente', call_emergency: 'Llame a emergencias',
    where_hospital: '¿Dónde está el hospital más cercano?', need_medicine: 'Necesito medicinas',
    stolen: 'Me han robado la cartera', embassy: '¿Dónde está la embajada?',
    file_report: 'Necesito hacer una denuncia', insurance: 'Necesito contactar a mi seguro',
    allergic_reaction: 'Estoy teniendo una reacción alérgica',
    chest_pain: 'Tengo dolor en el pecho',
    
    // Feelings
    happy: 'Estoy feliz', sad: 'Estoy triste', tired: 'Estoy cansado',
    good_feeling: 'Me siento bien', bad_feeling: 'Me siento mal',
    excited: 'Estoy emocionado', angry: 'Estoy enojado', scared: 'Tengo miedo',
    bored: 'Estoy aburrido', surprised: 'Estoy sorprendido', nervous: 'Estoy nervioso',
    relaxed: 'Estoy relajado', frustrated: 'Me siento frustrado',
    overwhelmed: 'Me siento abrumado', grateful: 'Estoy agradecido',
    disappointed: 'Estoy decepcionado', confident: 'Me siento seguro',
    lonely: 'Me siento solo', mixed_feelings: 'Tengo sentimientos encontrados',
    under_pressure: 'Me siento bajo presión', at_peace: 'Me siento en paz',
    nostalgic: 'Me siento nostálgico', relieved: 'Me alivia escuchar eso',
    anxious: 'Me siento bastante ansioso',
    
    // Hobbies
    music: 'Música', sports: 'Deportes', books: 'Libros', movies: 'Películas', cooking: 'Cocinar',
    i_like: 'Me gusta...', i_love: 'Me encanta...', i_dont_like: 'No me gusta...',
    do_you_like: '¿Te gusta...?', my_hobby: 'Mi pasatiempo es...', free_time: 'En mi tiempo libre',
    play_sports: 'Hago deporte', what_hobbies: '¿Cuáles son tus pasatiempos?',
    interested_in: 'Me interesa...', enjoy_doing: 'Disfruto haciendo...',
    good_at: 'Soy bueno en...', learning_to: 'Estoy aprendiendo a...',
    play_instrument: 'Toco un instrumento', passionate_about: 'Me apasiona...',
    recently_started: 'Recientemente empecé a...', how_long_hobby: '¿Cuánto tiempo llevas haciéndolo?',
    recommend_trying: 'Te recomendaría probar...', spare_time: 'En mi tiempo libre suelo...',
    get_into: 'Empecé porque...',
    
    // Work
    work_noun: 'Trabajo', office: 'Oficina', job: 'Empleo', boss: 'Jefe', meeting: 'Reunión',
    i_work: 'Trabajo en...', i_have_meeting: 'Tengo una reunión', my_job: 'Mi trabajo es...',
    busy: 'Estoy ocupado', not_available: 'No estoy disponible', can_i_help: '¿Puedo ayudarte?',
    one_moment: 'Un momento, por favor', schedule_meeting: '¿Podemos programar una reunión?',
    send_email: 'Te enviaré un correo', deadline: '¿Cuándo es la fecha límite?',
    work_from_home: 'Trabajo desde casa', on_vacation: 'Estoy de vacaciones',
    call_back: '¿Puede llamar más tarde?', discuss_project: 'Me gustaría discutir el proyecto',
    proposal: 'Prepararé una propuesta', negotiate: 'Necesitamos negociar los términos',
    follow_up: 'Daré seguimiento a eso', touch_base: 'Hablemos la próxima semana',
    going_forward: 'De ahora en adelante, deberíamos...',
    
    // Family
    mom: 'Mamá', dad: 'Papá', brother: 'Hermano', sister: 'Hermana', family: 'Familia',
    parents: 'Padres', children: 'Hijos', husband: 'Esposo', wife: 'Esposa', friend: 'Amigo',
    i_love_you: 'Te quiero', this_is_my: 'Este es mi...',
    grandmother: 'Abuela', grandfather: 'Abuelo', aunt: 'Tía', uncle: 'Tío', cousin: 'Primo',
    how_many_siblings: '¿Cuántos hermanos tienes?', close_to_family: 'Soy muy unido a mi familia',
    family_gathering: 'Tenemos una reunión familiar', runs_in_family: 'Es de familia',
    married_for: 'Llevamos casados...', expecting: 'Esperamos un bebé',
    raise_children: '¿Cómo crías a tus hijos?',
    
    // Kids extras
    apple: 'Manzana', see_you: '¡Nos vemos!', help_please: '¡Ayuda, por favor!',
    rabbit: 'Conejo', i_like_animals: 'Me gustan los animales',
    orange: 'Naranja', purple: 'Morado', favorite_color: 'Mi color favorito es...',
    my_family: 'Mi familia', dog: 'Perro', cat: 'Gato', bird: 'Pájaro', fish: 'Pez',
    i_have_pet: 'Tengo una mascota', red: 'Rojo', blue: 'Azul', green: 'Verde', yellow: 'Amarillo',
    youre_welcome: 'De nada',
  },
  
  fr: {
    // Greetings
    hello: 'Bonjour', hi: 'Salut', good_morning: 'Bonjour', good_afternoon: 'Bon après-midi',
    good_evening: 'Bonsoir', good_night: 'Bonne nuit', goodbye: 'Au revoir', bye: 'Salut',
    how_are_you: 'Comment allez-vous?', im_fine: 'Je vais bien', im_good: 'Je vais bien',
    and_you: 'Et vous?', nice_to_meet_you: 'Enchanté', welcome: 'Bienvenue',
    whats_up: 'Quoi de neuf?', how_is_it_going: 'Comment ça va?',
    see_you_later: 'À plus tard', see_you_tomorrow: 'À demain', see_you_soon: 'À bientôt',
    have_a_nice_day: 'Bonne journée', have_a_good_weekend: 'Bon week-end', take_care: 'Prenez soin de vous',
    its_been_a_pleasure: "C'était un plaisir", how_have_you_been: 'Comment avez-vous été?',
    long_time_no_see: 'Ça fait longtemps', pleasure_to_meet_you: "C'est un plaisir de vous rencontrer",
    
    // Basics
    yes: 'Oui', no: 'Non', please: "S'il vous plaît", thank_you: 'Merci', thanks: 'Merci',
    ok: "D'accord", good: 'Bon', bad: 'Mauvais', excuse_me: 'Excusez-moi', sorry: 'Pardon',
    i_dont_understand: 'Je ne comprends pas', i_understand: 'Je comprends', i_dont_know: 'Je ne sais pas',
    i_think_so: 'Je pense que oui', maybe: 'Peut-être', of_course: 'Bien sûr',
    can_you_repeat: 'Pouvez-vous répéter?', speak_slowly: "Parlez lentement, s'il vous plaît",
    how_do_you_say: 'Comment dit-on...?', what_does_mean: 'Que signifie cela?',
    
    // Introductions
    my_name_is: 'Je m\'appelle...', whats_your_name: 'Comment vous appelez-vous?',
    where_from: 'D\'où venez-vous?', i_am_from: 'Je viens de...',
    what_do_you_do: 'Que faites-vous dans la vie?', i_work_as: 'Je travaille comme...',
    pleasure_meeting: "C'était un plaisir de vous rencontrer",
    
    // Numbers
    zero: 'Zéro', one: 'Un', two: 'Deux', three: 'Trois', four: 'Quatre',
    five: 'Cinq', six: 'Six', seven: 'Sept', eight: 'Huit', nine: 'Neuf', ten: 'Dix',
    eleven: 'Onze', twelve: 'Douze', thirteen: 'Treize', fourteen: 'Quatorze', fifteen: 'Quinze',
    sixteen: 'Seize', seventeen: 'Dix-sept', eighteen: 'Dix-huit', nineteen: 'Dix-neuf',
    twenty: 'Vingt', thirty: 'Trente', forty: 'Quarante', fifty: 'Cinquante',
    sixty: 'Soixante', seventy: 'Soixante-dix', eighty: 'Quatre-vingts', ninety: 'Quatre-vingt-dix',
    hundred: 'Cent', thousand: 'Mille', first: 'Premier', second: 'Deuxième', third: 'Troisième',
    how_much_cost: 'Combien ça coûte?',
    
    // Time
    today: "Aujourd'hui", tomorrow: 'Demain', yesterday: 'Hier', now: 'Maintenant',
    what_time: 'Quelle heure est-il?', morning: 'Le matin', afternoon: "L'après-midi",
    monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi', thursday: 'Jeudi',
    friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
    
    // Directions
    left: 'Gauche', right: 'Droite', straight: 'Tout droit',
    where_is_bathroom: 'Où sont les toilettes?', where_is: 'Où est...?',
    
    // Shopping & Restaurant
    how_much: 'Combien?', too_expensive: 'Trop cher', menu_please: "Le menu, s'il vous plaît",
    the_bill_please: "L'addition, s'il vous plaît", delicious: 'Délicieux',
    water: 'Eau', coffee: 'Café', tea: 'Thé', bread: 'Pain',
    
    // Family
    mom: 'Maman', dad: 'Papa', brother: 'Frère', sister: 'Sœur', i_love_you: "Je t'aime",
    dog: 'Chien', cat: 'Chat', red: 'Rouge', blue: 'Bleu', green: 'Vert', yellow: 'Jaune',
    
    // Emergency
    help: 'Au secours!', hospital: 'Hôpital', doctor: 'Médecin',
    call_police: 'Appelez la police', i_am_lost: 'Je suis perdu',
  },
  
  de: {
    // Greetings
    hello: 'Hallo', hi: 'Hi', good_morning: 'Guten Morgen', good_afternoon: 'Guten Tag',
    good_evening: 'Guten Abend', good_night: 'Gute Nacht', goodbye: 'Auf Wiedersehen', bye: 'Tschüss',
    how_are_you: 'Wie geht es Ihnen?', im_fine: 'Mir geht es gut', im_good: 'Mir geht es gut',
    nice_to_meet_you: 'Freut mich', welcome: 'Willkommen',
    see_you_later: 'Bis später', have_a_nice_day: 'Schönen Tag noch',
    
    // Basics
    yes: 'Ja', no: 'Nein', please: 'Bitte', thank_you: 'Danke', sorry: 'Entschuldigung',
    i_dont_understand: 'Ich verstehe nicht', i_understand: 'Ich verstehe',
    can_you_repeat: 'Können Sie das wiederholen?', speak_slowly: 'Bitte sprechen Sie langsam',
    
    // Introductions
    my_name_is: 'Ich heiße...', whats_your_name: 'Wie heißen Sie?',
    where_from: 'Woher kommen Sie?', i_am_from: 'Ich komme aus...',
    
    // Numbers
    zero: 'Null', one: 'Eins', two: 'Zwei', three: 'Drei', four: 'Vier',
    five: 'Fünf', six: 'Sechs', seven: 'Sieben', eight: 'Acht', nine: 'Neun', ten: 'Zehn',
    eleven: 'Elf', twelve: 'Zwölf', twenty: 'Zwanzig', hundred: 'Hundert', thousand: 'Tausend',
    
    // Directions
    left: 'Links', right: 'Rechts', straight: 'Geradeaus',
    where_is_bathroom: 'Wo ist die Toilette?',
    
    // Restaurant
    menu_please: 'Die Speisekarte, bitte', delicious: 'Köstlich',
    water: 'Wasser', coffee: 'Kaffee', tea: 'Tee', bread: 'Brot',
    
    // Time
    today: 'Heute', tomorrow: 'Morgen', yesterday: 'Gestern',
    
    // Family
    mom: 'Mama', dad: 'Papa', brother: 'Bruder', sister: 'Schwester', i_love_you: 'Ich liebe dich',
    dog: 'Hund', cat: 'Katze', red: 'Rot', blue: 'Blau', green: 'Grün', yellow: 'Gelb',
    
    // Emergency
    help: 'Hilfe!', hospital: 'Krankenhaus', doctor: 'Arzt',
  },
  
  ja: {
    // Greetings
    hello: 'こんにちは', hi: 'やあ', good_morning: 'おはようございます', good_evening: 'こんばんは',
    good_night: 'おやすみなさい', goodbye: 'さようなら', how_are_you: 'お元気ですか?',
    im_fine: '元気です', nice_to_meet_you: 'はじめまして', see_you_later: 'また後で',
    have_a_nice_day: '良い一日を',
    
    // Basics
    yes: 'はい', no: 'いいえ', please: 'お願いします', thank_you: 'ありがとう', sorry: 'すみません',
    i_dont_understand: 'わかりません', excuse_me: 'すみません',
    
    // Numbers
    one: '一', two: '二', three: '三', four: '四', five: '五',
    six: '六', seven: '七', eight: '八', nine: '九', ten: '十',
    
    // Directions
    left: '左', right: '右', straight: 'まっすぐ', where_is_bathroom: 'トイレはどこですか?',
    
    // Restaurant
    menu_please: 'メニューをください', delicious: 'おいしい', water: '水',
    
    // Family
    mom: 'お母さん', dad: 'お父さん', i_love_you: '愛してる',
    dog: '犬', cat: '猫', red: '赤', blue: '青', green: '緑',
    
    // Emergency
    help: '助けて!', hospital: '病院', doctor: '医者',
  },
  
  it: {
    hello: 'Ciao', good_morning: 'Buongiorno', goodbye: 'Arrivederci',
    how_are_you: 'Come stai?', im_fine: 'Sto bene', thank_you: 'Grazie',
    yes: 'Sì', no: 'No', please: 'Per favore', sorry: 'Scusa',
    one: 'Uno', two: 'Due', three: 'Tre', four: 'Quattro', five: 'Cinque',
    left: 'Sinistra', right: 'Destra', straight: 'Dritto',
    water: 'Acqua', coffee: 'Caffè', delicious: 'Delizioso',
    help: 'Aiuto!', i_love_you: 'Ti amo',
    dog: 'Cane', cat: 'Gatto', red: 'Rosso', blue: 'Blu', green: 'Verde',
  },
  
  pt: {
    hello: 'Olá', good_morning: 'Bom dia', goodbye: 'Adeus',
    how_are_you: 'Como está?', im_fine: 'Estou bem', thank_you: 'Obrigado',
    yes: 'Sim', no: 'Não', please: 'Por favor', sorry: 'Desculpe',
    one: 'Um', two: 'Dois', three: 'Três', four: 'Quatro', five: 'Cinco',
    left: 'Esquerda', right: 'Direita', straight: 'Em frente',
    water: 'Água', coffee: 'Café', delicious: 'Delicioso',
    help: 'Socorro!', i_love_you: 'Eu te amo',
    dog: 'Cão', cat: 'Gato', red: 'Vermelho', blue: 'Azul', green: 'Verde',
  },
  
  zh: {
    hello: '你好', good_morning: '早上好', goodbye: '再见',
    how_are_you: '你好吗?', im_fine: '我很好', thank_you: '谢谢',
    yes: '是', no: '不', please: '请', sorry: '对不起',
    one: '一', two: '二', three: '三', four: '四', five: '五',
    left: '左', right: '右', straight: '直走',
    water: '水', delicious: '好吃',
    help: '救命!', i_love_you: '我爱你',
    dog: '狗', cat: '猫', red: '红色', blue: '蓝色', green: '绿色',
  },
  
  ko: {
    hello: '안녕하세요', good_morning: '좋은 아침', goodbye: '안녕히 가세요',
    how_are_you: '어떻게 지내세요?', im_fine: '잘 지내요', thank_you: '감사합니다',
    yes: '네', no: '아니요', please: '제발', sorry: '미안합니다',
    one: '하나', two: '둘', three: '셋', four: '넷', five: '다섯',
    left: '왼쪽', right: '오른쪽', straight: '직진',
    water: '물', delicious: '맛있어요',
    help: '도와주세요!', i_love_you: '사랑해요',
    dog: '개', cat: '고양이', red: '빨간색', blue: '파란색', green: '초록색',
  },
  
  ru: {
    hello: 'Привет', good_morning: 'Доброе утро', goodbye: 'До свидания',
    how_are_you: 'Как дела?', im_fine: 'Хорошо', thank_you: 'Спасибо',
    yes: 'Да', no: 'Нет', please: 'Пожалуйста', sorry: 'Извините',
    one: 'Один', two: 'Два', three: 'Три', four: 'Четыре', five: 'Пять',
    left: 'Налево', right: 'Направо', straight: 'Прямо',
    water: 'Вода', delicious: 'Вкусно',
    help: 'Помогите!', i_love_you: 'Я тебя люблю',
    dog: 'Собака', cat: 'Кошка', red: 'Красный', blue: 'Синий', green: 'Зелёный',
  },
  
  ar: {
    hello: 'مرحبا', good_morning: 'صباح الخير', goodbye: 'مع السلامة',
    how_are_you: 'كيف حالك?', im_fine: 'أنا بخير', thank_you: 'شكرا',
    yes: 'نعم', no: 'لا', please: 'من فضلك', sorry: 'آسف',
    one: 'واحد', two: 'اثنان', three: 'ثلاثة', four: 'أربعة', five: 'خمسة',
    left: 'يسار', right: 'يمين', straight: 'مباشرة',
    water: 'ماء', help: 'مساعدة!', i_love_you: 'أحبك',
  },
};

export const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string; emoji: string }[] = [
  { value: 'beginner', label: 'Beginner', emoji: '🌱' },
  { value: 'basic', label: 'Basic', emoji: '📗' },
  { value: 'intermediate', label: 'Intermediate', emoji: '📘' },
  { value: 'advanced', label: 'Advanced', emoji: '🔥' },
];
