export type DialogueTextContextKind = "dialogue" | "choice" | "statement";

export type DialogueTextContextTarget = {
  kind: DialogueTextContextKind;
  textarea: HTMLTextAreaElement | HTMLInputElement;
  getText: () => string;
  onTextChange: (nextText: string) => void;
  showStatementLie?: boolean;
};

export type DialogueTextContextMenuState = {
  x: number;
  y: number;
  target: DialogueTextContextTarget;
};
