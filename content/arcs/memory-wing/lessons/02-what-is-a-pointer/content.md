# What Is a Pointer

Every variable you've written lives at some address in memory — a location, the same way a house has a street address. Normally you never see that address; you just refer to the variable by name and the compiler handles the rest. A **pointer** is what happens when you decide you want to store that address itself, as a value, in another variable.

## Two operators, two very different jobs

```c
int x = 42;
int *p = &x;
```

Read this in two pieces. `&x` is the **address-of** operator — "give me the address where `x` lives," not the value 42, the *location*. `int *p` declares `p` as a variable whose job is to hold the address of an `int`. So after this line, `p` doesn't contain 42 — it contains *where `x` is*.

`*` does double duty in C, and which job it's doing depends on context:

- **In a declaration** (`int *p`), it says "this variable is a pointer to an `int`."
- **In an expression** (`*p`), it means **dereference** — "go to the address `p` holds, and give me the value that's actually there."

```c
printf("%d\n", *p);   // dereference p -> prints 42, the value at x's address
*p = 100;              // write through p -> x is now 100
printf("%d\n", x);     // prints 100 -- we changed x without ever writing "x = 100"
```

That last line is the entire point of a pointer: it lets you reach a variable indirectly, through its address, from somewhere that doesn't have the variable's name in scope. You'll use exactly this to let a function modify a caller's variable in the next few lessons.

## The type matters

`int *p` is specifically a pointer *to an int*. That type isn't decoration — it tells the compiler how many bytes to read or write when you dereference `p`, and how far to move if you ever do arithmetic on it (coming up next lesson). A pointer to a `char` and a pointer to a `double` behave differently under `*`, even though both are "just an address" underneath.

## NULL: a pointer to nothing

A pointer can also hold a special value, `NULL`, meaning "I don't point at anything valid right now." It's the pointer equivalent of an empty box — and dereferencing it (`*p` when `p` is `NULL`) is one of the most common bugs in all of C, because there's no valid memory at address zero to read. The machine's answer to that is immediate and unambiguous: it kills your program with a segmentation fault. You'll meet that firsthand — deliberately — in a couple of lessons.

## A trap worth naming now

`&x` is an address, not a number in the ordinary sense — printing it with `%d` (which expects a plain `int`) is a type mismatch, and the compiler will warn you about it. The correct format specifier for a raw address is `%p`, and the conventional way to print one is:

```c
printf("%p\n", (void *)&x);
```

You won't print raw addresses often in ordinary code, but recognizing this pattern means the next time you see `%p` in someone else's code — or in a debugger's output — it won't be a mystery.
