# Variables and the Boxes They Live In

> *"The patch bay only has so many jacks. Label everything, or you'll spend more time tracing cable than routing signal."* — taped to the workbench, handwriting unknown.

Every variable in C is a labeled box of a fixed size, and — unlike languages you may have touched before — **you must say up front exactly what kind of thing goes in the box.**

```c
int count = 3;
float ratio = 0.5f;
char grade = 'A';
double precise = 3.14159265;
```

- `int` — a whole number. On almost every machine you'll touch, 4 bytes, meaning it can hold roughly ±2.1 billion.
- `char` — one byte, holds a single character (technically a small integer — more on that later).
- `float` — a 4-byte approximation of a real number.
- `double` — an 8-byte approximation of a real number, roughly twice the precision of `float`. Use this by default for anything fractional; `float` is for when memory is genuinely tight.

## Declaration vs. initialization

`int count;` **declares** the box — it reserves the memory and gives it a name and a type. It does **not** put a known value inside it. `int count = 3;` declares *and* **initializes** in one line, giving it a starting value.

This distinction matters more in C than in most languages you've likely used, because of what happens if you skip initialization:

```c
int mystery;
printf("%d\n", mystery);
```

This compiles. It runs. And it prints... something. Whatever bit pattern happened to already be sitting in that spot of memory from whatever ran there before. Not zero — that's not guaranteed, it's a common beginner assumption that turns into a real bug. **An uninitialized local variable's value is undefined**, and "undefined" here doesn't mean "some safe default," it means the compiler and language make no promise about it whatsoever. Always initialize.

## Why C makes you say the type

A language like Python lets a variable hold an int today and a string tomorrow, because the *value* carries its own type at runtime and the variable is just a label pointing at it. C variables aren't labels pointing at typed values — **the box itself has a fixed type and a fixed size**, decided at compile time. That's what lets the compiler know exactly how many bytes to reserve, exactly what machine instructions to generate for arithmetic on it, and exactly how to lay it out next to other variables — all before your program ever runs. It's less flexible. It's also a large part of why C is fast: none of that gets figured out at runtime.
