#!/usr/bin/python

from myutil.utils import copyFile
import os

From = "../src/fight"
To = "../../branchTV/src/fight"
copylist = ["view/UI/joyPadControler.js","view/UI/uiAssit.js"]

def copyFromMobileToTV():
	for f in copylist:
		FromFile = os.path.join(From,f)
		ToFile = os.path.join(To,f)
		copyFile(FromFile, ToFile)
	os.system("svn ci -m '' %s"%To)
	
def copyFromTVToMobile():
	for f in copylist:
		FromFile = os.path.join(To,f)
		ToFile = os.path.join(From,f)
		copyFile(FromFile, ToFile)
	os.system("svn ci -m '' %s"%To)
	
if __name__ == "__main__":
	sel = raw_input("please select a operation 1: copyFromMobileToTV 2:copyFromTVToMobile\n")
	if sel == "1":
		copyFromMobileToTV()
	elif sel == "2":
		copyFromTVToMobile()
	else:
		print "select a error operation"		

	