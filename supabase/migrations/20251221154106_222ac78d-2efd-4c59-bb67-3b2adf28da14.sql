-- Seed all 42 languages with units, lessons, and exercises

-- First, let's create a function to generate content for each language
DO $$
DECLARE
  lang_codes text[] := ARRAY['es','fr','de','ja','it','ko','zh','pt','ru','ar','tr','nl','sv','ga','pl','hi','he','vi','el','no','da','ro','fi','cs','uk','cy','gd','hu','id','haw','nv','sw','eo','val','tlh','la','yi','ht','zu','ta','ca','th'];
  lang_code text;
  unit_id uuid;
  lesson_id uuid;
  unit_titles text[] := ARRAY['Basics', 'Phrases', 'Food', 'Animals', 'Travel'];
  unit_descs text[] := ARRAY['Learn essential greetings and introductions', 'Common everyday expressions', 'Ordering food and talking about meals', 'Learn animal names and descriptions', 'Navigate airports and hotels'];
  unit_icons text[] := ARRAY['hand-wave', 'message-circle', 'utensils', 'cat', 'plane'];
  lesson_titles_1 text[] := ARRAY['Hello!', 'Introductions', 'How are you?', 'Numbers 1-10', 'Review'];
  lesson_titles_2 text[] := ARRAY['Please & Thanks', 'Asking Questions', 'Directions', 'Time', 'Review'];
  lesson_titles_3 text[] := ARRAY['At the Restaurant', 'Ordering Drinks', 'Breakfast', 'Dinner', 'Review'];
  lesson_titles_4 text[] := ARRAY['Pets', 'Farm Animals', 'Wild Animals', 'Sea Creatures', 'Review'];
  lesson_titles_5 text[] := ARRAY['At the Airport', 'Hotel Check-in', 'Transportation', 'Emergencies', 'Review'];
  i int;
  j int;
BEGIN
  -- Loop through each language (skip 'es' as it already has content)
  FOREACH lang_code IN ARRAY lang_codes LOOP
    -- Skip if units already exist for this language
    IF NOT EXISTS (SELECT 1 FROM units WHERE language_code = lang_code::language_code) THEN
      -- Create 5 units for each language
      FOR i IN 1..5 LOOP
        INSERT INTO units (language_code, unit_number, title, description, icon_name, cefr_level)
        VALUES (lang_code::language_code, i, unit_titles[i], unit_descs[i], unit_icons[i], 
                CASE WHEN i <= 3 THEN 'A1'::cefr_level ELSE 'A2'::cefr_level END)
        RETURNING id INTO unit_id;
        
        -- Create 5 lessons for each unit
        FOR j IN 1..5 LOOP
          INSERT INTO lessons (unit_id, lesson_number, title, xp_reward)
          VALUES (
            unit_id,
            j,
            CASE i
              WHEN 1 THEN lesson_titles_1[j]
              WHEN 2 THEN lesson_titles_2[j]
              WHEN 3 THEN lesson_titles_3[j]
              WHEN 4 THEN lesson_titles_4[j]
              WHEN 5 THEN lesson_titles_5[j]
            END,
            10
          )
          RETURNING id INTO lesson_id;
          
          -- Create 8 exercises for each lesson with varied types
          -- Exercise 1: Multiple choice
          INSERT INTO exercises (lesson_id, exercise_order, exercise_type, question, correct_answer, options, hint)
          VALUES (lesson_id, 1, 'multiple_choice', 
                  'Select the correct translation', 
                  'correct_option',
                  '["correct_option", "wrong_1", "wrong_2", "wrong_3"]'::jsonb,
                  'Choose the best answer');
          
          -- Exercise 2: Translation with word bank
          INSERT INTO exercises (lesson_id, exercise_order, exercise_type, question, correct_answer, options, hint)
          VALUES (lesson_id, 2, 'translation', 
                  'Translate this phrase', 
                  'translated_phrase',
                  '["word1", "word2", "word3", "word4"]'::jsonb,
                  'Use the word bank below');
          
          -- Exercise 3: Word bank
          INSERT INTO exercises (lesson_id, exercise_order, exercise_type, question, correct_answer, options, hint)
          VALUES (lesson_id, 3, 'word_bank', 
                  'Arrange the words correctly', 
                  'correct sentence',
                  '{"words": ["correct", "sentence", "extra", "word"]}'::jsonb,
                  'Build the sentence');
          
          -- Exercise 4: Match pairs
          INSERT INTO exercises (lesson_id, exercise_order, exercise_type, question, correct_answer, options, hint)
          VALUES (lesson_id, 4, 'match_pairs', 
                  'Match the pairs', 
                  'matched',
                  '{"pairs": [{"left": "Word 1", "right": "Translation 1"}, {"left": "Word 2", "right": "Translation 2"}, {"left": "Word 3", "right": "Translation 3"}]}'::jsonb,
                  NULL);
          
          -- Exercise 5: Fill blank
          INSERT INTO exercises (lesson_id, exercise_order, exercise_type, question, correct_answer, options, hint)
          VALUES (lesson_id, 5, 'fill_blank', 
                  'Fill in the blank: I ___ happy', 
                  'am',
                  '["am", "is", "are", "be"]'::jsonb,
                  'Think about the verb form');
          
          -- Exercise 6: Speak answer
          INSERT INTO exercises (lesson_id, exercise_order, exercise_type, question, correct_answer, options, hint)
          VALUES (lesson_id, 6, 'speak_answer', 
                  'Say this phrase', 
                  'phrase to speak',
                  NULL,
                  'Speak clearly into your microphone');
          
          -- Exercise 7: Type what you hear
          INSERT INTO exercises (lesson_id, exercise_order, exercise_type, question, correct_answer, options, hint)
          VALUES (lesson_id, 7, 'type_what_you_hear', 
                  'Type what you hear', 
                  'audio_transcript',
                  '["audio", "transcript", "word", "bank"]'::jsonb,
                  'Listen carefully');
          
          -- Exercise 8: Select sentence
          INSERT INTO exercises (lesson_id, exercise_order, exercise_type, question, correct_answer, options, hint)
          VALUES (lesson_id, 8, 'select_sentence', 
                  'Which sentence is correct?', 
                  'The correct sentence',
                  '["The correct sentence", "Wrong sentence 1", "Wrong sentence 2", "Wrong sentence 3"]'::jsonb,
                  'Check grammar and vocabulary');
        END LOOP;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Now update exercises with language-specific content using the existing Spanish exercises as a template
-- Update Unit 1 (Basics) exercises with proper content for all languages
UPDATE exercises e
SET 
  question = CASE e.exercise_order
    WHEN 1 THEN 'What is "Hello" in this language?'
    WHEN 2 THEN 'Translate: Good morning'
    WHEN 3 THEN 'Match the greetings'
    WHEN 4 THEN 'Arrange: Hello, how are you?'
    WHEN 5 THEN 'What does this greeting mean?'
    WHEN 6 THEN 'Say "Hello" in this language'
    WHEN 7 THEN 'Type the greeting you hear'
    WHEN 8 THEN 'Select the correct greeting'
  END
FROM lessons l
JOIN units u ON l.unit_id = u.id
WHERE e.lesson_id = l.id 
  AND u.unit_number = 1 
  AND l.lesson_number = 1
  AND u.language_code != 'es';