#usr/local/bin

from python.tools import Tools
from optparse import OptionParser
import os,sys


def handJsc(mode):
	if mode == "jsc":
		Tools.compileJSToJSC()
	elif mode == "js":
		Tools.JSCToJS()
	else:
		print "js mode error need jsc or js"		

def handRes(mode):
	if mode == "compress":
		Tools.compressRes();
	elif mode == "uncompress":
		Tools.uncompressRes()
	else:
		print "res mode error need compress or uncompress"		

if __name__ == '__main__':


	print "cwd = %s"%os.getcwd()

	cwd = os.getcwd();
	if not cwd == sys.argv[0]:

		os.chdir(os.path.dirname(sys.argv[0]))

	print "cwd = %s"%os.getcwd()	

	

	option = OptionParser()
	option.add_option("-m","--mode",dest='mode')
	option.add_option("-t","--type",dest='type')
	option.add_option("-a","--all",dest='all')
	(opt,args) = option.parse_args()

	mode = opt.mode
	_type = opt.type

	if opt.all == "all":
		if mode == "decode":
			handRes("uncompress")
			handJsc("js")
		elif mode == "encode":
			handRes("compress")
			handJsc("jsc")	


	
	if mode and _type:
		if _type == "res":
			handRes(mode)
		elif _type == "js":
			handJsc(mode)
		else:
			print "type error need res or js"	
	else:
		print "please input mode(m) and type(t)"			