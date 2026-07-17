# const and Respecting the Wiring

`const` on an ordinary variable is simple: `const int x = 5;` means `x` can never be reassigned after this line. Try `x = 10;` later and the compiler refuses. With pointers, there are **two separate things** that could be protected — the pointer itself, or the thing it points to — and `const` needs to say which one.

## Read it right to left

```c
const int *p;    // pointer to a const int
int * const p;   // a const pointer to a (non-const) int
```

**`const int *p`** — read as "`p` is a pointer to a `const int`." You *cannot* modify the value through `p` (`*p = 5;` fails to compile), but you *can* point `p` at a different int entirely (`p = &y;` is fine).

**`int * const p`** — the `const` now binds to `p` itself, not to what it points at. You *can* modify the value through `p` (`*p = 5;` is fine), but you *cannot* reassign `p` to point somewhere else after it's initialized.

You can combine both: `const int * const p` — neither the value nor the pointer can change. In practice, `const int *p` (protecting the pointed-to value) is by far the one you'll write constantly; the other two are rarer.

## Why this matters in real code

The place you'll meet `const` most is in function parameters:

```c
void print_reading(const int *reading) {
    printf("%d\n", *reading);
}
```

This signature is a promise, visible to anyone who reads it without looking at the function body: `print_reading` will not modify whatever you pass it. And it's not just a comment — the compiler *enforces* it. If the function body ever tried to write through `reading`, that's a compile error, not a bug that only shows up at runtime. `const` turns a design intention into something the machine checks for you.
