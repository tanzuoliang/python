#!/usr/bin/python
import os

searchDir = os.getcwd()
cmd = 'svn st %s | awk \'{if ( $1 == "?") { print $2}}\' | xargs svn add'%searchDir
os.system(cmd)