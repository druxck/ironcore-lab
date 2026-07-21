# Make It So

Every exercise so far has been one file, compiled with one command. Real programs are dozens or thousands of files, and recompiling all of them from scratch every time you change one line would waste minutes you don't have. `make` exists to solve exactly that: **rebuild only what actually needs rebuilding, by running exactly the commands you tell it to.**

## The shape of a Makefile

```makefile
program: main.c helpers.c
	gcc -Wall -Wextra -o program main.c helpers.c

clean:
	rm -f program
```

Each block is a **rule**, with three parts:

- **Target** - `program`, the thing this rule knows how to build.
- **Prerequisites** - `main.c helpers.c`, the files the target depends on. If none of these are newer than the target, make decides there's nothing to do and skips the rule entirely. That's the whole speed trick.
- **Recipe** - the indented line(s) below, the actual shell commands that build the target.

Run `make` with no arguments and it builds the *first* target in the file. Run `make clean` and it builds the `clean` target specifically - a common convention for "delete what we built," even though `clean` doesn't correspond to a real file.

## The tab trap

Here's a wart that has cost real engineers real hours: **recipe lines must be indented with an actual tab character, not spaces.** This is a decision baked into `make` from its earliest versions, long before anyone agreed it was a good idea, and it has never been changed - too much existing software depends on the old behavior. Paste a Makefile from a web page where your editor "helpfully" converted tabs to spaces, and you'll get a cryptic `missing separator` error. Now you'll know exactly what that means.

## Why this matters going forward

You won't write elaborate Makefiles in this lab - the exercises here stay small enough that a direct compile works fine. But every real C project you touch from here on will have one, and knowing how to *read* one - what's a target, what's a dependency, what's just a shell command - means you're never stuck staring at someone else's build system wondering where to even start.
