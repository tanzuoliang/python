#!/usr/bin/python
#encoding=utf-8
from optparse import OptionParser
import os

#def removeCommect(filename):
#	ret = []
#	with open(filename,"r") as f:
#		for line in f.readlines():
#			if not line.start

def removeLog(content,matchtr):
	global logChars
	shortStr = ""
	findLog = False
	endMatch = False
	waitingCode = False
	leftEarNum = 0
	waitLeftEarNUm = 0

	matchStrLen = len(matchtr) * -1
	for c in content:
		if not findLog:
			shortStr = shortStr + c
		else:
			if waitingCode:
				if not c == " ":# and not c == "\t" and not c == "\n":
					findLog = False
					waitingCode = False
#					if shortStr[len(shortStr) - 1] == "/" or shortStr[len(shortStr) - 2] == "/":
#						print "haha"
#						shortStr = shortStr + "\n\t"
					shortStr = shortStr + c
			elif endMatch:
				if c == ";" or c == " " or c == "\t" or c == "\n":
					endMatch = False
					waitingCode = True
					pass 
			else:	
				if c == "(":
					leftEarNum = leftEarNum + 1
				elif c == ")":
					leftEarNum = leftEarNum - 1
					if leftEarNum == 0:
						endMatch = True
				elif c == "\n" or c == "\r":
					shortStr = shortStr + c		
			
				
			
		if matchtr in shortStr:
			findLog = True
			shortStr = shortStr[:matchStrLen]
			leftEarNum = 1
	return shortStr	
	
def mkdirs(d):
	if "/" in d:
		ls = d.split("/")[:-1]
		pa = "/"
		for l in ls:
			if l == "":
				continue
			pa = os.path.join(pa, l)
			if not os.path.exists(pa):
				os.mkdir(pa)
				print "create dir %s"%pa

#"""
#
#"""
#with open("test.js","r") as f:
#	print removeLog(f.read(),"cc.log(")	
				
if __name__ == "__main__":
	parser = OptionParser()
	parser.add_option('-s', '--src',dest='src',help='源文件夹')
	parser.add_option('-d', '--dest',dest='dest',help='目标文件夹')
	(option,args) = parser.parse_args()
	print option
	
	filterList = ["cc.log(","print(","cc.trace("]
	
	searchDir = option.src
	if not searchDir or not os.path.exists(searchDir):
		searchDir = os.getcwd()
		
	destDir = option.dest or "%s-log"%searchDir
#	while not destDir:
#		destDir = raw_input("please input dest:\n")
		
	if not os.path.exists(destDir):
		os.mkdir(destDir)	
			
		
	for (root,child,items) in os.walk(searchDir):
		for basefilename in items:
			filename = os.path.join(root, basefilename)
			if ".DS_Store" in basefilename:
				continue
			data = None
			print "[execute]",filename.replace(searchDir + "/","")
			with open(filename,"r") as f:
				data = f.read();
				for matchStr in filterList:
					data = removeLog(data,matchStr)
			if data:
				storeFilename = filename.replace(searchDir,destDir)
				mkdirs(storeFilename)
##				while not os.path.exists(basedir):
##					os.mkdir(basedir)
				with open(storeFilename,"w") as f:
					f.write(data)			
					
				
	
				
			