# Functions: Patch Cables

A function is a named, reusable patch cable: plug values in, get a value out, and the wiring in between only has to be written once.

```c
int square(int n) {
    return n * n;
}

int main(void) {
    int x = 5;
    printf("%d\n", square(x));
    return 0;
}
```

`square` **declares** its parameters - `int n` - as local variables that receive whatever values the caller passed in. In C, arguments are passed **by value**: `n` inside `square` is a fresh copy of whatever was passed in. Changing `n` inside the function has zero effect on `x` back in `main`. (Later, in the Memory Wing, you'll learn how to let a function actually reach back and change a caller's variable - it requires deliberately passing an address, not the value itself.)

`return n * n;` both computes the result and immediately exits the function, handing that value back to wherever it was called from.

## Declaration vs. definition

A function's **definition** is the whole thing - signature plus body, like `square` above. A **declaration** (also called a **prototype**) is just the signature, with a semicolon instead of a body:

```c
int square(int n);
```

Why would you ever want just the signature? Because C reads your file top to bottom, and **it needs to know a function's signature before you call it** - how many parameters, what types, what it returns - to generate correct code for the call and check you're using it right. If `square` is defined *below* `main` in the same file, `main` needs to see at least the prototype *above* it first, or the compiler has no way to check the call is even valid.

```c
int square(int n);   // prototype - now main can call it safely

int main(void) {
    printf("%d\n", square(5));
    return 0;
}

int square(int n) {   // full definition, can live anywhere after the prototype
    return n * n;
}
```

Skip the prototype and call a function the compiler hasn't seen yet, and you get exactly the "implicit declaration of function" complaint from the Assembly Basement - the compiler is warning you it had to guess the signature, and its guess might be wrong.
