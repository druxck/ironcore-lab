# Branching the Signal

Every program you've written so far runs the exact same instructions every time. A **branch** is where that stops being true - where the path your program takes depends on data it didn't know about until it ran.

## if / else if / else

```c
if (n < 0) {
    printf("negative\n");
} else if (n == 0) {
    printf("zero\n");
} else {
    printf("positive\n");
}
```

Conditions are checked top to bottom. The first one that's true runs its block, and every other branch is skipped - including any `else if` further down that would also have been true. Order can matter.

## switch

`switch` picks one of several branches based on a single value matching exactly:

```c
switch (level) {
    case 1:
        printf("low\n");
        break;
    case 2:
        printf("medium\n");
        break;
    case 3:
        printf("high\n");
        break;
}
```

Each `case` is a label, not a boundary. Without `break`, execution doesn't stop at the end of a matching case - it **falls through** and keeps running the code in the next case too, and the next, until it hits a `break` or the end of the `switch`. This is a deliberate C feature (occasionally useful for grouping cases that share behavior), but forgetting a `break` by accident is one of the most common real bugs in C code, precisely because nothing about the syntax warns you it's missing.
