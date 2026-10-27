import sys

with open("assets-src/out/args_debug.txt", "w") as f:
    f.write("sys.argv: " + repr(sys.argv))
