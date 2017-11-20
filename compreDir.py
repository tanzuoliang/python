#!/usr/bin/python

import os,sys




def compreFile(fileL,fileR,f):
#	print "start compare file %s"%f
	global diffrentCount
	if not os.path.exists(fileL) or not os.path.exists(fileR):
		return
	fl = open(fileL,"r")
	fr = open(fileR,"r")
	lineCount = 1
	for line in fl.readlines():
		if line != fr.readline():
			print "find diffrent compare %s   with  %s  at line:%d"%(fileL,fileR,lineCount)
			diffrentCount = diffrentCount + 1
			break
		else:
#			print "------------------------------------- %d some"%lineCount
			lineCount = lineCount + 1			
		
		
		
pathL = "/Users/tanzuoliang/Downloads/Dreamer_World-TeamEMT"#/assets/src"
pathR = "/Users/tanzuoliang/Downloads/mx_tailand_align_2016-08-24(1)"#/assets/src"		

#pathL = "/Users/tanzuoliang/Documents/study/tank/src"
#pathR = "/Users/tanzuoliang/Documents/projects/tank/src"
fileCount = 0		
diffrentCount = 0
for item in os.walk(pathL):
#	print("start to compare dir %s"%item[0])
	if not item[2]:
		continue
		
	for f in item[2]:
		if os.path.splitext(f)[1] != ".xml":
			continue
		fileL = os.path.join(item[0], f)
		fileR = fileL.replace(pathL, pathR,1)
		compreFile(fileL, fileR,f)
		fileCount = fileCount + 1
		
		
print "--------------------------------------- EXECUTE OVER -------------------------------fileCount = %d   diffrentCount = %d"%(fileCount,diffrentCount)		
					