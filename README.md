# @dinosaur/state

A simple state management library for TypeScript.

## Usage

### Creating a new state
```typescript
import { State } from "@dinosaur/state";

const counter = new State(0);
const name = new State<string | null>(null);
```

### Changing the state
```typescript
counter.value++;
name.value = "John Doe";
```

### Handling state changes
There are multiple ways to listen for state changes.
1. **Using listeners**  
The listener will be called whenever the state changes.
You can also remove the listener when you no longer need it.
```typescript
const counterListener = (value: number) => {
    console.log(`Counter: ${value}`);
    if (value === 10) {
        counter.removeListener(counterListener);
    }
};
counter.addListener(counterListener);
```

2. **Using disposable iterators**  
The `using` keyword ensures that the iterator is properly disposed when the block is exited.
```typescript
using counterValues = counter.watch();
for await (const value of counterValues) {
    console.log(`Counter: ${value}`);
    if (value === 10) {
        break;
    }
}
```

3. **Waiting for one change**
```typescript
const nextValue = await counter.next();
console.log(`Counter: ${nextValue}`);
```

### Deriving a state
This is useful for creating derived states. The derived state will automatically update when the original state changes.
```typescript
const displayName = name.derive((name) => name ?? "Anonymous");
```

### Merging states
Create states that depend on multiple other states. The merged state will automatically update when any of the original states change.
```typescript
const a = new State(1);
const b = new State(2);
const sum = State
    .merge({ a, b })
    .derive(({ a, b }) => a + b);
```




