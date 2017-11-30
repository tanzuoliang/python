#!/usr/bin/python

import os,sys,shutil
from optparse import OptionParser
from compreDir import show

def _execute_(dir,to):
	print "start to convert from %s to %s"%(dir,to)
	for f in os.listdir(dir):
		targetFile = os.path.join(dir, f);
		if os.path.splitext(targetFile)[1] == ".FBX":
			os.system("fbx-conv %s"%targetFile)
			targetFile = targetFile.replace(".FBX", ".c3b")
			shutil.copy(targetFile, os.path.join(to, targetFile.replace(dir, to)))
			os.remove(targetFile)
			

def getSome():
	print __name__
	pass

if __name__ == "__main__":
	show()
	getSome()
#	opt = OptionParser()
#	opt.add_option('-f','--file',dest='file')
#	opt.add_option('-t','--to',dest='to')
#	
#	(options,args) = opt.parse_args()
#	
#	if options.file and options.to:
#		_execute_(options.file, options.to)
#	else:
#		print "parma error"	
	