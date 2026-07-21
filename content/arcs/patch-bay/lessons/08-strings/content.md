# Strings Are Just Arrays

If you've used Python or JavaScript, "string" meant a real, built-in type with its own operations. **C has no such type.** A C string is just a convention layered on top of something you already know: a `char` array, with one extra rule.

## The null terminator

```c
char name[6] = "Alice";
```

`"Alice"` is 5 characters, but the array is declared with size 6. That's not a mistake - the compiler silently adds one more `char` at the end: `'\0'`, the **null terminator**, a byte whose value is 0. Every C string function - `printf("%s", ...)`, `strlen`, `strcmp` - works by reading characters one at a time **until it hits that `'\0'`**. There's no length stored anywhere; the null byte *is* how the end gets found. Forget to leave room for it, or overwrite it, and every string function reading that array will keep reading straight into whatever memory comes next, with no idea it's gone past the end.

## strlen

`<string.h>` gives you `strlen`, which counts characters up to (but not including) the null terminator:

```c
#include <string.h>

char word[] = "hello";
printf("%zu\n", strlen(word));   // 5 - the terminator itself isn't counted
```

Note the format specifier: `strlen` returns a `size_t` (an unsigned integer type used for sizes), and the correct specifier for that is `%zu`, not `%d`.

## Comparing strings: never with ==

This is the single most common C string bug, and it compiles without complaint:

```c
char answer[10];
scanf("%s", answer);
if (answer == "yes") {     // wrong - this is comparing addresses, not text
    printf("correct\n");
}
```

`answer` and `"yes"` are both, underneath, just addresses - pointers to where their first character lives in memory. `==` on them checks whether those two addresses are identical, which they essentially never are, even when the actual *text* is identical. This condition is effectively always false, no matter what the user typed. To compare the actual *contents* of two C strings, use `strcmp`, which returns `0` when the strings are equal:

```c
if (strcmp(answer, "yes") == 0) {
    printf("correct\n");
}
```
