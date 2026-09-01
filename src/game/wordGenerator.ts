import { WORDS_DICTIONARY } from '../data/words';
import { GAME_CONFIG } from './gameConfig';

export class WordGenerator {
  private history: string[] = [];
  private pool: string[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.history = [];
    this.pool = [...WORDS_DICTIONARY];
  }

  public getNextWord(): string {
    // If pool is empty or too small, replenish
    if (this.pool.length === 0) {
      this.pool = [...WORDS_DICTIONARY];
    }

    // Filter available candidates avoiding recent history
    const candidates = this.pool.filter(w => !this.history.includes(w));
    const selectionSource = candidates.length > 0 ? candidates : this.pool;

    const randomIndex = Math.floor(Math.random() * selectionSource.length);
    const selectedWord = selectionSource[randomIndex];

    // Remove from pool to reduce collision chance
    const poolIndex = this.pool.indexOf(selectedWord);
    if (poolIndex > -1) {
      this.pool.splice(poolIndex, 1);
    }

    // Update history queue
    this.history.push(selectedWord);
    if (this.history.length > GAME_CONFIG.recentWordHistory) {
      this.history.shift();
    }

    return selectedWord;
  }
}
