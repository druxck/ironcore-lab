# Operators & Expressions

C's arithmetic operators look exactly like the ones you already know: `+ - * / %`. The surprises are in the details.

## Integer division truncates — it does not round

```c
printf("%d\n", 7 / 2);
```

This prints `3`, not `3.5` and not `4`. When **both** operands of `/` are integers, C performs integer division: it computes the mathematical quotient and throws away everything after the decimal point — it truncates toward zero, it does not round. If you want a fractional result, at least one operand needs to already be a floating-point value:

```c
printf("%.2f\n", 7.0 / 2);
```

That prints `3.50`. Same numbers, different result, purely because `7.0` is a `double` literal instead of an `int` literal. This single rule — "integer division truncates" — causes more silent, no-warning bugs in beginner code than almost anything else in this room. The compiler will not tell you; the math is legal, just not what you meant.

## The modulo operator

`%` gives you the remainder of integer division: `10 % 3` is `1`, because 10 divided by 3 is 3 remainder 1. It only works on integers.

## Comparison and logical operators

`== != < > <= >=` compare two values and produce `1` (true) or `0` (false) — in C, booleans are just integers; there's no separate boolean type in the version of C this lab teaches. `&& || !` combine or invert those results: "and," "or," "not."

One trap worth naming early: C has no operator that chains comparisons the way math notation does. `1 < x < 10` does **not** check whether `x` is between 1 and 10 — it evaluates left to right: `1 < x` produces `0` or `1`, and *that result* gets compared against `10`, which is always true. You have to write it out: `x > 1 && x < 10`.

## Precedence

Just like arithmetic on paper, C operators have a pecking order — `*` and `/` bind tighter than `+` and `-`, comparisons bind looser than arithmetic, and `&&` binds tighter than `||`. `2 + 3 * 4` is `14`, not `20`, because multiplication happens first. When you're not sure, or when you want the *reader* to not have to be sure either, parentheses are free: `(2 + 3) * 4` costs you nothing at runtime and removes all doubt.
