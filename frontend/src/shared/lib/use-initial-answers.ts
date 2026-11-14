import { useCallback, useRef, useState } from "react";

const recordsEqual = <T extends string | boolean>(
  left: Record<string, T>,
  right: Record<string, T>,
): boolean => {
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) {
    return false;
  }
  return leftKeys.every((key) => Object.is(left[key], right[key]));
};

export const useInitialAnswers = <T extends string | boolean>(
  initialAnswers: Record<string, T> | undefined,
  onAnswersChange?: (answers: Record<string, T>) => void,
) => {
  const initialKey = JSON.stringify(initialAnswers ?? {});
  const [storedKey, setStoredKey] = useState(initialKey);
  const [answers, setAnswers] = useState<Record<string, T>>(
    () => initialAnswers ?? {},
  );
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const onChangeRef = useRef(onAnswersChange);
  onChangeRef.current = onAnswersChange;

  if (storedKey !== initialKey) {
    setStoredKey(initialKey);
    const next = initialAnswers ?? {};
    if (!recordsEqual(answers, next)) {
      answersRef.current = next;
      setAnswers(next);
    }
  }

  const commitAnswers = useCallback(
    (updater: (prev: Record<string, T>) => Record<string, T>) => {
      const next = updater(answersRef.current);
      if (recordsEqual(answersRef.current, next)) {
        return;
      }
      answersRef.current = next;
      setAnswers(next);
      onChangeRef.current?.(next);
    },
    [],
  );

  return [answers, commitAnswers] as const;
};
