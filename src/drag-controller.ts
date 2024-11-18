import type {ElementPart, ReactiveController, ReactiveElement} from 'lit';
import {
  directive,
  Directive,
  DirectiveParameters,
  PartInfo,
  PartType,
} from 'lit/directive.js';

/**
 * A controller that enables dragging an element.
 *
 * This controller can be used against a single element by setting the `target`
 * option to the element to listen for mouse events on. Alternatively, the
 * `handle()` method can be used as a directive to enable dragging on an element
 * in a template.
 * 
 * A drag operation is started when the user presses the mouse button on the
 * target element. The `onStart` callback is invoked when the drag operation
 * starts. `onMove` is invoked when the mouse moves while the button is pressed,
 * and `onEnd` is invoked when the button is released.
 * 
 * The return value of `onStart` can be used to pass `onMove` and `onEnd`
 * instead, which is useful for using variables in the closure scope of the
 * `onStart` callback in the `onMove` and `onEnd` callbacks.
 * 
 * `startX` and `startY` can be used to set the initial position of the element
 * being dragged.
 */
export class DragController<T = void> implements ReactiveController {
  // Used by the directive
  _host: ReactiveElement;
  _options: DraggableOptions<T>;

  data!: T;

  constructor(host: ReactiveElement, options: DraggableOptions<T>) {
    (this._host = host).addController(this);
    this._options = {...options};
    if (this._options.target !== undefined) {
      this._options.target.addEventListener('mousedown', this.#onMouseDown);
    }
  }

  #onMouseDown = (e: MouseEvent) => {
    let startX = this._host.offsetLeft;
    let startY = this._host.offsetTop;
    const clientX = e.clientX;
    const clientY = e.clientY;

    let {onStart, onMove, onEnd} = this._options;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - clientX + startX;
      const deltaY = e.clientY - clientY + startY;
      // TODO: dispatch an event an implement a native-DnD like protocol,
      // except without the restrictions of the native DnD API's DataTransfer
      // object.
      // this._host.dispatchEvent(new DragEvent('drag', {bubbles: true}));
      onMove?.(deltaX, deltaY, e, this.data);
    };

    const onMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('contextmenu', onMouseUp);
      onEnd?.(e, this.data);
    };

    // TODO: Use pointer events instead of mouse events
    // See: https://www.redblobgames.com/making-of/draggable/
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    // http://www.quirksmode.org/dom/events/contextmenu.html
    document.addEventListener('contextmenu', onMouseUp);

    const config = onStart?.(e, this.data);
    onMove ??= config?.onMove;
    onEnd ??= config?.onEnd;
    startX = config?.startX ?? 0;
    startY = config?.startY ?? 0;
  };

  hostConnected() {}

  /**
   * A directive that makes an element in a Lit template draggable. `data` is
   * passed to the `onStart`, `onMove`, and `onEnd` callbacks.
   */
  handle(data: T) {
    return draggable(this, data);
  }
}

class DraggableDirective<T = void> extends Directive {
  controller!: DragController<T>;
  element?: HTMLElement;
  data!: T;

  constructor(partInfo: PartInfo) {
    super(partInfo);
    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('handle() must be used in an element binding');
    }
  }

  // This method determines the directive signature.
  render(_controller: DragController<T>, _data: T) {
    throw new Error();
  }

  override update(
    part: ElementPart,
    [controller, data]: DirectiveParameters<this>,
  ) {
    this.data = data;
    this.controller ??= controller;
    if (part.element !== this.element) {
      if (this.element !== undefined) {
        this.element.removeEventListener('mousedown', this.#onMouseDown);
      }
      this.element = part.element as HTMLElement;
      this.element.addEventListener('mousedown', this.#onMouseDown);
    }
  }

  #onMouseDown = (e: MouseEvent) => {
    // TODO: dedupe with the controller's onMouseDown handler
    let startX: number;
    let startY: number;
    const clientX = e.clientX;
    const clientY = e.clientY;

    let {onStart, onMove, onEnd} = this.controller._options;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - clientX + startX;
      const deltaY = e.clientY - clientY + startY;
      // TODO: bubbling mouse events are weird. Should we use the real DnD API?
      // this.controller._host.dispatchEvent(
      //   new DragEvent('drag', {bubbles: true}),
      // );
      onMove?.(deltaX, deltaY, e, this.data);
    };

    const onMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('contextmenu', onMouseUp);
      onEnd?.(e, this.data);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    // http://www.quirksmode.org/dom/events/contextmenu.html
    document.addEventListener('contextmenu', onMouseUp);

    const config = onStart?.(e, this.data);
    onMove ??= config?.onMove;
    onEnd ??= config?.onEnd;
    startX = config?.startX ?? 0;
    startY = config?.startY ?? 0;
  };
}

const draggable = directive(DraggableDirective<any>);

export interface DraggableOptions<T = void> {
  /**
   * Callback invoked when the drag operation starts. The return value can be
   * used to override the default behavior of the drag operation.
   */
  onStart?: (event: MouseEvent, data: T) => DraggableStartResult<T> | void;

  /**
   * Callback invoked during the drag operation. `deltaX` and `deltaY` are
   * the change in position from the offset position of the target.
   */
  onMove?: (deltaX: number, deltaY: number, event: MouseEvent, data: T) => void;

  /**
   * Callback invoked whe the drag operation ends.
   */
  onEnd?: (event: MouseEvent, data: T) => void;

  target?: HTMLElement;
}

export interface DraggableStartResult<T = void> {
  /**
   * The initial X position of the element being dragged.
   */
  startX?: number;

  /**
   * The initial Y position of the element being dragged.
   */
  startY?: number;

  /**
   * Callback invoked during the drag operation. `deltaX` and `deltaY` are
   * the change in position from the offset position of the target.
   */
  onMove?: (deltaX: number, deltaY: number, event: MouseEvent, data: T) => void;

  /**
   * Callback invoked whe the drag operation ends.
   */
  onEnd?: (event: MouseEvent, data: T) => void;
}
