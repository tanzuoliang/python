#!/usr/bin/python
#encoding=utf-8

import os
from optparse import OptionParser

if __name__ == "__main__":
	parser = OptionParser()
	parser.add_option('-d', '--dir',dest='dir',help='要搜索的文件夹')
	parser.add_option('-s', '--source',dest='source',help='存储文件')
	(option,args) = parser.parse_args()
	fromDir = option.source
	todir = option.dir
	print option
	
	for (root,child,items) in os.walk(fromDir):
		
		toPath = root.replace(fromDir,todir)
		if not os.path.exists(toPath):
			os.mkdir(toPath)
		
		if not items:
			continue
		for fileName in items:
			nameInfos = os.path.splitext(fileName)
			if nameInfos[1] == ".a":
				fromFile = os.path.join(root,fileName)
				os.system("cp %s %s"%(fromFile,fromFile.replace(fromDir,todir)))
					
