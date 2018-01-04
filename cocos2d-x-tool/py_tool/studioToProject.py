#!/usr/bin/python
import os
from myutil.utils import syncDir
root = "../frameworks/runtime-src"
studio = os.path.join(root,"proj.android-studio","app","src","main","org","cocos2dx","javascript")
pro = os.path.join(root,"proj.android","src","org","cocos2dx","javascript")

#syncDir(studio, pro,REMOVE=False)