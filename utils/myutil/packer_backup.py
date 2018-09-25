#encoding=utf-8
#!/usr/bin/python

import os,json,sys,shutil
import Tkinter
#TexturePacker assets
#creates out.plist (cocos2d) and out.png from all png files in the 'assets' directory
#trimming all files and creating a texture with max. 2048x2048px 
#TexturePacker --data main-hd.plist --format cocos2d --sheet main-hd.png assets

reload(sys)
sys.setdefaultencoding("utf-8")

TexturePackerCommand = ""

if not os.path.exists("config"):
	TexturePackerCommand = raw_input("please set thd TexturePacker command path......\n")
	f = open("config","w")
	f.write(TexturePackerCommand)
	f.close()
else:
	f = open("config","r")
	TexturePackerCommand = f.read()
	f.close()

def packSheet(folder):
	outName = os.path.basename(folder)
	if outName in [".DS_Store"]:
		return
	tmpFolder = folder + "tmp"

	for item in os.walk(folder):
		if not item[2]:
			continue

		for file in item[2]:
			if os.path.basename(file) == ".DS_Store":
				continue
		
			fromPath = os.path.join(item[0],file)
			toPath = os.path.join(tmpFolder,file)
			if not os.path.exists(os.path.dirname(toPath)):
				os.makedirs(os.path.dirname(toPath))
			print fromPath
			print toPath
			shutil.copy(fromPath, toPath)	
	command = "%s --data %s.plist --format cocos2d --texture-format png --sheet %s.png %s"%(TexturePackerCommand,outName,outName,tmpFolder)
	os.system(command);
	shutil.rmtree(tmpFolder)
	print "%s successfully"%outName


def packAll(dir):
	for f in os.listdir(dir):
		packSheet("%s/%s"%(dir,f))
		
def isBigDir(path):
	for f in os.listdir(path):
		if os.path.splitext(f)[1] == ".png":
			return False
	return True				

def packPic():
	pass
	packSheet("")

#folder=""
#while True:
#	folder=raw_input("imput asset folder or input 0 for exit\n")
#	packStyle = ""
#	if folder == "0":
#		sys.exit()
#	else:
#		while not packStyle in ["0","1"]:
#			packStyle = raw_input("select pack style 0:signal,1:all\n")	
#		if isBigDir(folder):
#			if packStyle == "0":
#				packAll(folder)
#			else:
#				packSheet(folder)	
#		else:
#			packSheet(folder)				
top = Tkinter.Tk()
top.maxsize(600,400)
top.minsize(600,400)
Tkinter.Button(top, text ="点我", command = packPic).grid(row=1)
top.mainloop()
print("successfully")
raw_input("any key for exit......\n")