#!/usr/bin/python
#encoding=utf-8

from optparse import OptionParser
import os

"""
 keytool -list -v -keystore
"""

if __name__ == "__main__":
	parser = OptionParser()
	parser.add_option('-f', '--file',dest='file',help='签名文件')
	(option,args) = parser.parse_args()
	
	inputfile = option.file
	while not inputfile:
		inputfile = raw_input("please input you file:\n")
		
	ext = os.path.splitext(inputfile)[1]
	if ext == ".keystore":	
		cmd = "keytool -list -v -keystore %s"%inputfile
		os.system(cmd)
	elif ext == ".RSA":
		cmd = "keytool -printcert -file %s"%inputfile
		os.system(cmd)	