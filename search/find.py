#!/usr/bin/python
#encoding=utf-8
import os
from optparse import OptionParser

"""
sudo cp ./find.py /usr/local/bin/find.py && sudo chmod 777 /usr/local/bin/find.py
"""

mediaExtlist = [".png",".jpg",".jpeg",".mp3",".mp4",".wav",".avi",".gif",".fnt",".ttf"]

def isMedia(filename):
	global mediaExtlist
	ext = os.path.splitext(filename)[1]
	return ext in mediaExtlist		

"""
"""
def searchFile(filename,match,flag):
	if match in os.path.basename(filename):
		print "-------find file named %s"%(filename)
	
	if flag == "1" or isMedia(filename):
#		print "ingore %s"%filename
		return
	
	try:
		with open(filename,"r") as f:
			cnt = 1
			hasprinthead = False
			for line in f.readlines():
				if match in line:
					if not hasprinthead:
						print filename
						hasprinthead = True
					print "  [line:%d] %s"%(cnt,line)
				cnt = cnt + 1	
	except Exception as e:
		print "[error] filename : %s"%(filename)
		print e				


if __name__ == "__main__":
	parser = OptionParser()
	parser.add_option('-d', '--dir',dest='dir',help='要搜索的文件夹')
	parser.add_option('-c', '--content',dest='content',help='要搜索的内容')
	parser.add_option('-e','--ext',dest='ext',help='要搜索的文件后缀')
	parser.add_option('-f','--flag',dest='flag',help='查询标记默认0 0:搜索内容和文件名你  1:仅搜索文件名')
	
	(option,args) = parser.parse_args()
	print option
	
	extlist = None
	searchDir = option.dir
	searchFlag = option.flag or '0'
	if not searchFlag in ["1","0"]:
		searchFlag = '0'
	
	if not searchDir or not os.path.exists(searchDir):
		searchDir = os.getcwd()
	
	
	searchContent = option.content
	
	while not searchContent or searchContent == "":
		searchContent = raw_input("please input searchContent:\n")
	
	if option.ext:
		extlist = option.ext.split("|")
		
		
	if not os.path.isdir(searchDir):
		searchFile(searchDir,searchContent,searchFlag)
	else:
		"""
		"""
		for (root,child,items) in os.walk(searchDir):
			for basefilename in items:
				filename = os.path.join(root, basefilename)
				fileinfolist = os.path.splitext(basefilename)
				if not extlist or fileinfolist[1] in extlist:
					searchFile(filename,searchContent,searchFlag)
				