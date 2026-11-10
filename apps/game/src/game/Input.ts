export type InputAction =
  | 'left'
  | 'right'
  | 'softDrop'
  | 'hardDrop'
  | 'rotate'
  | 'rotateCCW';

type Handler = (action: InputAction) => void;

export class Input {
  private handler: Handler | null = null;
  private keysDown = new Set<string>();
  private repeatTimers = new Map<string, number>();
  private enabled = true;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  setHandler(handler: Handler | null): void {
    this.handler = handler;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.keysDown.clear();
      for (const id of this.repeatTimers.values()) window.clearInterval(id);
      this.repeatTimers.clear();
    }
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.setEnabled(false);
  }

  trigger(action: InputAction): void {
    if (!this.enabled || !this.handler) return;
    this.handler(action);
  }

  private mapKey(code: string): InputAction | null {
    switch (code) {
      case 'ArrowLeft':
      case 'KeyA':
        return 'left';
      case 'ArrowRight':
      case 'KeyD':
        return 'right';
      case 'ArrowDown':
      case 'KeyS':
        return 'softDrop';
      case 'ArrowUp':
      case 'KeyW':
      case 'KeyX':
        return 'rotate';
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        return 'rotateCCW';
      case 'Space':
        return 'hardDrop';
      default:
        return null;
    }
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return;
    const action = this.mapKey(e.code);
    if (!action) return;
    e.preventDefault();
    if (this.keysDown.has(e.code)) return;
    this.keysDown.add(e.code);
    this.trigger(action);

    if (action === 'left' || action === 'right' || action === 'softDrop') {
      const delay = action === 'softDrop' ? 40 : 140;
      const interval = action === 'softDrop' ? 40 : 50;
      const t = window.setTimeout(() => {
        const id = window.setInterval(() => this.trigger(action), interval);
        this.repeatTimers.set(e.code, id);
      }, delay);
      this.repeatTimers.set(e.code + '_delay', t);
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.code);
    const delay = this.repeatTimers.get(e.code + '_delay');
    if (delay) {
      window.clearTimeout(delay);
      this.repeatTimers.delete(e.code + '_delay');
    }
    const id = this.repeatTimers.get(e.code);
    if (id) {
      window.clearInterval(id);
      this.repeatTimers.delete(e.code);
    }
  };
}
