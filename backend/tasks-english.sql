INSERT INTO tasks (name, answer, topic_id, language_id, task_type_id, options)
SELECT
    v.name,
    v.answer,
    tp.id,
    lang.id,
    tt.id,
    v.options
FROM (
    VALUES
        ('She ___ to school yesterday.', 'went', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['go', 'went', 'gone', 'going']::TEXT[]),
        ('They ___ football last weekend.', 'played', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['play', 'played', 'plays', 'playing']::TEXT[]),
        ('He ___ not like coffee.', 'does', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['do', 'does', 'did', 'doing']::TEXT[]),
        ('We ___ at home now.', 'are', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['is', 'am', 'are', 'be']::TEXT[]),
        ('I ___ a book every week.', 'read', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['reads', 'read', 'reading', 'readed']::TEXT[]),
        ('She ___ TV right now.', 'is watching', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['watch', 'watches', 'is watching', 'watched']::TEXT[]),
        ('They ___ dinner at the moment.', 'are cooking', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['cook', 'cooks', 'are cooking', 'cooked']::TEXT[]),
        ('He ___ to music now.', 'is listening', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['listen', 'listens', 'is listening', 'listened']::TEXT[]),
        ('I saw ___ elephant at the zoo.', 'an', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['a', 'an', 'the', '-']::TEXT[]),
        ('___ sun is very bright today.', 'The', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['A', 'An', 'The', '-']::TEXT[]),
        ('She wants to be ___ teacher.', 'a', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['a', 'an', 'the', '-']::TEXT[]),
        ('The cat is ___ the table.', 'on', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['in', 'on', 'at', 'under']::TEXT[]),
        ('We meet ___ Monday.', 'on', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['in', 'on', 'at', 'by']::TEXT[]),
        ('She was born ___ 1995.', 'in', 'Grammar', 'MULTIPLE_CHOICE', ARRAY['in', 'on', 'at', 'by']::TEXT[]),
        ('Choose the synonym for ''happy'':', 'joyful', 'Vocabulary', 'MULTIPLE_CHOICE', ARRAY['sad', 'joyful', 'angry', 'tired']::TEXT[]),
        ('Choose the synonym for ''big'':', 'large', 'Vocabulary', 'MULTIPLE_CHOICE', ARRAY['small', 'large', 'tiny', 'short']::TEXT[]),
        ('Choose the synonym for ''fast'':', 'quick', 'Vocabulary', 'MULTIPLE_CHOICE', ARRAY['slow', 'quick', 'late', 'early']::TEXT[]),
        ('Choose the antonym for ''hot'':', 'cold', 'Vocabulary', 'MULTIPLE_CHOICE', ARRAY['cold', 'warm', 'heat', 'fire']::TEXT[]),
        ('Choose the antonym for ''up'':', 'down', 'Vocabulary', 'MULTIPLE_CHOICE', ARRAY['up', 'down', 'left', 'right']::TEXT[]),
        ('Choose the antonym for ''start'':', 'finish', 'Vocabulary', 'MULTIPLE_CHOICE', ARRAY['start', 'begin', 'finish', 'continue']::TEXT[]),
        ('What does ''ubiquitous'' mean?', 'present everywhere', 'Vocabulary', 'MULTIPLE_CHOICE', ARRAY['rare', 'present everywhere', 'expensive', 'ancient']::TEXT[]),
        ('What does ''benevolent'' mean?', 'kind', 'Vocabulary', 'MULTIPLE_CHOICE', ARRAY['evil', 'kind', 'angry', 'sad']::TEXT[]),
        ('What does ''ephemeral'' mean?', 'short-lived', 'Vocabulary', 'MULTIPLE_CHOICE', ARRAY['permanent', 'short-lived', 'beautiful', 'dangerous']::TEXT[]),
        ('The past tense of ''go'' is ''went''.', 'true', 'Grammar', 'TRUE_FALSE', NULL::TEXT[]),
        ('The article ''an'' is used before consonant sounds.', 'false', 'Grammar', 'TRUE_FALSE', NULL::TEXT[]),
        ('''Happy'' and ''sad'' are synonyms.', 'false', 'Vocabulary', 'TRUE_FALSE', NULL::TEXT[]),
        ('The plural of ''child'' is ''childs''.', 'false', 'Grammar', 'TRUE_FALSE', NULL::TEXT[]),
        ('''Quickly'' is an adverb.', 'true', 'Grammar', 'TRUE_FALSE', NULL::TEXT[]),
        ('Complete: To be or ___ to be.', 'not', 'Grammar', 'GAP_FILLING', NULL::TEXT[]),
        ('Complete: All that glitters is ___ gold.', 'not', 'Vocabulary', 'GAP_FILLING', NULL::TEXT[]),
        ('Complete: The early bird catches the ___.', 'worm', 'Vocabulary', 'GAP_FILLING', NULL::TEXT[]),
        ('Complete: When in Rome, do ___ the Romans do.', 'as', 'Grammar', 'GAP_FILLING', NULL::TEXT[]),
        ('Complete: Actions speak ___ than words.', 'louder', 'Vocabulary', 'GAP_FILLING', NULL::TEXT[])
) AS v(name, answer, topic_name, task_type_name, options)
JOIN languages lang ON lang.name = 'English'
JOIN topics tp ON tp.name = v.topic_name AND tp.language_id = lang.id
JOIN task_types tt ON tt.name = v.task_type_name
WHERE NOT EXISTS (
    SELECT 1
    FROM tasks t
    WHERE t.name = v.name
      AND t.language_id = lang.id
);
