# lit-dragging

## Example

### An element that moves itself

```ts
class MyDraggableElement extends LitElement {
  constructor() {
    super() {
      new DragController(this, {
        target: this,
        onMove: (x, y) => {
          this.style.left = `${x}px`;
          this.style.top = `${y}px`;
        };
      })
    }
  }
}
```
