#!/usr/bin/python
#encoding=utf-8
import os
from optparse import OptionParser

if __name__ == "__main__":
	parser = OptionParser()
	parser.add_option('-d', '--dir',dest='dir',help='要搜索的文件夹')
	parser.add_option('-c', '--content',dest='content',help='要搜索的内容')
	parser.add_option('-e','--ext',dest='ext',help='要搜索的文件后缀')
	
	(option,args) = parser.parse_args()
	print option
	
	extlist = None
	searchDir = option.dir
	
	"""
		 检查输入的文件夹
	"""
	if not searchDir:
		searchDir = raw_input("please input the dir that where you want to search from:\n")
	
	while not os.path.exists(searchDir):
		print "%s not exists"%searchDir
		searchDir = raw_input("please input the dir that where you want to search from:\n")
	
	
	searchContent = option.content
	
	while not searchContent or searchContent == "":
		searchContent = raw_input("please input searchContent:\n")
	
	if option.ext:
		extlist = option.ext.split("|")
		
		
	if not os.path.isdir(searchDir):
		try:
			with open(searchDir,"r") as f:
				if searchContent in f.read():
					print "find file named %s which contains %s"%(searchDir,searchContent)
		except Exception as e:
			print "[error] filename : %s"%(searchDir)
			print e
						
	else:
						
	
		"""
		"""
		for (root,child,items) in os.walk(searchDir):
			for basefilename in items:
				filename = os.path.join(root, basefilename)
				fileinfolist = os.path.splitext(basefilename)
				if not extlist or fileinfolist[1] in extlist:
					if searchContent == fileinfolist[0]:
						print "find file named %s"%filename
					else:
						try:
							with open(filename,"r") as f:
								if searchContent in f.read():
									print "find file named %s which contains %s"%(filename,searchContent)
						except Exception as e:
							print "[error] filename : %s"%(filename)
							print e				

