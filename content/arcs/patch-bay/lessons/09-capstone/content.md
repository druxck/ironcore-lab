# Capstone: A Word Counter

Every jack in this room is wired now: variables, operators, branches, loops, functions, arrays, strings. Time to route them together into something a bit more real.

## One new tool: reading a whole line

`scanf("%s", ...)` stops at the first whitespace — it reads one word, never a full line with spaces in it. To read an entire line, including spaces, use `fgets`:

```c
char line[256];
fgets(line, sizeof(line), stdin);
```

`fgets` reads up to 255 characters (leaving room for the terminator) or until it hits a newline, whichever comes first — and unlike `scanf`, **it keeps the newline character** as part of the string if there was room for it. That's worth remembering when you're comparing or measuring what you read.

## The exercise

Read one line of text and count how many words it contains — where a "word" is any run of non-whitespace characters. You'll need to track whether you're currently *inside* a word as you scan character by character: stepping from whitespace into a non-whitespace character is exactly the moment a new word starts, and that's the only moment you should increment your count. Watch for the edge cases: leading spaces, multiple spaces between words, and an empty line.
