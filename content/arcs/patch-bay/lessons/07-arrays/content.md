# Arrays: A Row of Jacks

An array is a fixed number of same-typed boxes, laid out contiguously in memory, one right after another — like a row of jacks on the patch panel, numbered left to right starting at zero.

```c
int arr[5] = {10, 20, 30, 40, 50};
printf("%d\n", arr[0]);   // 10 — the first element
printf("%d\n", arr[4]);   // 50 — the last element
```

## Indexing starts at 0

For an array declared with size `N`, the valid indices are `0` through `N - 1`. `arr[5]` on a 5-element array is **not** a helpful error — it's not a valid index at all, since the last real element is `arr[4]`. This trips up almost everyone at first, coming from ordinary counting where you'd call the fifth thing "5," not "4."

## C will not stop you from going out of bounds

Here's the part that separates C from most languages you may have used: `arr[5]` on that 5-element array **compiles**, and it will very likely **run** — no crash, no exception, no automatic error. It just reads (or writes) whatever bytes happen to sit in memory right after the array, because C's array access is nothing more than "start address plus offset, no questions asked." Sometimes that memory belongs to something else entirely, and you've just corrupted it, or read garbage and gotten a garbage value back, with no complaint from anyone.

This isn't a flaw nobody noticed — it's a direct consequence of C's whole design: no runtime safety net, maximum speed, and the responsibility for staying in bounds is entirely yours. You'll feel the sharp edge of this directly in the Memory Wing, where "off-by-one" stops being an abstract warning and starts being a bug you diagnose with real tools. For now, the habit to build is simple: **every time you write a loop over an array, double-check your bound is `< size`, not `<= size`.**
