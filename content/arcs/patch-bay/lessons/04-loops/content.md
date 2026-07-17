# Loops: Closing the Circuit

Three ways to repeat something in C, and each one signals a different intent to whoever reads your code next.

## while — repeat while a condition holds

```c
int i = 1;
while (i <= 5) {
    printf("%d\n", i);
    i++;
}
```

The condition is checked **before** each iteration, including the first. If it's false immediately, the body never runs at all.

## for — repeat a known number of times

```c
for (int i = 1; i <= 5; i++) {
    printf("%d\n", i);
}
```

A `for` loop is a `while` loop with its bookkeeping gathered into one line: initialize, condition, update. Reach for `for` whenever you're counting — it's a strong visual signal to the reader that this loop has a predictable start and end.

## do-while — repeat, but check after

```c
int i = 5;
do {
    printf("%d\n", i);
    i++;
} while (i < 5);
```

The condition is checked **after** the body runs — which means **the body always executes at least once**, even if the condition was already false before the loop started. In the example above, `i` starts at 5, so `i < 5` is false from the very beginning — but the body still runs once, printing `5`, before the loop checks and immediately stops. `do-while` is rarer than `while`/`for` in practice, but it's the right tool exactly when "run it once no matter what, then keep going while some condition holds" is what you actually mean — a menu prompt that must show at least once is the classic example.

## break and continue

`break` exits the loop entirely, right now, regardless of the loop's condition. `continue` skips straight to the next iteration — for a `for` loop, that means running the update step and then rechecking the condition, without running the rest of the current iteration's body.

```c
for (int i = 1; i <= 10; i++) {
    if (i % 3 == 0) continue;
    printf("%d\n", i);
}
```

This prints 1 through 10, skipping every multiple of 3.
