# Reading the Machine's Complaints

Nobody writes correct C on the first try — including the researchers whose notes fill this basement. What separates a fast learner from a stuck one isn't fewer mistakes, it's how quickly they read the compiler's response and act on it. That's a skill, and it's trainable.

## Errors vs. warnings

The compiler gives you two kinds of complaints:

- **Errors** stop the build cold. No executable gets produced until every error is fixed. These are things the compiler literally cannot make sense of, or that make the program's meaning ambiguous or invalid.
- **Warnings** let the build continue, but flag something that's *legal* C and still probably a bug — an unused variable, a suspicious comparison, a type mismatch that technically compiles. Ironcore Lab compiles everything with extra warning flags turned on (`-Wall -Wextra`) specifically because a program that compiles cleanly but is riddled with warnings is not actually done.

## The anatomy of a diagnostic

Every message from gcc/clang follows the same shape:

```
source.c:7:12: error: expected ';' before 'return'
```

Read it left to right: **file**, then **line 7**, then **column 12**, then the **severity**, then the **message**. That's not a suggestion of roughly where to look — it's a precise coordinate. Go to line 7, column 12, and start reading from there.

## The trap: the error is sometimes on the line *before*

The single most confusing thing for beginners: a missing semicolon gets reported on the line *after* the one that's actually missing it. Why? The compiler doesn't know a statement ended until it hits something that couldn't possibly continue it — so it reports the problem where it first got confused, which is one token too late.

```c
int x = 5
return 0;
```

The error will point at `return`, not at `x = 5`. The fix is on the line above the line the compiler complained about.

## A cascade is one bug wearing a disguise

Fix your first error, rebuild, and sometimes five new errors appear. Don't panic — this is usually *one* underlying mistake (like a missing closing brace) that confused the compiler's understanding of everything after it. **Always fix the first error in the list first**, then recompile before worrying about the rest. Often the rest disappear on their own.
