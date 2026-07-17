# The Archive Room

The last stack of logbooks in the basement. One more skill before the lights come all the way up here: getting `printf` to show you a value in more than one base at once, which ties bits, hex, and the toolchain together into one line of real output.

## Format specifiers, briefly

`printf`'s first argument is a **format string** — literal text mixed with placeholders that start with `%`. Each placeholder consumes one of the following arguments, in order, and controls how it's displayed:

```c
printf("%d = 0x%x\n", 255, 255);
```

- `%d` prints an `int` in decimal.
- `%x` prints an `int` in lowercase hexadecimal — no `0x` prefix included automatically; if you want that prefix in the output, you type it yourself, as a literal in the format string.

Run the line above and you get: `255 = 0xff`. Same value, same argument even (`255` passed twice), two different displays — because the *specifier* controls the base, not the value itself. This is the same relationship you worked through by hand in "Counting Like a Machine," now happening inside a real running program instead of on paper.

## What you're actually restoring

Step back for a second at the room level: you started this basement not knowing what a bit was. You now know what a byte holds, why hex exists, what four stages turn your text into a running program, how to read the compiler's opinion of your mistakes instead of fearing it, and what a build tool automates. That's not trivia — it's the floor everything else in this lab stands on. The Patch Bay, next, is where you start telling the machine what to *decide*, not just what to print.
