# Pointers and Arrays: Secretly the Same

Back in the Patch Bay you learned to index an array with `arr[i]`. It's time to open that up, because underneath, C doesn't really have a separate "array indexing" mechanism at all - it has pointers, and `arr[i]` is just a convenient way to write pointer arithmetic.

## Decay: an array name becomes a pointer

In almost every expression, an array's name **decays** into a pointer to its first element. `arr` and `&arr[0]` are, for essentially all practical purposes, the same address.

```c
int values[3] = {10, 20, 30};
int *p = values;        // no & needed -- values already decayed to a pointer
```

## `arr[i]` is `*(arr + i)`

This isn't an analogy - it's the literal definition. `arr[i]` means "take the address `arr` decays to, move forward `i` elements, then dereference." And "move forward `i` elements" is exactly what `+` does on a pointer: `arr + i` doesn't add `i` *bytes*, it adds `i * sizeof(*arr)` bytes, automatically, because the compiler knows from the pointer's type how big each element is.

```c
values[1]      // conventional indexing
*(values + 1)  // exactly the same thing, spelled differently
```

Try it with `p` from above: `*(p + 1)` reads `20`, same as `values[1]`. This is why array indexing in C has no bounds checking at all - `arr[i]` is nothing but address arithmetic and a dereference, and the compiler will happily compute an address past the end of the array and read or write whatever happens to be there. That's not a safety net missing by oversight; it's the direct, unavoidable consequence of what indexing *is* in C. You'll see exactly what goes wrong when this is misused in the next lesson's neighbor.

## Walking an array with a pointer

Because `arr + i` is just arithmetic, you can walk an array by incrementing a pointer instead of incrementing an index:

```c
int values[3] = {10, 20, 30};
int *p = values;
for (int i = 0; i < 3; i++) {
    printf("%d\n", *p);
    p++;               // move p forward by one int's worth of bytes
}
```

Both styles compile to essentially the same machine code - indexing is just pointer arithmetic with extra syntax around it. You'll see both in real code; recognizing they're the same thing means neither one will trip you up.
