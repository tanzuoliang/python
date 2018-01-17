#!/usr/bin/python
#encoding=utf-8
import os,time
import easygui
from PIL import Image

def saveScreen():
	pngname = "screen_jump.png"
	cmds = ["adb shell screencap -p /sdcard/%s"%pngname,"adb pull /sdcard/%s"%pngname,"adb shell rm /sdcard/%s"%pngname]
	for cmd in cmds:
		os.system(cmd)
		 
	return pngname


def findPoint(im):
	width,height = im.size
	for x in xrange(width):
		for y in xrange(height):
			pixel = im.getpixel((x,y))
			print "pixel = ",pixel 

while True:
#	image_name = saveScreen()
#	im = Image.open(image_name)
	
	l = float(raw_input("please enter the distance(cm):\n"))
	if l > 10:
		l = l * 0.1
	t = 252 * l - l * l * l
	os.system("adb shell input swipe 500 500 500 500 %d"%int(t))
