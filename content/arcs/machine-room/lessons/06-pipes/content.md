# Redirection and Pipes

*Logbook: "`cmd1 | cmd2` looks like a single operator to anyone typing it into a shell. Down here, it's fork(), pipe(), and two calls to close() done in exactly the right order."*

A **pipe** is a one-way channel the kernel gives you as a pair of file descriptors: whatever's written into one end can be read back out the other.

```c
#include <unistd.h>

int fds[2];
pipe(fds);
// fds[0] - the read end
// fds[1] - the write end
```

On its own, a pipe connects two file descriptors *within the same process*, which isn't very useful yet. Combine it with `fork()` and it becomes the plumbing behind every `cmd1 | cmd2` a shell runs: the child inherits **copies** of both `fds[0]` and `fds[1]` from the parent, so anything the child writes into `fds[1]` shows up when the parent reads from its own copy of `fds[0]`.

## Close the end you're not using

Here's the part that's easy to get wrong: after `fork()`, *both* processes have both ends open. If you don't close the end you're not using in each process, two things go wrong:

1. A process that still has the write end open, even unused, keeps that end "alive" from the reader's point of view - so a `read()` on the other side that's waiting for the writer to finish and close never sees an end-of-file, and blocks forever waiting for more data that's never coming.
2. It's just sloppy resource management - leftover file descriptors nobody's using.

The working pattern: the child closes its copy of the read end and writes; the parent closes its copy of the write end and reads. Once the child exits (which closes all of its own file descriptors, including its copy of the write end), the parent's `read()` sees end-of-file and returns cleanly, because *no process anywhere* still holds the write end open.
