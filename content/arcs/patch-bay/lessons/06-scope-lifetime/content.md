# Scope and Lifetime

Two different questions, easy to tangle together: **where** can a name be seen (scope), and **how long** does its storage actually exist (lifetime)?

## Block scope

Every `{ }` opens a new scope. A variable declared inside one is invisible outside it, and if a name is declared again inside a nested block, the inner one **shadows** - temporarily hides - the outer one for as long as that inner block runs:

```c
int x = 10;

int main(void) {
    int x = 20;
    printf("%d\n", x);  // prints 20 - the local x wins
    return 0;
}
```

Inside `main`, `x` unambiguously refers to the local one. The global `x` still exists in memory, untouched, but nothing inside `main` can reach it while a local `x` is in scope - you'd need to remove or rename the local one to see the global again.

## Lifetime: how long storage actually exists

A normal local variable's storage exists only while its enclosing block is executing - it's created fresh on entry, and gone the moment the block ends. Call the same function twice, and you get two completely separate, freshly-uninitialized copies.

`static` changes that for a local variable, without changing its scope:

```c
int next_id(void) {
    static int count = 0;
    count++;
    return count;
}
```

`count` is still only visible inside `next_id` - normal block scope. But its storage is **not** recreated on every call. It's initialized to `0` exactly once, the very first time the function runs, and every subsequent call sees whatever value the previous call left behind. Call `next_id()` three times in a row and you get `1`, then `2`, then `3`.

## Global redefinition

At file scope (outside any function), you get exactly one definition-with-initializer per name:

```c
int total = 0;
int total = 5;   // error: redefinition of 'total'
```

The compiler isn't confused about which value you meant - it's refusing to guess. If you need the same name to refer to a variable defined in a different file, that's what the `extern` keyword is for, which you'll meet when programs start spanning more than one file. Until then, one definition per global name.
