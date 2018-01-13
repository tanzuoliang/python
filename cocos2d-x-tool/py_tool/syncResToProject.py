#!/usr/bin/python
#encoding=utf-8

from myutil.utils import syncDir,checkSVNStatus
import os

fromRoot = '/Users/tanzuoliang/art_resource'
toRoot = "../res/new_ui"
toLanguage = "../res"

ll = [
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ icon','天天坦克/UI 效果图+输出 20170214 优化版/00 icon','icon'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ button','天天坦克/UI 效果图+输出 20170214 优化版/00 button','button'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ wenzi','天天坦克/UI 效果图+输出 20170214 优化版/00 wenzi','wenzi'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ 通用','天天坦克/UI 效果图+输出 20170214 优化版/00 通用','common'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ 字体','天天坦克/UI 效果图+输出 20170214 优化版/00 字体','fnt'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ BG','天天坦克/UI 效果图+输出 20170214 优化版/00 BG','bg')
]


"""
语言分类资源
"""
lll = [
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ 英文翻译','天天坦克/UI 效果图+输出 20170214 优化版/00 英文翻译','lang_en'),
	('天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ 翻译原版','天天坦克/UI 效果图+输出 20170214 优化版/00 翻译原版','lang_chs')
]


from myutil.utils import getDirsize
import os

if os.path.exists('../res-new') and getDirsize('../res') < getDirsize('../res-new'):
	print "当前res是压缩后的"
else:
	os.system('svn up %s'%toLanguage)
	for tu in ll:
		fromDir = os.path.join(fromRoot, tu[0])
		toDir	= os.path.join(toRoot, tu[2])
		os.system("svn up %s"%fromDir)
		fromDir = os.path.join(fromRoot, tu[1])
		
		syncDir(fromDir, toDir,False)
		checkSVNStatus(toRoot,[tu[2]])
		
		
	for tu in lll:
		fromDir = os.path.join(fromRoot, tu[0])
		toDir	= os.path.join(toLanguage, "language_img", tu[2],"res","new_ui")
		os.system("svn up %s"%fromDir)
		fromDir = os.path.join(fromRoot, tu[1])
		if not os.path.exists(toDir):
			os.makedir(toDir)
		syncDir(fromDir, toDir,False)
		checkSVNStatus(os.path.join(toLanguage, "language_img"),[tu[2]])
	"""
	英文引导
	"""
#	os.system("cp %s %s"%(os.path.join(fromRoot,"天天坦克/UI\ 效果图+输出\ 20170214\ 优化版/00\ 英文翻译/Novice\ guide/controlexplain.jpg"),os.path.join(toRoot, "bg/lang_en_controlexplain.jpg")))
	os.system("rm -rf %s"%(os.path.join(toLanguage,"language_img/lang_en/res/new_ui/Novice\ guide")))		
	os.system('svn ci %s -m "同步资源"'%toLanguage)	