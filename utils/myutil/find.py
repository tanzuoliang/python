#!/usr/bin/python
#encoding=utf-8
import os
from optparse import OptionParser

if __name__ == "__main__":
	parser = OptionParser()
	parser.add_option('-d', '--dir',dest='dir',help='要搜索的文件夹')
	parser.add_option('-c', '--content',dest='content',help='要搜索的内容')
	parser.add_option('-e','--ext',dest='ext',help='要搜索的文件后缀')
	parser.add_option('-f','--isFile',dest='isFile',help='要搜索的文件后缀')
	
	(option,args) = parser.parse_args()
	print option
	
	extlist = None
	searchDir = option.dir or os.getcwd()
	searchContent = option.content
	
	if option.ext:
		extlist = option.ext.split("|")
		
	isFile = option.isFile or "0"	
		
		
	for (root,child,items) in os.walk(searchDir):
		for basefilename in items:
			filename = os.path.join(root, basefilename)
			fileinfolist = os.path.splitext(basefilename)
			if not extlist or fileinfolist[1] in extlist:
				if isFile == "1":
					if searchContent in fileinfolist[0]:
						print "find %s in %s"%(searchContent,filename)
				elif isFile == "0":
					with open(filename,"r") as f:
						lineno = 1
						isFirst = True
						for line in f.readlines():
							if searchContent in line:
								if isFirst:
									isFirst = False
									print "------- %s -------"%filename
								print "[line:%d]%s"%(lineno,line)
							lineno = lineno + 1	

	
					

