#!/usr/bin/python
import os
from myutil.utils import syncDir

syncDir("src", "frameworks/runtime-src/proj.android/assets/src")
os.system("cp platform.json frameworks/runtime-src/proj.android/assets/platform.json")
os.system("cp project.json frameworks/runtime-src/proj.android/assets/project.json")
#syncDir("res", "frameworks/runtime-src/proj.android/assets/res")