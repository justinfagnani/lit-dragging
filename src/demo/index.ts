import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {DragController} from '../drag-controller.js';

@customElement('lit-dragging-demo')
export class LitDraggingDemo extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    #self-drag {
      position: relative;
      height: 400px;
      border: 1px solid black;
    }
  `;

  override render() {
    return html`
      <section>
        <h2>Self-dragging Element</h2>
        <p>
          This is a moveable element that has its own DragController to
          implement the move logic.
        </p>
        <div id="self-drag">
          <self-drag style="top: 100px; left: 100px;"></self-drag>
          <self-drag-with-handle
            style="top: 100px; left: 400px;"
          ></self-drag-with-handle>
        </div>
      </section>
      <section>
        <h2>Dragging Container</h2>
        <p>
          This is a container that has a DragController to implement the move
          logic in a single place for light DOM children.
        </p>
        <drag-container>
          <div style="top: 100px; left: 100px;"></div>
          <div style="top: 100px; left: 400px;"></div>
        </drag-container>
      </section>
      <section>
        <h2>Dragging Container with handle()</h2>
        <p>
          This is a container that declaratively enables dragging on its shadow
          children.
        </p>
        <drag-container-with-handle></drag-container-with-handle>
      </section>
    `;
  }
}

@customElement('self-drag')
export class SelfDrag extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: absolute;
      background: blue;
      width: 100px;
      height: 100px;
      user-select: none;
      cursor: grab;
    }
    :host([dragging]) {
      cursor: grabbing;
    }
  `;
  constructor() {
    super();
    new DragController(this, {
      target: this,
      onStart: () => {
        this.toggleAttribute('dragging', true);
        return {
          startX: this.offsetLeft,
          startY: this.offsetTop,
          onMove: (deltaX: number, deltaY: number) => {
            this.style.left = `${deltaX}px`;
            this.style.top = `${deltaY}px`;
          },
          onEnd: () => {
            this.toggleAttribute('dragging', false);
          },
        };
      },
    });
  }

  override render() {
    return html`Drag Me!`;
  }
}

@customElement('self-drag-with-handle')
export class SelfDragWithHandle extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: absolute;
      background: red;
      width: 100px;
      height: 100px;
      user-select: none;
    }
    :host([dragging]) {
      cursor: grabbing;
    }
    span {
      height: 20px;
      cursor: grab;
      color: white;
    }
  `;

  #drag = new DragController(this, {
    onStart: () => {
      this.toggleAttribute('dragging', true);
      return {
        startX: this.offsetLeft,
        startY: this.offsetTop,
        onMove: (deltaX: number, deltaY: number) => {
          this.style.left = `${deltaX}px`;
          this.style.top = `${deltaY}px`;
        },
        onEnd: () => {
          this.toggleAttribute('dragging', false);
        },
      };
    },
  });

  override render() {
    return html`<span ${this.#drag.handle()}>◉</span>Drag me by the handle!`;
  }
}

@customElement('drag-container')
export class DragContainer extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      height: 400px;
      border: 1px solid black;
    }
    ::slotted(*) {
      position: absolute;
      background: blue;
      width: 100px;
      height: 100px;
      user-select: none;
      cursor: grab;
    }
    ::slotted([dragging]) {
      cursor: grabbing;
    }
  `;

  // @ts-expect-error
  #drag = new DragController(this, {
    target: this,
    onStart: (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === this) {
        return;
      }
      target.toggleAttribute('dragging', true);
      return {
        startX: target.offsetLeft,
        startY: target.offsetTop,
        onMove: (deltaX: number, deltaY: number) => {
          target.style.left = `${deltaX}px`;
          target.style.top = `${deltaY}px`;
        },
        onEnd: () => {
          target.toggleAttribute('dragging', false);
        },
      };
    },
  });

  override render() {
    return html`<slot></slot>`;
  }
}

@customElement('drag-container-with-handle')
export class DragContainerWithHandle extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      height: 400px;
      border: 1px solid black;
    }
    div {
      position: absolute;
      background: blue;
      width: 100px;
      height: 100px;
      user-select: none;
      cursor: grab;
    }
    div[dragging] {
      cursor: grabbing;
    }
  `;

  #drag = new DragController(this, {
    onStart: (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      target.toggleAttribute('dragging', true);
      return {
        startX: target.offsetLeft,
        startY: target.offsetTop,
        onMove: (deltaX: number, deltaY: number) => {
          target.style.left = `${deltaX}px`;
          target.style.top = `${deltaY}px`;
        },
        onEnd: () => {
          target.toggleAttribute('dragging', false);
        },
      };
    },
  });

  override render() {
    return html`
      <div style="top: 100px; left: 100px;" ${this.#drag.handle()}></div>
      <div style="top: 100px; left: 400px;" ${this.#drag.handle()}></div>
    `;
  }
}
