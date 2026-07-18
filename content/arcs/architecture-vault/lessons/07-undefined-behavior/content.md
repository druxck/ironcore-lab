# Undefined Behavior Is a Compiler's Permission Slip

*Logbook: "New researchers treated 'undefined behavior' like a ghost story — as if the machine might do literally anything, for no reason. It's not a ghost story. It's a contract, and the compiler reads it more carefully than you do."*

The C standard defines what every well-formed operation does — except for a specific, enumerated list of operations it deliberately leaves **undefined**: signed integer overflow, dereferencing a null or dangling pointer, reading uninitialized memory, indexing an array out of bounds, and others you've already met by name in Memory Wing. "Undefined" doesn't mean "unpredictable" in some mystical sense — it means the standard places **no requirement whatsoever** on what happens, which the compiler reads as explicit permission to *assume your program never does it*, and to optimize accordingly. A check you write for a condition that can only be reached via UB is a check the compiler is legally entitled to delete, on the reasoning that if execution ever really got there, your program's behavior was already unconstrained by the standard — so preserving a "safety" check downstream of it isn't required either.

## A real one, caught for real

```c
#include <stdio.h>
#include <limits.h>

int main(void) {
    int x = INT_MAX;
    x = x + 1;
    printf("%d\n", x);
    return 0;
}
```

`INT_MAX` is the largest value a (32-bit) `int` can hold — `2147483647`. Adding `1` to it is signed integer overflow: undefined behavior, full stop, regardless of what any particular compiler or CPU happens to do about it. Compile and run this exact program in this lab (which always compiles with UBSan on) and here's the real, unedited output:

```
$ ./program
-2147483648
```
```
runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
```

(the first block is stdout, the second is stderr — UBSan reports to stderr and, by default, lets the program keep running rather than aborting it, which is exactly why you can't rely on "it printed a number and didn't crash" as evidence nothing went wrong). `-2147483648` is what two's-complement wraparound produces on essentially every real CPU you'll touch — but that's an accident of how the hardware works, not a promise from the C standard. A future compiler, a different optimization level, or a different target architecture owes you nothing here. That's the entire reason this matters: code that "happens to work" by riding on undefined behavior can silently stop working the moment anything about its build changes, with no warning and no bug in the traditional sense — the bug was always there, just unexercised.

## Check before, not after

The fix isn't a bigger type or a different compiler flag — it's checking for the dangerous condition *before* the operation that would overflow, never after:

```c
int x = INT_MAX;
if (x > INT_MAX - 1) {
    printf("would overflow\n");
} else {
    x = x + 1;
    printf("%d\n", x);
}
```

`x > INT_MAX - 1` is a completely well-defined comparison — no overflow occurs computing it, so the compiler has no license to assume it's unreachable or reorder around it. This pattern — verify the inputs are safe *before* doing the operation that would otherwise be UB — is the general shape of how real, robust C code handles every one of the undefined-behavior categories you've met so far: null checks before dereferencing, bounds checks before indexing, this overflow check before arithmetic. Checking after the fact is worthless, because "after the fact" of undefined behavior isn't a well-defined place to be standing.
