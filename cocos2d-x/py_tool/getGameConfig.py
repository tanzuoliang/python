#!/usr/bin/python

from myutil.utils import copyFile
import os

tv_path = "../src/gameConfig/tv/gameConfig.js"
tv_from = "../../branchTV/src/gameConfig/gameConfig.js"

mobile_path = "../src/gameConfig/mobile/gameConfig.js"
mobile_from = "../src/gameConfig/gameConfig.js"

os.system("svn up %s"%tv_from)
copyFile(tv_from, tv_path)

os.system("svn up %s"%mobile_from)
copyFile(mobile_from, mobile_path)




os.system("svn ci -m '' ../src/gameConfig")