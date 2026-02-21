export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  scenario?: string; // Some questions have a scenario description
  question: string;  // The actual question text
  options: Option[];
  correctAnswer: string;
  analysis: string;
}

export interface Level {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  LEVEL_TRANSITION = 'LEVEL_TRANSITION',
  COMPLETED = 'COMPLETED',
  GAME_OVER = 'GAME_OVER',
}
