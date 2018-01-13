#!/usr/bin/python
#encoding=utf-8
"""
from setuptools import setup, find_packages
setup(
	packages = find_packages('src'),  # 包含所有src中的包
	package_dir = {'':'src'},   # 告诉distutils包都在src下

	package_data = {
		# 任何包中含有.txt文件，都包含它
		'': ['*.txt'],
		# 包含demo包data文件夹中的 *.dat文件
		'demo': ['data/*.dat'],
	}
)


安装：python setup.py install
另外：
执行：python setup.py sdist会在dist文件夹生成项目的压缩包
执行：python setup.py bdist_wininst会生成exe安装文件

"""

#from setuptools import setup,find_packages
#
#
#
#setup(
#	name = "myUtils",
#	version = "1.0.0",
#	packages = find_packages()
#)

from distutils.core import setup
import glob
setup(
	name="myUtil",
	version = "1.0.0",
	py_modules = [item.replace(".py","") for item in glob.glob('myutil/*.py')]
)