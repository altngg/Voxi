import type { TestTask } from "../test/api/test-queries";

export const MOCK_THEORY_TEXTS = [
  "В Present Simple для he/she/it к глаголу добавляется -s: He works, she studies.",
  "Вопрос в Present Simple строится через do/does: Do you like music? Does she read books?",
  "Past Simple обычно выражает завершенное действие в прошлом: I visited London last year.",
  "После модального глагола используется базовая форма: can speak, must go, should learn.",
  "В конструкции there is/there are мы описываем наличие: There is a book on the table.",
  "Comparatives: короткие прилагательные получают -er, а длинные идут с more.",
  "Present Continuous: am/is/are + V-ing, когда действие происходит прямо сейчас.",
  "Артикль a/an используется с исчисляемым существительным в ед. числе, когда говорим впервые.",
];

export const buildMockTheoryByTaskId = (
  tasks: TestTask[],
  seed: number,
): Partial<Record<number, string>> => {
  const map: Partial<Record<number, string>> = {};
  tasks.forEach((task, index) => {
    const theoryIndex =
      (task.id * 31 + index * 17 + seed) % MOCK_THEORY_TEXTS.length;
    map[task.id] = MOCK_THEORY_TEXTS[theoryIndex];
  });
  return map;
};
