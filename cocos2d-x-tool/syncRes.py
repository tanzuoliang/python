#usr/local/bin

import os
from myutil.utils import syncDir,copyFile

l = ["aapt","helper","py_tool","node","battle_server_mobile","battle_server_tv"]	

fromDir = "."
toDir = "/Users/tanzuoliang/Documents/study/python/cocos2d-x-tool"

for d in l:
	syncDir(os.path.join(fromDir,d), os.path.join(toDir,d))

fl = ["create.py","hot_res.py","syncRes.py"]

for f in fl:
	copyFile(os.path.join(fromDir,f),os.path.join(toDir,f))	


os.chdir(toDir)
print os.getcwd()
os.system("gitup.py")
print "successfully"	