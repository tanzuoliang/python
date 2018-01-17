#!/usr/bin/python
#encoding=utf-8

import fire,os

def cut(root,name):
	"""
		cmds = ["adb shell screencap -p /sdcard/%s"%pngname,"adb pull /sdcard/%s"%pngname]#,"adb shell rm /sdcard/%s"%pngname]
	"""
	cmds = ["adb shell screencap -p /sdcard/%s"%name,"sudo adb pull /sdcard/%s"%name,"sudo mv %s %s"%(name,os.path.join(root,name))]
	for cmd in cmds:
		print cmd
		os.system(cmd)
		
if __name__ == "__main__":
	fire.Fire()