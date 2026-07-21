# Passing by Reference

Here's something that trips up nearly everyone the first time they try it. This function looks completely reasonable, and it does nothing at all:

```c
void increment(int n) {
    n = n + 1;
}

int main(void) {
    int x = 5;
    increment(x);
    printf("%d\n", x);   // still prints 5
}
```

## C only passes by value

Every argument in C is passed **by value** - the function receives a *copy* of whatever you handed it. `increment`'s parameter `n` is a brand new stack variable, initialized from `x`'s value at the moment of the call. Changing `n` changes that copy and nothing else; `x`, back in `main`, was never touched. There is no exception to this rule anywhere in C. It doesn't matter how the function is written - a plain variable is always copied in.

## Pointers are how you get around it

If a function needs to modify the caller's actual variable, it can't be handed the value - it needs the *address*, so it can reach back and write through it:

```c
void increment(int *n) {
    *n = *n + 1;      // dereference: write to the address, not to a local copy
}

int main(void) {
    int x = 5;
    increment(&x);     // pass the address of x
    printf("%d\n", x); // prints 6
}
```

The parameter is still passed by value - but now the *value being copied is an address*, and dereferencing that address inside the function reaches all the way back to `x`. This is the entire mechanism C has for "pass by reference": there isn't a separate reference type, it's pointers, used deliberately, at the call site and inside the function both.

## The classic example: swap

The textbook demonstration of this is a function that swaps two variables. Written the naive way - plain `int` parameters - it cannot work, for exactly the reason `increment` didn't. Written with pointer parameters, it does:

```c
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}
```

Every `*a` and `*b` here means "the value at the address I was given," never "the pointer variable itself." Get comfortable reading that distinction at a glance - you'll be doing it constantly from here on.
