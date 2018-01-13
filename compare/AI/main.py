#!/usr/bin/python

import os


def getLines(fi):
	with open(fi,"r") as f:
		return f.readlines()

leftLines = getLines("left.txt")
rightLines = getLines("right.txt")

le = max(len(leftLines),len(rightLines))

for i in range(le):
	if not leftLines[i] == rightLines[i]:
		print "find not at line ",(i + 1),"\nleft  is\t",leftLines[i],"\nright is\t",rightLines[i]
