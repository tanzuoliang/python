#!/usr/bin/python

import os
from optparse import OptionParser
if __name__ == "__main__":
	parser = OptionParser()
	parser.add_option("-m", "--message",dest="message")
	(option,_) = parser.parse_args()
	message = option.message or "default"
	cmd = "git add . && git commit -m %s && git push"%message
	print cmd
	os.system(cmd)