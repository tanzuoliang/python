#!/usr/bin/python
#encoding=utf-8

from myutil.utils import syncDir,checkSVNStatus
import os

fromRoot = '/Users/tanzuoliang/Documents/projects/art'
toRoot = "/Users/tanzuoliang/Documents/projects/tank/res/new_ui"

l = [
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ icon','天天坦克/UI 效果图+输出 20170214 优化版/00 icon','icon'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ button','天天坦克/UI 效果图+输出 20170214 优化版/00 button','button'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ wenzi','天天坦克/UI 效果图+输出 20170214 优化版/00 wenzi','wenzi'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ 通用','天天坦克/UI 效果图+输出 20170214 优化版/00 通用','common'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ 字体','天天坦克/UI 效果图+输出 20170214 优化版/00 字体','fnt'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ BG','天天坦克/UI 效果图+输出 20170214 优化版/00 BG','bg')
]

for tu in l:
	fromDir = os.path.join(fromRoot, tu[0])
	toDir	= os.path.join(toRoot, tu[2])
	os.system("svn up %s"%fromDir)
	fromDir = os.path.join(fromRoot, tu[1])
	syncDir(fromDir, toDir,False)
	checkSVNStatus(toRoot,[tu[2]])