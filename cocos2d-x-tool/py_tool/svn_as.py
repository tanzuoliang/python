#!/usr/bin/python
#encoding=utf-8
import os

root_path = '../frameworks/runtime-src/proj.android-studio/app'

ls = ["res","src","libs","adLibs","crashLibs","build.gradle","proguard-rules.pro","gradle.properties","AndroidManifest.xml"]

for l in ls:
	ll = os.path.join(root_path, l)
	if os.path.exists(ll):
		if os.path.isdir(ll):
			
			"""
			先删除 自己不要的
			"""
			cmd_list = ["svn st %s| awk '{if ( $1 == \"!\") { print $2}}' | xargs svn del"%(ll),
					"svn st %s| awk '{if ( $1 == \"D\") { print $2}}' | xargs svn ci -m ''"%(ll)]
			
			for cmd in cmd_list:
				print cmd
				os.system(cmd)
				
		"""
		而后添加自己最新的
		"""
		os.system("svn st %s| awk '{if ( $1 == \"?\") { print $2}}' | xargs svn add "%(ll))
		
		"""
		再更新共有的 终于提交你改的
		"""
		os.system("svn up %s && svn ci -m '' %s"%(ll,ll))
	