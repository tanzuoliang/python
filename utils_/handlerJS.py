#!/usr/bin/python

import re,time,os

p = "/Users/tanzuoliang/Documents/projects/tank/src/fight/ai/action/Explore.js"

#data = re.sub(r'cc.log\(.+\);', "", data)
#data = re.sub(r'(cc.log\(.+?\n{0,4}.+?\))', "//\0", data)
#data = re.sub(r'[\n\+|\+\n]{0,10}', "", data)


def dector(fun):
	def wrapper(fileName):
		st = time.time()
		print "strat to execute ",fun.__name__
		fun(fileName)
		print "finish execute ",fun.__name__ , " complete cost time = ",(time.time() - st)
	
	return wrapper	


def writeTo(fileName,data):
	with open(fileName,"w") as f:
		f.write(data)
		
def writeLinesTo(fileName,lines):
	with open(fileName,"w") as f:
		l = [i for i in lines if not i.strip() == ""]
		f.writelines(l)	

@dector		
def closeLog(fileName):
	with open(fileName,"r") as f:
		data = f.read()
		data = re.sub(r'\n\+', "+", data)
		data = re.sub(r'\+\n', "+", data)
		data = re.sub(r'cc.log', "//cc.log", data)
		#data = re.sub(r'tank.BattleLog.', "//tank.BattleLog.", data)
	
	writeTo(fileName,data)

@dector	
def removeLineAdd(fileName):
	with open(fileName,"r") as f:
		data = f.read()
		data = re.sub(r'\s*\n\s*/*\s*\+\s*', "+", data)
		data = re.sub(r'\s*\+\s*\n\s*/*', "+", data)

	writeTo(fileName,data)	

@dector
def openLog(fileName):
	with open(fileName,"r") as f:
		data = f.read()
		data = re.sub(r'//cc.log', "cc.log", data)
		#data = re.sub(r'//tank.BattleLog.', "tank.BattleLog.", data)
	
	writeTo(fileName,data)

@dector						
def clearLog(fileName):
	with open(fileName,"r") as f:
		data = f.read()
		data = re.sub(r'/*cc.log\(.+\);*', "", data)
		#data = re.sub(r'\s*\n\s*', "", data)

	writeTo(fileName,data)	

@dector
def clearNullLine(fileName):
	with open(fileName,"r") as f:
		lines = f.readlines()
	writeLinesTo(fileName,lines)
	
@dector
def clearUnuseCode(fileName):
	with open(fileName,"r") as f:
		lines = f.readlines()
		
	with open(fileName,"w") as f:
		f.writelines([i for i in lines if i.find("//") == -1])	

@dector	
def clearCommentCode(fileName):
	with open(fileName,"r") as f:
		data = f.read()
		data = re.sub(r'\s*\n\s*\*','*',data)
		data = re.sub(r'/\*\*\*\*.*\*/',"",data)
	writeTo(fileName, data)			


d = "/Users/tanzuoliang/Documents/projects/tank/src/fight"
for (root,child,fileList) in os.walk(d):
	if not fileList:
		continue
	
	for f in fileList:
		ff = os.path.join(root, f)
		if os.path.splitext(ff)[1] == ".js":
			closeLog(ff)	
			