#!/usr/bin/python
#encoding=utf-8
#
#pyinstaller -F /Users/tanzuoliang/Documents/study/python/android/android.py
import os,sys,time
if __name__ == "__main__":
	configPath = "androidConfig"
	if not os.path.exists(configPath):
		f = open(configPath,"w")
		path = raw_input("please set the project path\n")
		if path == "0":
			sys.exit()
		f.write(path)
		f.close()
	f = open(configPath,"r")
	projectPath = f.read();
	print projectPath
	f.close();	
	os.chdir(projectPath)
	os.system("cocos compile -p android")
	tag = time.strftime("%m_%d_%H_%M",time.localtime()) 
	os.rename("%s/simulator/android/tank-debug.apk"%projectPath, "%s/simulator/android/tank_%s.apk"%(projectPath,tag))
	os.system("open %s/simulator/android"%projectPath)