#!/usr/bin/python

import os
from optparse import OptionParser

"""
sudo cp ./find.py /usr/local/bin/gitup.py && sudo chmod 777 /usr/local/bin/gitup.py
"""

if __name__ == "__main__":
	parser = OptionParser()
	parser.add_option("-m", "--message",dest="message")
	(option,_) = parser.parse_args()
	message = option.message or "default"
	cmd = "git add . && git commit -m %s && git push origin master"%message
	print cmd
	os.system(cmd)